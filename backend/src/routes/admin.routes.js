const express = require("express");
const router = express.Router();
const { getUserSessionStats } = require("../controllers/sessionStats.controller")

// Ruta protegida
router.get("/session-stats", getUserSessionStats);

module.exports = router;
