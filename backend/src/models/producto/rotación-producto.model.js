const { poolPromise } = require('../db');
const sql = require('mssql');

const obtenerUnidadesVendidasPorMes = async (itemCode, canalParam) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input("ItemCode", sql.NVarChar, itemCode)
    .input("CanalParam", sql.NVarChar, canalParam)
    .query(`
    SET LANGUAGE Spanish;
      SELECT 
          DATENAME(YEAR, T0.DocDate) AS Año,
          DATENAME(MONTH, T0.DocDate) AS Mes,
          MONTH(T0.DocDate) AS NumeroMes,
          SUM(T1.Quantity) AS UnidadesVendidas
      FROM INV1 T1
      INNER JOIN OINV T0 ON T1.DocEntry = T0.DocEntry
      WHERE 
          T1.ItemCode = @ItemCode
          AND YEAR(T0.DocDate) >= YEAR(GETDATE()) - 3
          AND T0.CANCELED = 'N'
          AND (
              @CanalParam IS NULL
              OR (
                  (@CanalParam = 'Meli' AND (
                      (T1.WhsCode IN ('03', '05') AND T0.SlpCode IN (426, 364, 355))
                      OR (T1.WhsCode = '01' AND T0.SlpCode IN (355, 398))
                  ))
                  OR (@CanalParam = 'Falabella' AND T1.WhsCode = '03' AND T0.SlpCode = 371)
                  OR (@CanalParam = 'Balmaceda' AND T1.WhsCode = '07')
                  OR (@CanalParam = 'Vitex' AND T1.WhsCode = '01' AND T0.SlpCode IN (401, 397))
                  OR (@CanalParam = 'Chorrillo' AND T1.WhsCode = '01' 
                      AND T1.SlpCode NOT IN (401, 397, 355, 398, 227, 250, 205, 138, 209, 228, 226, 137, 212))
                  OR (@CanalParam = 'Empresas' AND T1.WhsCode = '01' 
                      AND T1.SlpCode IN (227, 250, 205, 209, 228, 226, 137, 212, 225, 138))
              )
          )
      GROUP BY 
          YEAR(T0.DocDate), 
          MONTH(T0.DocDate), 
          DATENAME(YEAR, T0.DocDate),
          DATENAME(MONTH, T0.DocDate)
      ORDER BY 
          Año, NumeroMes
    `);

  return result.recordset;
};

module.exports = {obtenerUnidadesVendidasPorMes};
