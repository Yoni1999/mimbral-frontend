const sql = require('mssql');
const { poolPromise } = require('../../models/db');

const obtenerProductosDetenidos = async (req, res) => {
  try {
    const pool = await poolPromise;

    // Obtener parámetros de la query string
    const periodo = req.query.periodo || '7D';
    const proveedor = req.query.proveedor || null;
    const primerNivel = req.query.primerNivel || null;
    const categoria = req.query.categoria || null;
    const subcategoria = req.query.subcategoria || null;
    const fechaInicioInput = req.query.fechaInicio || null; // Formato esperado 'YYYY-MM-DD'
    const fechaFinInput = req.query.fechaFin || null;     // Formato esperado 'YYYY-MM-DD'

    // Parámetros de paginación y ordenación
    const offset = parseInt(req.query.offset || '0');
    const limit = parseInt(req.query.limit || '20');
    const sortBy = req.query.sortBy || 'DiasSinVenta'; // Valor por defecto para ordenación
    const sortDirection = req.query.sortDirection || 'desc'; // Valor por defecto para dirección

    // --- DIAGNÓSTICO: Verificamos qué parámetros de ordenación recibimos ---
    console.log(`[Backend] Recibido: sortBy=${sortBy}, sortDirection=${sortDirection}, offset=${offset}, limit=${limit}`);

    // Validación de campos de ordenación permitidos para prevenir SQL injection
    const validSortFields = {
      SKU: 'OITM.ItemCode',
      Producto: 'OITM.ItemName',
      PrimerNivel: 'PN.Name',
      Categoria: 'CAT.Name',
      Subcategoria: 'SUBC.Name',
      UltimaVenta: 'UV.UltimaFechaVenta', // Alias de la CTE para la columna de fecha
      DiasSinVenta: 'DATEDIFF(DAY, UV.UltimaFechaVenta, GETDATE())', // Función para calcular días sin venta
      UltimaCompra: 'UC.UltimaFechaCompra', // Alias de la CTE para la columna de fecha
      Stock: 'SP.Stock', // Alias de la CTE StockPorProducto
      CostoPromedioUlt3Compras: 'C3.CostoPromedio', // Alias de la CTE Costo3Compras
      MargenPorcentaje: 'MargenPorcentaje' // Alias de la columna calculada en el SELECT
    };

    // Asegurarse de que el sortBy sea una clave válida o usar el valor por defecto
    const sortFieldSQL = validSortFields[sortBy] || 'DATEDIFF(DAY, UV.UltimaFechaVenta, GETDATE())';
    const sortDirSQL = sortDirection.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // --- DIAGNÓSTICO: Verificamos cómo se construyó la ordenación SQL ---
    console.log(`[Backend] Ordenación SQL construida: ORDER BY ${sortFieldSQL} ${sortDirSQL}`);

    // --- Lógica de cálculo de fechas dentro de SQL ---
    // (Esta parte permanece igual, ya que tu enfoque es manejar las fechas en SQL)

    const paginatedDataQuery = `
      DECLARE @Periodo NVARCHAR(10) = @PeriodoParam;
      DECLARE @Proveedor NVARCHAR(50) = @ProveedorParam;
      DECLARE @PrimerNivel NVARCHAR(100) = @PrimerNivelParam;
      DECLARE @Categoria NVARCHAR(100) = @CategoriaParam;
      DECLARE @Subcategoria NVARCHAR(100) = @SubcategoriaParam;
      DECLARE @FechaInicioCustom DATE = @FechaInicioInput;
      DECLARE @FechaFinCustom DATE = @FechaFinInput;
      DECLARE @FechaInicio DATE, @FechaFin DATE;

      IF @Periodo <> 'RANGO'
      BEGIN
        SET @FechaFin = GETDATE();
        SET @FechaInicio =
          CASE UPPER(@Periodo)
            WHEN '7D' THEN DATEADD(DAY, -7, @FechaFin)
            WHEN '14D' THEN DATEADD(DAY, -14, @FechaFin)
            WHEN '1M' THEN DATEADD(MONTH, -1, @FechaFin)
            WHEN '3M' THEN DATEADD(MONTH, -3, @FechaFin)
            WHEN '6M' THEN DATEADD(MONTH, -6, @FechaFin)
            WHEN '1Y' THEN DATEADD(YEAR, -1, @FechaFin)
            WHEN '2Y' THEN DATEADD(YEAR, -2, @FechaFin)
            ELSE DATEADD(DAY, -7, @FechaFin)
          END;
      END
      ELSE
      BEGIN
        SET @FechaInicio = @FechaInicioCustom;
        SET @FechaFin = @FechaFinCustom;
      END

      ;WITH ProductosDelProveedor AS (
        SELECT DISTINCT POR1.ItemCode
        FROM POR1
        INNER JOIN OPOR ON OPOR.DocEntry = POR1.DocEntry
        WHERE @Proveedor IS NULL OR OPOR.CardCode = @Proveedor
      ),
      Costo3Compras AS (
        SELECT P.ItemCode, AVG(P.PriceBefDi) AS CostoPromedio
        FROM (
          SELECT POR1.ItemCode, POR1.PriceBefDi,
            ROW_NUMBER() OVER (PARTITION BY POR1.ItemCode ORDER BY OPOR.DocDate DESC, POR1.LineNum DESC) AS rn
          FROM POR1
          INNER JOIN OPOR ON POR1.DocEntry = OPOR.DocEntry
          WHERE POR1.ItemCode IS NOT NULL
            AND (@Proveedor IS NULL OR OPOR.CardCode = @Proveedor)
        ) AS P
        WHERE P.rn <= 3
        GROUP BY P.ItemCode
      ),
      UltimaVenta AS (
        SELECT INV1.ItemCode, MAX(OINV.DocDate) AS UltimaFechaVenta
        FROM OINV
        INNER JOIN INV1 ON OINV.DocEntry = INV1.DocEntry
        GROUP BY INV1.ItemCode
      ),
      UltimaCompra AS (
        SELECT POR1.ItemCode, MAX(OPOR.DocDate) AS UltimaFechaCompra
        FROM POR1
        INNER JOIN OPOR ON POR1.DocEntry = OPOR.DocEntry
        WHERE POR1.ItemCode IS NOT NULL
        GROUP BY POR1.ItemCode
      ),
      StockPorProducto AS (
        SELECT ItemCode, SUM(OnHand) AS Stock
        FROM OITW
        WHERE WhsCode IN ('01', '03', '05', '07', '12', '13')
        GROUP BY ItemCode
      )

      SELECT
        OITM.ItemCode AS SKU,
        OITM.ItemName AS Producto,
        PN.Name AS PrimerNivel,
        CAT.Name AS Categoria,
        SUBC.Name AS Subcategoria,
        UV.UltimaFechaVenta AS UltimaVenta,
        DATEDIFF(DAY, UV.UltimaFechaVenta, GETDATE()) AS DiasSinVenta,
        UC.UltimaFechaCompra,
        ISNULL(SP.Stock, 0) AS Stock,
        OITM.U_Imagen AS Imagen,
        ISNULL(C3.CostoPromedio, 0) AS CostoPromedioUlt3Compras,
        CAST(
          CASE
            WHEN SUM(ISNULL(INV1.LineTotal, 0)) = 0 THEN 0
            ELSE ((SUM(ISNULL(INV1.LineTotal, 0)) - SUM(ISNULL(C3.CostoPromedio * INV1.Quantity, 0))) * 100.0)
                 / NULLIF(SUM(ISNULL(INV1.LineTotal, 0)), 0)
          END AS DECIMAL(10,2)
        ) AS MargenPorcentaje
      FROM OITM
      LEFT JOIN INV1 ON INV1.ItemCode = OITM.ItemCode
      LEFT JOIN OINV ON OINV.DocEntry = INV1.DocEntry AND OINV.DocDate BETWEEN @FechaInicio AND @FechaFin
      LEFT JOIN UltimaVenta UV ON UV.ItemCode = OITM.ItemCode
      LEFT JOIN UltimaCompra UC ON UC.ItemCode = OITM.ItemCode
      LEFT JOIN Costo3Compras C3 ON C3.ItemCode = OITM.ItemCode
      LEFT JOIN StockPorProducto SP ON SP.ItemCode = OITM.ItemCode
      LEFT JOIN [@PRIMER_NIVEL] PN ON PN.Code = OITM.U_Primer_Nivel
      LEFT JOIN [@CATEGORIA] CAT ON CAT.Code = OITM.U_Categoria
      LEFT JOIN [@SUBCATEGORIA] SUBC ON SUBC.Code = OITM.U_Subcategoria
      WHERE
        OITM.PrchseItem = 'Y'
        AND (@Proveedor IS NULL OR OITM.ItemCode IN (SELECT ItemCode FROM ProductosDelProveedor))
        AND (@PrimerNivel IS NULL OR OITM.U_Primer_Nivel = @PrimerNivel)
        AND (@Categoria IS NULL OR OITM.U_Categoria = @Categoria)
        AND (@Subcategoria IS NULL OR OITM.U_Subcategoria = @Subcategoria)
      GROUP BY
        OITM.ItemCode, OITM.ItemName, OITM.U_Primer_Nivel, OITM.U_Categoria, OITM.U_Subcategoria,
        OITM.U_Imagen, UV.UltimaFechaVenta, UC.UltimaFechaCompra,
        PN.Name, CAT.Name, SUBC.Name, C3.CostoPromedio, SP.Stock
      HAVING
        (UV.UltimaFechaVenta IS NULL OR UV.UltimaFechaVenta < @FechaInicio)
        AND ISNULL(SP.Stock, 0) > 0
      ORDER BY ${sortFieldSQL} ${sortDirSQL}
      OFFSET @Offset ROWS
      FETCH NEXT @Limit ROWS ONLY;
    `;

    const totalCountQuery = `
      DECLARE @Periodo NVARCHAR(10) = @PeriodoParam;
      DECLARE @Proveedor NVARCHAR(50) = @ProveedorParam;
      DECLARE @PrimerNivel NVARCHAR(100) = @PrimerNivelParam;
      DECLARE @Categoria NVARCHAR(100) = @CategoriaParam;
      DECLARE @Subcategoria NVARCHAR(100) = @SubcategoriaParam;
      DECLARE @FechaInicioCustom DATE = @FechaInicioInput;
      DECLARE @FechaFinCustom DATE = @FechaFinInput;
      DECLARE @FechaInicio DATE, @FechaFin DATE;

      IF @Periodo <> 'RANGO'
      BEGIN
        SET @FechaFin = GETDATE();
        SET @FechaInicio =
          CASE UPPER(@Periodo)
            WHEN '7D' THEN DATEADD(DAY, -7, @FechaFin)
            WHEN '14D' THEN DATEADD(DAY, -14, @FechaFin)
            WHEN '1M' THEN DATEADD(MONTH, -1, @FechaFin)
            WHEN '3M' THEN DATEADD(MONTH, -3, @FechaFin)
            WHEN '6M' THEN DATEADD(MONTH, -6, @FechaFin)
            WHEN '1Y' THEN DATEADD(YEAR, -1, @FechaFin)
            WHEN '2Y' THEN DATEADD(YEAR, -2, @FechaFin)
            ELSE DATEADD(DAY, -7, @FechaFin)
          END;
      END
      ELSE
      BEGIN
        SET @FechaInicio = @FechaInicioCustom;
        SET @FechaFin = @FechaFinCustom;
      END

      ;WITH ProductosDelProveedor AS (
        SELECT DISTINCT POR1.ItemCode
        FROM POR1
        INNER JOIN OPOR ON OPOR.DocEntry = POR1.DocEntry
        WHERE @Proveedor IS NULL OR OPOR.CardCode = @Proveedor
      ),
      UltimaVenta AS (
        SELECT INV1.ItemCode, MAX(OINV.DocDate) AS UltimaFechaVenta
        FROM OINV
        INNER JOIN INV1 ON OINV.DocEntry = INV1.DocEntry
        GROUP BY INV1.ItemCode
      ),
      StockPorProducto AS (
        SELECT ItemCode, SUM(OnHand) AS Stock
        FROM OITW
        WHERE WhsCode IN ('01', '03', '05', '07', '13')
        GROUP BY ItemCode
      )
      SELECT COUNT(DISTINCT OITM.ItemCode) as total
      FROM OITM
      LEFT JOIN INV1 ON INV1.ItemCode = OITM.ItemCode
      LEFT JOIN OINV ON OINV.DocEntry = INV1.DocEntry AND OINV.DocDate BETWEEN @FechaInicio AND @FechaFin
      LEFT JOIN UltimaVenta UV ON UV.ItemCode = OITM.ItemCode
      LEFT JOIN StockPorProducto SP ON SP.ItemCode = OITM.ItemCode
      LEFT JOIN [@PRIMER_NIVEL] PN ON PN.Code = OITM.U_Primer_Nivel
      LEFT JOIN [@CATEGORIA] CAT ON CAT.Code = OITM.U_Categoria
      LEFT JOIN [@SUBCATEGORIA] SUBC ON SUBC.Code = OITM.U_Subcategoria
      WHERE
        OITM.PrchseItem = 'Y'
        AND (@Proveedor IS NULL OR OITM.ItemCode IN (SELECT ItemCode FROM ProductosDelProveedor))
        AND (@PrimerNivel IS NULL OR OITM.U_Primer_Nivel = @PrimerNivel)
        AND (@Categoria IS NULL OR OITM.U_Categoria = @Categoria)
        AND (@Subcategoria IS NULL OR OITM.U_Subcategoria = @Subcategoria)
      GROUP BY
        OITM.ItemCode,
        UV.UltimaFechaVenta,
        SP.Stock
      HAVING
        (UV.UltimaFechaVenta IS NULL OR UV.UltimaFechaVenta < @FechaInicio)
        AND ISNULL(SP.Stock, 0) > 0;
    `;

    const dataRequest = pool.request();
    dataRequest.input('PeriodoParam', sql.NVarChar(10), periodo);
    dataRequest.input('ProveedorParam', sql.NVarChar(50), proveedor);
    dataRequest.input('PrimerNivelParam', sql.NVarChar(100), primerNivel);
    dataRequest.input('CategoriaParam', sql.NVarChar(100), categoria);
    dataRequest.input('SubcategoriaParam', sql.NVarChar(100), subcategoria);
    dataRequest.input('FechaInicioInput', sql.Date, fechaInicioInput);
    dataRequest.input('FechaFinInput', sql.Date, fechaFinInput);
    dataRequest.input('Offset', sql.Int, offset);
    dataRequest.input('Limit', sql.Int, limit);

    const countRequest = pool.request();
    countRequest.input('PeriodoParam', sql.NVarChar(10), periodo);
    countRequest.input('ProveedorParam', sql.NVarChar(50), proveedor);
    countRequest.input('PrimerNivelParam', sql.NVarChar(100), primerNivel);
    countRequest.input('CategoriaParam', sql.NVarChar(100), categoria);
    countRequest.input('SubcategoriaParam', sql.NVarChar(100), subcategoria);
    countRequest.input('FechaInicioInput', sql.Date, fechaInicioInput);
    countRequest.input('FechaFinInput', sql.Date, fechaFinInput);

    const [dataResult, countResult] = await Promise.all([
      dataRequest.query(paginatedDataQuery),
      countRequest.query(totalCountQuery)
    ]);

    const totalItems = countResult.recordset.length;

    res.status(200).json({
      data: dataResult.recordset,
      total: totalItems
    });

  } catch (error) {
    console.error('Error al obtener productos detenidos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};


const getStockDisponible = async (req, res) => {
  try {
    const pool = await poolPromise;

    const {
      proveedor = null,
      primerNivel = null,
      categoria = null,
      subcategoria = null,
    } = req.query;

    const result = await pool.request()
      .input('Proveedor', sql.NVarChar(50), proveedor)
      .input('PrimerNivel', sql.NVarChar(100), primerNivel)
      .input('Categoria', sql.NVarChar(100), categoria)
      .input('Subcategoria', sql.NVarChar(100), subcategoria)
      .query(`
        ;WITH ProductosProveedor AS (
          SELECT DISTINCT POR1.ItemCode
          FROM POR1
          INNER JOIN OPOR ON OPOR.DocEntry = POR1.DocEntry
          WHERE @Proveedor IS NULL OR OPOR.CardCode = @Proveedor
        )
        SELECT 
          OITM.ItemCode, 
          OITM.ItemName, 
          SUM(OITW.OnHand) AS StockDisponible
        FROM OITM
        INNER JOIN OITW ON OITM.ItemCode = OITW.ItemCode
        LEFT JOIN [@PRIMER_NIVEL] PN ON PN.Code = OITM.U_Primer_Nivel
        LEFT JOIN [@CATEGORIA] CAT ON CAT.Code = OITM.U_Categoria
        LEFT JOIN [@SUBCATEGORIA] SUBC ON SUBC.Code = OITM.U_Subcategoria
        WHERE 
          OITM.SellItem = 'Y'
          AND OITM.PrchseItem = 'N'
          AND OITW.WhsCode <> '02'
          AND (@Proveedor IS NULL OR OITM.ItemCode IN (SELECT ItemCode FROM ProductosProveedor))
          AND (@PrimerNivel IS NULL OR OITM.U_Primer_Nivel = @PrimerNivel)
          AND (@Categoria IS NULL OR OITM.U_Categoria = @Categoria)
          AND (@Subcategoria IS NULL OR OITM.U_Subcategoria = @Subcategoria)
        GROUP BY 
          OITM.ItemCode, 
          OITM.ItemName
        HAVING 
          SUM(OITW.OnHand) > 0
      `);

    res.status(200).json({ data: result.recordset });
  } catch (err) {
    console.error('Error al obtener stock disponible:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  obtenerProductosDetenidos, getStockDisponible
};