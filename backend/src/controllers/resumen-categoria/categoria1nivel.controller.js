const sql = require("mssql");
const { poolPromise } = require('../../models/db');

const obtenerVentasPorPrimerNivel = async (req, res) => {
    try {
      const pool = await poolPromise;
  
      const canal = req.query.canal || null;
      const vendedorEmpresa = req.query.vendedorEmpresa || null;
      const primerNivel = req.query.primerNivel || 399;
      const periodo = req.query.periodo || "7D";
      const fechaInicio = req.query.fechaInicio || null;
      const fechaFin = req.query.fechaFin || null;
  
      const query = `
        DECLARE @CanalParam VARCHAR(50) = @CanalParamInput;
        DECLARE @VendedorEmpresaParam INT = @VendedorEmpresaInput;
        DECLARE @PrimerNivelParam NVARCHAR(50) = @PrimerNivelInput;
        DECLARE @Periodo VARCHAR(10) = @PeriodoParam;
        DECLARE @FechaInicioCustom DATE = @FechaInicioInput;
        DECLARE @FechaFinCustom DATE = @FechaFinInput;
  
        DECLARE @FechaInicioActual DATE, @FechaFinActual DATE;
        DECLARE @FechaInicioAnterior DATE, @FechaFinAnterior DATE;
  
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
                    WHEN @Periodo = '7D'  THEN DATEADD(DAY, -6, @FechaFinActual)
                    WHEN @Periodo = '14D' THEN DATEADD(DAY, -13, @FechaFinActual)
                    WHEN @Periodo = '1M'  THEN DATEADD(MONTH, -1, @FechaFinActual)
                    WHEN @Periodo = '3M'  THEN DATEADD(MONTH, -3, @FechaFinActual)
                    WHEN @Periodo = '6M'  THEN DATEADD(MONTH, -6, @FechaFinActual)
                    WHEN @Periodo = '1A'  THEN DATEADD(YEAR, -1, @FechaFinActual)
                    ELSE @FechaFinActual
                END;
        END
  
        DECLARE @Dias INT = DATEDIFF(DAY, @FechaInicioActual, @FechaFinActual) + 1;
        SET @FechaFinAnterior = DATEADD(DAY, -1, @FechaInicioActual);
        SET @FechaInicioAnterior = DATEADD(DAY, -@Dias, @FechaInicioActual);
  
        WITH VentasPeriodo AS (
            SELECT 
                CAST(SUM(T1.LineTotal) AS DECIMAL(18, 2)) AS TotalVentasPeriodo
            FROM [dbo].[OINV] T0
            INNER JOIN [dbo].[INV1] T1 ON T0.DocEntry = T1.DocEntry
            INNER JOIN [dbo].[OITM] I ON T1.ItemCode = I.ItemCode
            LEFT JOIN [dbo].[@PRIMER_NIVEL] P ON I.U_PRIMER_NIVEL = P.Code
            WHERE 
                T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
                AND T0.CANCELED = 'N'
                AND (@PrimerNivelParam IS NULL OR I.U_PRIMER_NIVEL = @PrimerNivelParam)
                AND (
                    @CanalParam IS NULL
                    OR (
                        (@CanalParam = 'Meli' AND ((T1.WhsCode IN ('03', '05') AND T0.SlpCode IN (426, 364, 355))
                            OR (T1.WhsCode = '01' AND T0.SlpCode IN (355, 398)) ))
                        OR (@CanalParam = 'Falabella' AND T1.WhsCode = '03' AND T0.SlpCode = 371)
                        OR (@CanalParam = 'Balmaceda' AND T1.WhsCode = '07')
                        OR (@CanalParam = 'Vitex' AND T1.WhsCode = '01' AND T0.SlpCode IN (401, 397))
                        OR (@CanalParam = 'Chorrillo' AND T1.WhsCode = '01' 
                            AND T1.SlpCode NOT IN (401, 397, 355, 398, 227, 250, 205, 138, 209, 228, 226, 137, 212))
                        OR (@CanalParam = 'Empresas' AND T1.WhsCode = '01' 
                            AND T1.SlpCode IN (227, 250, 205, 138, 209, 228, 226, 137, 212))
                    )
                )
                AND (@VendedorEmpresaParam IS NULL OR T1.SlpCode = @VendedorEmpresaParam)
        ),
        VentasAnterior AS (
            SELECT 
                CAST(SUM(T1.LineTotal) AS DECIMAL(18, 2)) AS TotalVentasAnterior
            FROM [dbo].[OINV] T0
            INNER JOIN [dbo].[INV1] T1 ON T0.DocEntry = T1.DocEntry
            INNER JOIN [dbo].[OITM] I ON T1.ItemCode = I.ItemCode
            LEFT JOIN [dbo].[@PRIMER_NIVEL] P ON I.U_PRIMER_NIVEL = P.Code
            WHERE 
                T0.DocDate BETWEEN @FechaInicioAnterior AND @FechaFinAnterior
                AND T0.CANCELED = 'N'
                AND (@PrimerNivelParam IS NULL OR I.U_PRIMER_NIVEL = @PrimerNivelParam)
                AND (
                    @CanalParam IS NULL
                    OR (
                        (@CanalParam = 'Meli' AND ((T1.WhsCode IN ('03', '05') AND T0.SlpCode IN (426, 364, 355))
                            OR (T1.WhsCode = '01' AND T0.SlpCode IN (355, 398)) ))
                        OR (@CanalParam = 'Falabella' AND T1.WhsCode = '03' AND T0.SlpCode = 371)
                        OR (@CanalParam = 'Balmaceda' AND T1.WhsCode = '07')
                        OR (@CanalParam = 'Vitex' AND T1.WhsCode = '01' AND T0.SlpCode IN (401, 397))
                        OR (@CanalParam = 'Chorrillo' AND T1.WhsCode = '01' 
                            AND T1.SlpCode NOT IN (401, 397, 355, 398, 227, 250, 205, 138, 209, 228, 226, 137, 212))
                        OR (@CanalParam = 'Empresas' AND T1.WhsCode = '01' 
                            AND T1.SlpCode IN (227, 250, 205, 138, 209, 228, 226, 137, 212))
                    )
                )
                AND (@VendedorEmpresaParam IS NULL OR T1.SlpCode = @VendedorEmpresaParam)
        )
        SELECT 
            VP.TotalVentasPeriodo, 
            VA.TotalVentasAnterior,
            CASE 
                WHEN VA.TotalVentasAnterior = 0 THEN NULL
                ELSE CAST(((VP.TotalVentasPeriodo - VA.TotalVentasAnterior) * 100.0 / VA.TotalVentasAnterior) AS DECIMAL(18, 2))
            END AS PorcentajeCambio
        FROM VentasPeriodo VP, VentasAnterior VA;
      `;
  
      const request = pool.request();
      request.input("CanalParamInput", sql.VarChar, canal);
      request.input("VendedorEmpresaInput", sql.Int, vendedorEmpresa);
      request.input("PrimerNivelInput", sql.NVarChar, primerNivel);
      request.input("PeriodoParam", sql.VarChar, periodo);
      request.input("FechaInicioInput", sql.Date, fechaInicio);
      request.input("FechaFinInput", sql.Date, fechaFin);
  
      const result = await request.query(query);
      const data = result.recordset[0] || {
        TotalVentasPeriodo: 0,
        TotalVentasAnterior: 0,
        PorcentajeCambio: 0
      };
  
      res.json(data);
    } catch (error) {
      console.error("❌ Error al obtener ventas por primer nivel:", error);
      res.status(500).json({ error: "Error en el servidor." });
    }
  };

  const obtenerMargenPorPrimerNivel = async (req, res) => {
    try {
      const pool = await poolPromise;
  
      const canal = req.query.canal || null;
      const vendedorEmpresa = req.query.vendedorEmpresa || null;
      const primerNivel = req.query.primerNivel || 399;
      const periodo = req.query.periodo || "7D";
      const fechaInicio = req.query.fechaInicio || null;
      const fechaFin = req.query.fechaFin || null;
  
      const query = `
        DECLARE @CanalParam VARCHAR(50) = @CanalParamInput;
        DECLARE @VendedorEmpresaParam INT = @VendedorEmpresaInput;
        DECLARE @PrimerNivelParam NVARCHAR(50) = @PrimerNivelInput;
        DECLARE @Periodo VARCHAR(10) = @PeriodoParam;
        DECLARE @FechaInicioCustom DATE = @FechaInicioInput;
        DECLARE @FechaFinCustom DATE = @FechaFinInput;
  
        DECLARE @FechaInicioActual DATE, @FechaFinActual DATE;
        DECLARE @FechaInicioAnterior DATE, @FechaFinAnterior DATE;
  
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
                    WHEN @Periodo = '7D'  THEN DATEADD(DAY, -6, @FechaFinActual)
                    WHEN @Periodo = '14D' THEN DATEADD(DAY, -13, @FechaFinActual)
                    WHEN @Periodo = '1M'  THEN DATEADD(MONTH, -1, @FechaFinActual)
                    WHEN @Periodo = '3M'  THEN DATEADD(MONTH, -3, @FechaFinActual)
                    WHEN @Periodo = '6M'  THEN DATEADD(MONTH, -6, @FechaFinActual)
                    WHEN @Periodo = '1A'  THEN DATEADD(YEAR, -1, @FechaFinActual)
                    ELSE @FechaFinActual
                END;
        END
  
        DECLARE @Dias INT = DATEDIFF(DAY, @FechaInicioActual, @FechaFinActual) + 1;
        SET @FechaFinAnterior = DATEADD(DAY, -1, @FechaInicioActual);
        SET @FechaInicioAnterior = DATEADD(DAY, -@Dias, @FechaInicioActual);
  
        WITH PeriodoActual AS (
            SELECT
                CAST(SUM(I.LineTotal) AS DECIMAL(18, 2)) AS TotalVentas,
                CAST(SUM(I.Quantity * ISNULL(M.AvgPrice, 0)) AS DECIMAL(18, 2)) AS TotalCostos
            FROM OINV O
            INNER JOIN INV1 I ON O.DocEntry = I.DocEntry
            LEFT JOIN OITM M ON I.ItemCode = M.ItemCode
            LEFT JOIN [@PRIMER_NIVEL] PN ON M.U_PRIMER_NIVEL = PN.Code
            WHERE 
                O.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
                AND O.CANCELED = 'N'
                AND (@PrimerNivelParam IS NULL OR M.U_PRIMER_NIVEL = @PrimerNivelParam)
                AND (
                    @CanalParam IS NULL
                    OR (
                        (@CanalParam = 'Meli' AND ((I.WhsCode IN ('03', '05') AND O.SlpCode IN (426, 364, 355))
                            OR (I.WhsCode = '01' AND O.SlpCode IN (355, 398)) ))
                        OR (@CanalParam = 'Falabella' AND I.WhsCode = '03' AND O.SlpCode = 371)
                        OR (@CanalParam = 'Balmaceda' AND I.WhsCode = '07')
                        OR (@CanalParam = 'Vitex' AND I.WhsCode = '01' AND O.SlpCode IN (401, 397))
                        OR (@CanalParam = 'Chorrillo' AND I.WhsCode = '01' 
                            AND O.SlpCode NOT IN (401, 397, 355, 398, 227, 250, 205, 138, 209, 228, 226, 137, 212))
                        OR (@CanalParam = 'Empresas' AND I.WhsCode = '01' 
                            AND O.SlpCode IN (227, 250, 205, 138, 209, 228, 226, 137, 212))
                    )
                )
                AND (@VendedorEmpresaParam IS NULL OR O.SlpCode = @VendedorEmpresaParam)
        ),
        PeriodoAnterior AS (
            SELECT
                CAST(SUM(I.LineTotal) AS DECIMAL(18, 2)) AS TotalVentas,
                CAST(SUM(I.Quantity * ISNULL(M.AvgPrice, 0)) AS DECIMAL(18, 2)) AS TotalCostos
            FROM OINV O
            INNER JOIN INV1 I ON O.DocEntry = I.DocEntry
            LEFT JOIN OITM M ON I.ItemCode = M.ItemCode
            LEFT JOIN [@PRIMER_NIVEL] PN ON M.U_PRIMER_NIVEL = PN.Code
            WHERE 
                O.DocDate BETWEEN @FechaInicioAnterior AND @FechaFinAnterior
                AND O.CANCELED = 'N'
                AND (@PrimerNivelParam IS NULL OR M.U_PRIMER_NIVEL = @PrimerNivelParam)
                AND (
                    @CanalParam IS NULL
                    OR (
                        (@CanalParam = 'Meli' AND ((I.WhsCode IN ('03', '05') AND O.SlpCode IN (426, 364, 355))
                            OR (I.WhsCode = '01' AND O.SlpCode IN (355, 398)) ))
                        OR (@CanalParam = 'Falabella' AND I.WhsCode = '03' AND O.SlpCode = 371)
                        OR (@CanalParam = 'Balmaceda' AND I.WhsCode = '07')
                        OR (@CanalParam = 'Vitex' AND I.WhsCode = '01' AND O.SlpCode IN (401, 397))
                        OR (@CanalParam = 'Chorrillo' AND I.WhsCode = '01' 
                            AND O.SlpCode NOT IN (401, 397, 355, 398, 227, 250, 205, 138, 209, 228, 226, 137, 212))
                        OR (@CanalParam = 'Empresas' AND I.WhsCode = '01' 
                            AND O.SlpCode IN (227, 250, 205, 138, 209, 228, 226, 137, 212))
                    )
                )
                AND (@VendedorEmpresaParam IS NULL OR O.SlpCode = @VendedorEmpresaParam)
        )
  
        SELECT
            CASE 
                WHEN PA.TotalVentas = 0 THEN NULL
                ELSE CAST(((PA.TotalVentas - PA.TotalCostos) * 100.0) / PA.TotalVentas AS DECIMAL(5, 2))
            END AS MargenPorcentajePeriodo,
  
            CASE 
                WHEN PB.TotalVentas = 0 THEN NULL
                ELSE CAST(
                    (((PA.TotalVentas - PA.TotalCostos) * 100.0 / NULLIF(PA.TotalVentas, 0)) -
                     ((PB.TotalVentas - PB.TotalCostos) * 100.0 / NULLIF(PB.TotalVentas, 0)))
                    AS DECIMAL(5, 2))
            END AS VariacionMargen
        FROM PeriodoActual PA, PeriodoAnterior PB;
      `;
  
      const request = pool.request();
      request.input("CanalParamInput", sql.VarChar, canal);
      request.input("VendedorEmpresaInput", sql.Int, vendedorEmpresa);
      request.input("PrimerNivelInput", sql.NVarChar, primerNivel);
      request.input("PeriodoParam", sql.VarChar, periodo);
      request.input("FechaInicioInput", sql.Date, fechaInicio);
      request.input("FechaFinInput", sql.Date, fechaFin);
  
      const result = await request.query(query);
      const data = result.recordset[0] || {
        MargenPorcentajePeriodo: 0,
        VariacionMargen: 0
      };
  
      res.json(data);
    } catch (error) {
      console.error("❌ Error al obtener margen por primer nivel:", error);
      res.status(500).json({ error: "Error en el servidor." });
    }
  };
  const obtenerCantidadVentasPorPrimerNivel = async (req, res) => {
    try {
      const pool = await poolPromise;
  
      const canal = req.query.canal || null;
      const vendedorEmpresa = req.query.vendedorEmpresa || null;
      const primerNivel = req.query.primerNivel || 399;
      const periodo = req.query.periodo || "7D";
      const fechaInicio = req.query.fechaInicio || null;
      const fechaFin = req.query.fechaFin || null;
  
      const query = `
        DECLARE @CanalParam VARCHAR(50) = @CanalParamInput;
        DECLARE @VendedorEmpresaParam INT = @VendedorEmpresaInput;
        DECLARE @PrimerNivelParam NVARCHAR(50) = @PrimerNivelInput;
        DECLARE @Periodo VARCHAR(10) = @PeriodoParam;
        DECLARE @FechaInicioCustom DATE = @FechaInicioInput;
        DECLARE @FechaFinCustom DATE = @FechaFinInput;
  
        DECLARE @FechaInicioActual DATE, @FechaFinActual DATE;
        DECLARE @FechaInicioAnterior DATE, @FechaFinAnterior DATE;
  
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
                    WHEN @Periodo = '7D'  THEN DATEADD(DAY, -6, @FechaFinActual)
                    WHEN @Periodo = '14D' THEN DATEADD(DAY, -13, @FechaFinActual)
                    WHEN @Periodo = '1M'  THEN DATEADD(MONTH, -1, @FechaFinActual)
                    WHEN @Periodo = '3M'  THEN DATEADD(MONTH, -3, @FechaFinActual)
                    WHEN @Periodo = '6M'  THEN DATEADD(MONTH, -6, @FechaFinActual)
                    WHEN @Periodo = '1A'  THEN DATEADD(YEAR, -1, @FechaFinActual)
                    ELSE @FechaFinActual
                END;
        END
  
        DECLARE @Dias INT = DATEDIFF(DAY, @FechaInicioActual, @FechaFinActual) + 1;
        SET @FechaFinAnterior = DATEADD(DAY, -1, @FechaInicioActual);
        SET @FechaInicioAnterior = DATEADD(DAY, -@Dias, @FechaInicioActual);
  
        WITH TransaccionesPeriodo AS (
            SELECT COUNT(DISTINCT T0.DocEntry) AS CantidadTransacciones
            FROM [dbo].[OINV] T0
            INNER JOIN [dbo].[INV1] T1 ON T0.DocEntry = T1.DocEntry
            INNER JOIN [dbo].[OITM] I ON T1.ItemCode = I.ItemCode
            LEFT JOIN [dbo].[@PRIMER_NIVEL] PN ON I.U_PRIMER_NIVEL = PN.Code
            WHERE 
                T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
                AND T0.CANCELED = 'N'
                AND (@PrimerNivelParam IS NULL OR I.U_PRIMER_NIVEL = @PrimerNivelParam)
                AND (
                    @CanalParam IS NULL
                    OR (
                        (@CanalParam = 'Meli' AND ((T1.WhsCode IN ('03', '05') AND T0.SlpCode IN (426, 364, 355))
                            OR (T1.WhsCode = '01' AND T0.SlpCode IN (355, 398)) ))
                        OR (@CanalParam = 'Falabella' AND T1.WhsCode = '03' AND T0.SlpCode = 371)
                        OR (@CanalParam = 'Balmaceda' AND T1.WhsCode = '07')
                        OR (@CanalParam = 'Vitex' AND T1.WhsCode = '01' AND T0.SlpCode IN (401, 397))
                        OR (@CanalParam = 'Chorrillo' AND T1.WhsCode = '01' 
                            AND T1.SlpCode NOT IN (401, 397, 355, 398, 227, 250, 205, 138, 209, 228, 226, 137, 212))
                        OR (@CanalParam = 'Empresas' AND T1.WhsCode = '01' 
                            AND T1.SlpCode IN (227, 250, 205, 138, 209, 228, 226, 137, 212))
                    )
                )
                AND (@VendedorEmpresaParam IS NULL OR T1.SlpCode = @VendedorEmpresaParam)
        ),
        TransaccionesAnterior AS (
            SELECT COUNT(DISTINCT T0.DocEntry) AS CantidadTransacciones
            FROM [dbo].[OINV] T0
            INNER JOIN [dbo].[INV1] T1 ON T0.DocEntry = T1.DocEntry
            INNER JOIN [dbo].[OITM] I ON T1.ItemCode = I.ItemCode
            LEFT JOIN [dbo].[@PRIMER_NIVEL] PN ON I.U_PRIMER_NIVEL = PN.Code
            WHERE 
                T0.DocDate BETWEEN @FechaInicioAnterior AND @FechaFinAnterior
                AND T0.CANCELED = 'N'
                AND (@PrimerNivelParam IS NULL OR I.U_PRIMER_NIVEL = @PrimerNivelParam)
                AND (
                    @CanalParam IS NULL
                    OR (
                        (@CanalParam = 'Meli' AND ((T1.WhsCode IN ('03', '05') AND T0.SlpCode IN (426, 364, 355))
                            OR (T1.WhsCode = '01' AND T0.SlpCode IN (355, 398)) ))
                        OR (@CanalParam = 'Falabella' AND T1.WhsCode = '03' AND T0.SlpCode = 371)
                        OR (@CanalParam = 'Balmaceda' AND T1.WhsCode = '07')
                        OR (@CanalParam = 'Vitex' AND T1.WhsCode = '01' AND T0.SlpCode IN (401, 397))
                        OR (@CanalParam = 'Chorrillo' AND T1.WhsCode = '01' 
                            AND T1.SlpCode NOT IN (401, 397, 355, 398, 227, 250, 205, 138, 209, 228, 226, 137, 212))
                        OR (@CanalParam = 'Empresas' AND T1.WhsCode = '01' 
                            AND T1.SlpCode IN (227, 250, 205, 138, 209, 228, 226, 137, 212))
                    )
                )
                AND (@VendedorEmpresaParam IS NULL OR T1.SlpCode = @VendedorEmpresaParam)
        )
  
        SELECT 
            TP.CantidadTransacciones AS CantidadTransaccionesPeriodo, 
            TA.CantidadTransacciones AS CantidadTransaccionesAnterior,
            CASE 
                WHEN TA.CantidadTransacciones = 0 THEN NULL
                ELSE CAST(((TP.CantidadTransacciones - TA.CantidadTransacciones) * 100.0 / TA.CantidadTransacciones) AS DECIMAL(18, 2))
            END AS PorcentajeCambio
        FROM TransaccionesPeriodo TP, TransaccionesAnterior TA;
      `;
  
      const request = pool.request();
      request.input("CanalParamInput", sql.VarChar, canal);
      request.input("VendedorEmpresaInput", sql.Int, vendedorEmpresa);
      request.input("PrimerNivelInput", sql.NVarChar, primerNivel);
      request.input("PeriodoParam", sql.VarChar, periodo);
      request.input("FechaInicioInput", sql.Date, fechaInicio);
      request.input("FechaFinInput", sql.Date, fechaFin);
  
      const result = await request.query(query);
      const data = result.recordset[0] || {
        CantidadTransaccionesPeriodo: 0,
        CantidadTransaccionesAnterior: 0,
        PorcentajeCambio: 0
      };
  
      res.json(data);
    } catch (error) {
      console.error("❌ Error al obtener cantidad de ventas por primer nivel:", error);
      res.status(500).json({ error: "Error en el servidor." });
    }
  };
  const obtenerNotasCreditoPorPrimerNivel = async (req, res) => {
    try {
      const pool = await poolPromise;
  
      const canal = req.query.canal || null;
      const vendedorEmpresa = req.query.vendedorEmpresa || null;
      const primerNivel = req.query.primerNivel || 399;
      const periodo = req.query.periodo || "7D";
      const fechaInicio = req.query.fechaInicio || null;
      const fechaFin = req.query.fechaFin || null;
  
      const query = `
        DECLARE @CanalParam VARCHAR(50) = @CanalParamInput;
        DECLARE @VendedorEmpresaParam INT = @VendedorEmpresaInput;
        DECLARE @PrimerNivelParam NVARCHAR(50) = @PrimerNivelInput;
        DECLARE @Periodo VARCHAR(10) = @PeriodoParam;
        DECLARE @FechaInicioCustom DATE = @FechaInicioInput;
        DECLARE @FechaFinCustom DATE = @FechaFinInput;
  
        DECLARE @FechaInicioActual DATE, @FechaFinActual DATE;
        DECLARE @FechaInicioAnterior DATE, @FechaFinAnterior DATE;
  
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
              WHEN @Periodo = '1D' THEN @FechaFinActual
              WHEN @Periodo = '7D' THEN DATEADD(DAY, -6, @FechaFinActual)
              WHEN @Periodo = '14D' THEN DATEADD(DAY, -13, @FechaFinActual)
              WHEN @Periodo = '1M'  THEN DATEADD(MONTH, -1, @FechaFinActual)
              WHEN @Periodo = '3M' THEN DATEADD(MONTH, -3, @FechaFinActual)
              WHEN @Periodo = '6M' THEN DATEADD(MONTH, -6, @FechaFinActual)
              WHEN @Periodo = '1A' THEN DATEADD(YEAR, -1, @FechaFinActual)
              ELSE @FechaFinActual
            END;
        END
  
        DECLARE @Dias INT = DATEDIFF(DAY, @FechaInicioActual, @FechaFinActual) + 1;
        SET @FechaFinAnterior = DATEADD(DAY, -1, @FechaInicioActual);
        SET @FechaInicioAnterior = DATEADD(DAY, -@Dias, @FechaInicioActual);
  
        WITH NC_PeriodoActual AS (
          SELECT 
            COUNT(DISTINCT T0.DocEntry) AS CantidadNotasCreditoPeriodo,
            CAST(SUM(T1.Quantity) AS DECIMAL(18, 2)) AS CantidadProductosDevueltosPeriodo
          FROM [dbo].[ORIN] T0
          INNER JOIN [dbo].[RIN1] T1 ON T0.DocEntry = T1.DocEntry
          INNER JOIN [dbo].[OITM] I ON T1.ItemCode = I.ItemCode
          LEFT JOIN [dbo].[@PRIMER_NIVEL] PN ON I.U_PRIMER_NIVEL = PN.Code
          WHERE 
            T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
            AND (@PrimerNivelParam IS NULL OR I.U_PRIMER_NIVEL = @PrimerNivelParam)
            AND (
              @CanalParam IS NULL
              OR (
                (@CanalParam = 'Meli' AND ((T1.WhsCode IN ('03', '05') AND T0.SlpCode IN (426, 364, 355))
                  OR (T1.WhsCode = '01' AND T0.SlpCode IN (355, 398)) ))
                OR (@CanalParam = 'Falabella' AND T1.WhsCode = '03' AND T0.SlpCode = 371)
                OR (@CanalParam = 'Balmaceda' AND T1.WhsCode = '07')
                OR (@CanalParam = 'Vitex' AND T1.WhsCode = '01' AND T0.SlpCode IN (401, 397))
                OR (@CanalParam = 'Chorrillo' AND T1.WhsCode = '01' 
                    AND T0.SlpCode NOT IN (401, 397, 355, 398, 227, 250, 205, 138, 209, 228, 226, 137, 212))
                OR (@CanalParam = 'Empresas' AND T1.WhsCode = '01' 
                    AND T0.SlpCode IN (227, 250, 205, 138, 209, 228, 226, 137, 212))
              )
            )
            AND (@VendedorEmpresaParam IS NULL OR T0.SlpCode = @VendedorEmpresaParam)
        ),
        NC_PeriodoAnterior AS (
          SELECT 
            COUNT(DISTINCT T0.DocEntry) AS CantidadNotasCreditoAnterior,
            CAST(SUM(T1.Quantity) AS DECIMAL(18, 2)) AS CantidadProductosDevueltosAnterior
          FROM [dbo].[ORIN] T0
          INNER JOIN [dbo].[RIN1] T1 ON T0.DocEntry = T1.DocEntry
          INNER JOIN [dbo].[OITM] I ON T1.ItemCode = I.ItemCode
          LEFT JOIN [dbo].[@PRIMER_NIVEL] PN ON I.U_PRIMER_NIVEL = PN.Code
          WHERE 
            T0.DocDate BETWEEN @FechaInicioAnterior AND @FechaFinAnterior
            AND (@PrimerNivelParam IS NULL OR I.U_PRIMER_NIVEL = @PrimerNivelParam)
            AND (
              @CanalParam IS NULL
              OR (
                (@CanalParam = 'Meli' AND ((T1.WhsCode IN ('03', '05') AND T0.SlpCode IN (426, 364, 355))
                  OR (T1.WhsCode = '01' AND T0.SlpCode IN (355, 398)) ))
                OR (@CanalParam = 'Falabella' AND T1.WhsCode = '03' AND T0.SlpCode = 371)
                OR (@CanalParam = 'Balmaceda' AND T1.WhsCode = '07')
                OR (@CanalParam = 'Vitex' AND T1.WhsCode = '01' AND T0.SlpCode IN (401, 397))
                OR (@CanalParam = 'Chorrillo' AND T1.WhsCode = '01' 
                    AND T0.SlpCode NOT IN (401, 397, 355, 398, 227, 250, 205, 138, 209, 228, 226, 137, 212))
                OR (@CanalParam = 'Empresas' AND T1.WhsCode = '01' 
                    AND T0.SlpCode IN (227, 250, 205, 138, 209, 228, 226, 137, 212))
              )
            )
            AND (@VendedorEmpresaParam IS NULL OR T0.SlpCode = @VendedorEmpresaParam)
        )
  
        SELECT 
          P.CantidadNotasCreditoPeriodo,
          A.CantidadNotasCreditoAnterior,
          CASE 
            WHEN A.CantidadNotasCreditoAnterior = 0 THEN NULL
            ELSE CAST(((P.CantidadNotasCreditoPeriodo - A.CantidadNotasCreditoAnterior) * 100.0) / A.CantidadNotasCreditoAnterior AS DECIMAL(18,2))
          END AS PorcentajeCambioNotasCredito,
  
          P.CantidadProductosDevueltosPeriodo,
          A.CantidadProductosDevueltosAnterior,
          CASE 
            WHEN A.CantidadProductosDevueltosAnterior = 0 THEN NULL
            ELSE CAST(((P.CantidadProductosDevueltosPeriodo - A.CantidadProductosDevueltosAnterior) * 100.0) / A.CantidadProductosDevueltosAnterior AS DECIMAL(18,2))
          END AS PorcentajeCambioProductosDevueltos
        FROM NC_PeriodoActual P, NC_PeriodoAnterior A;
      `;
  
      const request = pool.request();
      request.input("CanalParamInput", sql.VarChar, canal);
      request.input("VendedorEmpresaInput", sql.Int, vendedorEmpresa);
      request.input("PrimerNivelInput", sql.NVarChar, primerNivel);
      request.input("PeriodoParam", sql.VarChar, periodo);
      request.input("FechaInicioInput", sql.Date, fechaInicio);
      request.input("FechaFinInput", sql.Date, fechaFin);
  
      const result = await request.query(query);
      const data = result.recordset[0] || {
        CantidadNotasCreditoPeriodo: 0,
        CantidadNotasCreditoAnterior: 0,
        PorcentajeCambioNotasCredito: 0,
        CantidadProductosDevueltosPeriodo: 0,
        CantidadProductosDevueltosAnterior: 0,
        PorcentajeCambioProductosDevueltos: 0
      };
  
      res.json(data);
    } catch (error) {
      console.error("❌ Error al obtener notas de crédito por primer nivel:", error);
      res.status(500).json({ error: "Error en el servidor." });
    }
  };
  const obtenerItemsVendidosPorPrimerNivel = async (req, res) => {
    try {
      const pool = await poolPromise;
  
      const canal = req.query.canal || null;
      const vendedorEmpresa = req.query.vendedorEmpresa || null;
      const primerNivel = req.query.primerNivel || 399;
      const periodo = req.query.periodo || "7D";
      const fechaInicio = req.query.fechaInicio || null;
      const fechaFin = req.query.fechaFin || null;
  
      const query = `
        DECLARE @CanalParam VARCHAR(50) = @CanalParamInput;
        DECLARE @VendedorEmpresaParam INT = @VendedorEmpresaInput;
        DECLARE @PrimerNivelParam NVARCHAR(50) = @PrimerNivelInput;
        DECLARE @Periodo VARCHAR(10) = @PeriodoParam;
        DECLARE @FechaInicioCustom DATE = @FechaInicioInput;
        DECLARE @FechaFinCustom DATE = @FechaFinInput;
  
        DECLARE @FechaInicioActual DATE, @FechaFinActual DATE;
        DECLARE @FechaInicioAnterior DATE, @FechaFinAnterior DATE;
  
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
              WHEN @Periodo = '1M'  THEN DATEADD(MONTH, -1, @FechaFinActual)
              WHEN @Periodo = '3M' THEN DATEADD(MONTH, -3, @FechaFinActual)
              WHEN @Periodo = '6M' THEN DATEADD(MONTH, -6, @FechaFinActual)
              WHEN @Periodo = '1A' THEN DATEADD(YEAR, -1, @FechaFinActual)
              ELSE @FechaFinActual
            END;
        END
  
        DECLARE @Dias INT = DATEDIFF(DAY, @FechaInicioActual, @FechaFinActual) + 1;
        SET @FechaFinAnterior = DATEADD(DAY, -1, @FechaInicioActual);
        SET @FechaInicioAnterior = DATEADD(DAY, -@Dias, @FechaInicioActual);
  
        WITH ProductosPeriodo AS (
          SELECT COUNT(DISTINCT T1.ItemCode) AS ProductosDistintosVendidos
          FROM [dbo].[OINV] T0
          INNER JOIN [dbo].[INV1] T1 ON T0.DocEntry = T1.DocEntry
          INNER JOIN [dbo].[OITM] I ON T1.ItemCode = I.ItemCode
          LEFT JOIN [dbo].[@PRIMER_NIVEL] PN ON I.U_PRIMER_NIVEL = PN.Code
          WHERE T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
            AND T0.CANCELED = 'N'
            AND (@PrimerNivelParam IS NULL OR I.U_PRIMER_NIVEL = @PrimerNivelParam)
            AND (
              @CanalParam IS NULL OR (
                (@CanalParam = 'Meli' AND ((T1.WhsCode IN ('03','05') AND T0.SlpCode IN (426,364,355)) OR (T1.WhsCode = '01' AND T0.SlpCode IN (355,398))))
                OR (@CanalParam = 'Falabella' AND T1.WhsCode = '03' AND T0.SlpCode = 371)
                OR (@CanalParam = 'Balmaceda' AND T1.WhsCode = '07')
                OR (@CanalParam = 'Vitex' AND T1.WhsCode = '01' AND T0.SlpCode IN (401,397))
                OR (@CanalParam = 'Chorrillo' AND T1.WhsCode = '01' AND T0.SlpCode NOT IN (401,397,355,398,227,250,205,138,209,228,226,137,212))
                OR (@CanalParam = 'Empresas' AND T1.WhsCode = '01' AND T0.SlpCode IN (227,250,205,138,209,228,226,137,212))
              )
            )
            AND (@VendedorEmpresaParam IS NULL OR T1.SlpCode = @VendedorEmpresaParam)
        ),
        ProductosAnterior AS (
          SELECT COUNT(DISTINCT T1.ItemCode) AS ProductosDistintosVendidosAnterior
          FROM [dbo].[OINV] T0
          INNER JOIN [dbo].[INV1] T1 ON T0.DocEntry = T1.DocEntry
          INNER JOIN [dbo].[OITM] I ON T1.ItemCode = I.ItemCode
          LEFT JOIN [dbo].[@PRIMER_NIVEL] PN ON I.U_PRIMER_NIVEL = PN.Code
          WHERE T0.DocDate BETWEEN @FechaInicioAnterior AND @FechaFinAnterior
            AND T0.CANCELED = 'N'
            AND (@PrimerNivelParam IS NULL OR I.U_PRIMER_NIVEL = @PrimerNivelParam)
            AND (
              @CanalParam IS NULL OR (
                (@CanalParam = 'Meli' AND ((T1.WhsCode IN ('03','05') AND T0.SlpCode IN (426,364,355)) OR (T1.WhsCode = '01' AND T0.SlpCode IN (355,398))))
                OR (@CanalParam = 'Falabella' AND T1.WhsCode = '03' AND T0.SlpCode = 371)
                OR (@CanalParam = 'Balmaceda' AND T1.WhsCode = '07')
                OR (@CanalParam = 'Vitex' AND T1.WhsCode = '01' AND T0.SlpCode IN (401,397))
                OR (@CanalParam = 'Chorrillo' AND T1.WhsCode = '01' AND T0.SlpCode NOT IN (401,397,355,398,227,250,205,138,209,228,226,137,212))
                OR (@CanalParam = 'Empresas' AND T1.WhsCode = '01' AND T0.SlpCode IN (227,250,205,138,209,228,226,137,212))
              )
            )
            AND (@VendedorEmpresaParam IS NULL OR T1.SlpCode = @VendedorEmpresaParam)
        )
        
        SELECT 
          PP.ProductosDistintosVendidos AS ProductosPeriodoActual,
          PA.ProductosDistintosVendidosAnterior AS ProductosPeriodoAnterior,
          CASE 
            WHEN PA.ProductosDistintosVendidosAnterior = 0 THEN NULL
            ELSE CAST(((PP.ProductosDistintosVendidos - PA.ProductosDistintosVendidosAnterior) * 100.0 / PA.ProductosDistintosVendidosAnterior) AS DECIMAL(18, 2))
          END AS PorcentajeCambio
        FROM ProductosPeriodo PP, ProductosAnterior PA;
      `;
  
      const request = pool.request();
      request.input("CanalParamInput", sql.VarChar, canal);
      request.input("VendedorEmpresaInput", sql.Int, vendedorEmpresa);
      request.input("PrimerNivelInput", sql.NVarChar, primerNivel);
      request.input("PeriodoParam", sql.VarChar, periodo);
      request.input("FechaInicioInput", sql.Date, fechaInicio);
      request.input("FechaFinInput", sql.Date, fechaFin);
  
      const result = await request.query(query);
      const data = result.recordset[0] || {
        ProductosPeriodoActual: 0,
        ProductosPeriodoAnterior: 0,
        PorcentajeCambio: 0,
      };
  
      res.json(data);
    } catch (error) {
      console.error("❌ Error al obtener productos distintos por primer nivel:", error);
      res.status(500).json({ error: "Error en el servidor." });
    }
  };
  const obtenerUnidadesVendidasPorPrimerNivel = async (req, res) => {
    try {
      const pool = await poolPromise;
  
      const canal = req.query.canal || null;
      const vendedorEmpresa = req.query.vendedorEmpresa || null;
      const primerNivel = req.query.primerNivel || 399;
      const periodo = req.query.periodo || "7D";
      const fechaInicio = req.query.fechaInicio || null;
      const fechaFin = req.query.fechaFin || null;
  
      const query = `
        DECLARE @CanalParam VARCHAR(50) = @CanalParamInput;
        DECLARE @VendedorEmpresaParam INT = @VendedorEmpresaInput;
        DECLARE @PrimerNivelParam NVARCHAR(50) = @PrimerNivelInput;
        DECLARE @Periodo VARCHAR(10) = @PeriodoParam;
        DECLARE @FechaInicioCustom DATE = @FechaInicioInput;
        DECLARE @FechaFinCustom DATE = @FechaFinInput;
  
        DECLARE @FechaInicioActual DATE, @FechaFinActual DATE;
        DECLARE @FechaInicioAnterior DATE, @FechaFinAnterior DATE;
  
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
              WHEN @Periodo = '7D'  THEN DATEADD(DAY, -6, @FechaFinActual)
              WHEN @Periodo = '14D' THEN DATEADD(DAY, -13, @FechaFinActual)
              WHEN @Periodo = '1M'  THEN DATEADD(MONTH, -1, @FechaFinActual)
              WHEN @Periodo = '3M'  THEN DATEADD(MONTH, -3, @FechaFinActual)
              WHEN @Periodo = '6M'  THEN DATEADD(MONTH, -6, @FechaFinActual)
              WHEN @Periodo = '1A'  THEN DATEADD(YEAR, -1, @FechaFinActual)
              ELSE @FechaFinActual
            END;
        END
  
        DECLARE @Dias INT = DATEDIFF(DAY, @FechaInicioActual, @FechaFinActual) + 1;
        SET @FechaFinAnterior = DATEADD(DAY, -1, @FechaInicioActual);
        SET @FechaInicioAnterior = DATEADD(DAY, -@Dias, @FechaInicioActual);
  
        WITH UnidadesVendidasPeriodo AS (
          SELECT CAST(SUM(T1.Quantity) AS INT) AS CantidadVendida
          FROM [dbo].[OINV] T0
          INNER JOIN [dbo].[INV1] T1 ON T0.DocEntry = T1.DocEntry
          INNER JOIN [dbo].[OITM] I ON T1.ItemCode = I.ItemCode
          LEFT JOIN [dbo].[@PRIMER_NIVEL] PN ON I.U_PRIMER_NIVEL = PN.Code
          WHERE T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
            AND T0.CANCELED = 'N'
            AND (@PrimerNivelParam IS NULL OR I.U_PRIMER_NIVEL = @PrimerNivelParam)
            AND (
              @CanalParam IS NULL OR (
                (@CanalParam = 'Meli' AND ((T1.WhsCode IN ('03', '05') AND T0.SlpCode IN (426, 364, 355)) OR (T1.WhsCode = '01' AND T0.SlpCode IN (355, 398))))
                OR (@CanalParam = 'Falabella' AND T1.WhsCode = '03' AND T0.SlpCode = 371)
                OR (@CanalParam = 'Balmaceda' AND T1.WhsCode = '07')
                OR (@CanalParam = 'Vitex' AND T1.WhsCode = '01' AND T0.SlpCode IN (401, 397))
                OR (@CanalParam = 'Chorrillo' AND T1.WhsCode = '01' AND T0.SlpCode NOT IN (401, 397, 355, 398, 227, 250, 205, 138, 209, 228, 226, 137, 212))
                OR (@CanalParam = 'Empresas' AND T1.WhsCode = '01' AND T1.SlpCode IN (227, 250, 205, 138, 209, 228, 226, 137, 212))
              )
            )
            AND (@VendedorEmpresaParam IS NULL OR T1.SlpCode = @VendedorEmpresaParam)
        ),
        UnidadesVendidasAnterior AS (
          SELECT CAST(SUM(T1.Quantity) AS INT) AS CantidadVendidaAnterior
          FROM [dbo].[OINV] T0
          INNER JOIN [dbo].[INV1] T1 ON T0.DocEntry = T1.DocEntry
          INNER JOIN [dbo].[OITM] I ON T1.ItemCode = I.ItemCode
          LEFT JOIN [dbo].[@PRIMER_NIVEL] PN ON I.U_PRIMER_NIVEL = PN.Code
          WHERE T0.DocDate BETWEEN @FechaInicioAnterior AND @FechaFinAnterior
            AND T0.CANCELED = 'N'
            AND (@PrimerNivelParam IS NULL OR I.U_PRIMER_NIVEL = @PrimerNivelParam)
            AND (
              @CanalParam IS NULL OR (
                (@CanalParam = 'Meli' AND ((T1.WhsCode IN ('03', '05') AND T0.SlpCode IN (426, 364, 355)) OR (T1.WhsCode = '01' AND T0.SlpCode IN (355, 398))))
                OR (@CanalParam = 'Falabella' AND T1.WhsCode = '03' AND T0.SlpCode = 371)
                OR (@CanalParam = 'Balmaceda' AND T1.WhsCode = '07')
                OR (@CanalParam = 'Vitex' AND T1.WhsCode = '01' AND T0.SlpCode IN (401, 397))
                OR (@CanalParam = 'Chorrillo' AND T1.WhsCode = '01' AND T0.SlpCode NOT IN (401, 397, 355, 398, 227, 250, 205, 138, 209, 228, 226, 137, 212))
                OR (@CanalParam = 'Empresas' AND T1.WhsCode = '01' AND T0.SlpCode IN (227, 250, 205, 138, 209, 228, 226, 137, 212))
              )
            )
            AND (@VendedorEmpresaParam IS NULL OR T1.SlpCode = @VendedorEmpresaParam)
        )
        SELECT 
          UVP.CantidadVendida,
          UVA.CantidadVendidaAnterior,
          CASE 
            WHEN UVA.CantidadVendidaAnterior = 0 THEN NULL
            ELSE CAST(((UVP.CantidadVendida - UVA.CantidadVendidaAnterior) * 100.0 / UVA.CantidadVendidaAnterior) AS DECIMAL(18, 2))
          END AS PorcentajeCambio
        FROM UnidadesVendidasPeriodo UVP, UnidadesVendidasAnterior UVA
      `;
  
      const request = pool.request();
      request.input("CanalParamInput", sql.VarChar, canal);
      request.input("VendedorEmpresaInput", sql.Int, vendedorEmpresa);
      request.input("PrimerNivelInput", sql.NVarChar, primerNivel);
      request.input("PeriodoParam", sql.VarChar, periodo);
      request.input("FechaInicioInput", sql.Date, fechaInicio);
      request.input("FechaFinInput", sql.Date, fechaFin);
  
      const result = await request.query(query);
      const data = result.recordset[0] || {
        CantidadVendida: 0,
        CantidadVendidaAnterior: 0,
        PorcentajeCambio: 0,
      };
  
      res.json(data);
    } catch (error) {
      console.error("❌ Error al obtener unidades vendidas por primer nivel:", error);
      res.status(500).json({ error: "Error en el servidor." });
    }
  };

