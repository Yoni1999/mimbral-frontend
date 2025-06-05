const sql = require("mssql");
const { poolPromise } = require("../models/db");
const { getCachedData } = require("../utils/cache");
const axios = require('axios');


//RESUMEN DE VENTAS
   //Top 10 productos más vendidos
const obtenerTopProductos = async (req, res) => {
    try {
      const pool = await poolPromise;
      const canal = req.query.canal || null;
      const vendedor = req.query.vendedor || null; 
      const periodo = req.query.periodo || "1D";
      const fechaInicio = req.query.fechaInicio || null;
      const fechaFin = req.query.fechaFin || null;
  
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
            I.ItemCode AS Codigo_Producto,
            O.ItemName AS Nombre_Producto,
            SUM(I.Quantity) AS Cantidad_Vendida,
            SUM(I.LineTotal) AS Total_Ventas,
            SUM(I.Quantity * O.AvgPrice) AS Costo_Total,
            SUM(I.LineTotal - (I.Quantity * O.AvgPrice)) AS Margen_Absoluto,
            CAST((SUM(I.LineTotal - (I.Quantity * O.AvgPrice)) * 100.0) / NULLIF(SUM(I.LineTotal), 0) AS DECIMAL(18, 2)) AS Margen_Porcentaje
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
        GROUP BY I.ItemCode, O.ItemName
        ORDER BY Cantidad_Vendida DESC;
      `;
  
      const request = pool.request();
      request.input("CanalParamInput", sql.VarChar, canal);
      request.input("VendedorParamInput", sql.Int, vendedor);
      request.input("PeriodoParam", sql.VarChar, periodo);
      request.input("FechaInicioInput", sql.Date, fechaInicio);
      request.input("FechaFinInput", sql.Date, fechaFin);
  
      const result = await request.query(query);
      res.json(result.recordset);
    } catch (error) {
      console.error("❌ Error al obtener los productos más vendidos:", error);
      res.status(500).json({ error: "Error en el servidor." });
    }
  };
//RESUMEN DE VENTAS
   //Top 10 categorias con mayor margen.
   const obtenerMargenCategoriasComparado = async (req, res) => {
    try {
      const pool = await poolPromise;
  
      const canal = req.query.canal || null;
      const vendedor = req.query.vendedor || null;
      const periodo = req.query.periodo || "1D";
      const fechaInicio = req.query.fechaInicio || null;
      const fechaFin = req.query.fechaFin || null;
      const modoComparacion = req.query.modo || "anio_anterior"; 
  
      const query = `
        -- Declaración de parámetros
        DECLARE @CanalParam VARCHAR(50) = @CanalParamInput;
        DECLARE @VendedorEmpresaParam INT = @VendedorParamInput;
        DECLARE @Periodo VARCHAR(10) = @PeriodoParam;
        DECLARE @FechaInicioCustom DATE = @FechaInicioInput;
        DECLARE @FechaFinCustom DATE = @FechaFinInput;
        DECLARE @ModoComparacion VARCHAR(20) = @ModoComparacionInput;
  
        -- Fechas de análisis
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
                    WHEN @Periodo = '1D' THEN @FechaFinActual
                    WHEN @Periodo = '7D' THEN DATEADD(DAY, -6, @FechaFinActual)
                    WHEN @Periodo = '14D' THEN DATEADD(DAY, -13, @FechaFinActual)
                    WHEN @Periodo = '1M' THEN DATEADD(MONTH, -1, @FechaFinActual)
                    WHEN @Periodo = '3M' THEN DATEADD(MONTH, -3, @FechaFinActual)
                    WHEN @Periodo = '6M' THEN DATEADD(MONTH, -6, @FechaFinActual)
                    ELSE @FechaFinActual
                END;
        END;
  
        -- Fechas de comparación
        DECLARE @FechaInicioComparacion DATE, @FechaFinComparacion DATE;
        IF @ModoComparacion = 'anio_anterior'
        BEGIN
            SET @FechaInicioComparacion = DATEADD(YEAR, -1, @FechaInicioActual);
            SET @FechaFinComparacion = DATEADD(YEAR, -1, @FechaFinActual);
        END
        ELSE
        BEGIN
            DECLARE @Dias INT = DATEDIFF(DAY, @FechaInicioActual, @FechaFinActual) + 1;
            SET @FechaFinComparacion = DATEADD(DAY, -1, @FechaInicioActual);
            SET @FechaInicioComparacion = DATEADD(DAY, -@Dias, @FechaInicioActual);
        END;
  
        -- CTE actual
        WITH TopVentasActual AS (
            SELECT TOP 10
                C.Name AS Categoria,
                C.U_Imagen,
                SUM(I.LineTotal) AS TotalVentas,
                SUM(I.Quantity * O.AvgPrice) AS CostoTotal,
                SUM(I.LineTotal - (I.Quantity * O.AvgPrice)) AS MargenAbsoluto,
                CAST((SUM(I.LineTotal - (I.Quantity * O.AvgPrice)) * 100.0) / NULLIF(SUM(I.LineTotal), 0) AS DECIMAL(18,2)) AS MargenPorcentaje
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
                AND (@VendedorEmpresaParam IS NULL OR I.SlpCode = @VendedorEmpresaParam)
            GROUP BY C.Name, C.U_Imagen
            ORDER BY TotalVentas DESC
        ),
  
        -- CTE comparativo
        MargenComparacion AS (
            SELECT 
                C.Name AS Categoria,
                C.U_Imagen,
                CAST((SUM(I.LineTotal - (I.Quantity * O.AvgPrice)) * 100.0) / NULLIF(SUM(I.LineTotal), 0) AS DECIMAL(18,2)) AS MargenPorcentaje_Comparacion
            FROM INV1 I
            INNER JOIN OITM O ON I.ItemCode = O.ItemCode
            INNER JOIN [@categoria] C ON O.U_Categoria = C.Code
            INNER JOIN OINV T0 ON I.DocEntry = T0.DocEntry
            WHERE 
                T0.DocDate BETWEEN @FechaInicioComparacion AND @FechaFinComparacion
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
                            AND I.SlpCode NOT IN (401, 397, 355, 398, 227, 250, 205, 138, 209, 228, 226, 137, 212))
                        OR (@CanalParam = 'Empresas' AND I.WhsCode = '01' 
                            AND I.SlpCode IN (227, 250, 205, 138, 209, 228, 226, 137, 212))
                    )
                )
                AND (@VendedorEmpresaParam IS NULL OR I.SlpCode = @VendedorEmpresaParam)
            GROUP BY C.Name, C.U_Imagen
        )
  
        SELECT 
            V.Categoria,
            V.TotalVentas,
            V.U_Imagen,
            V.CostoTotal,
            V.MargenAbsoluto,
            V.MargenPorcentaje,
            COALESCE(M.MargenPorcentaje_Comparacion, 0) AS MargenPorcentaje_Comparacion,
            CASE 
                WHEN M.MargenPorcentaje_Comparacion = 0 THEN NULL
                ELSE CAST((V.MargenPorcentaje - M.MargenPorcentaje_Comparacion) AS DECIMAL(18,2))
            END AS DiferenciaMargen
        FROM TopVentasActual V
        LEFT JOIN MargenComparacion M ON V.Categoria = M.Categoria
        ORDER BY V.TotalVentas DESC;
      `;
  
      const request = pool.request();
      request.input("CanalParamInput", sql.VarChar, canal);
      request.input("VendedorParamInput", sql.Int, vendedor);
      request.input("PeriodoParam", sql.VarChar, periodo);
      request.input("FechaInicioInput", sql.Date, fechaInicio);
      request.input("FechaFinInput", sql.Date, fechaFin);
      request.input("ModoComparacionInput", sql.VarChar, modoComparacion);
  
      const result = await request.query(query);
      res.json(result.recordset);
    } catch (error) {
      console.error("❌ Error al obtener comparación de margen por categoría:", error);
      res.status(500).json({ error: "Error en el servidor." });
    }
  };
  
//RESUMEN DE VENTAS

const obtenerVentasPeriodo = async (req, res) => {
    try {
      const pool = await poolPromise;
      const canal = req.query.canal || null;
      const vendedorEmpresa = req.query.vendedorEmpresa || null; // Nuevo filtro
      const periodo = req.query.periodo || "1D";
      const fechaInicio = req.query.fechaInicio || null;
      const fechaFin = req.query.fechaFin || null;
  
      const query = `
        DECLARE @CanalParam VARCHAR(50) = @CanalParamInput;
        DECLARE @VendedorEmpresaParam INT = @VendedorEmpresaInput;
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
            WHERE 
                T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
                AND T0.CANCELED = 'N'
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
            WHERE 
                T0.DocDate BETWEEN @FechaInicioAnterior AND @FechaFinAnterior
                AND T0.CANCELED = 'N'
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
      request.input("PeriodoParam", sql.VarChar, periodo);
      request.input("FechaInicioInput", sql.Date, fechaInicio);
      request.input("FechaFinInput", sql.Date, fechaFin);
  
      const result = await request.query(query);
      res.json(result.recordset[0]);
    } catch (error) {
      console.error("❌ Error al obtener ventas por período:", error);
      res.status(500).json({ error: "Error en el servidor." });
    }
  };




