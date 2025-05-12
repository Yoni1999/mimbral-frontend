const express = require("express");
const router = express.Router();
const {
  obtenerVentasPorCategoria,
  obtenerMargenVentasPorCategoria,
  obtenerTransaccionesPeriodo,
  obtenerNotasCreditoPorCategoria,
  obtenerProductosDistintosPorCategoria,
  obtenerUnidadesVendidasPorCategoria,
  obtenerCategorias,
  obtenerVentasCanalPorFecha,
  obtenerVentasCanalChart,
  obtenerTopSubcategorias,
  obtenerTopRentables,
  obtenerprimernivel,
  obtenertercernivel
} = require("../../controllers/resumen-categoria/resumenCategoria.controller");

//Mostrar primer nivel de categorias
router.get("/primer-nivel", obtenerprimernivel);

//Mostrar terceros niveles de categorias
router.get("/tercer-nivel", obtenertercernivel);

// MetricCard Routes
router.get("/ventas-categoria", obtenerVentasPorCategoria);
router.get("/margen-categoria", obtenerMargenVentasPorCategoria);
router.get("/transacciones-categoria", obtenerTransaccionesPeriodo);
router.get("/notas-credito-categoria", obtenerNotasCreditoPorCategoria);
router.get("/productos-distintos-categoria", obtenerProductosDistintosPorCategoria);
router.get("/unidades-vendidas-categoria", obtenerUnidadesVendidasPorCategoria);
router.get("/mostrar-categorias", obtenerCategorias);

//Graficos
router.get("/ventas-canal-fecha", obtenerVentasCanalPorFecha);
router.get('/ventas-canal-chart', obtenerVentasCanalChart);
router.get("/top-subcategorias", obtenerTopSubcategorias);
router.get("/top-rentables", obtenerTopRentables);





module.exports = router;
