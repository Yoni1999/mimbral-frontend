
// src/controllers/stockController.js
const { getStockValidFor } = require("../../models/pricing/stockModels");

function parseItemCodesFromUrl(req) {
  const fromQueryCsv = (req.query.itemCodes || "").toString();
  const fromParamsCsv = (req.params?.itemCodes || "").toString();
  const repeated = req.query.itemCode; // string | string[] | undefined
  const repeatedArr = Array.isArray(repeated) ? repeated : repeated ? [repeated] : [];

  const pieces = []
    .concat(fromQueryCsv ? fromQueryCsv.split(",") : [])
    .concat(fromParamsCsv ? fromParamsCsv.split(",") : [])
    .concat(repeatedArr);

  const itemCodes = [...new Set(
    pieces
      .map(x => (x ?? "").toString().trim())
      .filter(x => x.length > 0)
  )];

  return itemCodes;
}

// Formatea margen: 0.25 => "25%", 25 => "25%"; 2 decimales máx. sin ceros innecesarios
function formatMarginPercent(value) {
  if (value == null || isNaN(value)) return null;
  const num = Number(value);
  const pct = num <= 1 && num >= -1 ? num * 100 : num;
  const rounded = Math.round(pct * 100) / 100;
  const str = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/\.?0+$/, "");
  return `${str}%`;
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

    const items = data.map((it) => {
      const precioCosto = it["Precio Costo"] ?? it.avgPrice ?? null;
      const margen = it["Margen"] ?? it.margen_prod ?? null;

      return {
        sku: it.sku,
        precio_costo: precioCosto != null ? Number(precioCosto) : null,
        margen: margen != null ? Number(margen) : null,
        margen_str: formatMarginPercent(margen),
        stock_bodega_1: Number(it.stock_bodega_1 ?? 0),
        stock_bodega_3: Number(it.stock_bodega_3 ?? 0),
        stock_total: Number(it.stock_total ?? 0),
      };
    });

    return res.json({
      warehouses: { whs1: whs1 ?? "01", whs3: whs3 ?? "03" },
      filter: { itemCodes },
      count: items.length,
      items,
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
// src/models/pricing/stockModels.js