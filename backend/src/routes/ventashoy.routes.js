const express = require("express");
const router = express.Router();
const { obtenerProductosDistintosPeriodo, obtenerMargenVentas,obtenerMargenCategoriasComparado, obtenerNotascredito,obtenerTopProductos, obtenerTransaccionesPeriodo, obtenerVentasPeriodo, obtenerUnidadesVendidasPeriodo,obtenerTopProductosDetallado } = require("../controllers/obtenerVentasHoy");

// Ruta para obtener el total de ventas de hoy
router.get("/Notascredito", obtenerNotascredito);
router.get("/top-productos", obtenerTopProductos); 
router.get("/transacciones-periodo", obtenerTransaccionesPeriodo);
router.get("/ventas-periodo",obtenerVentasPeriodo);
router.get("/unidades-vendidas-periodo", obtenerUnidadesVendidasPeriodo );
router.get("/productos-distintos-periodo", obtenerProductosDistintosPeriodo);
router.get("/margen-categorias-comparado", obtenerMargenCategoriasComparado); 

router.get("/margen-ventas", obtenerMargenVentas);
router.get("/obtener-detalle-ventas", obtenerTopProductosDetallado);


module.exports = router;


