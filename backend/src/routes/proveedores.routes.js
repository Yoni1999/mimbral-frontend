const express = require("express");
const router = express.Router();
const { obtenerProveedores } = require("../controllers/proveedores.controller");


router.get("/", obtenerProveedores);

module.exports = router;