// (resumen de ventas)
const obtenerTransaccionesPeriodo = async (req, res) => {
    try {
      const pool = await poolPromise;
      const canal = req.query.canal || null;
      const vendedorEmpresa = req.query.vendedorEmpresa || null; // Nuevo filtro
      const periodo = req.query.periodo || "1D";
      const fechaInicio = req.query.fechaInicio || null;
      const fechaFin = req.query.fechaFin || null;
  
      const query = `
        DECLARE @CanalParam VARCHAR(50) = @CanalParamInput;
        DECLARE @VendedorEmpresaParam INT = @VendedorEmpresaInput;
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
        END;
  
        DECLARE @Dias INT = DATEDIFF(DAY, @FechaInicioActual, @FechaFinActual) + 1;
        SET @FechaFinAnterior = DATEADD(DAY, -1, @FechaInicioActual);
        SET @FechaInicioAnterior = DATEADD(DAY, -@Dias, @FechaInicioActual);
  
        WITH TransaccionesPeriodo AS (
            SELECT COUNT(DISTINCT T0.DocEntry) AS CantidadTransacciones
            FROM [dbo].[OINV] T0
            INNER JOIN [dbo].[INV1] T1 ON T0.DocEntry = T1.DocEntry
            WHERE 
                T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
                AND T0.CANCELED = 'N'
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
      request.input("PeriodoParam", sql.VarChar, periodo);
      request.input("FechaInicioInput", sql.Date, fechaInicio);
      request.input("FechaFinInput", sql.Date, fechaFin);
  
      const result = await request.query(query);
      res.json(result.recordset[0]);
    } catch (error) {
      console.error("❌ Error al obtener transacciones por período:", error);
      res.status(500).json({ error: "Error en el servidor." });
    }
  };

const obtenerUnidadesVendidasPeriodo = async (req, res) => {
    try {
      const pool = await poolPromise;
      const canal = req.query.canal || null;
      const vendedorEmpresa = req.query.vendedorEmpresa || null; // Nuevo filtro
      const periodo = req.query.periodo || "1D";
      const fechaInicio = req.query.fechaInicio || null;
      const fechaFin = req.query.fechaFin || null;
  
      const query = `
        DECLARE @CanalParam VARCHAR(50) = @CanalParamInput;
        DECLARE @VendedorEmpresaParam INT = @VendedorEmpresaInput;
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
            SELECT 
                CAST(SUM(T1.Quantity) AS INT) AS CantidadVendida
            FROM [dbo].[OINV] T0
            INNER JOIN [dbo].[INV1] T1 ON T0.DocEntry = T1.DocEntry
            WHERE 
                T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
                AND T0.CANCELED = 'N'
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
      request.input("VendedorEmpresaInput", sql.Int, vendedorEmpresa);
      request.input("PeriodoParam", sql.VarChar, periodo);
      request.input("FechaInicioInput", sql.Date, fechaInicio);
      request.input("FechaFinInput", sql.Date, fechaFin);
  
      const result = await request.query(query);
      res.json(result.recordset[0]);
    } catch (error) {
      console.error("❌ Error al obtener unidades vendidas por período:", error);
      res.status(500).json({ error: "Error en el servidor." });
    }
  };

