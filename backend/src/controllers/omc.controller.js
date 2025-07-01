
const { sql, poolPromise } = require("../models/db");

const getTemplates = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT ID, Nombre, Codigo, FechaCreacion
      FROM TEMPLATES
      ORDER BY FechaCreacion DESC
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error("❌ Error al obtener templates:", error);
    res.status(500).json({ error: "Error en el servidor al obtener los templates." });
  }
};

module.exports = {getTemplates};
