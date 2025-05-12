const express = require("express");
const router = express.Router();
const {obtenerVentasPorPrimerNivel, obtenerMargenPorPrimerNivel, obtenerCantidadVentasPorPrimerNivel,
     obtenerNotasCreditoPorPrimerNivel, obtenerItemsVendidosPorPrimerNivel, obtenerUnidadesVendidasPorPrimerNivel,
     obtenerVentasPorFechaYPrimerNivel, obtenerVentasCanalPorPrimerNivel, obtenerCategoriasMasVendidasPorPrimerNivel,
     obtenerTopRentablesPrimerNivel

} = require("../../controllers/resumen-categoria/categoria1nivel.controller");

router.get("/ventas-primer-nivel", obtenerVentasPorPrimerNivel);
router.get("/margen-primer-nivel", obtenerMargenPorPrimerNivel);
router.get("/cantidad-ventas-primer-nivel", obtenerCantidadVentasPorPrimerNivel);
router.get("/notas-credito-primer-nivel", obtenerNotasCreditoPorPrimerNivel);
router.get("/items-vendidos-primer-nivel", obtenerItemsVendidosPorPrimerNivel);
router.get("/unidades-vendidas-primer-nivel", obtenerUnidadesVendidasPorPrimerNivel);
router.get("/ventas-fecha-primer-nivel", obtenerVentasPorFechaYPrimerNivel);
router.get("/ventas-canal-primer-nivel", obtenerVentasCanalPorPrimerNivel);
router.get("/categorias-mas-vendidas-primer-nivel", obtenerCategoriasMasVendidasPorPrimerNivel);
router.get("/top-rentables-primer-nivel", obtenerTopRentablesPrimerNivel);



module.exports = router;


