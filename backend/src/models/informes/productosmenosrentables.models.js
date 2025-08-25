const { sql, poolPromise } = require('../../models/db');

async function obtenerProductosDetallado(params = {}) {
  const {
    canal = null,
    vendedor = null,
    periodo = null,        // '1D','7D','14D','1M','3M','6M','1A' o null si envías fechaInicio/fechaFin
    fechaInicio = null,
    fechaFin = null,
    proveedor = null,      // OPOR.CardCode (vía OPOR/POR1)
    primerNivel = null,    // OITM.U_Primer_Nivel
    categoria = null,      // OITM.U_Categoria
    subcategoria = null,   // OITM.U_Subcategoria
    page = 1,
    pageSize = 50,
    orderBy = 'Rentabilidad_Total',   // default acorde a tu SELECT original
    order = 'desc',
  } = params;

  // Paginación segura
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const safePageSize = Math.min(Math.max(parseInt(pageSize, 10) || 50, 1), 1000);
  const offset = (safePage - 1) * safePageSize;

  // Columnas ordenables EXACTAS del SELECT original
  const orderMap = {
    Rentabilidad_Total: 'Rentabilidad_Total',
    Cantidad_Vendida: 'Cantidad_Vendida',
    Precio_Venta_Promedio: 'Precio_Venta_Promedio',
    Costo_Promedio: 'Costo_Promedio',
    Margen_Porcentaje: 'Margen_Porcentaje',
    // aliases en minúsculas por si llegan así
    rentabilidad_total: 'Rentabilidad_Total',
    cantidad_vendida: 'Cantidad_Vendida',
    precio_venta_promedio: 'Precio_Venta_Promedio',
    costo_promedio: 'Costo_Promedio',
    margen_porcentaje: 'Margen_Porcentaje',
  };
  const dir = (String(order || '').toLowerCase() === 'asc') ? 'ASC' : 'DESC';
  const columnaOrden = orderMap[orderBy] || 'Rentabilidad_Total';

  const query = `
DECLARE @FechaInicioActual DATE, @FechaFinActual DATE;

IF (@FechaInicio IS NOT NULL AND @FechaFin IS NOT NULL)
BEGIN
  SET @FechaInicioActual = @FechaInicio;
  SET @FechaFinActual    = @FechaFin;
END
ELSE
BEGIN
  SET @FechaFinActual = CAST(GETDATE() AS DATE);
  SET @FechaInicioActual =
    CASE
      WHEN @Periodo = '1D'  THEN @FechaFinActual
      WHEN @Periodo = '7D'  THEN DATEADD(DAY,  -6, @FechaFinActual)
      WHEN @Periodo = '14D' THEN DATEADD(DAY, -13, @FechaFinActual)
      WHEN @Periodo = '1M'  THEN DATEADD(MONTH, -1, @FechaFinActual)
      WHEN @Periodo = '3M'  THEN DATEADD(MONTH, -3, @FechaFinActual)
      WHEN @Periodo = '6M'  THEN DATEADD(MONTH, -6, @FechaFinActual)
      WHEN @Periodo = '1A'  THEN DATEADD(YEAR,  -1, @FechaFinActual)
      ELSE @FechaFinActual
    END;
END;

;WITH ProductosProveedor AS (
  SELECT DISTINCT P1.ItemCode
  FROM POR1 P1
  INNER JOIN OPOR P0 ON P0.DocEntry = P1.DocEntry
  WHERE @ProveedorParam IS NULL OR P0.CardCode = @ProveedorParam
)

-- 1) Datos ORDENADOS sobre todo el dataset y luego paginados
SELECT
  O.U_Imagen                                   AS IMAGE,
  I.ItemCode                                    AS Codigo_Producto,
  O.ItemName                                    AS Nombre_Producto,
  T2.Name                                       AS primerNivel,
  T3.Name                                       AS Categoria,
  O.OnHand                                      AS STOCK,
  (
    SELECT SUM(W.OnOrder)
    FROM OITW W
    WHERE W.ItemCode = I.ItemCode
  )                                             AS stockOnOrder,
  T1.OnHand                                     AS Stock_Chorrillo,
  SUM(I.Quantity)                               AS Cantidad_Vendida,
  AVG(I.Price)                                  AS Precio_Venta_Promedio,
  AVG(I.StockPrice)                             AS Costo_Promedio,
  SUM((I.Price - I.StockPrice) * I.Quantity)    AS Rentabilidad_Total,
  CASE 
    WHEN AVG(I.Price) = 0 THEN 0
    ELSE ((AVG(I.Price) - AVG(I.StockPrice)) / NULLIF(AVG(I.Price), 0)) * 100
  END                                           AS Margen_Porcentaje
FROM INV1 I
INNER JOIN OITM O   ON I.ItemCode = O.ItemCode
INNER JOIN OINV T0  ON I.DocEntry = T0.DocEntry
INNER JOIN OITW T1  ON O.ItemCode = T1.ItemCode  -- stock por bodega
LEFT  JOIN [@PRIMER_NIVEL] T2 ON T2.Code = O.U_Primer_Nivel
LEFT  JOIN [@CATEGORIA]    T3 ON T3.Code = O.U_Categoria
WHERE
  T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
  AND T0.CANCELED = 'N'
  AND I.Quantity > 0
  AND T1.WhsCode = '01'               -- ✅ fix: antes estaba T1.OnHand = '01'
  AND I.ItemCode <> '701001008'
  AND I.StockPrice > 0

  -- Filtros jerarquías
  AND (@PrimerNivelParam  IS NULL OR O.U_Primer_Nivel = @PrimerNivelParam)
  AND (@CategoriaParam    IS NULL OR O.U_Categoria    = @CategoriaParam)
  AND (@SubcategoriaParam IS NULL OR O.U_Subcategoria = @SubcategoriaParam)

  -- Proveedor vía compras
  AND (@ProveedorParam IS NULL OR I.ItemCode IN (SELECT ItemCode FROM ProductosProveedor))

  -- Canal
  AND (
    @CanalParam IS NULL
    OR (
      (@CanalParam = 'Meli' AND (
        (I.WhsCode IN ('03','05') AND T0.SlpCode IN (426,364,355))
        OR (I.WhsCode = '01' AND T0.SlpCode IN (355,398))
      ))
      OR (@CanalParam = 'Falabella' AND I.WhsCode = '03' AND T0.SlpCode = 371)
      OR (@CanalParam = 'Balmaceda' AND I.WhsCode = '07')
      OR (@CanalParam = 'Vitex'     AND I.WhsCode = '01' AND T0.SlpCode IN (401,397))
      OR (@CanalParam = 'Chorrillo' AND I.WhsCode = '01'
           AND I.SlpCode NOT IN (401,397,355,398,227,250,205,138,209,228,226,137,212))
      OR (@CanalParam = 'Empresas'  AND I.WhsCode = '01'
           AND I.SlpCode IN (227,250,205,138,209,228,226,137,212))
    )
  )

  AND (@VendedorParam IS NULL OR T0.SlpCode = @VendedorParam)

GROUP BY
  I.ItemCode, O.ItemName, O.U_Imagen, O.OnHand, T1.OnHand,
  O.U_Primer_Nivel, O.U_Categoria, T2.Name, T3.Name
ORDER BY ${columnaOrden} ${dir}
OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;

-- 2) Conteo total (mismas condiciones; sin ORDER BY)
;WITH ProductosProveedor AS (
  SELECT DISTINCT P1.ItemCode
  FROM POR1 P1
  INNER JOIN OPOR P0 ON P0.DocEntry = P1.DocEntry
  WHERE @ProveedorParam IS NULL OR P0.CardCode = @ProveedorParam
)
SELECT COUNT(DISTINCT I.ItemCode) AS Total
FROM INV1 I
INNER JOIN OITM O   ON I.ItemCode = O.ItemCode
INNER JOIN OINV T0  ON I.DocEntry = T0.DocEntry
INNER JOIN OITW T1  ON O.ItemCode = T1.ItemCode
WHERE
  T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
  AND T0.CANCELED = 'N'
  AND I.Quantity > 0
  AND T1.WhsCode = '01'
  AND I.ItemCode <> '701001008'
  AND I.StockPrice > 0
  AND (@PrimerNivelParam  IS NULL OR O.U_Primer_Nivel = @PrimerNivelParam)
  AND (@CategoriaParam    IS NULL OR O.U_Categoria    = @CategoriaParam)
  AND (@SubcategoriaParam IS NULL OR O.U_Subcategoria = @SubcategoriaParam)
  AND (@ProveedorParam    IS NULL OR I.ItemCode IN (SELECT ItemCode FROM ProductosProveedor))
  AND (
    @CanalParam IS NULL
    OR (
      (@CanalParam = 'Meli' AND (
        (I.WhsCode IN ('03','05') AND T0.SlpCode IN (426,364,355))
        OR (I.WhsCode = '01' AND T0.SlpCode IN (355,398))
      ))
      OR (@CanalParam = 'Falabella' AND I.WhsCode = '03' AND T0.SlpCode = 371)
      OR (@CanalParam = 'Balmaceda' AND I.WhsCode = '07')
      OR (@CanalParam = 'Vitex'     AND I.WhsCode = '01' AND T0.SlpCode IN (401,397))
      OR (@CanalParam = 'Chorrillo' AND I.WhsCode = '01'
           AND I.SlpCode NOT IN (401,397,355,398,227,250,205,138,209,228,226,137,212))
      OR (@CanalParam = 'Empresas'  AND I.WhsCode = '01'
           AND I.SlpCode IN (227,250,205,138,209,228,226,137,212))
    )
  )
  AND (@VendedorParam IS NULL OR T0.SlpCode = @VendedorParam);
`;

  const pool = await poolPromise;
  const request = pool.request();

  // Bind (nombres 1:1 con el SQL)
  request.input('CanalParam',        sql.VarChar(50),   canal);
  request.input('VendedorParam',     sql.Int,           vendedor);
  request.input('Periodo',           sql.VarChar(10),   periodo);
  request.input('FechaInicio',       sql.Date,          fechaInicio);
  request.input('FechaFin',          sql.Date,          fechaFin);
  request.input('ProveedorParam',    sql.VarChar(50),   proveedor);
  request.input('PrimerNivelParam',  sql.VarChar(100),  primerNivel);
  request.input('CategoriaParam',    sql.VarChar(100),  categoria);
  request.input('SubcategoriaParam', sql.VarChar(100),  subcategoria);
  request.input('Limit',             sql.Int,           safePageSize);
  request.input('Offset',            sql.Int,           offset);

  const result = await request.query(query);

  const rows  = result.recordsets?.[0] ?? [];
  const total = result.recordsets?.[1]?.[0]?.Total ?? 0;
  const pages = Math.max(Math.ceil(total / safePageSize), 1);

  return { rows, total, page: safePage, pageSize: safePageSize, pages };
}

module.exports = { obtenerProductosDetallado };
