// routes/reportes.js
const express = require('express');
const router = express.Router();
const { getProductosDetallado } = require('../../controllers/informes/productosmenosrentables.controller');

router.get('/productos-menos-rentables', getProductosDetallado);

module.exports = router;


