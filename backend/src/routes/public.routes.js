const express = require("express");
const { obtenerDashboardCompartidoVentasPorCanal } = require("../controllers/shareVentasPorCanal.controller");

const router = express.Router();

router.get("/informes/ventas-productos-por-canal/:token", obtenerDashboardCompartidoVentasPorCanal);

module.exports = router;
