const { sql, poolPromise } = require("../models/db");

const getUserSessionStats = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        U.Nombre AS nombre,
        COUNT(S.ID) AS sesiones,
        SUM(DATEDIFF(MINUTE, S.FechaInicio, S.FechaFin)) AS minutos
      FROM SESIONES_USUARIOS S
      JOIN USUARIOS U ON U.ID = S.UsuarioID
      WHERE S.FechaFin IS NOT NULL
      GROUP BY U.Nombre
      ORDER BY minutos DESC
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error("❌ Error al obtener estadísticas de sesión:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

module.exports = { getUserSessionStats };
