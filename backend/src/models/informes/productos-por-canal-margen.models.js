// // models/informes/productos-por-canal-margen.models.js
// const { sql, poolPromise } = require("../../models/db");

// async function obtenerProductosPorCanalMargenDB(params) {
//   const {
//     canalesCsv,
//     skuCsv,
//     vendedor,
//     periodo,
//     fechaInicio,
//     fechaFin,
//     proveedor,
//     primerNivel,
//     categoria,
//     subcategoria,
//     tipoEnvio,
//     limit,
//     offset,
//     aplicarPaginacion,
//     campoOrden,
//     direccionOrden,
//   } = params;

//   const pool = await poolPromise;
//   const request = pool.request();

//   // ====== INPUTS ======
//   request.input("VendedorParamInput", sql.Int, vendedor);
//   request.input("PeriodoParam", sql.VarChar, periodo);
//   request.input("FechaInicioInput", sql.Date, fechaInicio);
//   request.input("FechaFinInput", sql.Date, fechaFin);
//   request.input("Proveedor", sql.VarChar, proveedor);

//   // UDFs en OITM: usar NVARCHAR y nombres exactos
//   request.input("PrimerNivel",  sql.NVarChar, primerNivel);
//   request.input("Categoria",    sql.NVarChar, categoria);
//   request.input("Subcategoria", sql.NVarChar, subcategoria);

//   request.input("TipoEnvio", sql.VarChar, tipoEnvio);
//   request.input("Limit", sql.Int, limit);
//   request.input("Offset", sql.Int, offset);
//   request.input("CanalesCsv", sql.NVarChar, canalesCsv);
//   request.input("SkusCsv", sql.NVarChar, skuCsv);

//   const paginacionSQL = aplicarPaginacion
//     ? "OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY"
//     : "";

//   const query = `
//     -- Rango de fechas (periodo/fechas personalizadas)
//     DECLARE @VendedorParam INT = @VendedorParamInput;
//     DECLARE @Periodo VARCHAR(10) = @PeriodoParam;
//     DECLARE @FechaInicioActual DATE, @FechaFinActual DATE;

//     IF (@FechaInicioInput IS NOT NULL AND @FechaFinInput IS NOT NULL)
//     BEGIN
//       SET @FechaInicioActual = @FechaInicioInput;
//       SET @FechaFinActual    = @FechaFinInput;
//     END
//     ELSE
//     BEGIN
//       SET @FechaFinActual = CAST(GETDATE() AS DATE);
//       SET @FechaInicioActual =
//         CASE
//           WHEN @Periodo = '1D'  THEN @FechaFinActual
//           WHEN @Periodo = '7D'  THEN DATEADD(DAY,  -6, @FechaFinActual)
//           WHEN @Periodo = '14D' THEN DATEADD(DAY, -13, @FechaFinActual)
//           WHEN @Periodo = '1M'  THEN DATEADD(MONTH, -1, @FechaFinActual)
//           WHEN @Periodo = '3M'  THEN DATEADD(MONTH, -3, @FechaFinActual)
//           WHEN @Periodo = '6M'  THEN DATEADD(MONTH, -6, @FechaFinActual)
//           ELSE @FechaFinActual
//         END;
//     END;

//     -- Flags de canales
//     DECLARE @HasCanal BIT = IIF(@CanalesCsv IS NULL OR LTRIM(RTRIM(@CanalesCsv)) = '', 0, 1);
//     DECLARE @HasMeli      BIT = IIF(EXISTS (SELECT 1 FROM STRING_SPLIT(@CanalesCsv, ',') WHERE LTRIM(RTRIM(value)) = 'Meli'), 1, 0);
//     DECLARE @HasFalabella BIT = IIF(EXISTS (SELECT 1 FROM STRING_SPLIT(@CanalesCsv, ',') WHERE LTRIM(RTRIM(value)) = 'Falabella'), 1, 0);
//     DECLARE @HasBalmaceda BIT = IIF(EXISTS (SELECT 1 FROM STRING_SPLIT(@CanalesCsv, ',') WHERE LTRIM(RTRIM(value)) = 'Balmaceda'), 1, 0);
//     DECLARE @HasVitex     BIT = IIF(EXISTS (SELECT 1 FROM STRING_SPLIT(@CanalesCsv, ',') WHERE LTRIM(RTRIM(value)) = 'Vitex'), 1, 0);
//     DECLARE @HasChorrillo BIT = IIF(EXISTS (SELECT 1 FROM STRING_SPLIT(@CanalesCsv, ',') WHERE LTRIM(RTRIM(value)) = 'Chorrillo'), 1, 0);
//     DECLARE @HasEmpresas  BIT = IIF(EXISTS (SELECT 1 FROM STRING_SPLIT(@CanalesCsv, ',') WHERE LTRIM(RTRIM(value)) = 'Empresas'), 1, 0);

//     -- Filtro por proveedor (SKUs)
//     ;WITH ProductosProveedor AS (
//       SELECT DISTINCT POR1.ItemCode
//       FROM POR1
//       INNER JOIN OPOR ON OPOR.DocEntry = POR1.DocEntry
//       WHERE @Proveedor IS NULL OR OPOR.CardCode = @Proveedor
//     )

