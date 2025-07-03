const { obtenerClientesConCreditoYDeuda } = require('../../models/linescredito/lineacredito');

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

module.exports = {
  getClientes
};
