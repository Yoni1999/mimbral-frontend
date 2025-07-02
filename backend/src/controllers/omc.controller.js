const { sql, poolPromise } = require("../models/db");
const beautify = require("js-beautify").html;

const getTemplates = async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT ID, Nombre, Codigo, FechaCreacion
      FROM TEMPLATES
      ORDER BY FechaCreacion DESC
    `);

    // Formatear el campo Codigo
    const formattedTemplates = result.recordset.map(template => ({
      ...template,
      Codigo: beautify(template.Codigo, {
        indent_size: 2,
        preserve_newlines: true,
        unformatted: []
      })
    }));

    res.json(formattedTemplates);
  } catch (error) {
    console.error("❌ Error al obtener templates:", error);
    res.status(500).json({ error: "Error en el servidor al obtener los templates." });
  }
};

const insertTemplate = async (req, res) => {
  try {
    const { nombre, codigo } = req.body;

    if (!nombre || !codigo) {
      return res.status(400).json({ error: "Faltan campos obligatorios." });
    }

    const pool = await poolPromise;

    await pool.request()
      .input("Nombre", sql.NVarChar, nombre)
      .input("Codigo", sql.NVarChar(sql.MAX), codigo)
      .input("FechaCreacion", sql.DateTime, new Date())
      .query(`
        INSERT INTO TEMPLATES (Nombre, Codigo, FechaCreacion)
        VALUES (@Nombre, @Codigo, @FechaCreacion)
      `);

    res.status(201).json({ message: "Template insertado correctamente." });

  } catch (error) {
    console.error("❌ Error al insertar template:", error);
    res.status(500).json({ error: "Error en el servidor al insertar el template." });
  }
};
const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "ID no proporcionado" });
    }

    const pool = await poolPromise;

    const result = await pool.request()
      .input("ID", sql.Int, id)
      .query("DELETE FROM TEMPLATES WHERE ID = @ID");

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Template no encontrado" });
    }

    res.json({ message: "Template eliminado correctamente" });

  } catch (error) {
    console.error("❌ Error al eliminar template:", error);
    res.status(500).json({ error: "Error en el servidor al eliminar el template." });
  }
};


module.exports = { getTemplates, insertTemplate, deleteTemplate };
