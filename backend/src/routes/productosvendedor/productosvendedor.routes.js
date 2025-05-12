const express = require("express");
const router = express.Router();
const {obtenerVentasProductoComparado, obtenerMargenProductoComparado, obtenerUnidadesVendidasComparado, obtenerTransaccionesComparado,
    obtenerProductosDistintosComparado, obtenerTicketPromedioComparado, obtenerNotasCreditoComparadopv,obtenerVentasPorCategoriaComparado,
    obtenerTopRentablesPorVendedor, obtenerTopProductosMasVendidosComparado, obtenerHistoricoVentasSKU, obtenersku

} = require("../../controllers/productosvendedor/productosvendedor.controller");

router.get("/ventastotal", obtenerVentasProductoComparado);
router.get("/margentotal", obtenerMargenProductoComparado);
router.get("/unidadesvendidas", obtenerUnidadesVendidasComparado);
router.get("/transacciones", obtenerTransaccionesComparado);
router.get("/productosdistintos", obtenerProductosDistintosComparado);
router.get("/ticketpromedio", obtenerTicketPromedioComparado);
router.get("/notascreditopv", obtenerNotasCreditoComparadopv);
router.get("/ventascategoria", obtenerVentasPorCategoriaComparado);
router.get("/toprentables", obtenerTopRentablesPorVendedor);
router.get("/topproductosmasvendidos", obtenerTopProductosMasVendidosComparado);
router.get("/historico", obtenerHistoricoVentasSKU);
router.get("/sku", obtenersku);

module.exports = router;