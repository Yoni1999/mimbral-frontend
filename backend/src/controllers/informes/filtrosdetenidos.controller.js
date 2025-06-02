const sql = require('mssql');
const { poolPromise } = require('../../models/db');

const obtenerProveedores = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT CardCode, CardName
      FROM OCRD
      WHERE CardType = 'S'
    `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    res.status(500).json({ error: 'Error al obtener los proveedores' });
  }
};

module.exports = {
  obtenerProveedores
};
