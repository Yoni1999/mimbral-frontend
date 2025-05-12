const express = require("express");
const router = express.Router();
const { obtenerVendedores } = require("../controllers/vendedores.Controller.js");

router.get("/vendedores", obtenerVendedores);

module.exports = router;
