const { poolPromise } = require('../db');
const sql = require('mssql');

// Obtener todos los templates
const getAllTemplates = async () => {
  const pool = await poolPromise;
  const result = await pool.request().query(`
    SELECT ID, Nombre, Codigo, FechaCreacion
    FROM TEMPLATES
    ORDER BY FechaCreacion DESC
  `);
  return result.recordset;
};

// Insertar un nuevo template
const insertTemplateToDB = async ({ nombre, codigo }) => {
  const pool = await poolPromise;
  await pool.request()
    .input("Nombre", sql.NVarChar, nombre)
    .input("Codigo", sql.NVarChar(sql.MAX), codigo)
    .input("FechaCreacion", sql.DateTime, new Date())
    .query(`
      INSERT INTO TEMPLATES (Nombre, Codigo, FechaCreacion)
      VALUES (@Nombre, @Codigo, @FechaCreacion)
    `);
};

// Eliminar template por ID
const deleteTemplateById = async (id) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input("ID", sql.Int, id)
    .query("DELETE FROM TEMPLATES WHERE ID = @ID");
  return result.rowsAffected[0];
};

module.exports = {
  getAllTemplates,
  insertTemplateToDB,
  deleteTemplateById
};
