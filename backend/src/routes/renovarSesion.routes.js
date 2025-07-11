// routes/renovarSesion.routes.js

const express = require("express");
const router = express.Router();
const renovarSesion = require("../controllers/renovarSesion.controller");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/renovar-sesion", authMiddleware, renovarSesion);

module.exports = router;
