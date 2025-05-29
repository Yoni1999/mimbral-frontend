const express = require('express');
const router = express.Router();
const { obtenerProductosDetenidos } = require('../../controllers/informes/productosdetenidos.controller');

// Ruta: 
router.get('/productos-detenidos', obtenerProductosDetenidos);
module.exports = router;
