const express = require('express');
const router = express.Router();
const { obtenerMetasPorCanal, insertarMeta, asignarMetasAVendedores, obtenerVendedoresmeta, obtenerTotalesAsignados, editarMeta,eliminarMeta } = require('../../controllers/metas/metas.controller');

// Ruta: GET /api/metas?periodo=38&canal=1
router.get('/', obtenerMetasPorCanal);
router.post('/insert', insertarMeta);
router.post('/asignar', asignarMetasAVendedores);
router.get('/vendedores', obtenerVendedoresmeta);
router.get('/metaasig/:id_meta', obtenerTotalesAsignados);
router.put('/editar', editarMeta);
router.delete('/eliminar/:id', eliminarMeta);

module.exports = router;
