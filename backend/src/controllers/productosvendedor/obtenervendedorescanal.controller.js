const sql = require("mssql");
const { poolPromise } = require('../../models/db');

const obtenerVendedoresPorCanal = async (req, res) => {
  const canal = req.query.canal;

  if (!canal) {
    return res.status(400).json({ error: "El parámetro 'canal' es obligatorio." });
  }

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('CanalParam', sql.VarChar, canal)
      .query(`
        SELECT SlpCode, SlpName, Memo, U_Imagen
        FROM OSLP
        WHERE 
        (
            (@CanalParam = 'Meli' AND SlpCode IN (426, 355, 398))
        OR (@CanalParam = 'Falabella' AND SlpCode = 371)
        OR (@CanalParam = 'Vitex' AND SlpCode IN (401, 397))
        OR (@CanalParam = 'Empresas' AND SlpCode IN (227, 250, 205,209, 228, 226, 137, 212,225,138))
        OR (@CanalParam = 'Chorrillo' AND SlpCode NOT IN (401, 397,426,371,355, 398,227, 250, 205, 138, 209, 228, 226, 137, 212,224,225,309,127,201, 211, 215, 219, 237, 238, 265))
        or (@CanalParam = 'Balmaceda' AND SLPCode IN(201, 211, 215, 219, 237, 238, 265))
        )
        AND LOWER(Memo) IN (
            'vendedor',
            'vendedor terreno',
            'cajero',
            'tienda'
        );

      `);

    res.status(200).json(result.recordset);
  } catch (err) {
    console.error("Error al obtener vendedores por canal:", err);
    res.status(500).json({ error: "Error al obtener vendedores por canal." });
  }
};

module.exports = {
  obtenerVendedoresPorCanal};
