// routes/proveedores.js
const express = require('express');
const router = express.Router();
const { obtenerProveedores } = require('../../controllers/informes/filtrosdetenidos.controller');

router.get('/obtenerproveedores', obtenerProveedores);

module.exports = router;
