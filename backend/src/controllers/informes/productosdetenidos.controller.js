const sql = require('mssql');
const { poolPromise } = require('../../models/db');

const obtenerProductosDetenidos = async (req, res) => {
  try {
    const pool = await poolPromise;

    const periodo = req.query.periodo || '7D';
    const primerNivel = req.query.primerNivel || null;
    const categoria = req.query.categoria || null;
    const subcategoria = req.query.subcategoria || null;
    const fechaInicioInput = req.query.fechaInicio || null;
    const fechaFinInput = req.query.fechaFin || null;

    const request = pool.request();
    request.input('PeriodoParam', sql.NVarChar(10), periodo);
    request.input('PrimerNivelParam', sql.NVarChar(100), primerNivel);
    request.input('CategoriaParam', sql.NVarChar(100), categoria);
    request.input('SubcategoriaParam', sql.NVarChar(100), subcategoria);
    request.input('FechaInicioInput', sql.Date, fechaInicioInput);
    request.input('FechaFinInput', sql.Date, fechaFinInput);

    const query = `
      DECLARE @Periodo NVARCHAR(10) = @PeriodoParam;
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
          END
      END
      ELSE
      BEGIN
        SET @FechaInicio = @FechaInicioCustom;
        SET @FechaFin = @FechaFinCustom;
      END

      ;WITH Costo3Compras AS (
        SELECT P.ItemCode, AVG(P.PriceBefDi) AS CostoPromedio
        FROM (
          SELECT POR1.ItemCode, POR1.PriceBefDi,
            ROW_NUMBER() OVER (PARTITION BY POR1.ItemCode ORDER BY OPOR.DocDate DESC) AS rn
          FROM POR1
          INNER JOIN OPOR ON POR1.DocEntry = OPOR.DocEntry
          WHERE POR1.ItemCode IS NOT NULL
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
        ISNULL(SUM(OITW.OnHand), 0) AS Stock,
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
      LEFT JOIN OITW ON OITW.ItemCode = OITM.ItemCode AND OITW.WhsCode IN ('01', '03', '05', '07', '12', '13')
      LEFT JOIN INV1 ON INV1.ItemCode = OITM.ItemCode
      LEFT JOIN OINV ON OINV.DocEntry = INV1.DocEntry AND OINV.DocDate BETWEEN @FechaInicio AND @FechaFin
      LEFT JOIN UltimaVenta UV ON UV.ItemCode = OITM.ItemCode
      LEFT JOIN UltimaCompra UC ON UC.ItemCode = OITM.ItemCode
      LEFT JOIN Costo3Compras C3 ON C3.ItemCode = OITM.ItemCode
      LEFT JOIN [@PRIMER_NIVEL] PN ON PN.Code = OITM.U_Primer_Nivel
      LEFT JOIN [@CATEGORIA] CAT ON CAT.Code = OITM.U_Categoria
      LEFT JOIN [@SUBCATEGORIA] SUBC ON SUBC.Code = OITM.U_Subcategoria
      WHERE
        OITM.PrchseItem = 'Y'
        AND (@PrimerNivel IS NULL OR OITM.U_Primer_Nivel = @PrimerNivel)
        AND (@Categoria IS NULL OR OITM.U_Categoria = @Categoria)
        AND (@Subcategoria IS NULL OR OITM.U_Subcategoria = @Subcategoria)
      GROUP BY
        OITM.ItemCode, OITM.ItemName, OITM.U_Primer_Nivel, OITM.U_Categoria, OITM.U_Subcategoria,
        OITM.U_Imagen, UV.UltimaFechaVenta, UC.UltimaFechaCompra, PN.Name, CAT.Name, SUBC.Name, C3.CostoPromedio
      HAVING
        (UV.UltimaFechaVenta IS NULL OR UV.UltimaFechaVenta < @FechaInicio)
        AND SUM(ISNULL(OITW.OnHand, 0)) > 0
      ORDER BY DiasSinVenta DESC;
    `;

    const result = await request.query(query);
    res.json(result.recordset);

  } catch (error) {
    console.error('Error al obtener productos detenidos (simple):', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  obtenerProductosDetenidos
};
