// routes/reportes.js
const express = require('express');
const router = express.Router();
const { productosSinVentasController } = require('../../controllers/informes/productossinventas.controller');

router.get('/productos-sin-ventas', productosSinVentasController);

module.exports = router;


