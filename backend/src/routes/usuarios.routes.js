const express = require("express");
const router = express.Router();
const {
  getUsuarios,
  updateUsuario,
  deleteUsuario
} = require("../controllers/usuarios.controller");

// GET todos los usuarios
router.get("/", getUsuarios);

// PUT actualizar usuario
router.put("/:id", updateUsuario);

// DELETE eliminar usuario
router.delete("/:id", deleteUsuario);

module.exports = router;
