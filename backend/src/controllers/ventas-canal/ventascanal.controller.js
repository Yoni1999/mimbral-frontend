const { obtenerTopClientesCompradoresDB } = require("../../models/ventas-canal/clientes.model");

const obtenerTopClientesCompradores = async (req, res) => {
  try {
    const canal = req.query.canal || null;
    const vendedor = req.query.vendedor ? parseInt(req.query.vendedor) : null;
    const periodo = req.query.periodo || '7D';
    const fechaInicio = req.query.fechaInicio || null;
    const fechaFin = req.query.fechaFin || null;

    const datos = await obtenerTopClientesCompradoresDB({
      canal,
      vendedor,
      periodo,
      fechaInicio,
      fechaFin
    });

    res.status(200).json(datos);
  } catch (error) {
    console.error('Error al obtener top clientes compradores:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { obtenerTopClientesCompradores };
