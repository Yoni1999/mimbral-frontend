const express = require("express");
const router = express.Router();
const {crearSugerencia,obtenerSugerencias, actualizarEstadoSugerencia, eliminarSugerencia} = require("../controllers/sugerencias.controller");


router.post("/", crearSugerencia);


router.get("/", obtenerSugerencias);
router.put("/:id", actualizarEstadoSugerencia);
router.delete("/:id",  eliminarSugerencia);

module.exports = router;