// 🔹 Obtener cantidad de notas de crédito de hoy y comparación con ayer
const obtenerNotascredito = async (req, res) => {
    try {
      const pool = await poolPromise;
  
      const periodo = req.query.periodo || "1D";
      const fechaInicio = req.query.fechaInicio || null;
      const fechaFin = req.query.fechaFin || null;
  
      const request = pool.request();
      request.input("PeriodoParam", sql.VarChar, periodo);
      request.input("FechaInicioInput", sql.Date, fechaInicio);
      request.input("FechaFinInput", sql.Date, fechaFin);
  
      const query = `
        DECLARE @Periodo VARCHAR(10) = @PeriodoParam;
        DECLARE @FechaInicioActual DATE, @FechaFinActual DATE;
        DECLARE @FechaInicioAnterior DATE, @FechaFinAnterior DATE;
  
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
  
        DECLARE @Dias INT = DATEDIFF(DAY, @FechaInicioActual, @FechaFinActual) + 1;
        SET @FechaFinAnterior = DATEADD(DAY, -1, @FechaInicioActual);
        SET @FechaInicioAnterior = DATEADD(DAY, -@Dias, @FechaInicioActual);
  
        WITH NC_PeriodoActual AS (
          SELECT 
            COUNT(DISTINCT T0.DocEntry) AS CantidadNotasCreditoPeriodo,
            CAST(SUM(T1.Quantity) AS DECIMAL(18, 2)) AS CantidadProductosDevueltosPeriodo
          FROM [dbo].[ORIN] T0
          INNER JOIN [dbo].[RIN1] T1 ON T0.DocEntry = T1.DocEntry
          WHERE T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
        ),
        NC_PeriodoAnterior AS (
          SELECT 
            COUNT(DISTINCT T0.DocEntry) AS CantidadNotasCreditoAnterior,
            CAST(SUM(T1.Quantity) AS DECIMAL(18, 2)) AS CantidadProductosDevueltosAnterior
          FROM [dbo].[ORIN] T0
          INNER JOIN [dbo].[RIN1] T1 ON T0.DocEntry = T1.DocEntry
          WHERE T0.DocDate BETWEEN @FechaInicioAnterior AND @FechaFinAnterior
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
  
      const result = await request.query(query);
      res.json(result.recordset[0]);
    } catch (error) {
      console.error("❌ Error al obtener notas de crédito por período:", error);
      res.status(500).json({ error: "Error en el servidor." });
    }
  };
  
  

const obtenerMargenVentas = async (req, res) => {
    try {
      const pool = await poolPromise;
  
      const periodo = req.query.periodo || "1D";
      const fechaInicio = req.query.fechaInicio || null;
      const fechaFin = req.query.fechaFin || null;
  
      const request = pool.request();
      request.input("PeriodoParam", sql.VarChar, periodo);
      request.input("FechaInicioInput", sql.Date, fechaInicio);
      request.input("FechaFinInput", sql.Date, fechaFin);
  
      const query = `
        DECLARE @Periodo VARCHAR(10) = @PeriodoParam;
        DECLARE @FechaInicioActual DATE, @FechaFinActual DATE;
        DECLARE @FechaInicioAnterior DATE, @FechaFinAnterior DATE;
  
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
                    WHEN @Periodo = '1D'  THEN @FechaFinActual
                    WHEN @Periodo = '7D'  THEN DATEADD(DAY, -6, @FechaFinActual)
                    WHEN @Periodo = '14D' THEN DATEADD(DAY, -13, @FechaFinActual)
                    WHEN @Periodo = '1M'  THEN DATEADD(MONTH, -1, @FechaFinActual)
                    WHEN @Periodo = '3M'  THEN DATEADD(MONTH, -3, @FechaFinActual)
                    WHEN @Periodo = '6M'  THEN DATEADD(MONTH, -6, @FechaFinActual)
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
          WHERE 
            O.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
            AND O.CANCELED = 'N'
        ),
        PeriodoAnterior AS (
          SELECT
            CAST(SUM(I.LineTotal) AS DECIMAL(18, 2)) AS TotalVentas,
            CAST(SUM(I.Quantity * ISNULL(M.AvgPrice, 0)) AS DECIMAL(18, 2)) AS TotalCostos
          FROM OINV O
          INNER JOIN INV1 I ON O.DocEntry = I.DocEntry
          LEFT JOIN OITM M ON I.ItemCode = M.ItemCode
          WHERE 
            O.DocDate BETWEEN @FechaInicioAnterior AND @FechaFinAnterior
            AND O.CANCELED = 'N'
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
  
      const result = await request.query(query);
      res.json(result.recordset[0]);
    } catch (error) {
      console.error("❌ Error al obtener margen de ventas:", error);
      res.status(500).json({ error: "Error en el servidor" });
    }
  };
  

  