//     /* =========
//        1) Totales por SKU (respeta filtro de canales si se usa)
//        ========= */
//     SELECT
//       I.ItemCode  AS sku,
//       O.ItemName  AS nombre,
//       SUM(I.Quantity)                                AS cantidadVendida,
//       SUM(I.LineTotal - (I.Quantity * I.StockPrice)) AS margenBruto,
//       SUM(I.Quantity * I.StockPrice)                 AS costoTotal,
//       CAST(
//         (SUM(I.LineTotal - (I.Quantity * I.StockPrice)) * 100.0)
//         / NULLIF(SUM(I.Quantity * I.StockPrice), 0)
//         AS DECIMAL(18,2)
//       ) AS margenPorcentaje
//     FROM INV1 I
//     INNER JOIN OINV T0 ON I.DocEntry = T0.DocEntry
//     INNER JOIN OITM O  ON I.ItemCode = O.ItemCode
//     WHERE
//       T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
//       AND T0.CANCELED = 'N'
//       AND O.AvgPrice > 0
//       AND (@Proveedor IS NULL OR I.ItemCode IN (SELECT ItemCode FROM ProductosProveedor))

//       -- Filtros robustos por código (UDF) en OITM
//       AND (
//         @PrimerNivel IS NULL
//         OR UPPER(LTRIM(RTRIM(O.U_PRIMER_NIVEL))) = UPPER(LTRIM(RTRIM(@PrimerNivel)))
//         OR (
//              TRY_CONVERT(INT, O.U_PRIMER_NIVEL) IS NOT NULL
//          AND TRY_CONVERT(INT, @PrimerNivel)     IS NOT NULL
//          AND TRY_CONVERT(INT, O.U_PRIMER_NIVEL) = TRY_CONVERT(INT, @PrimerNivel)
//            )
//       )
//       AND (
//         @Categoria IS NULL
//         OR UPPER(LTRIM(RTRIM(O.U_Categoria))) = UPPER(LTRIM(RTRIM(@Categoria)))
//         OR (
//              TRY_CONVERT(INT, O.U_Categoria) IS NOT NULL
//          AND TRY_CONVERT(INT, @Categoria)    IS NOT NULL
//          AND TRY_CONVERT(INT, O.U_Categoria) = TRY_CONVERT(INT, @Categoria)
//            )
//       )
//       AND (
//         @Subcategoria IS NULL
//         OR UPPER(LTRIM(RTRIM(O.U_Subcategoria))) = UPPER(LTRIM(RTRIM(@Subcategoria)))
//         OR (
//              TRY_CONVERT(INT, O.U_Subcategoria) IS NOT NULL
//          AND TRY_CONVERT(INT, @Subcategoria)    IS NOT NULL
//          AND TRY_CONVERT(INT, O.U_Subcategoria) = TRY_CONVERT(INT, @Subcategoria)
//            )
//       )

//       AND (@SkusCsv IS NULL OR I.ItemCode IN (SELECT LTRIM(RTRIM(value)) FROM STRING_SPLIT(@SkusCsv, ',')))
//       AND (
//         @HasCanal = 0
//         OR (
//           ( @HasMeli = 1 AND (
//               (I.WhsCode IN ('03','05') AND T0.SlpCode IN (426, 364, 355) AND
//                 (
//                   @TipoEnvio IS NULL
//                   OR (@TipoEnvio = 'full'    AND I.WhsCode = '05' AND I.SlpCode = 355)
//                   OR (@TipoEnvio = 'colecta' AND I.WhsCode = '03' AND I.SlpCode = 355)
//                 )
//               )
//               OR (I.WhsCode = '01' AND T0.SlpCode IN (355, 398))
//             )
//           )
//           OR ( @HasFalabella = 1 AND I.WhsCode = '03' AND T0.SlpCode = 371 )
//           OR ( @HasBalmaceda = 1 AND I.WhsCode = '07' )
//           OR ( @HasVitex = 1 AND I.WhsCode = '01' AND T0.SlpCode IN (401, 397) )
//           OR ( @HasChorrillo = 1 AND I.WhsCode = '01'
//                 AND I.SlpCode NOT IN (401, 397, 355, 398, 227, 250, 205, 138, 209, 228, 226, 137, 212) )
//           OR ( @HasEmpresas = 1 AND I.WhsCode = '01'
//                 AND I.SlpCode IN (227, 250, 205, 138, 209, 228, 226, 137, 212) )
//         )
//       )
//       AND (@VendedorParam IS NULL OR I.SlpCode = @VendedorParam)
//     GROUP BY I.ItemCode, O.ItemName
//     ORDER BY ${campoOrden} ${direccionOrden}
//     ${paginacionSQL};

//     /* =========
//        2) Conteo total de SKUs (para paginación)
//        ========= */
//     ;WITH ProductosProveedor AS (
//       SELECT DISTINCT POR1.ItemCode
//       FROM POR1
//       INNER JOIN OPOR ON OPOR.DocEntry = POR1.DocEntry
//       WHERE @Proveedor IS NULL OR OPOR.CardCode = @Proveedor
//     )
//     SELECT COUNT(DISTINCT I.ItemCode) AS Total
//     FROM INV1 I
//     INNER JOIN OINV T0 ON I.DocEntry = T0.DocEntry
//     INNER JOIN OITM O  ON I.ItemCode = O.ItemCode
//     WHERE
//       T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
//       AND T0.CANCELED = 'N'
//       AND O.AvgPrice > 0
//       AND (@Proveedor IS NULL OR I.ItemCode IN (SELECT ItemCode FROM ProductosProveedor))

