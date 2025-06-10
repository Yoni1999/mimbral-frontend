const express = require("express");
const router = express.Router();
const { getVentascanal, getMayorRentabilidad, getMenorRentabilidad} = require("../controllers/ventas.controller");

router.get("/ventas-canal", getVentascanal);
router.get("/productos-rentabilidad", getMayorRentabilidad);
router.get("/productos-rentabilidad-minima", getMenorRentabilidad);   

module.exports = router;
