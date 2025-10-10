// routes/informes.js
const express = require("express");
const router = express.Router();

const { obtenerProductosPorCanalMargen } = require("../../controllers/informes/productos-por-canal-margen.controller");

// GET /api/informes/productos-por-canal-margen
router.get("/productos-por-canal-margen", obtenerProductosPorCanalMargen);

module.exports = router;


//http://172.18.0.1:3001/api/informes/productos-por-canal-margen