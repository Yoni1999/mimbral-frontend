// src/controllers/stockController.js
const { getStockValidFor } = require("../../models/pricing/stockModels");

async function getStock(req, res) {
  try {
    const { whs1, whs3 } = req.query;


    let itemCodes = [];
    if (req.body && Array.isArray(req.body.itemCodes)) {
      itemCodes = req.body.itemCodes;
    } else if (req.body && typeof req.body.itemCodes === "string") {
      itemCodes = req.body.itemCodes.split(",").map(s => s.trim());
    }

    const data = await getStockValidFor({ whs1, whs3, itemCodes });

    return res.json({
      warehouses: { whs1: whs1 ?? "01", whs3: whs3 ?? "03" },
      filter: { itemCodes },
      count: data.length,
      items: data, 
    });
  } catch (err) {
    console.error("Error en getStock:", err);
    return res.status(500).json({
      message: "Error obteniendo stock.",
      error: err.message,
    });
  }
}

module.exports = { getStock };
