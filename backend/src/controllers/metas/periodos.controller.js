const sql = require("mssql");
const { poolPromise } = require('../../models/db');


// GET: obtener todos los periodos
const obtenerPeriodos = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM PERIODOS_METAS');
    res.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener los periodos:', error);
    res.status(500).json({ error: 'Error al obtener periodos' });
  }
};

// POST: crear un nuevo periodo
const crearPeriodo = async (req, res) => {
    const { nombre, fechaInicio, fechaFin } = req.body;
  
    try {
      const pool = await poolPromise;
  
      // 1. Obtener el último ID
      const result = await pool.request().query(`
        SELECT MAX(CAST(ID_PERIODO AS INT)) AS ultimoId FROM PERIODOS_METAS
      `);
  
      const ultimoId = result.recordset[0].ultimoId || 0;
      const nuevoId = (parseInt(ultimoId, 10) + 1).toString();
  
      // 2. Insertar nuevo periodo con ID generado
      await pool.request()
        .input('idPeriodo', sql.VarChar, nuevoId)
        .input('nombre', sql.VarChar, nombre)
        .input('fechaInicio', sql.Date, fechaInicio)
        .input('fechaFin', sql.Date, fechaFin)
        .query(`
          INSERT INTO PERIODOS_METAS (ID_PERIODO, NOMBRE, FECHA_INICIO, FECHA_FIN)
          VALUES (@idPeriodo, @nombre, @fechaInicio, @fechaFin)
        `);
  
      res.status(201).json({
        mensaje: 'Periodo creado correctamente',
        idGenerado: nuevoId
      });
    } catch (error) {
      console.error('Error al insertar periodo:', error);
      res.status(500).json({ error: 'Error al crear periodo' });
    }
  };
  // DELETE: eliminar un periodo por ID
const eliminarPeriodo = async (req, res) => {
    const { id } = req.params;
  
    try {
      const pool = await poolPromise;
  
      await pool.request()
        .input('id', sql.Int, id)
        .query('DELETE FROM PERIODOS_METAS WHERE ID_PERIODO = @id');
  
      res.status(200).json({ mensaje: 'Periodo eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar periodo:', error);
      res.status(500).json({ error: 'Error al eliminar periodo' });
    }
  };
  // PUT: actualizar un periodo por ID
const actualizarPeriodo = async (req, res) => {
    const { id } = req.params;
    const { nombre, fechaInicio, fechaFin } = req.body;
  
    try {
      const pool = await poolPromise;
  
      await pool.request()
        .input('id', sql.Int, id)
        .input('nombre', sql.VarChar(100), nombre)
        .input('fechaInicio', sql.Date, fechaInicio)
        .input('fechaFin', sql.Date, fechaFin)
        .query(`
          UPDATE PERIODOS_METAS
          SET NOMBRE = @nombre,
              FECHA_INICIO = @fechaInicio,
              FECHA_FIN = @fechaFin
          WHERE ID_PERIODO = @id
        `);
  
      res.status(200).json({ mensaje: 'Periodo actualizado correctamente' });
    } catch (error) {
      console.error('Error al actualizar periodo:', error);
      res.status(500).json({ error: 'Error al actualizar periodo' });
    }
  };
  const obtenerTodosLosPeriodos = async (req, res) => {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(`
        SELECT ID_PERIODO, NOMBRE, FECHA_INICIO, FECHA_FIN
        FROM PERIODOS_METAS
        ORDER BY FECHA_INICIO DESC
      `);
      res.json(result.recordset);
    } catch (error) {
      console.error('Error al obtener los períodos:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };
  

module.exports = {
  obtenerPeriodos,
  crearPeriodo,
  eliminarPeriodo,
    actualizarPeriodo,
    obtenerTodosLosPeriodos 
};
