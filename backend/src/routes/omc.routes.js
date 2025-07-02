const express = require("express");
const { getTemplates, insertTemplate, deleteTemplate } = require("../controllers/omc.controller");

const router = express.Router();


router.get("/", getTemplates);
router.post("/insert", insertTemplate );
router.delete("/:id", deleteTemplate);

module.exports = router;
