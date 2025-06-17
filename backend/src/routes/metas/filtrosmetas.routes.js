const express = require('express');
const router = express.Router();
const { obtenerMetasPorCanal,obtenerCategoriasPorPrimerNivel,obtenerResumenMetasPorCanal,obtenerSubcategoriasPorCategoria
,  } = require('../../controllers/metas/filtrosmetas.controller');

// Ruta: 
router.get('/views', obtenerMetasPorCanal);
router.get('/getcat', obtenerCategoriasPorPrimerNivel);
router.get('/getsub',obtenerSubcategoriasPorCategoria);
router.get('/cumplimiento', obtenerResumenMetasPorCanal);


module.exports = router;
