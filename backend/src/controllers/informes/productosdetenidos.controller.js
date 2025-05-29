const sql = require('mssql');
const { poolPromise } = require('../../models/db');

const obtenerProductosDetenidos = async (req, res) => {
  try {
    const { periodo, fechaInicio, fechaFin, primerNivel, categoria, subcategoria } = req.query;

    let fechaInicioFinal = fechaInicio ? new Date(fechaInicio) : null;
    let fechaFinFinal = fechaFin ? new Date(fechaFin) : new Date();

    // Si el periodo no es RANGO, calcular fechas automáticamente
    if (periodo && periodo.toUpperCase() !== 'RANGO') {
      const hoy = new Date();
      fechaFinFinal = hoy;

      switch (periodo.toUpperCase()) {
        case '7D':
          fechaInicioFinal = new Date(hoy.setDate(hoy.getDate() - 7));
          break;
        case '14D':
          fechaInicioFinal = new Date(hoy.setDate(hoy.getDate() - 14));
          break;
        case '1M':
          fechaInicioFinal = new Date(hoy.setMonth(hoy.getMonth() - 1));
          break;
        case '3M':
          fechaInicioFinal = new Date(hoy.setMonth(hoy.getMonth() - 3));
          break;
        case '6M':
          fechaInicioFinal = new Date(hoy.setMonth(hoy.getMonth() - 6));
          break;
        case '1Y':
          fechaInicioFinal = new Date(hoy.setFullYear(hoy.getFullYear() - 1));
          break;
        case '2Y':
          fechaInicioFinal = new Date(hoy.setFullYear(hoy.getFullYear() - 2));
          break;
      }
    }

    const pool = await poolPromise;
    const request = pool.request();

    request
      .input('FechaInicio', sql.Date, fechaInicioFinal)
      .input('FechaFin', sql.Date, fechaFinFinal)
      .input('PrimerNivel', sql.NVarChar(100), primerNivel || null)
      .input('Categoria', sql.NVarChar(100), categoria || null)
      .input('Subcategoria', sql.NVarChar(100), subcategoria || null);

    const result = await request.query(`
      ;WITH UltimaVenta AS (
        SELECT 
          INV1.ItemCode,
          MAX(OINV.DocDate) AS UltimaFechaVenta
        FROM OINV
        INNER JOIN INV1 ON OINV.DocEntry = INV1.DocEntry
        GROUP BY INV1.ItemCode
      )
      SELECT
        OITM.ItemCode AS SKU,
        OITM.ItemName AS Producto,
        PN.Name AS PrimerNivel,
        CAT.Name AS Categoria,
        SUBC.Name AS Subcategoria,
        UV.UltimaFechaVenta AS UltimaVenta,
        DATEDIFF(DAY, UV.UltimaFechaVenta, GETDATE()) AS DiasSinVenta,
        ISNULL(OITM.OnHand, 0) AS Stock,
        OITM.U_Imagen AS Imagen,
        CAST(
          CASE 
            WHEN SUM(ISNULL(INV1.LineTotal, 0)) = 0 THEN 0
            ELSE 
              ((SUM(ISNULL(INV1.LineTotal, 0)) - SUM(ISNULL(INV1.StockPrice * INV1.Quantity, 0))) * 100.0)
              / NULLIF(SUM(ISNULL(INV1.LineTotal, 0)), 0)
          END 
        AS DECIMAL(10,2)) AS MargenPorcentaje
      FROM OITM
      LEFT JOIN INV1 ON INV1.ItemCode = OITM.ItemCode
      LEFT JOIN OINV ON OINV.DocEntry = INV1.DocEntry AND OINV.DocDate BETWEEN @FechaInicio AND @FechaFin
      LEFT JOIN UltimaVenta UV ON UV.ItemCode = OITM.ItemCode
      LEFT JOIN [@PRIMER_NIVEL] PN ON PN.Code = OITM.U_Primer_Nivel
      LEFT JOIN [@CATEGORIA] CAT ON CAT.Code = OITM.U_Categoria
      LEFT JOIN [@SUBCATEGORIA] SUBC ON SUBC.Code = OITM.U_Subcategoria
      WHERE 
        OITM.OnHand > 0
        AND (@PrimerNivel IS NULL OR OITM.U_Primer_Nivel = @PrimerNivel)
        AND (@Categoria IS NULL OR OITM.U_Categoria = @Categoria)
        AND (@Subcategoria IS NULL OR OITM.U_Subcategoria = @Subcategoria)
      GROUP BY 
        OITM.ItemCode, 
        OITM.ItemName, 
        OITM.U_Primer_Nivel,
        OITM.U_Categoria,
        OITM.U_Subcategoria,
        OITM.OnHand, 
        OITM.U_Imagen, 
        UV.UltimaFechaVenta,
        PN.Name,
        CAT.Name,
        SUBC.Name
      HAVING 
        UV.UltimaFechaVenta IS NULL OR UV.UltimaFechaVenta < @FechaInicio
      ORDER BY DiasSinVenta DESC
    `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error al obtener productos detenidos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
module.exports = {
  obtenerProductosDetenidos,
};
