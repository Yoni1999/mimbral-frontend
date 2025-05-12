const express = require("express");
const router = express.Router();
const { getVentascanal, getMayorRentabilidad} = require("../controllers/ventas.controller");

router.get("/ventas-canal", getVentascanal);
router.get("/productos-rentabilidad", getMayorRentabilidad);   

module.exports = router;
