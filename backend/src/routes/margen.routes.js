const express = require("express");
const { obtenerMargenPorAnio, obtenerMargenBrutoPeriodo, obtenerMargenBrutoPorCategoria } = require("../controllers/margen.controller");

const router = express.Router();

router.get("/", obtenerMargenPorAnio); // Ruta para consultar margen
router.get("/bruto-periodo",obtenerMargenBrutoPeriodo);
router.get("/bruto-categoria",obtenerMargenBrutoPorCategoria);

module.exports = router;
