const { poolPromise } = require('../db');
const sql = require('mssql');

const obtenerResumenFormasPago = async (params) => {
  const {
    canal,
    vendedorEmpresa,
    periodo,
    fechaInicio,
    fechaFin,
  } = params;

  const pool = await poolPromise;

  const query = `
    DECLARE @CanalParam VARCHAR(50) = @CanalParamInput;
    DECLARE @VendedorEmpresaParam INT = @VendedorEmpresaParamInput;
    DECLARE @Periodo VARCHAR(10) = @PeriodoInput;
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
                WHEN @Periodo = '7D' THEN DATEADD(DAY, -6, @FechaFinActual)
                WHEN @Periodo = '14D' THEN DATEADD(DAY, -13, @FechaFinActual)
                WHEN @Periodo = '1M' THEN DATEADD(DAY, -30, @FechaFinActual)
                WHEN @Periodo = '3M' THEN DATEADD(MONTH, -3, @FechaFinActual)
                WHEN @Periodo = '6M' THEN DATEADD(MONTH, -6, @FechaFinActual)
                WHEN @Periodo = '1A' THEN DATEADD(YEAR, -1, @FechaFinActual)
                ELSE @FechaFinActual
            END;
    END;

    SELECT 
      OCTG.PymntGroup AS PayDueMonth,
      COUNT(DISTINCT T0.DocNum) AS CantidadFacturas,
      SUM(T1.LineTotal) AS TotalVentas
    FROM [dbo].[OINV] T0
    INNER JOIN [dbo].[INV1] T1 ON T0.DocEntry = T1.DocEntry
    LEFT JOIN [dbo].[OCTG] ON T0.GroupNum = OCTG.GroupNum
    WHERE 
      T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
      AND T0.CANCELED = 'N'
      AND (
        @CanalParam IS NULL
        OR (
          (@CanalParam = 'Meli' AND ((T1.WhsCode IN ('03', '05') AND T1.SlpCode IN (426, 364, 355))
              OR (T1.WhsCode = '01' AND T1.SlpCode IN (355, 398))))
          OR (@CanalParam = 'Falabella' AND T1.WhsCode = '03' AND T1.SlpCode = 371)
          OR (@CanalParam = 'Balmaceda' AND T1.WhsCode = '07')
          OR (@CanalParam = 'Vitex' AND T1.WhsCode = '01' AND T1.SlpCode IN (401, 397))
          OR (@CanalParam = 'Chorrillo' AND T1.WhsCode = '01' 
              AND T1.SlpCode NOT IN (401, 397, 355, 398, 227, 250, 205, 138, 209, 228, 226, 137, 212))
          OR (@CanalParam = 'Empresas' AND T1.WhsCode = '01' 
              AND T1.SlpCode IN (227, 250, 205, 209, 228, 226, 137, 212, 225, 138))
        )
      )
      AND (
        @VendedorEmpresaParam IS NULL OR T1.SlpCode = @VendedorEmpresaParam
      )
    GROUP BY OCTG.PymntGroup
    ORDER BY CantidadFacturas DESC;
  `;

  const request = pool.request();
  request.input("CanalParamInput", sql.VarChar, canal);
  request.input("VendedorEmpresaParamInput", sql.Int, vendedorEmpresa);
  request.input("PeriodoInput", sql.VarChar, periodo);
  request.input("FechaInicioInput", sql.Date, fechaInicio);
  request.input("FechaFinInput", sql.Date, fechaFin);

  const result = await request.query(query);
  return result.recordset;
};

module.exports = {
  obtenerResumenFormasPago,
};