//       AND (
//         @PrimerNivel IS NULL
//         OR UPPER(LTRIM(RTRIM(O.U_PRIMER_NIVEL))) = UPPER(LTRIM(RTRIM(@PrimerNivel)))
//         OR (
//              TRY_CONVERT(INT, O.U_PRIMER_NIVEL) IS NOT NULL
//          AND TRY_CONVERT(INT, @PrimerNivel)     IS NOT NULL
//          AND TRY_CONVERT(INT, O.U_PRIMER_NIVEL) = TRY_CONVERT(INT, @PrimerNivel)
//            )
//       )
//       AND (
//         @Categoria IS NULL
//         OR UPPER(LTRIM(RTRIM(O.U_Categoria))) = UPPER(LTRIM(RTRIM(@Categoria)))
//         OR (
//              TRY_CONVERT(INT, O.U_Categoria) IS NOT NULL
//          AND TRY_CONVERT(INT, @Categoria)    IS NOT NULL
//          AND TRY_CONVERT(INT, O.U_Categoria) = TRY_CONVERT(INT, @Categoria)
//            )
//       )
//       AND (
//         @Subcategoria IS NULL
//         OR UPPER(LTRIM(RTRIM(O.U_Subcategoria))) = UPPER(LTRIM(RTRIM(@Subcategoria)))
//         OR (
//              TRY_CONVERT(INT, O.U_Subcategoria) IS NOT NULL
//          AND TRY_CONVERT(INT, @Subcategoria)    IS NOT NULL
//          AND TRY_CONVERT(INT, O.U_Subcategoria) = TRY_CONVERT(INT, @Subcategoria)
//            )
//       )

//       AND (@SkusCsv IS NULL OR I.ItemCode IN (SELECT LTRIM(RTRIM(value)) FROM STRING_SPLIT(@SkusCsv, ',')))
//       AND (
//         @HasCanal = 0
//         OR (
//           ( @HasMeli = 1 AND (
//               (I.WhsCode IN ('03','05') AND T0.SlpCode IN (426, 364, 355) AND
//                 (
//                   @TipoEnvio IS NULL
//                   OR (@TipoEnvio = 'full'    AND I.WhsCode = '05' AND I.SlpCode = 355)
//                   OR (@TipoEnvio = 'colecta' AND I.WhsCode = '03' AND I.SlpCode = 355)
//                 )
//               )
//               OR (I.WhsCode = '01' AND T0.SlpCode IN (355, 398))
//             )
//           )
//           OR ( @HasFalabella = 1 AND I.WhsCode = '03' AND T0.SlpCode = 371 )
//           OR ( @HasBalmaceda = 1 AND I.WhsCode = '07' )
//           OR ( @HasVitex = 1 AND I.WhsCode = '01' AND T0.SlpCode IN (401, 397) )
//           OR ( @HasChorrillo = 1 AND I.WhsCode = '01'
//                 AND I.SlpCode NOT IN (401, 397, 355, 398, 227, 250, 205, 138, 209, 228, 226, 137, 212) )
//           OR ( @HasEmpresas = 1 AND I.WhsCode = '01'
//                 AND I.SlpCode IN (227, 250, 205, 138, 209, 228, 226, 137, 212) )
//         )
//       )
//       AND (@VendedorParam IS NULL OR I.SlpCode = @VendedorParam);

//     /* =========
//        3) Breakdown SKU + Canal (cantidad y margen por canal)
//        ========= */
//     ;WITH ProductosProveedor AS (
//       SELECT DISTINCT POR1.ItemCode
//       FROM POR1
//       INNER JOIN OPOR ON OPOR.DocEntry = POR1.DocEntry
//       WHERE @Proveedor IS NULL OR OPOR.CardCode = @Proveedor
//     )
//     SELECT
//       I.ItemCode                                                  AS sku,
//       C.Canal                                                     AS canal,
//       SUM(I.Quantity)                                             AS cantidadVendida,
//       SUM(I.LineTotal - (I.Quantity * I.StockPrice))              AS margenBruto,
//       SUM(I.Quantity * I.StockPrice)                              AS costoTotal,
//       CAST(
//         (SUM(I.LineTotal - (I.Quantity * I.StockPrice)) * 100.0)
//         / NULLIF(SUM(I.Quantity * I.StockPrice), 0)
//         AS DECIMAL(18,2)
//       ) AS margenPorcentaje
//     FROM INV1 I
//     INNER JOIN OINV T0 ON I.DocEntry = T0.DocEntry
//     INNER JOIN OITM O  ON I.ItemCode = O.ItemCode
//     CROSS APPLY (
//       SELECT CASE
//         WHEN (
//           (I.WhsCode IN ('03','05') AND T0.SlpCode IN (426, 364, 355) AND
//             (
//               @TipoEnvio IS NULL OR
//               (@TipoEnvio = 'full'    AND I.WhsCode = '05' AND I.SlpCode = 355) OR
//               (@TipoEnvio = 'colecta' AND I.WhsCode = '03' AND I.SlpCode = 355)
//             )
//           )
//           OR (I.WhsCode = '01' AND T0.SlpCode IN (355, 398))
//         ) THEN 'Meli'
//         WHEN (I.WhsCode = '03' AND T0.SlpCode = 371) THEN 'Falabella'
//         WHEN (I.WhsCode = '07') THEN 'Balmaceda'
//         WHEN (I.WhsCode = '01' AND T0.SlpCode IN (401, 397)) THEN 'Vitex'
//         WHEN (I.WhsCode = '01'
//               AND I.SlpCode NOT IN (401, 397, 355, 398, 227, 250, 205, 138, 209, 228, 226, 137, 212)) THEN 'Chorrillo'
//         WHEN (I.WhsCode = '01'
//               AND I.SlpCode IN (227, 250, 205, 138, 209, 228, 226, 137, 212)) THEN 'Empresas'
//         ELSE NULL
//       END AS Canal
//     ) C
//     WHERE
//       T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
//       AND T0.CANCELED = 'N'
//       AND O.AvgPrice > 0
//       AND C.Canal IS NOT NULL
//       AND (@Proveedor IS NULL OR I.ItemCode IN (SELECT ItemCode FROM ProductosProveedor))

