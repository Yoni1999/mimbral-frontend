const sql = require('mssql');
const { poolPromise } = require('../../models/db');

// GET: obtener metas por período y canal
const obtenerMetasPorCanal = async (req, res) => {
  const { idPeriodo, idCanal } = req.query;

  if (!idPeriodo || !idCanal) {
    return res.status(400).json({ error: 'Se requiere idPeriodo e idCanal' });
  }

  try {
    const pool = await poolPromise;

    // Declaramos los slpCodes directamente para este primer paso
    let slpCodes = '';

    if (idCanal == 1) slpCodes = '227,250,205,138,209,228,226,137,212,225';
    else if (idCanal == 2) slpCodes = '371,305,211';
    else if (idCanal == 3) slpCodes = '355,303';
    else if (idCanal == 5) slpCodes = '401,397';

    const result = await pool.request()
      .input('ID_PERIODO', sql.Int, idPeriodo)
      .input('ID_CANAL', sql.Int, idCanal)
      .input('SLPCODES', sql.VarChar, slpCodes)
      .query(`
        SELECT 
          mp.SKU,
          itm.ItemName AS NOMBRE_PRODUCTO,
          mp.ID_PERIODO,
          mp.META_CANTIDAD,
          ISNULL(SUM(i.Quantity), 0) AS TOTAL_VENDIDO,
          ISNULL(SUM(i.LineTotal), 0) AS MONTO_TOTAL
        FROM METAS_PRODUCTO_CANAL mp
        JOIN PERIODOS_METAS p ON mp.ID_PERIODO = p.ID_PERIODO
        JOIN OITM itm ON mp.SKU = itm.ItemCode
        LEFT JOIN (
            SELECT i.ItemCode, i.Quantity, i.LineTotal
            FROM INV1 i
            JOIN OINV o ON o.DocEntry = i.DocEntry
            WHERE o.DocDate BETWEEN (SELECT FECHA_INICIO FROM PERIODOS_METAS WHERE ID_PERIODO = @ID_PERIODO)
              AND (SELECT FECHA_FIN FROM PERIODOS_METAS WHERE ID_PERIODO = @ID_PERIODO)
              AND o.CANCELED = 'N'
              AND i.SlpCode IN (
                SELECT value FROM STRING_SPLIT(@SLPCODES, ',')
              )
        ) i ON i.ItemCode = mp.SKU
        WHERE mp.ID_PERIODO = @ID_PERIODO
          AND mp.ID_CANAL = @ID_CANAL
        GROUP BY mp.SKU, itm.ItemName, mp.ID_PERIODO, mp.META_CANTIDAD
        ORDER BY mp.META_CANTIDAD DESC;
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener metas por canal:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  obtenerMetasPorCanal,
};
