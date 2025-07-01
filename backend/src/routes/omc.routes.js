const express = require("express");
const { getTemplates } = require("../controllers/omc.controller");

const router = express.Router();


router.get("/", getTemplates);

module.exports = router;