//       AND (
//         @PrimerNivel IS NULL
//         OR UPPER(LTRIM(RTRIM(O.U_PRIMER_NIVEL))) = UPPER(LTRIM(RTRIM(@PrimerNivel)))
//         OR (
//              TRY_CONVERT(INT, O.U_PRIMER_NIVEL) IS NOT NULL
//          AND TRY_CONVERT(INT, @PrimerNivel)     IS NOT NULL
//          AND TRY_CONVERT(INT, O.U_PRIMER_NIVEL) = TRY_CONVERT(INT, @PrimerNivel)
//            )
//       )
//       AND (
//         @Categoria IS NULL
//         OR UPPER(LTRIM(RTRIM(O.U_Categoria))) = UPPER(LTRIM(RTRIM(@Categoria)))
//         OR (
//              TRY_CONVERT(INT, O.U_Categoria) IS NOT NULL
//          AND TRY_CONVERT(INT, @Categoria)    IS NOT NULL
//          AND TRY_CONVERT(INT, O.U_Categoria) = TRY_CONVERT(INT, @Categoria)
//            )
//       )
//       AND (
//         @Subcategoria IS NULL
//         OR UPPER(LTRIM(RTRIM(O.U_Subcategoria))) = UPPER(LTRIM(RTRIM(@Subcategoria)))
//         OR (
//              TRY_CONVERT(INT, O.U_Subcategoria) IS NOT NULL
//          AND TRY_CONVERT(INT, @Subcategoria)    IS NOT NULL
//          AND TRY_CONVERT(INT, O.U_Subcategoria) = TRY_CONVERT(INT, @Subcategoria)
//            )
//       )

//       AND (@SkusCsv IS NULL OR I.ItemCode IN (SELECT LTRIM(RTRIM(value)) FROM STRING_SPLIT(@SkusCsv, ',')))
//       AND (
//         @HasCanal = 0
//         OR ( (@HasMeli=1 AND C.Canal='Meli')
//           OR (@HasFalabella=1 AND C.Canal='Falabella')
//           OR (@HasBalmaceda=1 AND C.Canal='Balmaceda')
//           OR (@HasVitex=1 AND C.Canal='Vitex')
//           OR (@HasChorrillo=1 AND C.Canal='Chorrillo')
//           OR (@HasEmpresas=1 AND C.Canal='Empresas') )
//       )
//       AND (@VendedorParam IS NULL OR I.SlpCode = @VendedorParam)
//     GROUP BY I.ItemCode, C.Canal
//     ORDER BY I.ItemCode, C.Canal;
//   `;

//   const result = await request.query(query);

//   return {
//     rows: result.recordsets[0] || [],          
//     total: result.recordsets[1]?.[0]?.Total || 0,
//     breakdown: result.recordsets[2] || [],    
//   };
// }

// module.exports = { obtenerProductosPorCanalMargenDB };

// models/informes/productos-por-canal-margen.models.js



// models/informes/productos-por-canal-margen.models.js
const { sql, poolPromise } = require("../../models/db");

