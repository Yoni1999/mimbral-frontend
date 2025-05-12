const express = require('express');
const router = express.Router();
const { obtenerMetasPorCanal } = require('../../controllers/metas/metas.controller');

// Ruta: GET /api/metas?periodo=38&canal=1
router.get('/', obtenerMetasPorCanal);

module.exports = router;
