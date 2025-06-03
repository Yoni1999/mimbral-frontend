const express = require('express');
const router = express.Router();
const { obtenerProductosDetenidos, getStockDisponible, getStockdetenido } = require('../../controllers/informes/productosdetenidos.controller');

// Ruta: 
router.get('/productos-detenidos', obtenerProductosDetenidos);
router.get('/stock-detenidos', getStockDisponible);
router.get('/stock-detenido-ventas', getStockdetenido);
module.exports = router;



