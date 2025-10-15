// src/models/stockModel.js
const { sql, poolPromise } = require("../db");

/**
 * Obtiene stock por SKU para productos activos (ValidFor='Y')
 * Incluye también el costo promedio (AvgPrice) y margen de producto (U_Margen_Prod).
 * Filtra opcionalmente por una lista de itemCodes recibidos.
 * Suma solo las bodegas whs1 y whs3.
 *
 * @param {{ whs1?: string, whs3?: string, itemCodes?: string[] }} opts
 * @returns {Promise<Array<{ sku: string, stock_bodega_1: number, stock_bodega_3: number, stock_total: number, avgPrice: number, margen_prod: number }>>}
 */
async function getStockValidFor(opts = {}) {
  const whs1 = opts.whs1 ?? "01";
  const whs3 = opts.whs3 ?? "03";

  const itemCodesArr = Array.isArray(opts.itemCodes)
    ? [...new Set(
        opts.itemCodes
          .map(v => (v ?? "").toString().trim())
          .filter(v => v.length > 0)
      )]
    : [];

  const hasFilter = itemCodesArr.length > 0;
  const itemCodesCsv = hasFilter ? itemCodesArr.join(",") : "";

  const pool = await poolPromise;
  const req = pool.request();
  req.input("whs1", sql.NVarChar, whs1);
  req.input("whs3", sql.NVarChar, whs3);
  req.input("hasFilter", sql.Bit, hasFilter);
  req.input("itemCodesCsv", sql.NVarChar(sql.MAX), itemCodesCsv);

  const q = `
    SELECT
      i.ItemCode AS sku,
      i.AvgPrice AS PrecioCosto,
      i.U_Margen_Prod AS Margen,
      SUM(CASE WHEN w.WhsCode = @whs1 THEN w.OnHand ELSE 0 END) AS stock_bodega_1,
      SUM(CASE WHEN w.WhsCode = @whs3 THEN w.OnHand ELSE 0 END) AS stock_bodega_3,
      SUM(CASE WHEN w.WhsCode IN (@whs1, @whs3) THEN w.OnHand ELSE 0 END) AS stock_total
    FROM OITM i
    INNER JOIN OITW w ON w.ItemCode = i.ItemCode
    WHERE i.ValidFor = 'Y'
      AND w.WhsCode IN (@whs1, @whs3)
      AND (
        @hasFilter = 0
        OR i.ItemCode IN (
          SELECT LTRIM(RTRIM(value))
          FROM STRING_SPLIT(@itemCodesCsv, ',')
          WHERE value IS NOT NULL AND LTRIM(RTRIM(value)) <> ''
        )
      )
    GROUP BY i.ItemCode, i.AvgPrice, i.U_Margen_Prod
    ORDER BY i.ItemCode;
  `;

  const { recordset } = await req.query(q);

  return recordset.map(r => ({
    sku: r.sku,
    avgPrice: r.PrecioCosto != null ? Number(r.PrecioCosto) : null,
    margen_prod: r.Margen != null ? Number(r.Margen) : null,
    stock_bodega_1: Number(r.stock_bodega_1 ?? 0),
    stock_bodega_3: Number(r.stock_bodega_3 ?? 0),
    stock_total: Number(r.stock_total ?? 0),
  }));
}

module.exports = { getStockValidFor };
