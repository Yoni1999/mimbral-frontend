const { poolPromise } = require('../db');
const sql = require('mssql');

async function obtenerClientesConCreditoYDeuda(filtros) {
  const {
    rut,
    estado,
    tieneDeuda,
    groupCodes,
    montoInicio,
    montoFin
  } = filtros;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('rut', sql.NVarChar(20), rut || null)
      .input('estado', sql.Char(1), estado || null)
      .input('tieneDeuda', sql.Bit, tieneDeuda)
      .input('groupCodes', sql.NVarChar(sql.MAX), groupCodes || null)
      .input('montoInicio', sql.Numeric(18, 2), montoInicio)
      .input('montoFin', sql.Numeric(18, 2), montoFin)
      .query(`
        SELECT 
          C.CardName AS Nombre,
          C.LicTradNum AS Rut,
          C.Phone1 AS Telefono,
          C.Address AS Direccion,
          C.City AS Ciudad,
          C.CreateDate AS FechaApertura,
          C.CreditLine AS LimiteCredito,
          C.E_Mail AS Email,
          C.Balance AS BalanceOriginal,

          ISNULL((
            SELECT SUM(H.CheckSum)
            FROM OCHH H
            WHERE H.CardCode = C.CardCode AND H.Deposited = 'N' AND H.Canceled = 'N'
          ), 0) AS ChequesEnCartera,

          C.Balance + ISNULL((
            SELECT SUM(H.CheckSum)
            FROM OCHH H
            WHERE H.CardCode = C.CardCode AND H.Deposited = 'N' AND H.Canceled = 'N'
          ), 0) AS BalanceTotal,

          C.CreditLine - (
            C.Balance + ISNULL((
              SELECT SUM(H.CheckSum)
              FROM OCHH H
              WHERE H.CardCode = C.CardCode AND H.Deposited = 'N' AND H.Canceled = 'N'
            ), 0)
          ) AS CreditoDisponible,

          CASE 
            WHEN C.ValidFor = 'Y' THEN 'Activo'
            WHEN C.ValidFor = 'N' THEN 'Inactivo'
            ELSE 'Desconocido'
          END AS EstadoCliente,

          CASE 
            WHEN C.Balance > 0 THEN 'Con Deuda'
            ELSE 'Sin Deuda'
          END AS EstadoDeuda,

          C.GroupCode AS TipoCliente,
          C.GroupNum AS CodigoPago,
          P.PymntGroup AS PagoPredeterminado,
          C.UpdateDate AS UltimaModificacion

        FROM OCRD C
        LEFT JOIN OCTG P ON C.GroupNum = P.GroupNum

        WHERE 
          (@rut IS NULL OR C.LicTradNum LIKE @rut + '%')
          AND (@estado IS NULL OR C.ValidFor = @estado)
          AND (
            @tieneDeuda IS NULL OR
            (@tieneDeuda = 1 AND C.Balance > 0) OR
            (@tieneDeuda = 0 AND C.Balance = 0)
          )
          AND (
            @groupCodes IS NULL OR 
            EXISTS (
              SELECT 1 
              FROM STRING_SPLIT(@groupCodes, ',') 
              WHERE TRY_CAST(value AS INT) = C.GroupCode
            )
          )
          AND (
            (@montoInicio IS NULL OR C.CreditLine >= @montoInicio)
            AND (@montoFin IS NULL OR C.CreditLine <= @montoFin)
          )
      `);

    return result.recordset;

  } catch (err) {
    console.error('Error al ejecutar la consulta de clientes:', err);
    throw err;
  }
}

module.exports = {
  obtenerClientesConCreditoYDeuda
};
