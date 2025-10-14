// src/routes/stockRoutes.js
const express = require("express");
const router = express.Router();
const { getStock } = require("../../controllers/pricing/stockController");

router.get("/stock", getStock);

module.exports = router;


