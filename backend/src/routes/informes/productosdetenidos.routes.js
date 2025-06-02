const express = require('express');
const router = express.Router();
const { obtenerProductosDetenidos, getStockDisponible } = require('../../controllers/informes/productosdetenidos.controller');

// Ruta: 
router.get('/productos-detenidos', obtenerProductosDetenidos);
router.get('/stock-detenidos', getStockDisponible);
module.exports = router;



