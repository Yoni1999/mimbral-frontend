const express = require("express");
const router = express.Router();
const {obtenerVendedoresPorCanal
} = require("../../controllers/productosvendedor/obtenervendedorescanal.controller");

router.get("/obvc", obtenerVendedoresPorCanal);


module.exports = router;