async function obtenerProductosPorCanalMargenDB(params) {
  const {
    canalesCsv,
    skuCsv,
    vendedor,
    periodo,
    fechaInicio,
    fechaFin,
    proveedor,
    primerNivel,
    categoria,
    subcategoria,
    tipoEnvio,
    limit,
    offset,
    aplicarPaginacion,
    campoOrden,
    direccionOrden,
  } = params;

  const pool = await poolPromise;
  const request = pool.request();

  // ====== INPUTS ======
  request.input("VendedorParamInput", sql.Int, vendedor);
  request.input("PeriodoParam", sql.VarChar, periodo);
  request.input("FechaInicioInput", sql.Date, fechaInicio);
  request.input("FechaFinInput", sql.Date, fechaFin);
  request.input("Proveedor", sql.VarChar, proveedor);

  // UDFs en OITM
  request.input("PrimerNivel",  sql.NVarChar, primerNivel);
  request.input("Categoria",    sql.NVarChar, categoria);
  request.input("Subcategoria", sql.NVarChar, subcategoria);

  request.input("TipoEnvio", sql.VarChar, tipoEnvio);
  request.input("Limit", sql.Int, limit);
  request.input("Offset", sql.Int, offset);
  request.input("CanalesCsv", sql.NVarChar, canalesCsv);
  request.input("SkusCsv", sql.NVarChar, skuCsv);

  const paginacionSQL = aplicarPaginacion
    ? "OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY"
    : "";

  const query = `
    -- Fechas desde periodo o explícitas
    DECLARE @VendedorParam INT = @VendedorParamInput;
    DECLARE @Periodo VARCHAR(10) = @PeriodoParam;
    DECLARE @FechaInicioActual DATE, @FechaFinActual DATE;

    IF (@FechaInicioInput IS NOT NULL AND @FechaFinInput IS NOT NULL)
    BEGIN
      SET @FechaInicioActual = @FechaInicioInput;
      SET @FechaFinActual    = @FechaFinInput;
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
          ELSE @FechaFinActual
        END;
    END;

    -- Flags de canales
    DECLARE @HasCanal BIT = IIF(@CanalesCsv IS NULL OR LTRIM(RTRIM(@CanalesCsv)) = '', 0, 1);
    DECLARE @HasMeli      BIT = IIF(EXISTS (SELECT 1 FROM STRING_SPLIT(@CanalesCsv, ',') WHERE LTRIM(RTRIM(value)) = 'Meli'), 1, 0);
    DECLARE @HasFalabella BIT = IIF(EXISTS (SELECT 1 FROM STRING_SPLIT(@CanalesCsv, ',') WHERE LTRIM(RTRIM(value)) = 'Falabella'), 1, 0);
    DECLARE @HasBalmaceda BIT = IIF(EXISTS (SELECT 1 FROM STRING_SPLIT(@CanalesCsv, ',') WHERE LTRIM(RTRIM(value)) = 'Balmaceda'), 1, 0);
    DECLARE @HasVitex     BIT = IIF(EXISTS (SELECT 1 FROM STRING_SPLIT(@CanalesCsv, ',') WHERE LTRIM(RTRIM(value)) = 'Vitex'), 1, 0);
    DECLARE @HasChorrillo BIT = IIF(EXISTS (SELECT 1 FROM STRING_SPLIT(@CanalesCsv, ',') WHERE LTRIM(RTRIM(value)) = 'Chorrillo'), 1, 0);
    DECLARE @HasEmpresas  BIT = IIF(EXISTS (SELECT 1 FROM STRING_SPLIT(@CanalesCsv, ',') WHERE LTRIM(RTRIM(value)) = 'Empresas'), 1, 0);

    -- Filtro por proveedor (SKUs)
    ;WITH ProductosProveedor AS (
      SELECT DISTINCT POR1.ItemCode
      FROM POR1
      INNER JOIN OPOR ON OPOR.DocEntry = POR1.DocEntry
      WHERE @Proveedor IS NULL OR OPOR.CardCode = @Proveedor
    )

    /* =========
       1) Totales por SKU
       ========= */
    SELECT
      I.ItemCode  AS sku,
      O.ItemName  AS nombre,
      MAX(O.U_Imagen)                             AS imagen,  -- agregado con MAX
      SUM(I.Quantity)                              AS cantidadVendida,
      SUM(I.LineTotal - (I.Quantity * I.StockPrice)) AS margenBruto,
      SUM(I.Quantity * I.StockPrice)               AS costoTotal,
      CAST(
        (SUM(I.LineTotal - (I.Quantity * I.StockPrice)) * 100.0)
        / NULLIF(SUM(I.Quantity * I.StockPrice), 0)
        AS DECIMAL(18,2)
      ) AS margenPorcentaje
    FROM INV1 I
    INNER JOIN OINV T0 ON I.DocEntry = T0.DocEntry
    INNER JOIN OITM O  ON I.ItemCode = O.ItemCode
    WHERE
      T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
      AND T0.CANCELED = 'N'
      AND O.AvgPrice > 0
      AND (@Proveedor IS NULL OR I.ItemCode IN (SELECT ItemCode FROM ProductosProveedor))
      AND (
        @PrimerNivel IS NULL
        OR UPPER(LTRIM(RTRIM(O.U_PRIMER_NIVEL))) = UPPER(LTRIM(RTRIM(@PrimerNivel)))
        OR (TRY_CONVERT(INT, O.U_PRIMER_NIVEL) IS NOT NULL AND TRY_CONVERT(INT, @PrimerNivel) IS NOT NULL
            AND TRY_CONVERT(INT, O.U_PRIMER_NIVEL) = TRY_CONVERT(INT, @PrimerNivel))
      )
      AND (
        @Categoria IS NULL
        OR UPPER(LTRIM(RTRIM(O.U_Categoria))) = UPPER(LTRIM(RTRIM(@Categoria)))
        OR (TRY_CONVERT(INT, O.U_Categoria) IS NOT NULL AND TRY_CONVERT(INT, @Categoria) IS NOT NULL
            AND TRY_CONVERT(INT, O.U_Categoria) = TRY_CONVERT(INT, @Categoria))
      )
      AND (
        @Subcategoria IS NULL
        OR UPPER(LTRIM(RTRIM(O.U_Subcategoria))) = UPPER(LTRIM(RTRIM(@Subcategoria)))
        OR (TRY_CONVERT(INT, O.U_Subcategoria) IS NOT NULL AND TRY_CONVERT(INT, @Subcategoria) IS NOT NULL
            AND TRY_CONVERT(INT, O.U_Subcategoria) = TRY_CONVERT(INT, @Subcategoria))
      )
      AND (@SkusCsv IS NULL OR I.ItemCode IN (SELECT LTRIM(RTRIM(value)) FROM STRING_SPLIT(@SkusCsv, ',')))
      AND (
        @HasCanal = 0
        OR (
          ( @HasMeli = 1 AND (
              (I.WhsCode IN ('03','05') AND T0.SlpCode IN (426, 364, 355) AND
                (@TipoEnvio IS NULL
                 OR (@TipoEnvio = 'full'    AND I.WhsCode = '05' AND I.SlpCode = 355)
                 OR (@TipoEnvio = 'colecta' AND I.WhsCode = '03' AND I.SlpCode = 355))
              )
              OR (I.WhsCode = '01' AND T0.SlpCode IN (355, 398))
            ))
          OR ( @HasFalabella = 1 AND I.WhsCode = '03' AND T0.SlpCode = 371 )
          OR ( @HasBalmaceda = 1 AND I.WhsCode = '07' )
          OR ( @HasVitex = 1 AND I.WhsCode = '01' AND T0.SlpCode IN (401, 397) )
          OR ( @HasChorrillo = 1 AND I.WhsCode = '01'
                AND I.SlpCode NOT IN (401, 397, 355, 398, 227, 250, 205, 138, 209, 228, 226, 137, 212) )
          OR ( @HasEmpresas = 1 AND I.WhsCode = '01'
                AND I.SlpCode IN (227, 250, 205, 138, 209, 228, 226, 137, 212) )
        )
      )
      AND (@VendedorParam IS NULL OR I.SlpCode = @VendedorParam)
    GROUP BY I.ItemCode, O.ItemName
    ORDER BY ${campoOrden} ${direccionOrden}
    ${paginacionSQL};

    /* =========
       2) Conteo total de SKUs
       ========= */
    ;WITH ProductosProveedor AS (
      SELECT DISTINCT POR1.ItemCode
      FROM POR1
      INNER JOIN OPOR ON OPOR.DocEntry = POR1.DocEntry
      WHERE @Proveedor IS NULL OR OPOR.CardCode = @Proveedor
    )
    SELECT COUNT(DISTINCT I.ItemCode) AS Total
    FROM INV1 I
    INNER JOIN OINV T0 ON I.DocEntry = T0.DocEntry
    INNER JOIN OITM O  ON I.ItemCode = O.ItemCode
    WHERE
      T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
      AND T0.CANCELED = 'N'
      AND O.AvgPrice > 0
      AND (@Proveedor IS NULL OR I.ItemCode IN (SELECT ItemCode FROM ProductosProveedor))
      AND (
        @PrimerNivel IS NULL
        OR UPPER(LTRIM(RTRIM(O.U_PRIMER_NIVEL))) = UPPER(LTRIM(RTRIM(@PrimerNivel)))
        OR (TRY_CONVERT(INT, O.U_PRIMER_NIVEL) IS NOT NULL AND TRY_CONVERT(INT, @PrimerNivel) IS NOT NULL
            AND TRY_CONVERT(INT, O.U_PRIMER_NIVEL) = TRY_CONVERT(INT, @PrimerNivel))
      )
      AND (
        @Categoria IS NULL
        OR UPPER(LTRIM(RTRIM(O.U_Categoria))) = UPPER(LTRIM(RTRIM(@Categoria)))
        OR (TRY_CONVERT(INT, O.U_Categoria) IS NOT NULL AND TRY_CONVERT(INT, @Categoria) IS NOT NULL
            AND TRY_CONVERT(INT, O.U_Categoria) = TRY_CONVERT(INT, @Categoria))
      )
      AND (
        @Subcategoria IS NULL
        OR UPPER(LTRIM(RTRIM(O.U_Subcategoria))) = UPPER(LTRIM(RTRIM(@Subcategoria)))
        OR (TRY_CONVERT(INT, O.U_Subcategoria) IS NOT NULL AND TRY_CONVERT(INT, @Subcategoria) IS NOT NULL
            AND TRY_CONVERT(INT, O.U_Subcategoria) = TRY_CONVERT(INT, @Subcategoria))
      )
      AND (@SkusCsv IS NULL OR I.ItemCode IN (SELECT LTRIM(RTRIM(value)) FROM STRING_SPLIT(@SkusCsv, ',')))
      AND (
        @HasCanal = 0
        OR (
          ( @HasMeli = 1 AND (
              (I.WhsCode IN ('03','05') AND T0.SlpCode IN (426, 364, 355) AND
                (@TipoEnvio IS NULL
                 OR (@TipoEnvio = 'full'    AND I.WhsCode = '05' AND I.SlpCode = 355)
                 OR (@TipoEnvio = 'colecta' AND I.WhsCode = '03' AND I.SlpCode = 355))
              )
              OR (I.WhsCode = '01' AND T0.SlpCode IN (355, 398))
            ))
          OR ( @HasFalabella = 1 AND I.WhsCode = '03' AND T0.SlpCode = 371 )
          OR ( @HasBalmaceda = 1 AND I.WhsCode = '07' )
          OR ( @HasVitex = 1 AND I.WhsCode = '01' AND T0.SlpCode IN (401, 397) )
          OR ( @HasChorrillo = 1 AND I.WhsCode = '01'
                AND I.SlpCode NOT IN (401, 397, 355, 398, 227, 250, 205, 138, 209, 228, 226, 137, 212) )
          OR ( @HasEmpresas = 1 AND I.WhsCode = '01'
                AND I.SlpCode IN (227, 250, 205, 138, 209, 228, 226, 137, 212) )
        )
      )
      AND (@VendedorParam IS NULL OR I.SlpCode = @VendedorParam);

    /* =========
       3) Breakdown SKU + Canal (agregado)
       ========= */
    ;WITH ProductosProveedor AS (
      SELECT DISTINCT POR1.ItemCode
      FROM POR1
      INNER JOIN OPOR ON OPOR.DocEntry = POR1.DocEntry
      WHERE @Proveedor IS NULL OR OPOR.CardCode = @Proveedor
    )
    SELECT
      I.ItemCode                                     AS sku,
      C.Canal                                        AS canal,
      MAX(O.U_Imagen)                                AS imagen,  -- agregado con MAX
      SUM(I.Quantity)                                AS cantidadVendida,
      SUM(I.LineTotal - (I.Quantity * I.StockPrice)) AS margenBruto,
      SUM(I.Quantity * I.StockPrice)                 AS costoTotal,
      CAST(
        (SUM(I.LineTotal - (I.Quantity * I.StockPrice)) * 100.0)
        / NULLIF(SUM(I.Quantity * I.StockPrice), 0)
        AS DECIMAL(18,2)
      ) AS margenPorcentaje
    FROM INV1 I
    INNER JOIN OINV T0 ON I.DocEntry = T0.DocEntry
    INNER JOIN OITM O  ON I.ItemCode = O.ItemCode
    CROSS APPLY (
      SELECT CASE
        WHEN (
          (I.WhsCode IN ('03','05') AND COALESCE(I.SlpCode, T0.SlpCode) IN (426, 364, 355) AND
            (@TipoEnvio IS NULL
             OR (@TipoEnvio = 'full'    AND I.WhsCode = '05' AND COALESCE(I.SlpCode, T0.SlpCode) = 355)
             OR (@TipoEnvio = 'colecta' AND I.WhsCode = '03' AND COALESCE(I.SlpCode, T0.SlpCode) = 355))
          )
          OR (I.WhsCode = '01' AND COALESCE(I.SlpCode, T0.SlpCode) IN (355, 398))
        ) THEN 'Meli'
        WHEN (I.WhsCode = '03' AND COALESCE(I.SlpCode, T0.SlpCode) = 371) THEN 'Falabella'
        WHEN (I.WhsCode = '07') THEN 'Balmaceda'
        WHEN (I.WhsCode = '01' AND COALESCE(I.SlpCode, T0.SlpCode) IN (401, 397)) THEN 'Vitex'
        WHEN (I.WhsCode = '01'
              AND COALESCE(I.SlpCode, T0.SlpCode) NOT IN (401, 397, 355, 398, 227, 250, 205, 138, 209, 228, 226, 137, 212)) THEN 'Chorrillo'
        WHEN (I.WhsCode = '01'
              AND COALESCE(I.SlpCode, T0.SlpCode)     IN (227, 250, 205, 138, 209, 228, 226, 137, 212)) THEN 'Empresas'
        ELSE NULL
      END AS Canal
    ) C
    WHERE
      T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
      AND T0.CANCELED = 'N'
      AND O.AvgPrice > 0
      AND C.Canal IS NOT NULL
      AND (@Proveedor IS NULL OR I.ItemCode IN (SELECT ItemCode FROM ProductosProveedor))
      AND (
        @PrimerNivel IS NULL
        OR UPPER(LTRIM(RTRIM(O.U_PRIMER_NIVEL))) = UPPER(LTRIM(RTRIM(@PrimerNivel)))
        OR (TRY_CONVERT(INT, O.U_PRIMER_NIVEL) IS NOT NULL AND TRY_CONVERT(INT, @PrimerNivel) IS NOT NULL
            AND TRY_CONVERT(INT, O.U_PRIMER_NIVEL) = TRY_CONVERT(INT, @PrimerNivel))
      )
      AND (
        @Categoria IS NULL
        OR UPPER(LTRIM(RTRIM(O.U_Categoria))) = UPPER(LTRIM(RTRIM(@Categoria)))
        OR (TRY_CONVERT(INT, O.U_Categoria) IS NOT NULL AND TRY_CONVERT(INT, @Categoria) IS NOT NULL
            AND TRY_CONVERT(INT, O.U_Categoria) = TRY_CONVERT(INT, @Categoria))
      )
      AND (
        @Subcategoria IS NULL
        OR UPPER(LTRIM(RTRIM(O.U_Subcategoria))) = UPPER(LTRIM(RTRIM(@Subcategoria)))
        OR (TRY_CONVERT(INT, O.U_Subcategoria) IS NOT NULL AND TRY_CONVERT(INT, @Subcategoria) IS NOT NULL
            AND TRY_CONVERT(INT, O.U_Subcategoria) = TRY_CONVERT(INT, @Subcategoria))
      )
      AND (@SkusCsv IS NULL OR I.ItemCode IN (SELECT LTRIM(RTRIM(value)) FROM STRING_SPLIT(@SkusCsv, ',')))
      AND (
        @HasCanal = 0
        OR ( (@HasMeli=1 AND C.Canal='Meli')
          OR (@HasFalabella=1 AND C.Canal='Falabella')
          OR (@HasBalmaceda=1 AND C.Canal='Balmaceda')
          OR (@HasVitex=1 AND C.Canal='Vitex')
          OR (@HasChorrillo=1 AND C.Canal='Chorrillo')
          OR (@HasEmpresas=1 AND C.Canal='Empresas') )
      )
      AND (@VendedorParam IS NULL OR I.SlpCode = @VendedorParam)
    GROUP BY I.ItemCode, C.Canal
    ORDER BY I.ItemCode, C.Canal;

    /* =========
       4) Detalle de líneas por SKU + Canal
       ========= */
    ;WITH ProductosProveedor AS (
      SELECT DISTINCT POR1.ItemCode
      FROM POR1
      INNER JOIN OPOR ON OPOR.DocEntry = POR1.DocEntry
      WHERE @Proveedor IS NULL OR OPOR.CardCode = @Proveedor
    )
    SELECT
      I.ItemCode                                 AS sku,
      O.U_Imagen                                 AS imagen,
      C.Canal                                    AS canal,
      T0.folionum                                  AS folioNum,          
      CONVERT(date, T0.DocDate)                  AS fecha,
      COALESCE(I.SlpCode, T0.SlpCode)            AS vendedorCodigo,    
      S.SlpName                                  AS vendedor,
      I.Quantity                                 AS cantidad,
      I.LineTotal                                AS venta,
      (I.LineTotal - (I.Quantity * I.StockPrice)) AS margenBrutoLinea,
      (I.Quantity * I.StockPrice)                AS costoLinea
    FROM INV1 I
    INNER JOIN OINV T0 ON I.DocEntry = T0.DocEntry
    INNER JOIN OITM O  ON I.ItemCode = O.ItemCode
    LEFT  JOIN OSLP S  ON S.SlpCode = COALESCE(I.SlpCode, T0.SlpCode)
    CROSS APPLY (
      SELECT CASE
        WHEN (
          (I.WhsCode IN ('03','05') AND COALESCE(I.SlpCode, T0.SlpCode) IN (426, 364, 355) AND
            (@TipoEnvio IS NULL
             OR (@TipoEnvio = 'full'    AND I.WhsCode = '05' AND COALESCE(I.SlpCode, T0.SlpCode) = 355)
             OR (@TipoEnvio = 'colecta' AND I.WhsCode = '03' AND COALESCE(I.SlpCode, T0.SlpCode) = 355))
          )
          OR (I.WhsCode = '01' AND COALESCE(I.SlpCode, T0.SlpCode) IN (355, 398))
        ) THEN 'Meli'
        WHEN (I.WhsCode = '03' AND COALESCE(I.SlpCode, T0.SlpCode) = 371) THEN 'Falabella'
        WHEN (I.WhsCode = '07') THEN 'Balmaceda'
        WHEN (I.WhsCode = '01' AND COALESCE(I.SlpCode, T0.SlpCode) IN (401, 397)) THEN 'Vitex'
        WHEN (I.WhsCode = '01'
              AND COALESCE(I.SlpCode, T0.SlpCode) NOT IN (401, 397, 355, 398, 227, 250, 205, 138, 209, 228, 226, 137, 212)) THEN 'Chorrillo'
        WHEN (I.WhsCode = '01'
              AND COALESCE(I.SlpCode, T0.SlpCode)     IN (227, 250, 205, 138, 209, 228, 226, 137, 212)) THEN 'Empresas'
        ELSE NULL
      END AS Canal
    ) C
    WHERE
      T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
      AND T0.CANCELED = 'N'
      AND O.AvgPrice > 0
      AND C.Canal IS NOT NULL
      AND (@Proveedor IS NULL OR I.ItemCode IN (SELECT ItemCode FROM ProductosProveedor))
      AND (
        @PrimerNivel IS NULL
        OR UPPER(LTRIM(RTRIM(O.U_PRIMER_NIVEL))) = UPPER(LTRIM(RTRIM(@PrimerNivel)))
        OR (TRY_CONVERT(INT, O.U_PRIMER_NIVEL) IS NOT NULL AND TRY_CONVERT(INT, @PrimerNivel) IS NOT NULL
            AND TRY_CONVERT(INT, O.U_PRIMER_NIVEL) = TRY_CONVERT(INT, @PrimerNivel))
      )
      AND (
        @Categoria IS NULL
        OR UPPER(LTRIM(RTRIM(O.U_Categoria))) = UPPER(LTRIM(RTRIM(@Categoria)))
        OR (TRY_CONVERT(INT, O.U_Categoria) IS NOT NULL AND TRY_CONVERT(INT, @Categoria) IS NOT NULL
            AND TRY_CONVERT(INT, O.U_Categoria) = TRY_CONVERT(INT, @Categoria))
      )
      AND (
        @Subcategoria IS NULL
        OR UPPER(LTRIM(RTRIM(O.U_Subcategoria))) = UPPER(LTRIM(RTRIM(@Subcategoria)))
        OR (TRY_CONVERT(INT, O.U_Subcategoria) IS NOT NULL AND TRY_CONVERT(INT, @Subcategoria) IS NOT NULL
            AND TRY_CONVERT(INT, O.U_Subcategoria) = TRY_CONVERT(INT, @Subcategoria))
      )
      AND (@SkusCsv IS NULL OR I.ItemCode IN (SELECT LTRIM(RTRIM(value)) FROM STRING_SPLIT(@SkusCsv, ',')))
      AND (
        @HasCanal = 0
        OR ( (@HasMeli=1 AND C.Canal='Meli')
          OR (@HasFalabella=1 AND C.Canal='Falabella')
          OR (@HasBalmaceda=1 AND C.Canal='Balmaceda')
          OR (@HasVitex=1 AND C.Canal='Vitex')
          OR (@HasChorrillo=1 AND C.Canal='Chorrillo')
          OR (@HasEmpresas=1 AND C.Canal='Empresas') )
      )
      AND (@VendedorParam IS NULL OR I.SlpCode = @VendedorParam)
    ORDER BY I.ItemCode, C.Canal, T0.DocDate DESC, T0.folionum DESC;  -- orden claro
  `;

  const result = await request.query(query);

  return {
    rows: result.recordsets[0] || [],
    total: result.recordsets[1]?.[0]?.Total || 0,
    breakdown: result.recordsets[2] || [],
    detalles: result.recordsets[3] || [],
  };
}

module.exports = { obtenerProductosPorCanalMargenDB };
