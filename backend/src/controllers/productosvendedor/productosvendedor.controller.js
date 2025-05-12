const sql = require("mssql");
const { poolPromise } = require('../../models/db');

//VENTAS TOTALES VENDEDOR & PRODUCTOS
const obtenerVentasProductoComparado = async (req, res) => {
    try {
      const pool = await poolPromise;
  
      const canal = req.query.canal || null;
      const vendedor = req.query.vendedorEmpresa || null;
      const itemCode = req.query.itemCode || null;
      const periodo = req.query.periodo || "7D";
      const fechaInicio = req.query.fechaInicio || null;
      const fechaFin = req.query.fechaFin || null;
      const modoComparacion = req.query.modoComparacion || "PeriodoAnterior";
      const fechaInicioAnterior = req.query.fechaInicioAnterior || null;
      const fechaFinAnterior = req.query.fechaFinAnterior || null;
  
      const query = `
        DECLARE @CanalParam VARCHAR(50) = @CanalParamInput;
        DECLARE @VendedorEmpresaParam INT = @VendedorEmpresaParamInput;
        DECLARE @Periodo VARCHAR(10) = @PeriodoInput;
        DECLARE @FechaInicioCustom DATE = @FechaInicioInput;
        DECLARE @FechaFinCustom DATE = @FechaFinInput;
        DECLARE @ItemCodeParam VARCHAR(50) = @ItemCodeInput;
        DECLARE @ModoComparacion VARCHAR(30) = @ModoComparacionInput;
        DECLARE @FechaInicioAnteriorCustom DATE = @FechaInicioAnteriorInput;
        DECLARE @FechaFinAnteriorCustom DATE = @FechaFinAnteriorInput;
  
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
                    WHEN @Periodo = '1M'  THEN DATEADD(MONTH, DATEDIFF(MONTH, 0, @FechaFinActual), 0)
                    WHEN @Periodo = '3M'  THEN DATEADD(MONTH, -3, @FechaFinActual)
                    WHEN @Periodo = '6M'  THEN DATEADD(MONTH, -6, @FechaFinActual)
                    WHEN @Periodo = '1A'  THEN DATEADD(YEAR, -1, @FechaFinActual)
                    ELSE @FechaFinActual
                END;
        END
  
        IF @ModoComparacion = 'PeriodoAnterior'
        BEGIN
            DECLARE @Dias INT = DATEDIFF(DAY, @FechaInicioActual, @FechaFinActual) + 1;
            SET @FechaFinAnterior = DATEADD(DAY, -1, @FechaInicioActual);
            SET @FechaInicioAnterior = DATEADD(DAY, -@Dias, @FechaInicioActual);
        END
        ELSE IF @ModoComparacion = 'MismoPeriodoAnoAnterior'
        BEGIN
            SET @FechaInicioAnterior = DATEADD(YEAR, -1, @FechaInicioActual);
            SET @FechaFinAnterior = DATEADD(YEAR, -1, @FechaFinActual);
        END
        ELSE IF @ModoComparacion = 'Custom' AND @FechaInicioAnteriorCustom IS NOT NULL AND @FechaFinAnteriorCustom IS NOT NULL
        BEGIN
            SET @FechaInicioAnterior = @FechaInicioAnteriorCustom;
            SET @FechaFinAnterior = @FechaFinAnteriorCustom;
        END
  
        ;WITH VentasPeriodo AS (
            SELECT CAST(SUM(T1.LineTotal) AS DECIMAL(18, 2)) AS TotalVentasPeriodo
            FROM [dbo].[OINV] T0
            INNER JOIN [dbo].[INV1] T1 ON T0.DocEntry = T1.DocEntry
            WHERE 
                T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
                AND T0.CANCELED = 'N'
                AND (@ItemCodeParam IS NULL OR T1.ItemCode = @ItemCodeParam)
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
            SELECT CAST(SUM(T1.LineTotal) AS DECIMAL(18, 2)) AS TotalVentasAnterior
            FROM [dbo].[OINV] T0
            INNER JOIN [dbo].[INV1] T1 ON T0.DocEntry = T1.DocEntry
            WHERE 
                T0.DocDate BETWEEN @FechaInicioAnterior AND @FechaFinAnterior
                AND T0.CANCELED = 'N'
                AND (@ItemCodeParam IS NULL OR T1.ItemCode = @ItemCodeParam)
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
      request.input("VendedorEmpresaParamInput", sql.Int, vendedor);
      request.input("PeriodoInput", sql.VarChar, periodo);
      request.input("FechaInicioInput", sql.Date, fechaInicio);
      request.input("FechaFinInput", sql.Date, fechaFin);
      request.input("ItemCodeInput", sql.VarChar, itemCode);
      request.input("ModoComparacionInput", sql.VarChar, modoComparacion);
      request.input("FechaInicioAnteriorInput", sql.Date, fechaInicioAnterior);
      request.input("FechaFinAnteriorInput", sql.Date, fechaFinAnterior);
  
      const result = await request.query(query);
      res.json(result.recordset || []);
    } catch (error) {
      console.error("❌ Error al obtener ventas comparadas:", error);
      res.status(500).json({ error: "Error en el servidor." });
    }
  };
  
//Margen PRODUCTO/VENDEDOR
const obtenerMargenProductoComparado = async (req, res) => {
    try {
      const pool = await poolPromise;
  
      const canal = req.query.canal || null;
      const vendedor = req.query.vendedorEmpresa || null;
      const itemCode = req.query.itemCode || null;
      const periodo = req.query.periodo || "7D";
      const fechaInicio = req.query.fechaInicio || null;
      const fechaFin = req.query.fechaFin || null;
      const modoComparacion = req.query.modoComparacion || "PeriodoAnterior";
      const fechaInicioAnterior = req.query.fechaInicioAnterior || null;
      const fechaFinAnterior = req.query.fechaFinAnterior || null;
  
      const query = `
        DECLARE @CanalParam VARCHAR(50) = @CanalParamInput;
        DECLARE @VendedorEmpresaParam INT = @VendedorEmpresaParamInput;
        DECLARE @Periodo VARCHAR(10) = @PeriodoInput;
        DECLARE @FechaInicioCustom DATE = @FechaInicioInput;
        DECLARE @FechaFinCustom DATE = @FechaFinInput;
        DECLARE @ItemCodeParam VARCHAR(50) = @ItemCodeInput;
        DECLARE @ModoComparacion VARCHAR(30) = @ModoComparacionInput;
        DECLARE @FechaInicioAnteriorCustom DATE = @FechaInicioAnteriorInput;
        DECLARE @FechaFinAnteriorCustom DATE = @FechaFinAnteriorInput;
  
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
                    WHEN @Periodo = '1M'  THEN DATEADD(MONTH, DATEDIFF(MONTH, 0, @FechaFinActual), 0)
                    WHEN @Periodo = '3M'  THEN DATEADD(MONTH, -3, @FechaFinActual)
                    WHEN @Periodo = '6M'  THEN DATEADD(MONTH, -6, @FechaFinActual)
                    WHEN @Periodo = '1A'  THEN DATEADD(YEAR, -1, @FechaFinActual)
                    ELSE @FechaFinActual
                END;
        END
  
        IF @ModoComparacion = 'PeriodoAnterior'
        BEGIN
            DECLARE @Dias INT = DATEDIFF(DAY, @FechaInicioActual, @FechaFinActual) + 1;
            SET @FechaFinAnterior = DATEADD(DAY, -1, @FechaInicioActual);
            SET @FechaInicioAnterior = DATEADD(DAY, -@Dias, @FechaInicioActual);
        END
        ELSE IF @ModoComparacion = 'MismoPeriodoAnoAnterior'
        BEGIN
            SET @FechaInicioAnterior = DATEADD(YEAR, -1, @FechaInicioActual);
            SET @FechaFinAnterior = DATEADD(YEAR, -1, @FechaFinActual);
        END
        ELSE IF @ModoComparacion = 'Custom' AND @FechaInicioAnteriorCustom IS NOT NULL AND @FechaFinAnteriorCustom IS NOT NULL
        BEGIN
            SET @FechaInicioAnterior = @FechaInicioAnteriorCustom;
            SET @FechaFinAnterior = @FechaFinAnteriorCustom;
        END
  
        ;WITH MargenBrutoPeriodo AS (
            SELECT 
                CAST(SUM(T1.LineTotal) AS DECIMAL(18, 2)) AS TotalVentasPeriodo,
                CAST(SUM(T1.StockPrice * T1.Quantity) AS DECIMAL(18, 2)) AS CostoTotalPeriodo
            FROM [dbo].[OINV] T0
            INNER JOIN [dbo].[INV1] T1 ON T0.DocEntry = T1.DocEntry
            WHERE 
                T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
                AND T0.CANCELED = 'N'
                AND (@ItemCodeParam IS NULL OR T1.ItemCode = @ItemCodeParam)
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
        MargenBrutoAnterior AS (
            SELECT 
                CAST(SUM(T1.LineTotal) AS DECIMAL(18, 2)) AS TotalVentasAnterior,
                CAST(SUM(T1.StockPrice * T1.Quantity) AS DECIMAL(18, 2)) AS CostoTotalAnterior
            FROM [dbo].[OINV] T0
            INNER JOIN [dbo].[INV1] T1 ON T0.DocEntry = T1.DocEntry
            WHERE 
                T0.DocDate BETWEEN @FechaInicioAnterior AND @FechaFinAnterior
                AND T0.CANCELED = 'N'
                AND (@ItemCodeParam IS NULL OR T1.ItemCode = @ItemCodeParam)
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
            (MBP.TotalVentasPeriodo - MBP.CostoTotalPeriodo) AS MargenBrutoPeriodo,
            MBA.TotalVentasAnterior,
            (MBA.TotalVentasAnterior - MBA.CostoTotalAnterior) AS MargenBrutoAnterior,
            CASE 
                WHEN MBA.TotalVentasAnterior = 0 THEN NULL
                ELSE CAST(((MBP.TotalVentasPeriodo - MBA.TotalVentasAnterior) * 100.0 / MBA.TotalVentasAnterior) AS DECIMAL(18, 2))
            END AS PorcentajeCambio
        FROM MargenBrutoPeriodo MBP, MargenBrutoAnterior MBA;
      `;
  
      const request = pool.request();
      request.input("CanalParamInput", sql.VarChar, canal);
      request.input("VendedorEmpresaParamInput", sql.Int, vendedor);
      request.input("PeriodoInput", sql.VarChar, periodo);
      request.input("FechaInicioInput", sql.Date, fechaInicio);
      request.input("FechaFinInput", sql.Date, fechaFin);
      request.input("ItemCodeInput", sql.VarChar, itemCode);
      request.input("ModoComparacionInput", sql.VarChar, modoComparacion);
      request.input("FechaInicioAnteriorInput", sql.Date, fechaInicioAnterior);
      request.input("FechaFinAnteriorInput", sql.Date, fechaFinAnterior);
  
      const result = await request.query(query);
      res.json(result.recordset || []);
    } catch (error) {
      console.error("❌ Error al obtener margen comparado:", error);
      res.status(500).json({ error: "Error en el servidor." });
    }
  };
  //UNIDADES VENDIDO PRODUCTO/VENDEDOR
  const obtenerUnidadesVendidasComparado = async (req, res) => {
    try {
      const pool = await poolPromise;
  
      const canal = req.query.canal || null;
      const vendedor = req.query.vendedorEmpresa || null;
      const itemCode = req.query.itemCode || null;
      const periodo = req.query.periodo || "7D";
      const fechaInicio = req.query.fechaInicio || null;
      const fechaFin = req.query.fechaFin || null;
      const modoComparacion = req.query.modoComparacion || "PeriodoAnterior";
      const fechaInicioAnterior = req.query.fechaInicioAnterior || null;
      const fechaFinAnterior = req.query.fechaFinAnterior || null;
  
      const query = `
        DECLARE @CanalParam VARCHAR(50) = @CanalParamInput;
        DECLARE @VendedorEmpresaParam INT = @VendedorEmpresaParamInput;
        DECLARE @Periodo VARCHAR(10) = @PeriodoInput;
        DECLARE @FechaInicioCustom DATE = @FechaInicioInput;
        DECLARE @FechaFinCustom DATE = @FechaFinInput;
        DECLARE @ItemCodeParam VARCHAR(50) = @ItemCodeInput;
        DECLARE @ModoComparacion VARCHAR(30) = @ModoComparacionInput;
        DECLARE @FechaInicioAnteriorCustom DATE = @FechaInicioAnteriorInput;
        DECLARE @FechaFinAnteriorCustom DATE = @FechaFinAnteriorInput;
  
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
                    WHEN @Periodo = '1M'  THEN DATEADD(MONTH, DATEDIFF(MONTH, 0, @FechaFinActual), 0)
                    WHEN @Periodo = '3M'  THEN DATEADD(MONTH, -3, @FechaFinActual)
                    WHEN @Periodo = '6M'  THEN DATEADD(MONTH, -6, @FechaFinActual)
                    WHEN @Periodo = '1A'  THEN DATEADD(YEAR, -1, @FechaFinActual)
                    ELSE @FechaFinActual
                END;
        END
  
        IF @ModoComparacion = 'PeriodoAnterior'
        BEGIN
            DECLARE @Dias INT = DATEDIFF(DAY, @FechaInicioActual, @FechaFinActual) + 1;
            SET @FechaFinAnterior = DATEADD(DAY, -1, @FechaInicioActual);
            SET @FechaInicioAnterior = DATEADD(DAY, -@Dias, @FechaInicioActual);
        END
        ELSE IF @ModoComparacion = 'MismoPeriodoAnoAnterior'
        BEGIN
            SET @FechaInicioAnterior = DATEADD(YEAR, -1, @FechaInicioActual);
            SET @FechaFinAnterior = DATEADD(YEAR, -1, @FechaFinActual);
        END
        ELSE IF @ModoComparacion = 'Custom' AND @FechaInicioAnteriorCustom IS NOT NULL AND @FechaFinAnteriorCustom IS NOT NULL
        BEGIN
            SET @FechaInicioAnterior = @FechaInicioAnteriorCustom;
            SET @FechaFinAnterior = @FechaFinAnteriorCustom;
        END
  
        ;WITH UnidadesVendidasPeriodo AS (
            SELECT 
                CAST(SUM(T1.Quantity) AS INT) AS CantidadVendida
            FROM [dbo].[OINV] T0
            INNER JOIN [dbo].[INV1] T1 ON T0.DocEntry = T1.DocEntry
            WHERE 
                T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
                AND T0.CANCELED = 'N'
                AND (@ItemCodeParam IS NULL OR T1.ItemCode = @ItemCodeParam)
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
        UnidadesVendidasAnterior AS (
            SELECT 
                CAST(SUM(T1.Quantity) AS INT) AS CantidadVendidaAnterior
            FROM [dbo].[OINV] T0
            INNER JOIN [dbo].[INV1] T1 ON T0.DocEntry = T1.DocEntry
            WHERE 
                T0.DocDate BETWEEN @FechaInicioAnterior AND @FechaFinAnterior
                AND T0.CANCELED = 'N'
                AND (@ItemCodeParam IS NULL OR T1.ItemCode = @ItemCodeParam)
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
            UVP.CantidadVendida,
            UVA.CantidadVendidaAnterior,
            CASE 
                WHEN UVA.CantidadVendidaAnterior = 0 THEN NULL
                ELSE CAST(((UVP.CantidadVendida - UVA.CantidadVendidaAnterior) * 100.0 / UVA.CantidadVendidaAnterior) AS DECIMAL(18, 2))
            END AS PorcentajeCambio
        FROM UnidadesVendidasPeriodo UVP, UnidadesVendidasAnterior UVA;
      `;
  
      const request = pool.request();
      request.input("CanalParamInput", sql.VarChar, canal);
      request.input("VendedorEmpresaParamInput", sql.Int, vendedor);
      request.input("PeriodoInput", sql.VarChar, periodo);
      request.input("FechaInicioInput", sql.Date, fechaInicio);
      request.input("FechaFinInput", sql.Date, fechaFin);
      request.input("ItemCodeInput", sql.VarChar, itemCode);
      request.input("ModoComparacionInput", sql.VarChar, modoComparacion);
      request.input("FechaInicioAnteriorInput", sql.Date, fechaInicioAnterior);
      request.input("FechaFinAnteriorInput", sql.Date, fechaFinAnterior);
  
      const result = await request.query(query);
      res.json(result.recordset || []);
    } catch (error) {
      console.error("❌ Error al obtener unidades vendidas comparadas:", error);
      res.status(500).json({ error: "Error en el servidor." });
    }
  };
  //TRANSACCIONES PRODUCTO/VENDEDOR
  const obtenerTransaccionesComparado = async (req, res) => {
    try {
      const pool = await poolPromise;
  
      const canal = req.query.canal || null;
      const vendedor = req.query.vendedorEmpresa || null;
      const itemCode = req.query.itemCode || null;
      const periodo = req.query.periodo || "7D";
      const fechaInicio = req.query.fechaInicio || null;
      const fechaFin = req.query.fechaFin || null;
      const modoComparacion = req.query.modoComparacion || "PeriodoAnterior";
      const fechaInicioAnterior = req.query.fechaInicioAnterior || null;
      const fechaFinAnterior = req.query.fechaFinAnterior || null;
  
      const query = `
        DECLARE @CanalParam VARCHAR(50) = @CanalParamInput;
        DECLARE @VendedorEmpresaParam INT = @VendedorEmpresaParamInput;
        DECLARE @Periodo VARCHAR(10) = @PeriodoInput;
        DECLARE @FechaInicioCustom DATE = @FechaInicioInput;
        DECLARE @FechaFinCustom DATE = @FechaFinInput;
        DECLARE @ItemCodeParam VARCHAR(50) = @ItemCodeInput;
        DECLARE @ModoComparacion VARCHAR(30) = @ModoComparacionInput;
        DECLARE @FechaInicioAnteriorCustom DATE = @FechaInicioAnteriorInput;
        DECLARE @FechaFinAnteriorCustom DATE = @FechaFinAnteriorInput;
  
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
                    WHEN @Periodo = '1M'  THEN DATEADD(MONTH, DATEDIFF(MONTH, 0, @FechaFinActual), 0)
                    WHEN @Periodo = '3M'  THEN DATEADD(MONTH, -3, @FechaFinActual)
                    WHEN @Periodo = '6M'  THEN DATEADD(MONTH, -6, @FechaFinActual)
                    WHEN @Periodo = '1A'  THEN DATEADD(YEAR, -1, @FechaFinActual)
                    ELSE @FechaFinActual
                END;
        END
  
        IF @ModoComparacion = 'PeriodoAnterior'
        BEGIN
            DECLARE @Dias INT = DATEDIFF(DAY, @FechaInicioActual, @FechaFinActual) + 1;
            SET @FechaFinAnterior = DATEADD(DAY, -1, @FechaInicioActual);
            SET @FechaInicioAnterior = DATEADD(DAY, -@Dias, @FechaInicioActual);
        END
        ELSE IF @ModoComparacion = 'MismoPeriodoAnoAnterior'
        BEGIN
            SET @FechaInicioAnterior = DATEADD(YEAR, -1, @FechaInicioActual);
            SET @FechaFinAnterior = DATEADD(YEAR, -1, @FechaFinActual);
        END
        ELSE IF @ModoComparacion = 'Custom' AND @FechaInicioAnteriorCustom IS NOT NULL AND @FechaFinAnteriorCustom IS NOT NULL
        BEGIN
            SET @FechaInicioAnterior = @FechaInicioAnteriorCustom;
            SET @FechaFinAnterior = @FechaFinAnteriorCustom;
        END
  
        ;WITH TransaccionesPeriodo AS (
            SELECT COUNT(DISTINCT T0.DocEntry) AS CantidadTransacciones
            FROM [dbo].[OINV] T0
            INNER JOIN [dbo].[INV1] T1 ON T0.DocEntry = T1.DocEntry
            WHERE 
                T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
                AND T0.CANCELED = 'N'
                AND (@ItemCodeParam IS NULL OR T1.ItemCode = @ItemCodeParam)
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
            WHERE 
                T0.DocDate BETWEEN @FechaInicioAnterior AND @FechaFinAnterior
                AND T0.CANCELED = 'N'
                AND (@ItemCodeParam IS NULL OR T1.ItemCode = @ItemCodeParam)
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
      request.input("VendedorEmpresaParamInput", sql.Int, vendedor);
      request.input("PeriodoInput", sql.VarChar, periodo);
      request.input("FechaInicioInput", sql.Date, fechaInicio);
      request.input("FechaFinInput", sql.Date, fechaFin);
      request.input("ItemCodeInput", sql.VarChar, itemCode);
      request.input("ModoComparacionInput", sql.VarChar, modoComparacion);
      request.input("FechaInicioAnteriorInput", sql.Date, fechaInicioAnterior);
      request.input("FechaFinAnteriorInput", sql.Date, fechaFinAnterior);
  
      const result = await request.query(query);
      res.json(result.recordset || []);
    } catch (error) {
      console.error("❌ Error al obtener transacciones comparadas:", error);
      res.status(500).json({ error: "Error en el servidor." });
    }
  };
  //ITEMS VENDIDIDOS VENDEDOR
  const obtenerProductosDistintosComparado = async (req, res) => {
    try {
      const pool = await poolPromise;
  
      const canal = req.query.canal || null;
      const vendedor = req.query.vendedorEmpresa || null;
      const itemCode = req.query.itemCode || null;
      const periodo = req.query.periodo || "7D";
      const fechaInicio = req.query.fechaInicio || null;
      const fechaFin = req.query.fechaFin || null;
      const modoComparacion = req.query.modoComparacion || "PeriodoAnterior";
      const fechaInicioAnterior = req.query.fechaInicioAnterior || null;
      const fechaFinAnterior = req.query.fechaFinAnterior || null;
  
      const query = `
        DECLARE @CanalParam VARCHAR(50) = @CanalParamInput;
        DECLARE @VendedorEmpresaParam INT = @VendedorEmpresaParamInput;
        DECLARE @Periodo VARCHAR(10) = @PeriodoInput;
        DECLARE @FechaInicioCustom DATE = @FechaInicioInput;
        DECLARE @FechaFinCustom DATE = @FechaFinInput;
        DECLARE @ItemCodeParam VARCHAR(50) = @ItemCodeInput;
        DECLARE @ModoComparacion VARCHAR(30) = @ModoComparacionInput;
        DECLARE @FechaInicioAnteriorCustom DATE = @FechaInicioAnteriorInput;
        DECLARE @FechaFinAnteriorCustom DATE = @FechaFinAnteriorInput;
  
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
                    WHEN @Periodo = '1M'  THEN DATEADD(MONTH, DATEDIFF(MONTH, 0, @FechaFinActual), 0)
                    WHEN @Periodo = '3M'  THEN DATEADD(MONTH, -3, @FechaFinActual)
                    WHEN @Periodo = '6M'  THEN DATEADD(MONTH, -6, @FechaFinActual)
                    WHEN @Periodo = '1A'  THEN DATEADD(YEAR, -1, @FechaFinActual)
                    ELSE @FechaFinActual
                END;
        END
  
        IF @ModoComparacion = 'PeriodoAnterior'
        BEGIN
            DECLARE @Dias INT = DATEDIFF(DAY, @FechaInicioActual, @FechaFinActual) + 1;
            SET @FechaFinAnterior = DATEADD(DAY, -1, @FechaInicioActual);
            SET @FechaInicioAnterior = DATEADD(DAY, -@Dias, @FechaInicioActual);
        END
        ELSE IF @ModoComparacion = 'MismoPeriodoAnoAnterior'
        BEGIN
            SET @FechaInicioAnterior = DATEADD(YEAR, -1, @FechaInicioActual);
            SET @FechaFinAnterior = DATEADD(YEAR, -1, @FechaFinActual);
        END
        ELSE IF @ModoComparacion = 'Custom' AND @FechaInicioAnteriorCustom IS NOT NULL AND @FechaFinAnteriorCustom IS NOT NULL
        BEGIN
            SET @FechaInicioAnterior = @FechaInicioAnteriorCustom;
            SET @FechaFinAnterior = @FechaFinAnteriorCustom;
        END
  
        ;WITH ProductosPeriodo AS (
            SELECT COUNT(DISTINCT T1.ItemCode) AS ProductosDistintosVendidos
            FROM [dbo].[OINV] T0
            INNER JOIN [dbo].[INV1] T1 ON T0.DocEntry = T1.DocEntry
            WHERE 
                T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
                AND T0.CANCELED = 'N'
                AND (@ItemCodeParam IS NULL OR T1.ItemCode = @ItemCodeParam)
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
        ProductosAnterior AS (
            SELECT COUNT(DISTINCT T1.ItemCode) AS ProductosDistintosVendidosAnterior
            FROM [dbo].[OINV] T0
            INNER JOIN [dbo].[INV1] T1 ON T0.DocEntry = T1.DocEntry
            WHERE 
                T0.DocDate BETWEEN @FechaInicioAnterior AND @FechaFinAnterior
                AND T0.CANCELED = 'N'
                AND (@ItemCodeParam IS NULL OR T1.ItemCode = @ItemCodeParam)
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
      request.input("VendedorEmpresaParamInput", sql.Int, vendedor);
      request.input("PeriodoInput", sql.VarChar, periodo);
      request.input("FechaInicioInput", sql.Date, fechaInicio);
      request.input("FechaFinInput", sql.Date, fechaFin);
      request.input("ItemCodeInput", sql.VarChar, itemCode);
      request.input("ModoComparacionInput", sql.VarChar, modoComparacion);
      request.input("FechaInicioAnteriorInput", sql.Date, fechaInicioAnterior);
      request.input("FechaFinAnteriorInput", sql.Date, fechaFinAnterior);
  
      const result = await request.query(query);
      res.json(result.recordset || []);
    } catch (error) {
      console.error("❌ Error al obtener productos distintos vendidos:", error);
      res.status(500).json({ error: "Error en el servidor." });
    }
  };
  //PROMEDIO POR TICKET PRODUCTOS
  const obtenerTicketPromedioComparado = async (req, res) => {
    try {
      const pool = await poolPromise;
  
      const canal = req.query.canal || null;
      const vendedor = req.query.vendedorEmpresa || null;
      const itemCode = req.query.itemCode || null;
      const periodo = req.query.periodo || "7D";
      const fechaInicio = req.query.fechaInicio || null;
      const fechaFin = req.query.fechaFin || null;
      const modoComparacion = req.query.modoComparacion || "PeriodoAnterior";
      const fechaInicioAnterior = req.query.fechaInicioAnterior || null;
      const fechaFinAnterior = req.query.fechaFinAnterior || null;
  
      const query = `
        DECLARE @CanalParam VARCHAR(50) = @CanalParamInput;
        DECLARE @VendedorEmpresaParam INT = @VendedorEmpresaParamInput;
        DECLARE @Periodo VARCHAR(10) = @PeriodoInput;
        DECLARE @FechaInicioCustom DATE = @FechaInicioInput;
        DECLARE @FechaFinCustom DATE = @FechaFinInput;
        DECLARE @ItemCodeParam VARCHAR(50) = @ItemCodeInput;
        DECLARE @ModoComparacion VARCHAR(30) = @ModoComparacionInput;
        DECLARE @FechaInicioAnteriorCustom DATE = @FechaInicioAnteriorInput;
        DECLARE @FechaFinAnteriorCustom DATE = @FechaFinAnteriorInput;
  
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
                    WHEN @Periodo = '1M'  THEN DATEADD(MONTH, DATEDIFF(MONTH, 0, @FechaFinActual), 0)
                    WHEN @Periodo = '3M'  THEN DATEADD(MONTH, -3, @FechaFinActual)
                    WHEN @Periodo = '6M'  THEN DATEADD(MONTH, -6, @FechaFinActual)
                    WHEN @Periodo = '1A'  THEN DATEADD(YEAR, -1, @FechaFinActual)
                    ELSE @FechaFinActual
                END;
        END
  
        IF @ModoComparacion = 'PeriodoAnterior'
        BEGIN
            DECLARE @Dias INT = DATEDIFF(DAY, @FechaInicioActual, @FechaFinActual) + 1;
            SET @FechaFinAnterior = DATEADD(DAY, -1, @FechaInicioActual);
            SET @FechaInicioAnterior = DATEADD(DAY, -@Dias, @FechaInicioActual);
        END
        ELSE IF @ModoComparacion = 'MismoPeriodoAnoAnterior'
        BEGIN
            SET @FechaInicioAnterior = DATEADD(YEAR, -1, @FechaInicioActual);
            SET @FechaFinAnterior = DATEADD(YEAR, -1, @FechaFinActual);
        END
        ELSE IF @ModoComparacion = 'Custom'
        BEGIN
            SET @FechaInicioAnterior = @FechaInicioAnteriorCustom;
            SET @FechaFinAnterior = @FechaFinAnteriorCustom;
        END
  
        ;WITH TicketActual AS (
            SELECT 
                CAST(SUM(T1.LineTotal) AS DECIMAL(18,2)) AS TotalVentas,
                COUNT(DISTINCT T0.DocEntry) AS Transacciones
            FROM OINV T0
            INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
            WHERE 
                T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
                AND T0.CANCELED = 'N'
                AND (@ItemCodeParam IS NULL OR T1.ItemCode = @ItemCodeParam)
                AND (
                    @CanalParam IS NULL OR (
                        (@CanalParam = 'Meli' AND ((T1.WhsCode IN ('03','05') AND T0.SlpCode IN (426,364,355)) OR (T1.WhsCode = '01' AND T0.SlpCode IN (355,398))))
                        OR (@CanalParam = 'Falabella' AND T1.WhsCode = '03' AND T0.SlpCode = 371)
                        OR (@CanalParam = 'Balmaceda' AND T1.WhsCode = '07')
                        OR (@CanalParam = 'Vitex' AND T1.WhsCode = '01' AND T0.SlpCode IN (401,397))
                        OR (@CanalParam = 'Chorrillo' AND T1.WhsCode = '01' AND T1.SlpCode NOT IN (401,397,355,398,227,250,205,138,209,228,226,137,212))
                        OR (@CanalParam = 'Empresas' AND T1.WhsCode = '01' AND T1.SlpCode IN (227,250,205,138,209,228,226,137,212))
                    )
                )
                AND (@VendedorEmpresaParam IS NULL OR T1.SlpCode = @VendedorEmpresaParam)
        ),
        TicketAnterior AS (
            SELECT 
                CAST(SUM(T1.LineTotal) AS DECIMAL(18,2)) AS TotalVentasAnterior,
                COUNT(DISTINCT T0.DocEntry) AS TransaccionesAnterior
            FROM OINV T0
            INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
            WHERE 
                T0.DocDate BETWEEN @FechaInicioAnterior AND @FechaFinAnterior
                AND T0.CANCELED = 'N'
                AND (@ItemCodeParam IS NULL OR T1.ItemCode = @ItemCodeParam)
                AND (
                    @CanalParam IS NULL OR (
                        (@CanalParam = 'Meli' AND ((T1.WhsCode IN ('03','05') AND T0.SlpCode IN (426,364,355)) OR (T1.WhsCode = '01' AND T0.SlpCode IN (355,398))))
                        OR (@CanalParam = 'Falabella' AND T1.WhsCode = '03' AND T0.SlpCode = 371)
                        OR (@CanalParam = 'Balmaceda' AND T1.WhsCode = '07')
                        OR (@CanalParam = 'Vitex' AND T1.WhsCode = '01' AND T0.SlpCode IN (401,397))
                        OR (@CanalParam = 'Chorrillo' AND T1.WhsCode = '01' AND T1.SlpCode NOT IN (401,397,355,398,227,250,205,138,209,228,226,137,212))
                        OR (@CanalParam = 'Empresas' AND T1.WhsCode = '01' AND T1.SlpCode IN (227,250,205,138,209,228,226,137,212))
                    )
                )
                AND (@VendedorEmpresaParam IS NULL OR T1.SlpCode = @VendedorEmpresaParam)
        )
  
        SELECT 
            CAST(TA.TotalVentas / NULLIF(TA.Transacciones, 0) AS DECIMAL(18, 2)) AS PromedioPorTicket,
            CAST(TB.TotalVentasAnterior / NULLIF(TB.TransaccionesAnterior, 0) AS DECIMAL(18, 2)) AS PromedioAnterior,
            CASE 
                WHEN TB.TransaccionesAnterior = 0 THEN NULL
                ELSE CAST((
                    (TA.TotalVentas / NULLIF(TA.Transacciones, 0)) - 
                    (TB.TotalVentasAnterior / NULLIF(TB.TransaccionesAnterior, 0))
                ) * 100.0 / NULLIF((TB.TotalVentasAnterior / NULLIF(TB.TransaccionesAnterior, 0)), 0) AS DECIMAL(18,2))
            END AS PorcentajeCambio
        FROM TicketActual TA, TicketAnterior TB;
      `;
  
      const request = pool.request();
      request.input("CanalParamInput", sql.VarChar, canal);
      request.input("VendedorEmpresaParamInput", sql.Int, vendedor);
      request.input("PeriodoInput", sql.VarChar, periodo);
      request.input("FechaInicioInput", sql.Date, fechaInicio);
      request.input("FechaFinInput", sql.Date, fechaFin);
      request.input("ItemCodeInput", sql.VarChar, itemCode);
      request.input("ModoComparacionInput", sql.VarChar, modoComparacion);
      request.input("FechaInicioAnteriorInput", sql.Date, fechaInicioAnterior);
      request.input("FechaFinAnteriorInput", sql.Date, fechaFinAnterior);
  
      const result = await request.query(query);
      res.json(result.recordset || []);
    } catch (error) {
      console.error("❌ Error al obtener ticket promedio comparado:", error);
      res.status(500).json({ error: "Error en el servidor." });
    }
  };
  //NOTAS DE CREDITO PRODUCTO/VENDEDOR
  const obtenerNotasCreditoComparadopv = async (req, res) => {
    try {
      const pool = await poolPromise;
  
      const canal = req.query.canal || null;
      const vendedor = req.query.vendedorEmpresa || null;
      const itemCode = req.query.itemCode || null;
      const periodo = req.query.periodo || "7D";
      const fechaInicio = req.query.fechaInicio || null;
      const fechaFin = req.query.fechaFin || null;
      const modoComparacion = req.query.modoComparacion || "PeriodoAnterior";
      const fechaInicioAnterior = req.query.fechaInicioAnterior || null;
      const fechaFinAnterior = req.query.fechaFinAnterior || null;
  
      const query = `
        
        DECLARE @CanalParam VARCHAR(50) = @CanalParamInput;
        DECLARE @VendedorEmpresaParam INT = @VendedorEmpresaParamInput;
        DECLARE @Periodo VARCHAR(10) = @PeriodoInput;
        DECLARE @FechaInicioCustom DATE = @FechaInicioInput;
        DECLARE @FechaFinCustom DATE = @FechaFinInput;
        DECLARE @ItemCodeParam VARCHAR(50) = @ItemCodeInput;
        DECLARE @ModoComparacion VARCHAR(30) = @ModoComparacionInput;
        DECLARE @FechaInicioAnteriorCustom DATE = @FechaInicioAnteriorInput;
        DECLARE @FechaFinAnteriorCustom DATE = @FechaFinAnteriorInput;
  
        DECLARE @FechaInicioActual DATE, @FechaFinActual DATE;
        DECLARE @FechaInicioAnterior DATE, @FechaFinAnterior DATE;

        -- Definir fechas actuales
        IF @FechaInicioInput IS NOT NULL AND @FechaFinInput IS NOT NULL
        BEGIN
        SET @FechaInicioActual = @FechaInicioInput;
        SET @FechaFinActual = @FechaFinInput;
        END
        ELSE
        BEGIN
        SET @FechaFinActual = CAST(GETDATE() AS DATE);
        SET @FechaInicioActual =
            CASE 
            WHEN @Periodo = '1D' THEN @FechaFinActual
            WHEN @Periodo = '7D' THEN DATEADD(DAY, -6, @FechaFinActual)
            WHEN @Periodo = '14D' THEN DATEADD(DAY, -13, @FechaFinActual)
            WHEN @Periodo = '1M' THEN DATEADD(MONTH, -1, @FechaFinActual)
            WHEN @Periodo = '3M' THEN DATEADD(MONTH, -3, @FechaFinActual)
            WHEN @Periodo = '6M' THEN DATEADD(MONTH, -6, @FechaFinActual)
            ELSE @FechaFinActual
            END;
        END;

        -- Definir fechas comparativas
        IF @ModoComparacion = 'PeriodoAnterior'
        BEGIN
        DECLARE @Dias INT = DATEDIFF(DAY, @FechaInicioActual, @FechaFinActual) + 1;
        SET @FechaFinAnterior = DATEADD(DAY, -1, @FechaInicioActual);
        SET @FechaInicioAnterior = DATEADD(DAY, -@Dias, @FechaInicioActual);
        END
        ELSE IF @ModoComparacion = 'MismoPeriodoAnoAnterior'
        BEGIN
        SET @FechaInicioAnterior = DATEADD(YEAR, -1, @FechaInicioActual);
        SET @FechaFinAnterior = DATEADD(YEAR, -1, @FechaFinActual);
        END
        ELSE IF @ModoComparacion = 'Custom' AND @FechaInicioAnteriorInput IS NOT NULL AND @FechaFinAnteriorInput IS NOT NULL
        BEGIN
        SET @FechaInicioAnterior = @FechaInicioAnteriorInput;
        SET @FechaFinAnterior = @FechaFinAnteriorInput;
        END

        -- CTEs
        ;WITH NC_PeriodoActual AS (
        SELECT 
            COUNT(DISTINCT T0.DocEntry) AS CantidadNotasCreditoPeriodo,
            CAST(SUM(T1.Quantity) AS DECIMAL(18, 2)) AS CantidadProductosDevueltosPeriodo
        FROM [dbo].[ORIN] T0
        INNER JOIN [dbo].[RIN1] T1 ON T0.DocEntry = T1.DocEntry
        WHERE 
            T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
            AND (@ItemCodeParam IS NULL OR T1.ItemCode = @ItemCodeParam)
            AND (
            @CanalParam IS NULL
            OR (
                (@CanalParam = 'Meli' AND ((T1.WhsCode IN ('03', '05') AND T0.SlpCode IN (426, 364, 355)) OR (T1.WhsCode = '01' AND T0.SlpCode IN (355, 398))))
                OR (@CanalParam = 'Falabella' AND T1.WhsCode = '03' AND T0.SlpCode = 371)
                OR (@CanalParam = 'Balmaceda' AND T1.WhsCode = '07')
                OR (@CanalParam = 'Vitex' AND T1.WhsCode = '01' AND T0.SlpCode IN (401, 397))
                OR (@CanalParam = 'Chorrillo' AND T1.WhsCode = '01' AND T1.SlpCode NOT IN (401, 397, 355, 398, 227, 250, 205, 138, 209, 228, 226, 137, 212))
                OR (@CanalParam = 'Empresas' AND T1.WhsCode = '01' AND T1.SlpCode IN (227, 250, 205, 138, 209, 228, 226, 137, 212))
            )
            )
            AND (@VendedorEmpresaParam IS NULL OR T1.SlpCode = @VendedorEmpresaParam)
        ),
        NC_PeriodoAnterior AS (
        SELECT 
            COUNT(DISTINCT T0.DocEntry) AS CantidadNotasCreditoAnterior,
            CAST(SUM(T1.Quantity) AS DECIMAL(18, 2)) AS CantidadProductosDevueltosAnterior
        FROM [dbo].[ORIN] T0
        INNER JOIN [dbo].[RIN1] T1 ON T0.DocEntry = T1.DocEntry
        WHERE 
            T0.DocDate BETWEEN @FechaInicioAnterior AND @FechaFinAnterior
            AND (@ItemCodeParam IS NULL OR T1.ItemCode = @ItemCodeParam)
            AND (
            @CanalParam IS NULL
            OR (
                (@CanalParam = 'Meli' AND ((T1.WhsCode IN ('03', '05') AND T0.SlpCode IN (426, 364, 355)) OR (T1.WhsCode = '01' AND T0.SlpCode IN (355, 398))))
                OR (@CanalParam = 'Falabella' AND T1.WhsCode = '03' AND T0.SlpCode = 371)
                OR (@CanalParam = 'Balmaceda' AND T1.WhsCode = '07')
                OR (@CanalParam = 'Vitex' AND T1.WhsCode = '01' AND T0.SlpCode IN (401, 397))
                OR (@CanalParam = 'Chorrillo' AND T1.WhsCode = '01' AND T1.SlpCode NOT IN (401, 397, 355, 398, 227, 250, 205, 138, 209, 228, 226, 137, 212))
                OR (@CanalParam = 'Empresas' AND T1.WhsCode = '01' AND T1.SlpCode IN (227, 250, 205, 138, 209, 228, 226, 137, 212))
            )
            )
            AND (@VendedorEmpresaParam IS NULL OR T1.SlpCode = @VendedorEmpresaParam)
        )

        -- Resultado final
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
      request.input("VendedorEmpresaParamInput", sql.Int, vendedor);
      request.input("ItemCodeInput", sql.VarChar, itemCode);
      request.input("PeriodoInput", sql.VarChar, periodo);
      request.input("FechaInicioInput", sql.Date, fechaInicio);
      request.input("FechaFinInput", sql.Date, fechaFin);
      request.input("ModoComparacionInput", sql.VarChar, modoComparacion);
      request.input("FechaInicioAnteriorInput", sql.Date, fechaInicioAnterior);
      request.input("FechaFinAnteriorInput", sql.Date, fechaFinAnterior);
  
      const result = await request.query(query);
      res.status(200).json(result.recordset[0]);
    } catch (error) {
      console.error("❌ Error al obtener notas de crédito comparadas:", error);
      res.status(500).json({ error: "Error en el servidor." });
    }
  };
//  CATEGORÍAS VENDIDAS VENDEDOR
const obtenerVentasPorCategoriaComparado = async (req, res) => {
    try {
      const pool = await poolPromise;
  
      const canal = req.query.canal || null;
      const vendedor = req.query.vendedorEmpresa || null;
      const periodo = req.query.periodo || "7D";
      const fechaInicio = req.query.fechaInicio || null;
      const fechaFin = req.query.fechaFin || null;
      const modoComparacion = req.query.modoComparacion || "PeriodoAnterior";
      const fechaInicioAnterior = req.query.fechaInicioAnterior || null;
      const fechaFinAnterior = req.query.fechaFinAnterior || null;
  
      const query = `
        DECLARE @CanalParam VARCHAR(50) = @CanalParamInput;
        DECLARE @VendedorEmpresaParam INT = @VendedorEmpresaParamInput;
        DECLARE @Periodo VARCHAR(10) = @PeriodoInput;
        DECLARE @FechaInicioCustom DATE = @FechaInicioInput;
        DECLARE @FechaFinCustom DATE = @FechaFinInput;
        DECLARE @ModoComparacion VARCHAR(30) = @ModoComparacionInput;
        DECLARE @FechaInicioAnteriorCustom DATE = @FechaInicioAnteriorInput;
        DECLARE @FechaFinAnteriorCustom DATE = @FechaFinAnteriorInput;
  
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
                    WHEN @Periodo = '1M'  THEN DATEADD(MONTH, DATEDIFF(MONTH, 0, @FechaFinActual), 0)
                    WHEN @Periodo = '3M'  THEN DATEADD(MONTH, -3, @FechaFinActual)
                    WHEN @Periodo = '6M'  THEN DATEADD(MONTH, -6, @FechaFinActual)
                    ELSE @FechaFinActual
                END;
        END
  
        IF @ModoComparacion = 'PeriodoAnterior'
        BEGIN
            DECLARE @Dias INT = DATEDIFF(DAY, @FechaInicioActual, @FechaFinActual) + 1;
            SET @FechaFinAnterior = DATEADD(DAY, -1, @FechaInicioActual);
            SET @FechaInicioAnterior = DATEADD(DAY, -@Dias, @FechaInicioActual);
        END
        ELSE IF @ModoComparacion = 'MismoPeriodoAnoAnterior'
        BEGIN
            SET @FechaInicioAnterior = DATEADD(YEAR, -1, @FechaInicioActual);
            SET @FechaFinAnterior = DATEADD(YEAR, -1, @FechaFinActual);
        END
        ELSE IF @ModoComparacion = 'Custom' AND @FechaInicioAnteriorCustom IS NOT NULL AND @FechaFinAnteriorCustom IS NOT NULL
        BEGIN
            SET @FechaInicioAnterior = @FechaInicioAnteriorCustom;
            SET @FechaFinAnterior = @FechaFinAnteriorCustom;
        END
  
        ;WITH VentasActual AS (
            SELECT 
                C.U_Imagen,
                C.Name AS Categoria,
                SUM(I.LineTotal) AS Ventas_Actual,
                CAST(SUM(I.Quantity) AS INT) AS Unidades_Actual
            FROM INV1 I
            INNER JOIN OITM O ON I.ItemCode = O.ItemCode
            INNER JOIN [@categoria] C ON O.U_Categoria = C.Code
            INNER JOIN OINV T0 ON I.DocEntry = T0.DocEntry
            WHERE 
                T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
                AND T0.CANCELED = 'N'
                AND (
                    @CanalParam IS NULL
                    OR (
                        (@CanalParam = 'Meli' AND ((I.WhsCode IN ('03', '05') AND T0.SlpCode IN (426, 364, 355)) OR (I.WhsCode = '01' AND T0.SlpCode IN (355, 398))))
                        OR (@CanalParam = 'Falabella' AND I.WhsCode = '03' AND T0.SlpCode = 371)
                        OR (@CanalParam = 'Balmaceda' AND I.WhsCode = '07')
                        OR (@CanalParam = 'Vitex' AND I.WhsCode = '01' AND T0.SlpCode IN (401, 397))
                        OR (@CanalParam = 'Chorrillo' AND I.WhsCode = '01' AND I.SlpCode NOT IN (401, 397, 355, 398, 227, 250, 205, 138, 209, 228, 226, 137, 212))
                        OR (@CanalParam = 'Empresas' AND I.WhsCode = '01' AND I.SlpCode IN (227, 250, 205, 138, 209, 228, 226, 137, 212))
                    )
                )
                AND (@VendedorEmpresaParam IS NULL OR I.SlpCode = @VendedorEmpresaParam)
            GROUP BY C.Name, C.U_Imagen
        ),
        VentasAnterior AS (
            SELECT 
                C.U_Imagen,
                C.Name AS Categoria,
                SUM(I.LineTotal) AS Ventas_Anterior,
                CAST(SUM(I.Quantity) AS INT) AS Unidades_Anterior
            FROM INV1 I
            INNER JOIN OITM O ON I.ItemCode = O.ItemCode
            INNER JOIN [@categoria] C ON O.U_Categoria = C.Code
            INNER JOIN OINV T0 ON I.DocEntry = T0.DocEntry
            WHERE 
                T0.DocDate BETWEEN @FechaInicioAnterior AND @FechaFinAnterior
                AND T0.CANCELED = 'N'
                AND (
                    @CanalParam IS NULL
                    OR (
                        (@CanalParam = 'Meli' AND ((I.WhsCode IN ('03', '05') AND T0.SlpCode IN (426, 364, 355)) OR (I.WhsCode = '01' AND T0.SlpCode IN (355, 398))))
                        OR (@CanalParam = 'Falabella' AND I.WhsCode = '03' AND T0.SlpCode = 371)
                        OR (@CanalParam = 'Balmaceda' AND I.WhsCode = '07')
                        OR (@CanalParam = 'Vitex' AND I.WhsCode = '01' AND I.SlpCode IN (401, 397))
                        OR (@CanalParam = 'Chorrillo' AND I.WhsCode = '01' AND I.SlpCode NOT IN (401, 397, 355, 398, 227, 250, 205, 138, 209, 228, 226, 137, 212))
                        OR (@CanalParam = 'Empresas' AND I.WhsCode = '01' AND I.SlpCode IN (227, 250, 205, 138, 209, 228, 226, 137, 212))
                    )
                )
                AND (@VendedorEmpresaParam IS NULL OR I.SlpCode = @VendedorEmpresaParam)
            GROUP BY C.Name, C.U_Imagen
        )
  
        SELECT 
            VA.U_Imagen,
            VA.Categoria,
            VA.Ventas_Actual,
            VAnt.Ventas_Anterior,
            VA.Unidades_Actual,
            VAnt.Unidades_Anterior,
            CASE 
                WHEN VAnt.Ventas_Anterior = 0 THEN NULL
                ELSE CAST(((VA.Ventas_Actual - VAnt.Ventas_Anterior) * 100.0 / VAnt.Ventas_Anterior) AS DECIMAL(18, 2))
            END AS PorcentajeCambioVentas,
            CASE 
                WHEN VAnt.Unidades_Anterior = 0 THEN NULL
                ELSE CAST(((VA.Unidades_Actual - VAnt.Unidades_Anterior) * 100.0 / VAnt.Unidades_Anterior) AS DECIMAL(18, 2))
            END AS PorcentajeCambioUnidades
        FROM VentasActual VA
        LEFT JOIN VentasAnterior VAnt ON VA.Categoria = VAnt.Categoria
        ORDER BY VA.Ventas_Actual DESC;
      `;
  
      const request = pool.request();
      request.input("CanalParamInput", sql.VarChar, canal);
      request.input("VendedorEmpresaParamInput", sql.Int, vendedor);
      request.input("PeriodoInput", sql.VarChar, periodo);
      request.input("FechaInicioInput", sql.Date, fechaInicio);
      request.input("FechaFinInput", sql.Date, fechaFin);
      request.input("ModoComparacionInput", sql.VarChar, modoComparacion);
      request.input("FechaInicioAnteriorInput", sql.Date, fechaInicioAnterior);
      request.input("FechaFinAnteriorInput", sql.Date, fechaFinAnterior);
  
      const result = await request.query(query);
      res.status(200).json(result.recordset);
    } catch (error) {
      console.error("❌ Error al obtener ventas por categoría comparadas:", error);
      res.status(500).json({ error: "Error en el servidor." });
    }
  };

  //PRODUCTOS RENTABLES VENDEDOR

  const obtenerTopRentablesPorVendedor = async (req, res) => {
    try {
      const pool = await poolPromise;
  
      const canal = req.query.canal || null;
      const vendedor = req.query.vendedorEmpresa || null;
      const periodo = req.query.periodo || "7D";
      const fechaInicio = req.query.fechaInicio || null;
      const fechaFin = req.query.fechaFin || null;
  
      const query = `
        DECLARE @CanalParam VARCHAR(50) = @CanalParamInput;
        DECLARE @VendedorParam INT = @VendedorParamInput;
        DECLARE @Periodo VARCHAR(10) = @PeriodoInput;
        DECLARE @FechaInicioCustom DATE = @FechaInicioInput;
        DECLARE @FechaFinCustom DATE = @FechaFinInput;
  
        DECLARE @FechaInicioActual DATE, @FechaFinActual DATE;
  
        -- Definir fechas
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
  
        -- Consulta principal
        SELECT TOP 10
            O.U_Imagen as Imagen,
            I.ItemCode AS Codigo_Producto,
            O.ItemName AS Nombre_Producto,
            SUM(I.Quantity) AS Cantidad_Vendida,
            SUM(I.LineTotal) AS Total_Ventas,
            SUM(I.Quantity * O.AvgPrice) AS Costo_Total,
            SUM(I.LineTotal - (I.Quantity * O.AvgPrice)) AS Margen_Absoluto,
            CAST(
                (SUM(I.LineTotal - (I.Quantity * O.AvgPrice)) * 100.0) / NULLIF(SUM(I.LineTotal), 0)
                AS DECIMAL(18, 2)
            ) AS Margen_Porcentaje
        FROM INV1 I
        INNER JOIN OITM O ON I.ItemCode = O.ItemCode
        INNER JOIN OINV T0 ON I.DocEntry = T0.DocEntry
        WHERE 
            T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
            AND T0.CANCELED = 'N'
            AND O.AvgPrice > 0
            AND (
                @CanalParam IS NULL
                OR (
                    (@CanalParam = 'Meli' AND ((I.WhsCode IN ('03', '05') AND T0.SlpCode IN (426, 364, 355)) OR (I.WhsCode = '01' AND T0.SlpCode IN (355, 398))))
                    OR (@CanalParam = 'Falabella' AND I.WhsCode = '03' AND T0.SlpCode = 371)
                    OR (@CanalParam = 'Balmaceda' AND I.WhsCode = '07')
                    OR (@CanalParam = 'Vitex' AND I.WhsCode = '01' AND T0.SlpCode IN (401, 397))
                    OR (@CanalParam = 'Chorrillo' AND I.WhsCode = '01' AND I.SlpCode NOT IN (401, 397, 355, 398, 227, 250, 205, 138, 209, 228, 226, 137, 212))
                    OR (@CanalParam = 'Empresas' AND I.WhsCode = '01' AND I.SlpCode IN (227, 250, 205, 138, 209, 228, 226, 137, 212))
                )
            )
            AND (@VendedorParam IS NULL OR I.SlpCode = @VendedorParam)
        GROUP BY I.ItemCode, O.ItemName, O.U_Imagen
        ORDER BY Margen_Absoluto DESC;
      `;
  
      const request = pool.request();
      request.input("CanalParamInput", sql.VarChar, canal);
      request.input("VendedorParamInput", sql.Int, vendedor);
      request.input("PeriodoInput", sql.VarChar, periodo);
      request.input("FechaInicioInput", sql.Date, fechaInicio);
      request.input("FechaFinInput", sql.Date, fechaFin);
  
      const result = await request.query(query);
      res.status(200).json(result.recordset);
    } catch (error) {
      console.error("❌ Error al obtener productos más rentables por vendedor:", error);
      res.status(500).json({ error: "Error en el servidor." });
    }
  };
  //PRODUCTOS MAS VENDIDOS COMPARADOS/VENDEDOR
  const obtenerTopProductosMasVendidosComparado = async (req, res) => {
    try {
      const pool = await poolPromise;
  
      const canal = req.query.canal || null;
      const vendedor = req.query.vendedorEmpresa || null;
      const periodo = req.query.periodo || "14D";
      const fechaInicio = req.query.fechaInicio || null;
      const fechaFin = req.query.fechaFin || null;
      const modoComparacion = req.query.modoComparacion || "MismoPeriodoAnoAnterior";
      const fechaInicioAnterior = req.query.fechaInicioAnterior || null;
      const fechaFinAnterior = req.query.fechaFinAnterior || null;
  
      const query = `
        DECLARE @CanalParam VARCHAR(50) = @CanalParamInput;
        DECLARE @VendedorParam INT = @VendedorParamInput;
        DECLARE @Periodo VARCHAR(10) = @PeriodoInput;
        DECLARE @FechaInicioCustom DATE = @FechaInicioInput;
        DECLARE @FechaFinCustom DATE = @FechaFinInput;
        DECLARE @ModoComparacion VARCHAR(30) = @ModoComparacionInput;
        DECLARE @FechaInicioAnteriorCustom DATE = @FechaInicioAnteriorInput;
        DECLARE @FechaFinAnteriorCustom DATE = @FechaFinAnteriorInput;
  
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
  
        DECLARE @FechaInicioAnterior DATE, @FechaFinAnterior DATE;
        IF @ModoComparacion = 'PeriodoAnterior'
        BEGIN
            DECLARE @Dias INT = DATEDIFF(DAY, @FechaInicioActual, @FechaFinActual) + 1;
            SET @FechaFinAnterior = DATEADD(DAY, -1, @FechaInicioActual);
            SET @FechaInicioAnterior = DATEADD(DAY, -@Dias, @FechaInicioActual);
        END
        ELSE IF @ModoComparacion = 'MismoPeriodoAnoAnterior'
        BEGIN
            SET @FechaInicioAnterior = DATEADD(YEAR, -1, @FechaInicioActual);
            SET @FechaFinAnterior = DATEADD(YEAR, -1, @FechaFinActual);
        END
        ELSE IF @ModoComparacion = 'Custom' AND @FechaInicioAnteriorCustom IS NOT NULL AND @FechaFinAnteriorCustom IS NOT NULL
        BEGIN
            SET @FechaInicioAnterior = @FechaInicioAnteriorCustom;
            SET @FechaFinAnterior = @FechaFinAnteriorCustom;
        END;
  
        -- Datos actuales
        WITH VentasActual AS (
            SELECT 
                O.U_Imagen,
                I.ItemCode,
                O.ItemName,
                SUM(I.Quantity) AS Cantidad_Vendida,
                SUM(I.LineTotal) AS Total_Ventas
            FROM INV1 I
            INNER JOIN OITM O ON I.ItemCode = O.ItemCode
            INNER JOIN OINV T0 ON I.DocEntry = T0.DocEntry
            WHERE 
                T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
                AND T0.CANCELED = 'N'
                AND (
                    @CanalParam IS NULL OR
                    (@CanalParam = 'Meli' AND ((I.WhsCode IN ('03', '05') AND T0.SlpCode IN (426, 364, 355))
                        OR (I.WhsCode = '01' AND T0.SlpCode IN (355, 398))))
                    OR (@CanalParam = 'Falabella' AND I.WhsCode = '03' AND T0.SlpCode = 371)
                    OR (@CanalParam = 'Balmaceda' AND I.WhsCode = '07')
                    OR (@CanalParam = 'Vitex' AND I.WhsCode = '01' AND T0.SlpCode IN (401, 397))
                    OR (@CanalParam = 'Chorrillo' AND I.WhsCode = '01' AND I.SlpCode NOT IN (401, 397, 355, 398, 227, 250, 205, 138, 209, 228, 226, 137, 212))
                    OR (@CanalParam = 'Empresas' AND I.WhsCode = '01' AND I.SlpCode IN (227, 250, 205, 138, 209, 228, 226, 137, 212))
                )
                AND (@VendedorParam IS NULL OR I.SlpCode = @VendedorParam)
            GROUP BY I.ItemCode, O.ItemName, O.U_Imagen
        ),
        VentasAnterior AS (
            SELECT 
                I.ItemCode,
                SUM(I.LineTotal) AS Total_Ventas_Anterior
            FROM INV1 I
            INNER JOIN OINV T0 ON I.DocEntry = T0.DocEntry
            WHERE 
                T0.DocDate BETWEEN @FechaInicioAnterior AND @FechaFinAnterior
                AND T0.CANCELED = 'N'
                AND (
                    @CanalParam IS NULL OR
                    (@CanalParam = 'Meli' AND ((I.WhsCode IN ('03', '05') AND T0.SlpCode IN (426, 364, 355))
                        OR (I.WhsCode = '01' AND T0.SlpCode IN (355, 398))))
                    OR (@CanalParam = 'Falabella' AND I.WhsCode = '03' AND T0.SlpCode = 371)
                    OR (@CanalParam = 'Balmaceda' AND I.WhsCode = '07')
                    OR (@CanalParam = 'Vitex' AND I.WhsCode = '01' AND T0.SlpCode IN (401, 397))
                    OR (@CanalParam = 'Chorrillo' AND I.WhsCode = '01' AND I.SlpCode NOT IN (401, 397, 355, 398, 227, 250, 205, 138, 209, 228, 226, 137, 212))
                    OR (@CanalParam = 'Empresas' AND I.WhsCode = '01' AND I.SlpCode IN (227, 250, 205, 138, 209, 228, 226, 137, 212))
                )
                AND (@VendedorParam IS NULL OR I.SlpCode = @VendedorParam)
            GROUP BY I.ItemCode
        )
        SELECT TOP 10
            A.U_Imagen,
            A.ItemCode,
            A.ItemName AS Nombre_Producto,
            A.Cantidad_Vendida,
            A.Total_Ventas,
            ISNULL(B.Total_Ventas_Anterior, 0) AS Total_Ventas_Anterior,
            CASE
                WHEN B.Total_Ventas_Anterior = 0 THEN NULL
                ELSE CAST(((A.Total_Ventas - B.Total_Ventas_Anterior) * 100.0) / B.Total_Ventas_Anterior AS DECIMAL(18,2))
            END AS PorcentajeCambio
        FROM VentasActual A
        LEFT JOIN VentasAnterior B ON A.ItemCode = B.ItemCode
        ORDER BY A.Total_Ventas DESC;
      `;
  
      const request = pool.request();
      request.input("CanalParamInput", sql.VarChar, canal);
      request.input("VendedorParamInput", sql.Int, vendedor);
      request.input("PeriodoInput", sql.VarChar, periodo);
      request.input("FechaInicioInput", sql.Date, fechaInicio);
      request.input("FechaFinInput", sql.Date, fechaFin);
      request.input("ModoComparacionInput", sql.VarChar, modoComparacion);
      request.input("FechaInicioAnteriorInput", sql.Date, fechaInicioAnterior);
      request.input("FechaFinAnteriorInput", sql.Date, fechaFinAnterior);
  
      const result = await request.query(query);
      res.status(200).json(result.recordset);
    } catch (error) {
      console.error("❌ Error al obtener el top de productos más vendidos comparado:", error);
      res.status(500).json({ error: "Error en el servidor." });
    }
  };
  const obtenerHistoricoVentasSKU = async (req, res) => {
    try {
      const pool = await poolPromise;
  
      const periodo = req.query.periodo || "7D";
      const fechaInicio = req.query.fechaInicio || null;
      const fechaFin = req.query.fechaFin || null;
      const itemCode = req.query.itemCode;
      const canal = req.query.canal || null;
  
      if (!itemCode) {
        return res.status(400).json({ error: "Falta el parámetro obligatorio: Código del producto" });
      }
  
      const query = `
        DECLARE @Periodo VARCHAR(10) = @PeriodoInput;
        DECLARE @FechaInicioCustom DATE = @FechaInicioInput;
        DECLARE @FechaFinCustom DATE = @FechaFinInput;
        DECLARE @ItemCodeParam NVARCHAR(50) = @ItemCodeInput;
        DECLARE @CanalParam VARCHAR(50) = @CanalInput;
  
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
                WHEN ((I.WhsCode IN ('03', '05') AND OI.SlpCode IN (426, 364, 355)) 
                      OR (I.WhsCode = '01' AND OI.SlpCode IN (355, 398)))
                     AND (@CanalParam IS NULL OR @CanalParam = 'Meli')
                THEN I.LineTotal ELSE 0 
            END) AS Meli,
  
            SUM(CASE 
                WHEN I.WhsCode = '03' AND OI.SlpCode = 371 
                     AND (@CanalParam IS NULL OR @CanalParam = 'Falabella')
                THEN I.LineTotal ELSE 0 
            END) AS Falabella,
  
            SUM(CASE 
                WHEN I.WhsCode = '07' 
                     AND (@CanalParam IS NULL OR @CanalParam = 'Balmaceda')
                THEN I.LineTotal ELSE 0 
            END) AS Balmaceda,
  
            SUM(CASE 
                WHEN I.WhsCode = '01' AND OI.SlpCode IN (401, 397) 
                     AND (@CanalParam IS NULL OR @CanalParam = 'Vitex')
                THEN I.LineTotal ELSE 0 
            END) AS Vitex,
  
            SUM(CASE 
                WHEN I.WhsCode = '01' 
                     AND I.SlpCode NOT IN (401, 397, 355, 398, 227, 250, 205, 138, 209, 228, 226, 137, 212)
                     AND (@CanalParam IS NULL OR @CanalParam = 'Chorrillo')
                THEN I.LineTotal ELSE 0 
            END) AS Chorrillo,
  
            SUM(CASE 
                WHEN I.WhsCode = '01' 
                     AND I.SlpCode IN (227, 250, 205, 138, 209, 228, 226, 137, 212)
                     AND (@CanalParam IS NULL OR @CanalParam = 'Empresas')
                THEN I.LineTotal ELSE 0 
            END) AS Empresas
  
        FROM INV1 I
        INNER JOIN OINV OI ON I.DocEntry = OI.DocEntry
        WHERE 
            OI.DocDate BETWEEN @FechaInicio AND @FechaFin
            AND OI.CANCELED = 'N'
            AND I.ItemCode = @ItemCodeParam
        GROUP BY 
            OI.DocDate
        ORDER BY 
            OI.DocDate ASC;
      `;
  
      const request = pool.request();
      request.input("PeriodoInput", sql.VarChar, periodo);
      request.input("FechaInicioInput", sql.Date, fechaInicio);
      request.input("FechaFinInput", sql.Date, fechaFin);
      request.input("ItemCodeInput", sql.VarChar, itemCode);
      request.input("CanalInput", sql.VarChar, canal);
  
      const result = await request.query(query);
      res.status(200).json(result.recordset);
    } catch (error) {
      console.error("❌ Error al obtener histórico de ventas por SKU:", error);
      res.status(500).json({ error: "Error en el servidor." });
    }
  };
  
  //OBTENER SKU GENERAL
  const obtenersku = async (req, res) => {
    try {
      const pool = await poolPromise;
      const queryText = `
        SELECT TOP 10 
          ItemCode AS itemcode,
          ItemName AS itemname,
          U_Imagen
        FROM OITM
        WHERE ItemCode LIKE '%' + @query + '%' 
           OR ItemName LIKE '%' + @query + '%'
           and PrchseItem ='Y'
        ORDER BY ItemCode;
      `;

      const query = req.query.query || ""; // <-- obtenemos el parámetro de búsqueda
  
      const result = await pool
        .request()
        .input("query", sql.NVarChar, query) // <-- lo pasamos como parámetro seguro
        .query(queryText);
  
      res.status(200).json(result.recordset);
    } catch (error) {
      console.error("❌ Error al obtener SKU:", error);
      res.status(500).json({ error: "Error en el servidor." });
    }
  };
  
  

module.exports = {obtenerVentasProductoComparado, obtenerMargenProductoComparado, obtenerUnidadesVendidasComparado, 
    obtenerTransaccionesComparado, obtenerProductosDistintosComparado, obtenerTicketPromedioComparado,
    obtenerNotasCreditoComparadopv, obtenerVentasPorCategoriaComparado, obtenerTopRentablesPorVendedor, 
    obtenerTopProductosMasVendidosComparado, obtenerHistoricoVentasSKU, obtenersku

};