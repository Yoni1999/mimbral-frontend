const express = require("express");
const router = express.Router();
const {obtenerVentasPorSubcategoria,obtenerMargenVentasPorSubcategoria, obtenerCantidadVentasPorSubcategoria,obtenerNotasCreditoPorSubcategoria,
     obtenerItemsVendidosPorSubcategoria,obtenerUnidadesVendidasPorSubcategoria, obtenerVentasLineasPorSubcategoria, obtenerVentasPorCanalSubcategoria,
     obtenerTopProductosSubcategoria,obtenerTopRentablesSubcategoria

} = require("../../controllers/resumen-categoria/categoria3nivel.controller");



// MetricCard Routes
router.get("/ventas-subcategoria", obtenerVentasPorSubcategoria);
router.get("/margen-subcategoria", obtenerMargenVentasPorSubcategoria);
router.get("/cantidad-ventas-subcategoria", obtenerCantidadVentasPorSubcategoria);
router.get("/notas-credito-subcategoria", obtenerNotasCreditoPorSubcategoria);
router.get("/items-vendidos-subcategoria", obtenerItemsVendidosPorSubcategoria);
router.get("/unidades-vendidas-subcategoria", obtenerUnidadesVendidasPorSubcategoria);
//Graficos
router.get("/ventas-lineas-subcategoria", obtenerVentasLineasPorSubcategoria);
router.get("/ventas-canal-subcategoria", obtenerVentasPorCanalSubcategoria);
router.get("/top-productos-subcategoria", obtenerTopProductosSubcategoria);
router.get("/top-rentables-subcategoria", obtenerTopRentablesSubcategoria);


module.exports = router;
