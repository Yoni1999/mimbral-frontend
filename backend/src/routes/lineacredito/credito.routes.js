const express = require('express');
const router = express.Router();
const { getClientes, getTiposDeCliente, getClientesPorRut } = require('../../controllers/lineacredito/lineacredito.controller')

router.get('/lineacredito', getClientes);
router.get('/tiposcliente', getTiposDeCliente);
router.get('/buscar-rut', getClientesPorRut);

module.exports = router