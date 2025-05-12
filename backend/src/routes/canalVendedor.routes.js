const express = require("express");
const router = express.Router();
const { obtenerVendedoresPorCanal } = require("../controllers/canalVendedor.controller");

// Definir la ruta para obtener vendedores por canal
router.get("/canal-vendedor", obtenerVendedoresPorCanal);

module.exports = router;
