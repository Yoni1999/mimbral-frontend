const { poolPromise } = require('../db');
const sql = require('mssql');

const obtenerTopClientesCompradoresDB = async ({ canal, vendedor, periodo, fechaInicio, fechaFin }) => {
  const pool = await poolPromise;

  const query = `
    DECLARE @CanalParam VARCHAR(50) = @CanalParamInput;
    DECLARE @VendedorParam INT = @VendedorParamInput;
    DECLARE @Periodo VARCHAR(10) = @PeriodoParam;
    DECLARE @FechaInicioCustom DATE = @FechaInicioInput;
    DECLARE @FechaFinCustom DATE = @FechaFinInput;
    DECLARE @FechaInicioActual DATE, @FechaFinActual DATE;

    IF (@FechaInicioCustom IS NOT NULL AND @FechaFinCustom IS NOT NULL)
    BEGIN
      SET @FechaInicioActual = @FechaInicioCustom;
      SET @FechaFinActual = @FechaFinCustom;
    END
    ELSE
    BEGIN
      SET @FechaFinActual = CAST(GETDATE() AS DATE);
      SET @FechaInicioActual =
        CASE 
          WHEN @Periodo = '1D'  THEN @FechaFinActual
          WHEN @Periodo = '7D'  THEN DATEADD(DAY, -6, @FechaFinActual)
          WHEN @Periodo = '14D' THEN DATEADD(DAY, -13, @FechaFinActual)
          WHEN @Periodo = '1M'  THEN DATEADD(MONTH, -1, @FechaFinActual)
          WHEN @Periodo = '3M'  THEN DATEADD(MONTH, -3, @FechaFinActual)
          WHEN @Periodo = '6M'  THEN DATEADD(MONTH, -6, @FechaFinActual)
          ELSE @FechaFinActual
        END;
    END;

    SELECT TOP 10
      C.CardCode,
      C.CardName,
      C.CreditLine,
      C.CITY,
      C.Balance,
      COUNT(DISTINCT T0.DocEntry) AS Cantidad_Compras,
      SUM(I.LineTotal) AS Total_Comprado,
      CAST(SUM(I.LineTotal) * 1.0 / NULLIF(COUNT(DISTINCT T0.DocEntry), 0) AS DECIMAL(18,2)) AS Ticket_Promedio,
      MAX(T0.DocDate) AS Ultima_Compra
    FROM OINV T0
    INNER JOIN INV1 I ON T0.DocEntry = I.DocEntry
    INNER JOIN OCRD C ON T0.CardCode = C.CardCode
    WHERE 
      T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
      AND T0.CANCELED = 'N'
      AND (
        @CanalParam IS NULL
        OR (
          (@CanalParam = 'Meli' AND ((I.WhsCode IN ('03', '05') AND T0.SlpCode IN (426, 364, 355))
              OR (I.WhsCode = '01' AND T0.SlpCode IN (355, 398)) ))
          OR (@CanalParam = 'Falabella' AND I.WhsCode = '03' AND T0.SlpCode = 371)
          OR (@CanalParam = 'Balmaceda' AND I.WhsCode = '07')
          OR (@CanalParam = 'Vitex' AND I.WhsCode = '01' AND T0.SlpCode IN (401, 397))
          OR (@CanalParam = 'Chorrillo' AND I.WhsCode = '01'
              AND I.SlpCode NOT IN (401, 397, 355, 398, 227,225, 250, 205, 138, 209, 228, 226, 137, 212))
          OR (@CanalParam = 'Empresas' AND I.WhsCode = '01'
              AND I.SlpCode IN (227, 250, 205, 138, 225, 209, 228, 226, 137, 212))
        )
      )
      AND (@VendedorParam IS NULL OR I.SlpCode = @VendedorParam)
    GROUP BY 
      C.CardCode, C.CardName, C.CreditLine, C.CITY, C.Balance
    ORDER BY 
      Cantidad_Compras DESC;
  `;

  const request = pool.request();
  request.input('CanalParamInput', sql.VarChar(50), canal);
  request.input('VendedorParamInput', sql.Int, vendedor);
  request.input('PeriodoParam', sql.VarChar(10), periodo);
  request.input('FechaInicioInput', sql.Date, fechaInicio);
  request.input('FechaFinInput', sql.Date, fechaFin);

  const result = await request.query(query);
  return result.recordset;
};

module.exports = { obtenerTopClientesCompradoresDB };