const obtenerProductosDistintosPeriodo = async (req, res) => {
    try {
      const pool = await poolPromise;
      const canal = req.query.canal || null;
      const vendedorEmpresa = req.query.vendedorEmpresa || null; // Nuevo filtro
      const periodo = req.query.periodo || "1D"; // Por defecto, "hoy"
      const fechaInicio = req.query.fechaInicio || null;
      const fechaFin = req.query.fechaFin || null;
  
      const query = `
        DECLARE @CanalParam VARCHAR(50) = @CanalParamInput;
        DECLARE @VendedorEmpresaParam INT = @VendedorEmpresaInput;
        DECLARE @Periodo VARCHAR(10) = @PeriodoParam;
        DECLARE @FechaInicioCustom DATE = @FechaInicioInput;
        DECLARE @FechaFinCustom DATE = @FechaFinInput;
  
        DECLARE @FechaInicioActual DATE, @FechaFinActual DATE;
        DECLARE @FechaInicioAnterior DATE, @FechaFinAnterior DATE;
  
        -- Si hay fechas personalizadas, usarlas
        IF (@FechaInicioCustom IS NOT NULL AND @FechaFinCustom IS NOT NULL)
        BEGIN
            SET @FechaInicioActual = @FechaInicioCustom;
            SET @FechaFinActual = @FechaFinCustom;
        END
        ELSE
        BEGIN
            -- Definir el período según la opción seleccionada
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
  
        -- Calcular la cantidad de días en el período
        DECLARE @Dias INT = DATEDIFF(DAY, @FechaInicioActual, @FechaFinActual) + 1;
        -- Definir el período anterior con la misma cantidad de días
        SET @FechaFinAnterior = DATEADD(DAY, -1, @FechaInicioActual);
        SET @FechaInicioAnterior = DATEADD(DAY, -@Dias, @FechaInicioActual);
  
        -- CTE para contar los productos distintos vendidos en el período actual
        WITH ProductosPeriodo AS (
            SELECT 
                COUNT(DISTINCT T1.ItemCode) AS ProductosDistintosVendidos
            FROM [dbo].[OINV] T0
            INNER JOIN [dbo].[INV1] T1 ON T0.DocEntry = T1.DocEntry
            WHERE 
                T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
                AND T0.CANCELED = 'N'
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
                            AND T1.SlpCode IN (227, 250, 205, 138, 209, 228, 226, 137, 212))
                    )
                )
                AND (@VendedorEmpresaParam IS NULL OR T1.SlpCode = @VendedorEmpresaParam) -- Filtro por vendedor empresa
        ),
        ProductosAnterior AS (
            SELECT 
                COUNT(DISTINCT T1.ItemCode) AS ProductosDistintosVendidosAnterior
            FROM [dbo].[OINV] T0
            INNER JOIN [dbo].[INV1] T1 ON T0.DocEntry = T1.DocEntry
            WHERE 
                T0.DocDate BETWEEN @FechaInicioAnterior AND @FechaFinAnterior
                AND T0.CANCELED = 'N'
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
                            AND T1.SlpCode IN (227, 250, 205, 138, 209, 228, 226, 137, 212))
                    )
                )
                AND (@VendedorEmpresaParam IS NULL OR T1.SlpCode = @VendedorEmpresaParam) -- Filtro por vendedor empresa
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
      request.input("PeriodoParam", sql.VarChar, periodo);
      request.input("FechaInicioInput", sql.Date, fechaInicio);
      request.input("FechaFinInput", sql.Date, fechaFin);
  
      const result = await request.query(query);
      res.json(result.recordset[0]);
    } catch (error) {
      console.error("❌ Error al obtener productos distintos por período:", error);
      res.status(500).json({ error: "Error en el servidor." });
    }
  };
  
const obtenerTopProductosDetallado = async (req, res) => {
  try {
    const pool = await poolPromise;
    const canal = req.query.canal || null;
    const vendedor = req.query.vendedor || null;
    const periodo = req.query.periodo || null;
    const fechaInicio = req.query.fechaInicio || null;
    const fechaFin = req.query.fechaFin || null;

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

      SELECT TOP 50
          I.ItemCode AS Codigo_Producto,
          O.ItemName AS Nombre_Producto,
          O.U_Imagen AS Imagen,
          PN.Name AS PrimerNivel,
          CAT.Name AS Categoria,
          SUM(I.Quantity) AS Cantidad_Vendida,
          SUM(I.LineTotal) AS Total_Ventas,
          AVG(I.PriceAfVAT) AS Precio_Promedio_Venta,
          SUM(I.Quantity * O.AvgPrice) AS Costo_Total,
          SUM(I.LineTotal - (I.Quantity * O.AvgPrice)) AS Margen_Absoluto,
          CAST(
              (SUM(I.LineTotal - (I.Quantity * O.AvgPrice)) * 100.0) / NULLIF(SUM(I.LineTotal), 0)
              AS DECIMAL(18, 2)
          ) AS Margen_Porcentaje,
          (
            SELECT SUM(W.OnHand)
            FROM OITW W
            WHERE W.ItemCode = I.ItemCode
              AND (
                @CanalParam IS NULL AND W.WhsCode NOT IN ('02', '12')
                OR @CanalParam = 'Meli' AND W.WhsCode IN ('03', '05')
                OR @CanalParam = 'Falabella' AND W.WhsCode = '03'
                OR @CanalParam = 'Balmaceda' AND W.WhsCode = '07'
                OR @CanalParam IN ('Vitex', 'Chorrillo', 'Empresas') AND W.WhsCode = '01'
              )
          ) AS Stock_Disponible
      FROM INV1 I
      INNER JOIN OITM O ON I.ItemCode = O.ItemCode
      INNER JOIN OINV T0 ON I.DocEntry = T0.DocEntry
      LEFT JOIN [@PRIMER_NIVEL] PN ON PN.Code = O.U_Primer_Nivel
      LEFT JOIN [@CATEGORIA] CAT ON CAT.Code = O.U_Categoria
      WHERE 
          T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
          AND T0.CANCELED = 'N'
          AND O.AvgPrice > 0
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
      GROUP BY 
          I.ItemCode, O.ItemName, O.U_Imagen, O.U_Primer_Nivel, O.U_Categoria,
          PN.Name, CAT.Name
      ORDER BY Cantidad_Vendida DESC;
    `;

    const request = pool.request();
    request.input("CanalParamInput", sql.VarChar, canal);
    request.input("VendedorParamInput", sql.Int, vendedor);
    request.input("PeriodoParam", sql.VarChar, periodo);
    request.input("FechaInicioInput", sql.Date, fechaInicio);
    request.input("FechaFinInput", sql.Date, fechaFin);

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (error) {
    console.error("❌ Error al obtener productos detallados:", error);
    res.status(500).json({ error: "Error en el servidor." });
  }
};

const obtenerProductosDetallado = async (req, res) => {
  try {
    const pool = await poolPromise;

    const {
      canal = null,
      vendedor = null,
      periodo = null,
      fechaInicio = null,
      fechaFin = null,
      proveedor = null,
      primerNivel = null,
      categoria = null,
      subcategoria = null,
      limit = 100,
      offset = 0,
    } = req.query;

    const request = pool.request();
    request.input("CanalParamInput", sql.VarChar, canal);
    request.input("VendedorParamInput", sql.Int, vendedor);
    request.input("PeriodoParam", sql.VarChar, periodo);
    request.input("FechaInicioInput", sql.Date, fechaInicio);
    request.input("FechaFinInput", sql.Date, fechaFin);
    request.input("Proveedor", sql.VarChar, proveedor);
    request.input("PrimerNivel", sql.VarChar, primerNivel);
    request.input("Categoria", sql.VarChar, categoria);
    request.input("Subcategoria", sql.VarChar, subcategoria);
    request.input("Limit", sql.Int, limit);
    request.input("Offset", sql.Int, offset);

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

      ;WITH ProductosProveedor AS (
        SELECT DISTINCT POR1.ItemCode
        FROM POR1
        INNER JOIN OPOR ON OPOR.DocEntry = POR1.DocEntry
        WHERE @Proveedor IS NULL OR OPOR.CardCode = @Proveedor
      )
      SELECT
          I.ItemCode AS sku,
          O.ItemName AS nombre,
          O.U_Imagen AS imagen,
          PN.Name AS primerNivel,
          CAT.Name AS categoria,
          SUM(I.Quantity) AS cantidadVendida,
          SUM(I.LineTotal) AS totalVentas,
          AVG(I.PriceAfVAT) AS precioPromedio,
          SUM(I.Quantity * O.AvgPrice) AS costoTotal,
          SUM(I.LineTotal - (I.Quantity * O.AvgPrice)) AS margenBruto,
          CAST(
              (SUM(I.LineTotal - (I.Quantity * O.AvgPrice)) * 100.0) / NULLIF(SUM(I.LineTotal), 0)
              AS DECIMAL(18, 2)
          ) AS margenPorcentaje,
          (
            SELECT SUM(W.OnHand)
            FROM OITW W
            WHERE W.ItemCode = I.ItemCode
              AND (
                @CanalParam IS NULL AND W.WhsCode NOT IN ('02', '12')
                OR @CanalParam = 'Meli' AND W.WhsCode IN ('03', '05')
                OR @CanalParam = 'Falabella' AND W.WhsCode = '03'
                OR @CanalParam = 'Balmaceda' AND W.WhsCode = '07'
                OR @CanalParam IN ('Vitex', 'Chorrillo', 'Empresas') AND W.WhsCode = '01'
              )
          ) AS stock
      FROM INV1 I
      INNER JOIN OITM O ON I.ItemCode = O.ItemCode
      INNER JOIN OINV T0 ON I.DocEntry = T0.DocEntry
      LEFT JOIN [@PRIMER_NIVEL] PN ON PN.Code = O.U_Primer_Nivel
      LEFT JOIN [@CATEGORIA] CAT ON CAT.Code = O.U_Categoria
      WHERE 
          T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
          AND T0.CANCELED = 'N'
          AND O.AvgPrice > 0
          AND (@Proveedor IS NULL OR I.ItemCode IN (SELECT ItemCode FROM ProductosProveedor))
          AND (@PrimerNivel IS NULL OR O.U_Primer_Nivel = @PrimerNivel)
          AND (@Categoria IS NULL OR O.U_Categoria = @Categoria)
          AND (@Subcategoria IS NULL OR O.U_Subcategoria = @Subcategoria)
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
      GROUP BY 
          I.ItemCode, O.ItemName, O.U_Imagen, O.U_Primer_Nivel, O.U_Categoria,
          PN.Name, CAT.Name
      ORDER BY cantidadVendida DESC
      OFFSET @Offset ROWS
      FETCH NEXT @Limit ROWS ONLY;

      ;WITH ProductosProveedor AS (
        SELECT DISTINCT POR1.ItemCode
        FROM POR1
        INNER JOIN OPOR ON OPOR.DocEntry = POR1.DocEntry
        WHERE @Proveedor IS NULL OR OPOR.CardCode = @Proveedor
      )
      SELECT COUNT(DISTINCT I.ItemCode) AS Total
      FROM INV1 I
      INNER JOIN OITM O ON I.ItemCode = O.ItemCode
      INNER JOIN OINV T0 ON I.DocEntry = T0.DocEntry
      WHERE 
          T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
          AND T0.CANCELED = 'N'
          AND O.AvgPrice > 0
          AND (@Proveedor IS NULL OR I.ItemCode IN (SELECT ItemCode FROM ProductosProveedor))
          AND (@PrimerNivel IS NULL OR O.U_Primer_Nivel = @PrimerNivel)
          AND (@Categoria IS NULL OR O.U_Categoria = @Categoria)
          AND (@Subcategoria IS NULL OR O.U_Subcategoria = @Subcategoria)
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
          AND (@VendedorParam IS NULL OR T0.SlpCode = @VendedorParam);
    `;

    const result = await request.query(query);

    res.json({
      data: result.recordsets[0],
      total: result.recordsets[1]?.[0]?.Total || 0,
    });
  } catch (error) {
    console.error("❌ Error al obtener productos detallados:", error);
    res.status(500).json({ error: "Error en el servidor." });
  }
};

module.exports = {obtenerTransaccionesPeriodo, obtenerNotascredito, obtenerMargenCategoriasComparado,  
  obtenerTopProductos, obtenerVentasPeriodo, obtenerUnidadesVendidasPeriodo,obtenerProductosDistintosPeriodo,
  obtenerMargenVentas, obtenerTopProductosDetallado,obtenerProductosDetallado};


  