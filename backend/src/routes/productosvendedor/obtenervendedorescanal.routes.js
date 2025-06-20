const express = require("express");
const router = express.Router();
const {obtenerVendedoresPorCanal, getResumenFormasPago} = require("../../controllers/productosvendedor/obtenervendedorescanal.controller");

router.get("/obvc", obtenerVendedoresPorCanal);
router.get("/formas-pago", getResumenFormasPago); // Asumiendo que esta ruta también usa el mismo controlador


module.exports = router;