const express = require('express');
const router = express.Router();
const { obtenerPeriodos, crearPeriodo, eliminarPeriodo, actualizarPeriodo,obtenerTodosLosPeriodos  } = require('../../controllers/metas/periodos.controller');


router.get('/', obtenerPeriodos);

router.post('/', crearPeriodo);
router.delete('/:id', eliminarPeriodo);
router.put('/:id', actualizarPeriodo);
router.get('/', obtenerTodosLosPeriodos);


module.exports = router;
