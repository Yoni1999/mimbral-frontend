const {
  obtenerTopClientesCompradoresDB
} = require("../../models/ventas-canal/clientes.model");

const {
  obtenerVentasPorMesYCanal
} = require("../../models/ventas-canal/rotacion-ventas"); // <-- Asegúrate de que el path coincida con tu estructura

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

const obtenerVentasMensualesPorCanal = async (req, res) => {
  const { canal } = req.query;

  try {
    const data = await obtenerVentasPorMesYCanal(canal);
    res.json(data);
  } catch (error) {
    console.error('Error al obtener ventas por canal:', error);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
};

module.exports = {
  obtenerTopClientesCompradores,
  obtenerVentasMensualesPorCanal 
};
