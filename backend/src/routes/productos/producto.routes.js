// routes/producto.js
const express = require("express");
const router = express.Router();
const { obtenerResumenProducto, obtenerDetalleStock, obtenerVentasMensuales, obtenerHistoricoOrdenesCompra, obtenerStockPorAlmacen  } = require("../../controllers/producto/obtenerResumenProducto.controller");

router.get("/resumen-producto", obtenerResumenProducto);
router.get("/detalle-stock", obtenerDetalleStock);
router.get("/ventas-mensuales", obtenerVentasMensuales);
router.get("/historico-ordenes-compra", obtenerHistoricoOrdenesCompra);
router.get("/stock-por-almacen", obtenerStockPorAlmacen);

module.exports = router;