//   graficos
  const obtenerVentasPorFechaYPrimerNivel = async (req, res) => {
    try {
      const pool = await poolPromise;
  
      const periodo = req.query.periodo || "7D";
      const primerNivel = req.query.primerNivel || null;
      const fechaInicio = req.query.fechaInicio || null;
      const fechaFin = req.query.fechaFin || null;
  
      const query = `
        DECLARE @Periodo VARCHAR(10) = @PeriodoParam;
        DECLARE @FechaInicioCustom DATE = @FechaInicioInput;
        DECLARE @FechaFinCustom DATE = @FechaFinInput;
        DECLARE @PrimerNivelParam NVARCHAR(50) = @PrimerNivelInput;
  
        DECLARE @FechaInicio DATE;
        DECLARE @FechaFin DATE;
  
        IF (@FechaInicioCustom IS NOT NULL AND @FechaFinCustom IS NOT NULL)
        BEGIN
            SET @FechaInicio = @FechaInicioCustom;
            SET @FechaFin = @FechaFinCustom;
        END
        ELSE
        BEGIN
            SET @FechaFin = CAST(GETDATE() AS DATE);
            SET @FechaInicio =
                CASE 
                    WHEN @Periodo = '7D'  THEN DATEADD(DAY, -6, @FechaFin)
                    WHEN @Periodo = '14D' THEN DATEADD(DAY, -13, @FechaFin)
                    WHEN @Periodo = '1M'  THEN DATEADD(MONTH, -1, @FechaFin)
                    WHEN @Periodo = '3M'  THEN DATEADD(MONTH, -3, @FechaFin)
                    WHEN @Periodo = '6M'  THEN DATEADD(MONTH, -6, @FechaFin)
                    ELSE @FechaFin
                END;
        END;
  
        SELECT 
            OI.DocDate AS Fecha,
  
            SUM(CASE 
                WHEN (I.WhsCode IN ('03', '05') AND OI.SlpCode IN (426, 364, 355)) 
                  OR (I.WhsCode = '01' AND OI.SlpCode IN (355, 398)) 
                THEN I.LineTotal ELSE 0 
            END) AS Meli,
  
            SUM(CASE 
                WHEN I.WhsCode = '03' AND OI.SlpCode = 371 
                THEN I.LineTotal ELSE 0 
            END) AS Falabella,
  
            SUM(CASE 
                WHEN I.WhsCode = '07' 
                THEN I.LineTotal ELSE 0 
            END) AS Balmaceda,
  
            SUM(CASE 
                WHEN I.WhsCode = '01' AND OI.SlpCode IN (401, 397) 
                THEN I.LineTotal ELSE 0 
            END) AS Vitex,
  
            SUM(CASE 
                WHEN I.WhsCode = '01' 
                 AND I.SlpCode NOT IN (401, 397, 355, 398, 227, 250, 205, 138, 209, 228, 226, 137, 212) 
                THEN I.LineTotal ELSE 0 
            END) AS Chorrillo,
  
            SUM(CASE 
                WHEN I.WhsCode = '01' 
                 AND I.SlpCode IN (227, 250, 205, 138, 209, 228, 226, 137, 212) 
                THEN I.LineTotal ELSE 0 
            END) AS Empresas
  
        FROM INV1 I
        INNER JOIN OINV OI ON I.DocEntry = OI.DocEntry
        INNER JOIN OITM ITM ON I.ItemCode = ITM.ItemCode  
        LEFT JOIN [@PRIMER_NIVEL] PN ON ITM.U_PRIMER_NIVEL = PN.Code
        WHERE 
            OI.DocDate BETWEEN @FechaInicio AND @FechaFin
            AND OI.CANCELED = 'N'
            AND (@PrimerNivelParam IS NULL OR ITM.U_PRIMER_NIVEL = @PrimerNivelParam)
        GROUP BY 
            OI.DocDate
        ORDER BY 
            OI.DocDate ASC;
      `;
  
      const request = pool.request();
      request.input("PeriodoParam", sql.VarChar, periodo);
      request.input("FechaInicioInput", sql.Date, fechaInicio);
      request.input("FechaFinInput", sql.Date, fechaFin);
      request.input("PrimerNivelInput", sql.NVarChar, primerNivel);
  
      const result = await request.query(query);
      res.json(result.recordset);
    } catch (error) {
      console.error("❌ Error al obtener ventas por fecha y primer nivel:", error);
      res.status(500).json({ error: "Error en el servidor." });
    }
  };
  const obtenerVentasCanalPorPrimerNivel = async (req, res) => {
    try {
      const pool = await poolPromise;
  
      const primerNivel = req.query.primerNivel || 399;
      const periodo = req.query.periodo || "7D";
      const fechaInicio = req.query.fechaInicio || null;
      const fechaFin = req.query.fechaFin || null;
  
      const query = `
        DECLARE @PrimerNivelParam NVARCHAR(50) = @PrimerNivelInput;
        DECLARE @Periodo VARCHAR(10) = @PeriodoParam;
        DECLARE @FechaInicioCustom DATE = @FechaInicioInput;
        DECLARE @FechaFinCustom DATE = @FechaFinInput;
  
        DECLARE @FechaInicio DATE, @FechaFin DATE;
  
        IF (@FechaInicioCustom IS NOT NULL AND @FechaFinCustom IS NOT NULL)
        BEGIN
            SET @FechaInicio = @FechaInicioCustom;
            SET @FechaFin = @FechaFinCustom;
        END
        ELSE
        BEGIN
            SET @FechaFin = CAST(GETDATE() AS DATE);
            SET @FechaInicio = 
                CASE 
                    WHEN @Periodo = '1D' THEN @FechaFin
                    WHEN @Periodo = '7D' THEN DATEADD(DAY, -6, @FechaFin)
                    WHEN @Periodo = '14D' THEN DATEADD(DAY, -13, @FechaFin)
                    WHEN @Periodo = '1M' THEN DATEADD(MONTH, -1, @FechaFin)
                    WHEN @Periodo = '3M' THEN DATEADD(MONTH, -3, @FechaFin)
                    WHEN @Periodo = '6M' THEN DATEADD(MONTH, -6, @FechaFin)
                    ELSE @FechaFin
                END;
        END
  
        SELECT 
            SUM(CASE 
                WHEN (I.WhsCode IN ('03', '05') AND OI.SlpCode IN (426, 364, 355)) 
                  OR (I.WhsCode = '01' AND OI.SlpCode IN (355, 398)) 
                THEN I.LineTotal ELSE 0 
            END) AS Meli,
  
            SUM(CASE 
                WHEN I.WhsCode = '03' AND OI.SlpCode = 371 
                THEN I.LineTotal ELSE 0 
            END) AS Falabella,
  
            SUM(CASE 
                WHEN I.WhsCode = '07' 
                THEN I.LineTotal ELSE 0 
            END) AS Balmaceda,
  
            SUM(CASE 
                WHEN I.WhsCode = '01' AND OI.SlpCode IN (401, 397) 
                THEN I.LineTotal ELSE 0 
            END) AS Vitex,
  
            SUM(CASE 
                WHEN I.WhsCode = '01' 
                 AND I.SlpCode NOT IN (401, 397, 355, 398, 227, 250, 205, 138, 209, 228, 226, 137, 212) 
                THEN I.LineTotal ELSE 0 
            END) AS Chorrillo,
  
            SUM(CASE 
                WHEN I.WhsCode = '01' 
                 AND I.SlpCode IN (227, 250, 205, 138, 209, 228, 226, 137, 212) 
                THEN I.LineTotal ELSE 0 
            END) AS Empresas
  
        FROM INV1 I
        INNER JOIN OINV OI ON I.DocEntry = OI.DocEntry
        INNER JOIN OITM ITM ON I.ItemCode = ITM.ItemCode
        LEFT JOIN [@PRIMER_NIVEL] PN ON ITM.U_PRIMER_NIVEL = PN.Code
        WHERE 
            OI.DocDate BETWEEN @FechaInicio AND @FechaFin
            AND OI.CANCELED = 'N'
            AND (@PrimerNivelParam IS NULL OR ITM.U_PRIMER_NIVEL = @PrimerNivelParam);
      `;
  
      const request = pool.request();
      request.input("PrimerNivelInput", sql.NVarChar, primerNivel);
      request.input("PeriodoParam", sql.VarChar, periodo);
      request.input("FechaInicioInput", sql.Date, fechaInicio);
      request.input("FechaFinInput", sql.Date, fechaFin);
  
      const result = await request.query(query);
      res.json(result.recordset[0]);
    } catch (error) {
      console.error("❌ Error al obtener ventas por canal y primer nivel:", error);
      res.status(500).json({ error: "Error en el servidor." });
    }
  };
  const obtenerCategoriasMasVendidasPorPrimerNivel = async (req, res) => {
    try {
      const pool = await poolPromise;
  
      const primerNivel = req.query.primerNivel || 399;
      const periodo = req.query.periodo || "7D";
      const fechaInicio = req.query.fechaInicio || null;
      const fechaFin = req.query.fechaFin || null;
  
      const query = `
        DECLARE @PrimerNivelParam NVARCHAR(50) = @PrimerNivelInput;
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
        END
  
        SELECT 
            C.Code AS Codigo_Categoria,
            C.U_Imagen AS Imagen,
            C.Name AS Nombre_Categoria,
            COUNT(DISTINCT T0.DocEntry) AS NumTransacciones,
            SUM(I.Quantity) AS Cantidad_Vendida,
            SUM(I.LineTotal) AS Total_Ventas
        FROM INV1 I
        INNER JOIN OINV T0 ON I.DocEntry = T0.DocEntry
        INNER JOIN OITM O ON I.ItemCode = O.ItemCode
        LEFT JOIN [@Categoria] C ON O.U_Categoria = C.Code
        LEFT JOIN [@PRIMER_NIVEL] PN ON O.U_PRIMER_NIVEL = PN.Code
        WHERE 
            T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
            AND T0.CANCELED = 'N'
            AND O.AvgPrice > 0
            AND O.U_PRIMER_NIVEL = @PrimerNivelParam
        GROUP BY C.Code, C.U_Imagen, C.Name
        ORDER BY Total_Ventas DESC;
      `;
  
      const request = pool.request();
      request.input("PrimerNivelInput", sql.NVarChar(50), primerNivel);
      request.input("PeriodoParam", sql.VarChar(10), periodo);
      request.input("FechaInicioInput", sql.Date, fechaInicio);
      request.input("FechaFinInput", sql.Date, fechaFin);
  
      const result = await request.query(query);
      res.json(result.recordset);
    } catch (error) {
      console.error("❌ Error al obtener las categorías más vendidas por primer nivel:", error);
      res.status(500).json({ error: "Error en el servidor." });
    }
  };
  
  const obtenerTopRentablesPrimerNivel = async (req, res) => {
    try {
      const pool = await poolPromise;
  
      const canal = req.query.canal || null;
      const vendedor = req.query.vendedorEmpresa || null;
      const primerNivel = req.query.primerNivel || 399;
      const periodo = req.query.periodo || "7D";
      const fechaInicio = req.query.fechaInicio || null;
      const fechaFin = req.query.fechaFin || null;
  
      const query = `
        DECLARE @CanalParam VARCHAR(50) = @CanalParamInput;
        DECLARE @VendedorParam INT = @VendedorParamInput;
        DECLARE @PrimerNivelParam NVARCHAR(50) = @PrimerNivelInput;
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
                    WHEN @Periodo = '1D'  THEN @FechaFinActual
                    WHEN @Periodo = '7D'  THEN DATEADD(DAY, -6, @FechaFinActual)
                    WHEN @Periodo = '14D' THEN DATEADD(DAY, -13, @FechaFinActual)
                    WHEN @Periodo = '1M'  THEN DATEADD(MONTH, -1, @FechaFinActual)
                    WHEN @Periodo = '3M'  THEN DATEADD(MONTH, -3, @FechaFinActual)
                    WHEN @Periodo = '6M'  THEN DATEADD(MONTH, -6, @FechaFinActual)
                    ELSE @FechaFinActual
                END;
        END;
  
        SELECT 
            I.ItemCode AS Codigo_Producto,
            O.ItemName AS Nombre_Producto,
            O.U_Imagen AS Imagen_Producto,
            SUM(I.Quantity) AS Cantidad_Vendida,
            CAST(SUM(I.LineTotal) / NULLIF(SUM(I.Quantity), 0) AS DECIMAL(18,2)) AS Precio_Promedio,
            CAST(SUM(I.Quantity * O.AvgPrice) / NULLIF(SUM(I.Quantity), 0) AS DECIMAL(18,2)) AS Costo_Promedio,
            CAST(SUM(I.LineTotal - (I.Quantity * O.AvgPrice)) AS DECIMAL(18,2)) AS Margen_Absoluto,
            CAST((SUM(I.LineTotal - (I.Quantity * O.AvgPrice)) * 100.0) / NULLIF(SUM(I.LineTotal), 0) AS DECIMAL(5,2)) AS Margen_Porcentaje,
            CAST((SUM(I.LineTotal) - SUM(I.Quantity * O.AvgPrice)) / NULLIF(SUM(I.Quantity), 0) AS DECIMAL(18,2)) AS Margen_Unitario
        FROM INV1 I
        INNER JOIN OITM O ON I.ItemCode = O.ItemCode
        LEFT JOIN [@PRIMER_NIVEL] PN ON O.U_PRIMER_NIVEL = PN.Code
        INNER JOIN OINV T0 ON I.DocEntry = T0.DocEntry
        WHERE 
            T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
            AND T0.CANCELED = 'N'
            AND O.AvgPrice > 0
            AND (@PrimerNivelParam IS NULL OR O.U_PRIMER_NIVEL = @PrimerNivelParam)
            AND (
                @CanalParam IS NULL
                OR (
                    (@CanalParam = 'Meli' AND ((I.WhsCode IN ('03', '05') AND T0.SlpCode IN (426, 364, 355))
                        OR (I.WhsCode = '01' AND T0.SlpCode IN (355, 398)) ))
                    OR (@CanalParam = 'Falabella' AND I.WhsCode = '03' AND T0.SlpCode = 371)
                    OR (@CanalParam = 'Balmaceda' AND I.WhsCode = '07')
                    OR (@CanalParam = 'Vitex' AND I.WhsCode = '01' AND T0.SlpCode IN (401, 397))
                    OR (@CanalParam = 'Chorrillo' AND I.WhsCode = '01' 
                        AND I.SlpCode NOT IN (401, 397, 355, 398, 227, 250, 205, 138, 209, 228, 226, 137, 212))
                    OR (@CanalParam = 'Empresas' AND I.WhsCode = '01' 
                        AND I.SlpCode IN (227, 250, 205, 138, 209, 228, 226, 137, 212))
                )
            )
            AND (@VendedorParam IS NULL OR T0.SlpCode = @VendedorParam)
        GROUP BY I.ItemCode, O.ItemName, O.U_Imagen
        ORDER BY Margen_Absoluto DESC;
      `;
  
      const request = pool.request();
      request.input("CanalParamInput", sql.VarChar, canal);
      request.input("VendedorParamInput", sql.Int, vendedor);
      request.input("PrimerNivelInput", sql.NVarChar, primerNivel);
      request.input("PeriodoInput", sql.VarChar, periodo);
      request.input("FechaInicioInput", sql.Date, fechaInicio);
      request.input("FechaFinInput", sql.Date, fechaFin);
  
      const result = await request.query(query);
      res.json(result.recordset || []);
    } catch (error) {
      console.error("❌ Error al obtener top rentables por primer nivel:", error);
      res.status(500).json({ error: "Error en el servidor." });
    }
  };

module.exports = {obtenerVentasPorPrimerNivel, obtenerMargenPorPrimerNivel, obtenerCantidadVentasPorPrimerNivel,
     obtenerNotasCreditoPorPrimerNivel,obtenerItemsVendidosPorPrimerNivel, obtenerUnidadesVendidasPorPrimerNivel,
     obtenerVentasPorFechaYPrimerNivel, obtenerVentasCanalPorPrimerNivel, obtenerCategoriasMasVendidasPorPrimerNivel,
     obtenerTopRentablesPrimerNivel
};