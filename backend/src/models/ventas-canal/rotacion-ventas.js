const { poolPromise } = require('../db');
const sql = require('mssql');

const obtenerVentasPorMesYCanal = async (canalParam) => {
  const pool = await poolPromise;

  const result = await pool.request()
    .input('CanalParam', sql.VarChar(50), canalParam)
    .query(`
      SET LANGUAGE Spanish;

      WITH VentasConCanal AS (
        SELECT 
            DATENAME(YEAR, T0.DocDate) AS Año,
            DATENAME(MONTH, T0.DocDate) AS Mes,
            MONTH(T0.DocDate) AS NumeroMes,
            CASE
                WHEN (T1.WhsCode IN ('03', '05') AND T0.SlpCode IN (426, 364, 355))
                     OR (T1.WhsCode = '01' AND T0.SlpCode IN (355, 398)) THEN 'Meli'
                WHEN T1.WhsCode = '03' AND T0.SlpCode = 371 THEN 'Falabella'
                WHEN T1.WhsCode = '07' THEN 'Balmaceda'
                WHEN T1.WhsCode = '01' AND T0.SlpCode IN (401, 397) THEN 'Vitex'
                WHEN T1.WhsCode = '01' AND T1.SlpCode NOT IN (401, 397, 355, 398, 227, 250, 205, 138, 209, 228, 226, 137, 212) THEN 'Chorrillo'
                WHEN T1.WhsCode = '01' AND T1.SlpCode IN (227, 250, 205, 209, 228, 226, 137, 212, 225, 138) THEN 'Empresas'
                ELSE 'Otro'
            END AS Canal,
            T1.LineTotal
        FROM INV1 T1
        INNER JOIN OINV T0 ON T1.DocEntry = T0.DocEntry
        WHERE 
            YEAR(T0.DocDate) >= YEAR(GETDATE()) - 3
            AND T0.CANCELED = 'N'
      )

      SELECT 
          Año,
          Mes,
          NumeroMes,
          ISNULL(@CanalParam, 'Todos') AS Canal,
          SUM(LineTotal) AS TotalVentas
      FROM VentasConCanal
      WHERE Canal <> 'Otro'
        AND (@CanalParam IS NULL OR Canal = @CanalParam)
      GROUP BY Año, Mes, NumeroMes
      ORDER BY Año, NumeroMes;
    `);

  return result.recordset;
};

module.exports = { obtenerVentasPorMesYCanal };
