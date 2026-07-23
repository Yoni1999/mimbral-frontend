const express = require("express");
const { crearLinkCompartibleVentasPorCanal } = require("../controllers/shareVentasPorCanal.controller");

const router = express.Router();

router.post("/informes/ventas-productos-por-canal", crearLinkCompartibleVentasPorCanal);

module.exports = router;
