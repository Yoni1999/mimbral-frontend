// routes/templace.js
const express = require("express");
const router = express.Router();
const { getTemplates, insertTemplate, deleteTemplate  } = require("../../controllers/OMC/templace.controller");

router.get("/", getTemplates);
router.post("/insert", insertTemplate );
router.delete("/:id", deleteTemplate);

module.exports = router;

