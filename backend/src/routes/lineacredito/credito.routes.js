const express = require('express');
const router = express.Router();
const { getClientes } = require('../../controllers/lineacredito/lineacredito.controller')

router.get('/lineacredito', getClientes);

module.exports = router