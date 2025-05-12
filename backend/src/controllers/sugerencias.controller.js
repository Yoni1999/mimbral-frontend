// controllers/sugerencias.controller.js
const { poolPromise, sql } = require("../models/db");


const crearSugerencia = async (req, res) => {
  try {
    const { departamento, mensaje } = req.body;

    if (!departamento || !mensaje) {
      return res.status(400).json({ error: "Faltan campos obligatorios." });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input("DEPARTAMENTO", sql.NVarChar(100), departamento)
      .input("SUGERENCIA", sql.NVarChar(sql.MAX), mensaje)
      .query(`
        INSERT INTO SUGERENCIAS_USUARIOS (DEPARTAMENTO, SUGERENCIA)
        OUTPUT INSERTED.*
        VALUES (@DEPARTAMENTO, @SUGERENCIA)
      `);

    const sugerenciaInsertada = result.recordset[0];

    res.status(201).json(sugerenciaInsertada);
  } catch (error) {
    console.error("❌ Error al registrar sugerencia:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
};


const obtenerSugerencias = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT ID, ID_USUARIO, DEPARTAMENTO, SUGERENCIA, FECHA_REGISTRO, ESTADO
      FROM SUGERENCIAS_USUARIOS
      ORDER BY FECHA_REGISTRO DESC
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error("❌ Error al obtener sugerencias:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
};
// PUT: actualizar estado
const actualizarEstadoSugerencia = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const pool = await poolPromise;
    await pool.request()
      .input("ID", sql.Int, id)
      .input("ESTADO", sql.NVarChar(20), estado)
      .query(`
        UPDATE SUGERENCIAS_USUARIOS
        SET ESTADO = @ESTADO
        WHERE ID = @ID
      `);

    res.status(200).json({ mensaje: "Estado actualizado con éxito." });
  } catch (error) {
    console.error("❌ Error al actualizar estado:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
};

// DELETE: eliminar sugerencia
const eliminarSugerencia = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;

    await pool.request()
      .input("ID", sql.Int, id)
      .query(`DELETE FROM SUGERENCIAS_USUARIOS WHERE ID = @ID`);

    res.status(200).json({ mensaje: "Sugerencia eliminada." });
  } catch (error) {
    console.error("❌ Error al eliminar sugerencia:", error);
    res.status(500).json({ error: "No se pudo eliminar la sugerencia." });
  }
};

module.exports = {
  obtenerSugerencias,
  crearSugerencia,
  actualizarEstadoSugerencia,
  eliminarSugerencia,
};
