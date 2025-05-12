const express = require("express");
const router = express.Router();
const { actualizarDatos, getUltimaActualizacion } = require("../controllers/actualizarDatos.controller");

// ✅ Ruta para actualizar la base de datos
router.post("/actualizar-datos", actualizarDatos);
router.get("/ultima-actualizacion", getUltimaActualizacion)

module.exports = router;
