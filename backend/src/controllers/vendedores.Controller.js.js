const { sql, poolPromise } = require("../models/db");
const { getCachedData } = require("../utils/cache");

const obtenerVendedores = async (req, res) => {
  try {
    const pool = await poolPromise;

    // 🔹 Obtener parámetros desde la URL
    let { periodo, fechaInicio, fechaFin } = req.query;

    // Validar fechas personalizadas o calcular según el periodo
    if (!fechaInicio || !fechaFin) {
      fechaFin = new Date().toISOString().split("T")[0]; // Hoy
      let fechaInicioObj = new Date();

      switch (periodo) {
        case "1D":
          fechaInicio = fechaFin;
          break;
        case "7D":
          fechaInicioObj.setDate(fechaInicioObj.getDate() - 7);
          break;
        case "30D":
          fechaInicioObj.setDate(fechaInicioObj.getDate() - 30);
          break;
        case "3M":
          fechaInicioObj.setMonth(fechaInicioObj.getMonth() - 3);
          break;
        case "6M":
          fechaInicioObj.setMonth(fechaInicioObj.getMonth() - 6);
          break;
        default:
          fechaInicioObj.setDate(fechaInicioObj.getDate() - 7); // Por defecto, últimos 7 días
      }

      fechaInicio = fechaInicioObj.toISOString().split("T")[0];
    }

    // 🔹 Query SQL con filtro de fechas dinámico
    const query = `
      DECLARE @FechaInicio DATE = @FechaInicioInput;
      DECLARE @FechaFin DATE = @FechaFinInput;

      SELECT 
          IV1.SlpCode AS id,  
          SLP.SlpName AS nombre,
          SLP.Memo AS cargo,
          'San Javier' AS Rol,  
          CASE 
              WHEN SUM(IV1.LineTotal) >= 4000000 THEN 'Top'
              WHEN SUM(IV1.LineTotal) BETWEEN 1000000 AND 3999999 THEN 'Intermedio'
              ELSE 'Bajo'
          END AS categoria,
          CASE 
              WHEN SUM(IV1.LineTotal) >= 4000000 THEN 'success.main'
              WHEN SUM(IV1.LineTotal) BETWEEN 1000000 AND 3999999 THEN 'warning.main'
              ELSE 'error.main'
          END AS colorCategoria,
          CAST(SUM(IV1.LineTotal) AS INT) AS ventas, 
          CONVERT(VARCHAR, MAX(OI.DocDate), 23) AS fechaVentas
      FROM INV1 IV1
      LEFT JOIN OINV OI ON IV1.DocEntry = OI.DocEntry
      LEFT JOIN OSLP SLP ON IV1.SlpCode = SLP.SlpCode 
      WHERE OI.DocDate BETWEEN @FechaInicio AND @FechaFin  
      AND OI.CANCELED = 'N'  
      AND IV1.SlpCode IS NOT NULL  
      GROUP BY IV1.SlpCode, SLP.SlpName, SLP.Memo
      ORDER BY ventas DESC;
    `;

    // 🔹 Ejecutar consulta en SQL Server
    const result = await pool
      .request()
      .input("FechaInicioInput", sql.Date, fechaInicio)
      .input("FechaFinInput", sql.Date, fechaFin)
      .query(query);

    res.json(result.recordset);
  } catch (error) {
    console.error("❌ Error al obtener vendedores:", error);
    res.status(500).json({ error: "Error en el servidor." });
  }
};

module.exports = { obtenerVendedores };
