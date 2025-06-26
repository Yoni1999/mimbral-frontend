// routes/Canal
const express = require("express");
const router = express.Router();
const { obtenerTopClientesCompradores  } = require("../../controllers/ventas-canal/ventascanal.controller");

router.get("/top10clientes", obtenerTopClientesCompradores);


module.exports = router;

