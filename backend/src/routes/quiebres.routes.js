const express = require('express');
const router = express.Router();
const {obtenerProductosEnQuiebre, obtenerStockPorBodega, obtenerQuiebresPorRango } = require('../controllers/quiebres.controller');

router.get("/subcategorias/quiebres/:subcategoriaId", obtenerProductosEnQuiebre);
router.get("/stock/detalle/:itemCode", obtenerStockPorBodega); 
router.get("/rango", obtenerQuiebresPorRango);
router.post("/rango", obtenerQuiebresPorRango);

module.exports = router;
