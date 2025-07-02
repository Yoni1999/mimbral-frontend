const beautify = require("js-beautify").html;
const {
  getAllTemplates,
  insertTemplateToDB,
  deleteTemplateById
} = require("../../models/OMC/templace");

// GET
const getTemplates = async (req, res) => {
  try {
    const templates = await getAllTemplates();

    const formatted = templates.map(template => ({
      ...template,
      Codigo: beautify(template.Codigo, {
        indent_size: 2,
        preserve_newlines: true,
        unformatted: []
      })
    }));

    res.json(formatted);
  } catch (error) {
    console.error("❌ Error al obtener templates:", error);
    res.status(500).json({ error: "Error en el servidor al obtener los templates." });
  }
};

// POST
const insertTemplate = async (req, res) => {
  try {
    const { nombre, codigo } = req.body;

    if (!nombre || !codigo) {
      return res.status(400).json({ error: "Faltan campos obligatorios." });
    }

    await insertTemplateToDB({ nombre, codigo });
    res.status(201).json({ message: "Template insertado correctamente." });

  } catch (error) {
    console.error("❌ Error al insertar template:", error);
    res.status(500).json({ error: "Error en el servidor al insertar el template." });
  }
};

// DELETE
const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) return res.status(400).json({ error: "ID no proporcionado" });

    const deleted = await deleteTemplateById(id);
    if (deleted === 0) {
      return res.status(404).json({ error: "Template no encontrado" });
    }

    res.json({ message: "Template eliminado correctamente" });

  } catch (error) {
    console.error("❌ Error al eliminar template:", error);
    res.status(500).json({ error: "Error en el servidor al eliminar el template." });
  }
};

module.exports = { getTemplates, insertTemplate, deleteTemplate };
