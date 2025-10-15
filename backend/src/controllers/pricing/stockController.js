// src/controllers/stockController.js
const { getStockValidFor } = require("../../models/pricing/stockModels");

function parseItemCodesFromUrl(req) {
  // 1) /api/pricing/stock?itemCodes=A,B,C
  const fromQueryCsv = (req.query.itemCodes || "").toString();

  // 2) /api/pricing/stock/A,B,C  
  const fromParamsCsv = (req.params?.itemCodes || "").toString();

  // 3) Repetidos: ?itemCode=A&itemCode=B&itemCode=C
  const repeated = req.query.itemCode; // string | string[] | undefined
  const repeatedArr = Array.isArray(repeated) ? repeated : repeated ? [repeated] : [];

  const pieces = []
    .concat(fromQueryCsv ? fromQueryCsv.split(",") : [])
    .concat(fromParamsCsv ? fromParamsCsv.split(",") : [])
    .concat(repeatedArr);

  // Normaliza, limpia y quita duplicados
  const itemCodes = [...new Set(
    pieces
      .map(x => (x ?? "").toString().trim())
      .filter(x => x.length > 0)
  )];

  return itemCodes;
}

async function getStock(req, res) {
  try {
    const { whs1, whs3 } = req.query;

    const itemCodes = parseItemCodesFromUrl(req);

    if (itemCodes.length === 0) {
      return res.status(400).json({
        message: "Debes enviar al menos un itemCode en la URL (p. ej. ?itemCodes=SKU1,SKU2 o /stock/SKU1,SKU2)."
      });
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
