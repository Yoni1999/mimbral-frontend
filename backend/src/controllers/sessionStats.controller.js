const { sql, poolPromise } = require("../models/db");

const getUserSessionStats = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        U.Nombre AS nombre,
        COUNT(S.FechaInicio) AS sesiones,
        MAX(S.FechaInicio) AS ultimaConexion
      FROM SESIONES_USUARIOS S
      JOIN USUARIOS U ON U.ID = S.UsuarioID
      GROUP BY U.Nombre
      ORDER BY ultimaConexion DESC
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error("❌ Error al obtener estadísticas de sesión:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

module.exports = { getUserSessionStats };
