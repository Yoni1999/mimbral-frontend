const { obtenerClientesConCreditoYDeuda } = require('../../models/linescredito/lineacredito');
const { obtenerTiposDeCliente } = require('../../models/linescredito/lineacredito');
const { buscarClientesPorRut } = require('../../models/linescredito/lineacredito');

const getClientes = async (req, res) => {
  try {
    const filtros = {
      rut: req.query.rut || null,
      estado: req.query.estado || null,
      tieneDeuda: req.query.tieneDeuda !== undefined && req.query.tieneDeuda !== null
        ? parseInt(req.query.tieneDeuda)
        : null,
      groupCodes: req.query.groupCodes || null,
      montoInicio: req.query.montoInicio ? parseFloat(req.query.montoInicio) : null,
      montoFin: req.query.montoFin ? parseFloat(req.query.montoFin) : null,
    };

    const clientes = await obtenerClientesConCreditoYDeuda(filtros);
    res.status(200).json(clientes);

  } catch (error) {
    console.error('Error en getClientes:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalle: error.message
    });
  }
};

const getTiposDeCliente = async (req, res) => {
  try {
    const tipos = await obtenerTiposDeCliente();
    res.status(200).json(tipos);
  } catch (error) {
    console.error('Error en getTiposDeCliente:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      detalle: error.message
    });
  }
};

const getClientesPorRut = async (req, res) => {
  try {
    const query = req.query.query || '';
    const clientes = await buscarClientesPorRut(query);
    res.status(200).json(clientes);
  } catch (error) {
    console.error('Error en getClientesPorRut:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};


module.exports = { getClientes, getTiposDeCliente, getClientesPorRut };
