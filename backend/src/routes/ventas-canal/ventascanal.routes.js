// routes/Canal
const express = require("express");
const router = express.Router();
const { obtenerTopClientesCompradores, obtenerVentasMensualesPorCanal } = require("../../controllers/ventas-canal/ventascanal.controller");

router.get("/top10clientes", obtenerTopClientesCompradores);
router.get('/ventas-mensuales-por-canal', obtenerVentasMensualesPorCanal); 


module.exports = router;

