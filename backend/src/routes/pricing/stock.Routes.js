// src/routes/stockRoutes.js
const express = require("express");
const router = express.Router();
const { getStock } = require("../../controllers/pricing/stockController");

router.get("/stock", getStock);
router.get("/stock/:itemCodes", getStock); 

module.exports = router;


// src/models/pricing/stockModels.js