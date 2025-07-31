const express = require("express");
const { obtenerMargenBrutoPeriodo, obtenerMargenBrutoPorCategoria } = require("../controllers/margen.controller");

const router = express.Router();


router.get("/bruto-periodo",obtenerMargenBrutoPeriodo);
router.get("/bruto-categoria",obtenerMargenBrutoPorCategoria);

module.exports = router;


