const express = require("express");
const router = express.Router();
const { obtenerCategorias, obtenerSubcategoriasEnQuiebre, getVentasPorCategoria } = require("../controllers/categorias.Controller");

router.get("/", obtenerCategorias);
router.get("/quiebres/:codigo_categoria", obtenerSubcategoriasEnQuiebre);
router.get("/ventas-categoria", getVentasPorCategoria); 

module.exports = router;
