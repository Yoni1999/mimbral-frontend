const sql = require("mssql");
const { poolPromise } = require('../../models/db');

// Total Ventas por Subcategoría
const obtenerVentasPorSubcategoria = async (req, res) => {
  try {
    const pool = await poolPromise;

    const canal = req.query.canal || null;
    const vendedorEmpresa = req.query.vendedorEmpresa || null;
    const subcategoria = req.query.subcategoria || null;
    const periodo = req.query.periodo || "1D";
    const fechaInicio = req.query.fechaInicio || null;
    const fechaFin = req.query.fechaFin || null;

    const query = `
      DECLARE @CanalParam VARCHAR(50) = @CanalParamInput;
      DECLARE @VendedorEmpresaParam INT = @VendedorEmpresaInput;
      DECLARE @SubcategoriaParam INT = @SubcategoriaInput;
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
                  WHEN @Periodo = '1M' THEN DATEADD(MONTH, -1, @FechaFinActual)
                  WHEN @Periodo = '3M' THEN DATEADD(MONTH, -3, @FechaFinActual)
                  WHEN @Periodo = '6M' THEN DATEADD(MONTH, -6, @FechaFinActual)
                  WHEN @Periodo = '1A' THEN DATEADD(YEAR, -1, @FechaFinActual)
                  ELSE @FechaFinActual
              END;
      END;

      DECLARE @Dias INT = DATEDIFF(DAY, @FechaInicioActual, @FechaFinActual) + 1;
      SET @FechaFinAnterior = DATEADD(DAY, -1, @FechaInicioActual);
      SET @FechaInicioAnterior = DATEADD(DAY, -@Dias, @FechaInicioActual);

      WITH VentasPeriodo AS (
          SELECT 
              CAST(SUM(T1.LineTotal) AS DECIMAL(18, 2)) AS TotalVentasPeriodo
          FROM OINV T0
          INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
          INNER JOIN OITM I ON T1.ItemCode = I.ItemCode
          LEFT JOIN [@SUBCATEGORIA] S ON I.U_Subcategoria = S.Code
          WHERE 
              T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
              AND T0.CANCELED = 'N'
              AND (@SubcategoriaParam IS NULL OR I.U_Subcategoria = @SubcategoriaParam)
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
          FROM OINV T0
          INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
          INNER JOIN OITM I ON T1.ItemCode = I.ItemCode
          LEFT JOIN [@SUBCATEGORIA] S ON I.U_Subcategoria = S.Code
          WHERE 
              T0.DocDate BETWEEN @FechaInicioAnterior AND @FechaFinAnterior
              AND T0.CANCELED = 'N'
              AND (@SubcategoriaParam IS NULL OR I.U_Subcategoria = @SubcategoriaParam)
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
    request.input("SubcategoriaInput", sql.Int, subcategoria);
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
    console.error("❌ Error al obtener ventas por subcategoría:", error);
    res.status(500).json({ error: "Error en el servidor." });
  }
};

// Margen de ventas por subcategoría con comparación entre períodos
const obtenerMargenVentasPorSubcategoria = async (req, res) => {
  try {
    const pool = await poolPromise;

    const canal = req.query.canal || null;
    const vendedorEmpresa = req.query.vendedorEmpresa || null;
    const subcategoria = req.query.subcategoria || null;
    const periodo = req.query.periodo || "1D";
    const fechaInicio = req.query.fechaInicio || null;
    const fechaFin = req.query.fechaFin || null;

    const query = `
      DECLARE @CanalParam VARCHAR(50) = @CanalParamInput;
      DECLARE @VendedorEmpresaParam INT = @VendedorEmpresaInput;
      DECLARE @SubcategoriaParam INT = @SubcategoriaInput;
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
                  WHEN @Periodo = '1M' THEN DATEADD(MONTH, -1, @FechaFinActual)
                  WHEN @Periodo = '3M' THEN DATEADD(MONTH, -3, @FechaFinActual)
                  WHEN @Periodo = '6M' THEN DATEADD(MONTH, -6, @FechaFinActual)
                  WHEN @Periodo = '1A' THEN DATEADD(YEAR, -1, @FechaFinActual)
                  ELSE @FechaFinActual
              END;
      END;

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
          LEFT JOIN [@SUBCATEGORIA] S ON M.U_Subcategoria = S.Code
          WHERE 
              O.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
              AND O.CANCELED = 'N'
              AND (@SubcategoriaParam IS NULL OR M.U_Subcategoria = @SubcategoriaParam)
              AND (
                  @CanalParam IS NULL
                  OR (
                      (@CanalParam = 'Meli' AND ((I.WhsCode IN ('03', '05') AND O.SlpCode IN (426, 364, 355))
                          OR (I.WhsCode = '01' AND O.SlpCode IN (355, 398)) ))
                      OR (@CanalParam = 'Falabella' AND I.WhsCode = '03' AND O.SlpCode = 371)
                      OR (@CanalParam = 'Balmaceda' AND I.WhsCode = '07')
                      OR (@CanalParam = 'Vitex' AND I.WhsCode = '01' AND O.SlpCode IN (401, 397))
                      OR (@CanalParam = 'Chorrillo' AND I.WhsCode = '01' 
                          AND I.SlpCode NOT IN (401, 397, 355, 398, 227, 250, 205, 138, 209, 228, 226, 137, 212))
                      OR (@CanalParam = 'Empresas' AND I.WhsCode = '01' 
                          AND I.SlpCode IN (227, 250, 205, 138, 209, 228, 226, 137, 212))
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
          LEFT JOIN [@SUBCATEGORIA] S ON M.U_Subcategoria = S.Code
          WHERE 
              O.DocDate BETWEEN @FechaInicioAnterior AND @FechaFinAnterior
              AND O.CANCELED = 'N'
              AND (@SubcategoriaParam IS NULL OR M.U_Subcategoria = @SubcategoriaParam)
              AND (
                  @CanalParam IS NULL
                  OR (
                      (@CanalParam = 'Meli' AND ((I.WhsCode IN ('03', '05') AND O.SlpCode IN (426, 364, 355))
                          OR (I.WhsCode = '01' AND O.SlpCode IN (355, 398)) ))
                      OR (@CanalParam = 'Falabella' AND I.WhsCode = '03' AND O.SlpCode = 371)
                      OR (@CanalParam = 'Balmaceda' AND I.WhsCode = '07')
                      OR (@CanalParam = 'Vitex' AND I.WhsCode = '01' AND O.SlpCode IN (401, 397))
                      OR (@CanalParam = 'Chorrillo' AND I.WhsCode = '01' 
                          AND I.SlpCode NOT IN (401, 397, 355, 398, 227, 250, 205, 138, 209, 228, 226, 137, 212))
                      OR (@CanalParam = 'Empresas' AND I.WhsCode = '01' 
                          AND I.SlpCode IN (227, 250, 205, 138, 209, 228, 226, 137, 212))
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
    request.input("SubcategoriaInput", sql.Int, subcategoria);
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
    console.error("❌ Error al obtener margen por subcategoría:", error);
    res.status(500).json({ error: "Error en el servidor." });
  }
};
 // Cantidad de ventas por subcategoría (con comparación de períodos)
const obtenerCantidadVentasPorSubcategoria = async (req, res) => {
  try {
    const pool = await poolPromise;

    const canal = req.query.canal || null;
    const vendedorEmpresa = req.query.vendedorEmpresa || null;
    const subcategoria = req.query.subcategoria || null;
    const periodo = req.query.periodo || "1D";
    const fechaInicio = req.query.fechaInicio || null;
    const fechaFin = req.query.fechaFin || null;

    const query = `
      DECLARE @CanalParam VARCHAR(50) = @CanalParamInput;
      DECLARE @VendedorEmpresaParam INT = @VendedorEmpresaInput;
      DECLARE @SubcategoriaParam INT = @SubcategoriaInput;
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
                  WHEN @Periodo = '1M' THEN DATEADD(MONTH, -1, @FechaFinActual)
                  WHEN @Periodo = '3M' THEN DATEADD(MONTH, -3, @FechaFinActual)
                  WHEN @Periodo = '6M' THEN DATEADD(MONTH, -6, @FechaFinActual)
                  WHEN @Periodo = '1A' THEN DATEADD(YEAR, -1, @FechaFinActual)
                  ELSE @FechaFinActual
              END;
      END;

      DECLARE @Dias INT = DATEDIFF(DAY, @FechaInicioActual, @FechaFinActual) + 1;
      SET @FechaFinAnterior = DATEADD(DAY, -1, @FechaInicioActual);
      SET @FechaInicioAnterior = DATEADD(DAY, -@Dias, @FechaInicioActual);

      WITH TransaccionesPeriodo AS (
          SELECT COUNT(DISTINCT T0.DocEntry) AS CantidadTransacciones
          FROM OINV T0
          INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
          INNER JOIN OITM I ON T1.ItemCode = I.ItemCode
          LEFT JOIN [@SUBCATEGORIA] S ON I.U_Subcategoria = S.Code
          WHERE 
              T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
              AND T0.CANCELED = 'N'
              AND (@SubcategoriaParam IS NULL OR I.U_Subcategoria = @SubcategoriaParam)
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
          FROM OINV T0
          INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
          INNER JOIN OITM I ON T1.ItemCode = I.ItemCode
          LEFT JOIN [@SUBCATEGORIA] S ON I.U_Subcategoria = S.Code
          WHERE 
              T0.DocDate BETWEEN @FechaInicioAnterior AND @FechaFinAnterior
              AND T0.CANCELED = 'N'
              AND (@SubcategoriaParam IS NULL OR I.U_Subcategoria = @SubcategoriaParam)
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
    request.input("SubcategoriaInput", sql.Int, subcategoria);
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
    console.error("❌ Error al obtener cantidad de transacciones por subcategoría:", error);
    res.status(500).json({ error: "Error en el servidor." });
  }
};
  // Notas de crédito por subcategoría y productos devueltos con comparación
const obtenerNotasCreditoPorSubcategoria = async (req, res) => {
  try {
    const pool = await poolPromise;

    const canal = req.query.canal || null;
    const vendedorEmpresa = req.query.vendedorEmpresa || null;
    const subcategoria = req.query.subcategoria || null;
    const periodo = req.query.periodo || "1D";
    const fechaInicio = req.query.fechaInicio || null;
    const fechaFin = req.query.fechaFin || null;

    const query = `
      DECLARE @CanalParam VARCHAR(50) = @CanalParamInput;
      DECLARE @VendedorEmpresaParam INT = @VendedorEmpresaInput;
      DECLARE @SubcategoriaParam INT = @SubcategoriaInput;
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
            WHEN @Periodo = '1M' THEN DATEADD(MONTH, -1, @FechaFinActual)
            WHEN @Periodo = '3M' THEN DATEADD(MONTH, -3, @FechaFinActual)
            WHEN @Periodo = '6M' THEN DATEADD(MONTH, -6, @FechaFinActual)
            WHEN @Periodo = '1A' THEN DATEADD(YEAR, -1, @FechaFinActual)
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
        FROM ORIN T0
        INNER JOIN RIN1 T1 ON T0.DocEntry = T1.DocEntry
        INNER JOIN OITM I ON T1.ItemCode = I.ItemCode
        LEFT JOIN [@SUBCATEGORIA] S ON I.U_Subcategoria = S.Code
        WHERE 
          T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
          AND (@SubcategoriaParam IS NULL OR I.U_Subcategoria = @SubcategoriaParam)
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
          AND (@VendedorEmpresaParam IS NULL OR T0.SlpCode = @VendedorEmpresaParam)
      ),
      NC_PeriodoAnterior AS (
        SELECT 
          COUNT(DISTINCT T0.DocEntry) AS CantidadNotasCreditoAnterior,
          CAST(SUM(T1.Quantity) AS DECIMAL(18, 2)) AS CantidadProductosDevueltosAnterior
        FROM ORIN T0
        INNER JOIN RIN1 T1 ON T0.DocEntry = T1.DocEntry
        INNER JOIN OITM I ON T1.ItemCode = I.ItemCode
        LEFT JOIN [@SUBCATEGORIA] S ON I.U_Subcategoria = S.Code
        WHERE 
          T0.DocDate BETWEEN @FechaInicioAnterior AND @FechaFinAnterior
          AND (@SubcategoriaParam IS NULL OR I.U_Subcategoria = @SubcategoriaParam)
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
    request.input("SubcategoriaInput", sql.Int, subcategoria);
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
    console.error("❌ Error al obtener notas de crédito por subcategoría:", error);
    res.status(500).json({ error: "Error en el servidor." });
  }
};

 // Productos distintos vendidos por subcategoría (con comparación de períodos)
const obtenerItemsVendidosPorSubcategoria = async (req, res) => {
  try {
    const pool = await poolPromise;

    const canal = req.query.canal || null;
    const vendedorEmpresa = req.query.vendedorEmpresa || null;
    const subcategoria = req.query.subcategoria || null;
    const periodo = req.query.periodo || "1D";
    const fechaInicio = req.query.fechaInicio || null;
    const fechaFin = req.query.fechaFin || null;

    const query = `
      DECLARE @CanalParam VARCHAR(50) = @CanalParamInput;
      DECLARE @VendedorEmpresaParam INT = @VendedorEmpresaInput;
      DECLARE @SubcategoriaParam INT = @SubcategoriaInput;
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
            WHEN @Periodo = '1M' THEN DATEADD(MONTH, -1, @FechaFinActual)
            WHEN @Periodo = '3M' THEN DATEADD(MONTH, -3, @FechaFinActual)
            WHEN @Periodo = '6M' THEN DATEADD(MONTH, -6, @FechaFinActual)
            WHEN @Periodo = '1A' THEN DATEADD(YEAR, -1, @FechaFinActual)
            ELSE @FechaFinActual
          END;
      END;

      DECLARE @Dias INT = DATEDIFF(DAY, @FechaInicioActual, @FechaFinActual) + 1;
      SET @FechaFinAnterior = DATEADD(DAY, -1, @FechaInicioActual);
      SET @FechaInicioAnterior = DATEADD(DAY, -@Dias, @FechaInicioActual);

      WITH ProductosPeriodo AS (
        SELECT 
          COUNT(DISTINCT T1.ItemCode) AS ProductosDistintosVendidos
        FROM OINV T0
        INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
        INNER JOIN OITM I ON T1.ItemCode = I.ItemCode
        LEFT JOIN [@SUBCATEGORIA] S ON I.U_Subcategoria = S.Code
        WHERE 
          T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
          AND T0.CANCELED = 'N'
          AND (@SubcategoriaParam IS NULL OR I.U_Subcategoria = @SubcategoriaParam)
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
        SELECT 
          COUNT(DISTINCT T1.ItemCode) AS ProductosDistintosVendidosAnterior
        FROM OINV T0
        INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
        INNER JOIN OITM I ON T1.ItemCode = I.ItemCode
        LEFT JOIN [@SUBCATEGORIA] S ON I.U_Subcategoria = S.Code
        WHERE 
          T0.DocDate BETWEEN @FechaInicioAnterior AND @FechaFinAnterior
          AND T0.CANCELED = 'N'
          AND (@SubcategoriaParam IS NULL OR I.U_Subcategoria = @SubcategoriaParam)
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
    request.input("VendedorEmpresaInput", sql.Int, vendedorEmpresa);
    request.input("SubcategoriaInput", sql.Int, subcategoria);
    request.input("PeriodoParam", sql.VarChar, periodo);
    request.input("FechaInicioInput", sql.Date, fechaInicio);
    request.input("FechaFinInput", sql.Date, fechaFin);

    const result = await request.query(query);
    const data = result.recordset[0] || {
      ProductosPeriodoActual: 0,
      ProductosPeriodoAnterior: 0,
      PorcentajeCambio: 0
    };

    res.json(data);
  } catch (error) {
    console.error("❌ Error al obtener ítems vendidos por subcategoría:", error);
    res.status(500).json({ error: "Error en el servidor." });
  }
};
// Unidades vendidas por subcategoría (con comparación entre períodos)
const obtenerUnidadesVendidasPorSubcategoria = async (req, res) => {
  try {
    const pool = await poolPromise;

    const canal = req.query.canal || null;
    const vendedorEmpresa = req.query.vendedorEmpresa || null;
    const subcategoria = req.query.subcategoria || null;
    const periodo = req.query.periodo || "1D";
    const fechaInicio = req.query.fechaInicio || null;
    const fechaFin = req.query.fechaFin || null;

    const query = `
      DECLARE @CanalParam VARCHAR(50) = @CanalParamInput;
      DECLARE @VendedorEmpresaParam INT = @VendedorEmpresaInput;
      DECLARE @SubcategoriaParam INT = @SubcategoriaInput;
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
            WHEN @Periodo = '1M' THEN DATEADD(MONTH, -1, @FechaFinActual)
            WHEN @Periodo = '3M' THEN DATEADD(MONTH, -3, @FechaFinActual)
            WHEN @Periodo = '6M' THEN DATEADD(MONTH, -6, @FechaFinActual)
            WHEN @Periodo = '1A' THEN DATEADD(YEAR, -1, @FechaFinActual)
            ELSE @FechaFinActual
          END;
      END;

      DECLARE @Dias INT = DATEDIFF(DAY, @FechaInicioActual, @FechaFinActual) + 1;
      SET @FechaFinAnterior = DATEADD(DAY, -1, @FechaInicioActual);
      SET @FechaInicioAnterior = DATEADD(DAY, -@Dias, @FechaInicioActual);

      WITH UnidadesVendidasPeriodo AS (
        SELECT 
          CAST(SUM(T1.Quantity) AS INT) AS CantidadVendida
        FROM OINV T0
        INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
        INNER JOIN OITM I ON T1.ItemCode = I.ItemCode
        LEFT JOIN [@SUBCATEGORIA] S ON I.U_Subcategoria = S.Code
        WHERE 
          T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
          AND T0.CANCELED = 'N'
          AND (@SubcategoriaParam IS NULL OR I.U_Subcategoria = @SubcategoriaParam)
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
        FROM OINV T0
        INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
        INNER JOIN OITM I ON T1.ItemCode = I.ItemCode
        LEFT JOIN [@SUBCATEGORIA] S ON I.U_Subcategoria = S.Code
        WHERE 
          T0.DocDate BETWEEN @FechaInicioAnterior AND @FechaFinAnterior
          AND T0.CANCELED = 'N'
          AND (@SubcategoriaParam IS NULL OR I.U_Subcategoria = @SubcategoriaParam)
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
    request.input("VendedorEmpresaInput", sql.Int, vendedorEmpresa);
    request.input("SubcategoriaInput", sql.Int, subcategoria);
    request.input("PeriodoParam", sql.VarChar, periodo);
    request.input("FechaInicioInput", sql.Date, fechaInicio);
    request.input("FechaFinInput", sql.Date, fechaFin);

    const result = await request.query(query);
    const data = result.recordset[0] || {
      CantidadVendida: 0,
      CantidadVendidaAnterior: 0,
      PorcentajeCambio: 0
    };

    res.json(data);
  } catch (error) {
    console.error("❌ Error al obtener unidades vendidas por subcategoría:", error);
    res.status(500).json({ error: "Error en el servidor." });
  }
};
  // Ventas por fecha y canal para subcategoría (formato líneas para gráfico)
// Ventas por fecha y canal para subcategoría (formato líneas para gráfico)
const obtenerVentasLineasPorSubcategoria = async (req, res) => {
  try {
    const pool = await poolPromise;

    const subcategoria = req.query.subcategoria || null;
    const periodo = req.query.periodo || "1D";
    const fechaInicio = req.query.fechaInicio || null;
    const fechaFin = req.query.fechaFin || null;

    const query = `
      DECLARE @Periodo VARCHAR(10) = @PeriodoParam;
      DECLARE @FechaInicioCustom DATE = @FechaInicioInput;
      DECLARE @FechaFinCustom DATE = @FechaFinInput;
      DECLARE @SubcategoriaParam INT = @SubcategoriaInput;

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
                  WHEN @Periodo = '1D' THEN @FechaFin
                  WHEN @Periodo = '7D' THEN DATEADD(DAY, -6, @FechaFin)
                  WHEN @Periodo = '14D' THEN DATEADD(DAY, -13, @FechaFin)
                  WHEN @Periodo = '1M' THEN DATEADD(MONTH, -1, @FechaFin)
                  WHEN @Periodo = '3M' THEN DATEADD(MONTH, -3, @FechaFin)
                  WHEN @Periodo = '6M' THEN DATEADD(MONTH, -6, @FechaFin)
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
      LEFT JOIN [@SUBCATEGORIA] S ON ITM.U_Subcategoria = S.Code
      WHERE 
          OI.DocDate BETWEEN @FechaInicio AND @FechaFin
          AND OI.CANCELED = 'N'
          AND (@SubcategoriaParam IS NULL OR ITM.U_Subcategoria = @SubcategoriaParam) 
      GROUP BY 
          OI.DocDate
      ORDER BY 
          OI.DocDate ASC;
    `;

    const request = pool.request();
    request.input("PeriodoParam", sql.VarChar, periodo);
    request.input("FechaInicioInput", sql.Date, fechaInicio);
    request.input("FechaFinInput", sql.Date, fechaFin);
    request.input("SubcategoriaInput", sql.Int, subcategoria);

    const result = await request.query(query);
    const data = result.recordset || [];

    res.json(data);
  } catch (error) {
    console.error("❌ Error al obtener ventas por fecha y canal:", error);
    res.status(500).json({ error: "Error en el servidor." });
  }
};

  // Ventas por canal para una subcategoría (gráfico tipo dona o resumen total)
const obtenerVentasPorCanalSubcategoria = async (req, res) => {
    try {
      const pool = await poolPromise;
  
      const subcategoria = req.query.subcategoria || null;
      const periodo = req.query.periodo || "1D";
      const fechaInicio = req.query.fechaInicio || null;
      const fechaFin = req.query.fechaFin || null;
  
      const query = `
        DECLARE @Periodo VARCHAR(10) = @PeriodoParam;
        DECLARE @FechaInicioCustom DATE = @FechaInicioInput;
        DECLARE @FechaFinCustom DATE = @FechaFinInput;
        DECLARE @SubcategoriaParam INT = @SubcategoriaInput;
  
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
                    WHEN @Periodo = '1D' THEN @FechaFin
                    WHEN @Periodo = '7D' THEN DATEADD(DAY, -6, @FechaFin)
                    WHEN @Periodo = '14D' THEN DATEADD(DAY, -13, @FechaFin)
                    WHEN @Periodo = '1M' THEN DATEADD(MONTH, -1, @FechaFin)
                    WHEN @Periodo = '3M' THEN DATEADD(MONTH, -3, @FechaFin)
                    WHEN @Periodo = '6M' THEN DATEADD(MONTH, -6, @FechaFin)
                    ELSE @FechaFin
                END;
        END;
  
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
        LEFT JOIN [@SUBCATEGORIA] S ON ITM.U_Subcategoria = S.Code
        WHERE 
            OI.DocDate BETWEEN @FechaInicio AND @FechaFin
            AND OI.CANCELED = 'N'
            AND (@SubcategoriaParam IS NULL OR ITM.U_Subcategoria = @SubcategoriaParam);
      `;
  
      const request = pool.request();
      request.input("PeriodoParam", sql.VarChar, periodo);
      request.input("FechaInicioInput", sql.Date, fechaInicio);
      request.input("FechaFinInput", sql.Date, fechaFin);
      request.input("SubcategoriaInput", sql.Int, subcategoria);
  
      const result = await request.query(query);
      const data = result.recordset[0] || {
        Meli: 0,
        Falabella: 0,
        Balmaceda: 0,
        Vitex: 0,
        Chorrillo: 0,
        Empresas: 0
      };
  
      res.json(data);
    } catch (error) {
      console.error("❌ Error al obtener ventas por canal y subcategoría:", error);
      res.status(500).json({ error: "Error en el servidor." });
    }
  };
  // Top 10 productos más vendidos por subcategoría (con margen, unidades y ventas)
  const obtenerTopProductosSubcategoria = async (req, res) => {
    try {
      const pool = await poolPromise;
  
      const subcategoria = req.query.subcategoria || null;
      const canal = req.query.canal || null;
      const vendedor = req.query.vendedor || null;
      const periodo = req.query.periodo || "1D";
      const fechaInicio = req.query.fechaInicio || null;
      const fechaFin = req.query.fechaFin || null;
  
      const query = `
        DECLARE @Periodo VARCHAR(10) = @PeriodoParam;
        DECLARE @FechaInicioCustom DATE = @FechaInicioInput;
        DECLARE @FechaFinCustom DATE = @FechaFinInput;
        DECLARE @SubcategoriaParam INT = @SubcategoriaInput;
        DECLARE @CanalParam VARCHAR(50) = @CanalInput;
        DECLARE @VendedorParam INT = @VendedorInput;
  
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
            O.U_Imagen AS Imagen,  -- Agregado el campo U_Imagen
            SUM(I.Quantity) AS Cantidad_Vendida,
            SUM(I.LineTotal) AS Total_Ventas,
            SUM(I.Quantity * O.AvgPrice) AS Costo_Total,
            SUM(I.LineTotal - (I.Quantity * O.AvgPrice)) AS Margen_Absoluto,
            CAST((SUM(I.LineTotal - (I.Quantity * O.AvgPrice)) * 100.0) / NULLIF(SUM(I.LineTotal), 0) AS DECIMAL(18, 2)) AS Margen_Porcentaje
        FROM INV1 I
        INNER JOIN OITM O ON I.ItemCode = O.ItemCode
        LEFT JOIN [@SUBCATEGORIA] S ON O.U_Subcategoria = S.Code
        INNER JOIN OINV T0 ON I.DocEntry = T0.DocEntry
        WHERE 
            T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
            AND T0.CANCELED = 'N'
            AND O.AvgPrice > 0
            AND (@SubcategoriaParam IS NULL OR O.U_Subcategoria = @SubcategoriaParam)
            AND (
                @CanalParam IS NULL
                OR (
                    (@CanalParam = 'Meli' AND ((I.WhsCode IN ('03', '05') AND T0.SlpCode IN (426, 364, 355))
                        OR (I.WhsCode = '01' AND T0.SlpCode IN (355, 398))  ))
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
        ORDER BY Cantidad_Vendida DESC;
      `;
  
      const request = pool.request();
      request.input("PeriodoParam", sql.VarChar, periodo);
      request.input("FechaInicioInput", sql.Date, fechaInicio);
      request.input("FechaFinInput", sql.Date, fechaFin);
      request.input("SubcategoriaInput", sql.Int, subcategoria);
      request.input("CanalInput", sql.VarChar, canal);
      request.input("VendedorInput", sql.Int, vendedor);
  
      const result = await request.query(query);
      const data = result.recordset || [];
  
      res.json(data);
    } catch (error) {
      console.error("❌ Error al obtener top productos por subcategoría:", error);
      res.status(500).json({ error: "Error en el servidor." });
    }
  };
  
  // Top 10 productos más rentables por subcategoría (con márgenes y unidades)
  const obtenerTopRentablesSubcategoria = async (req, res) => {
    try {
      const pool = await poolPromise;
  
      const subcategoria = req.query.subcategoria || null;
      const canal = req.query.canal || null;
      const vendedor = req.query.vendedor || null;
      const periodo = req.query.periodo || "1D";
      const fechaInicio = req.query.fechaInicio || null;
      const fechaFin = req.query.fechaFin || null;
  
      const query = `
        DECLARE @Periodo VARCHAR(10) = @PeriodoParam;
        DECLARE @FechaInicioCustom DATE = @FechaInicioInput;
        DECLARE @FechaFinCustom DATE = @FechaFinInput;
        DECLARE @SubcategoriaParam INT = @SubcategoriaInput;
        DECLARE @CanalParam VARCHAR(50) = @CanalInput;
        DECLARE @VendedorParam INT = @VendedorInput;
  
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
          O.U_Imagen AS Imagen,  -- Se agrega la columna de imagen de OITM
  
          SUM(I.Quantity) AS Cantidad_Vendida,
          CAST(SUM(I.LineTotal) / NULLIF(SUM(I.Quantity), 0) AS DECIMAL(18,2)) AS Precio_Promedio,
          CAST(SUM(I.Quantity * O.AvgPrice) / NULLIF(SUM(I.Quantity), 0) AS DECIMAL(18,2)) AS Costo_Promedio,
  
          CAST((SUM(I.LineTotal - (I.Quantity * O.AvgPrice))) AS DECIMAL(18,2)) AS Margen_Absoluto,
          CAST((SUM(I.LineTotal - (I.Quantity * O.AvgPrice)) * 100.0) / NULLIF(SUM(I.LineTotal), 0) AS DECIMAL(5, 2)) AS Margen_Porcentaje,
  
          CAST((SUM(I.LineTotal) - SUM(I.Quantity * O.AvgPrice)) / NULLIF(SUM(I.Quantity), 0) AS DECIMAL(18,2)) AS Margen_Unitario
  
        FROM INV1 I
        INNER JOIN OITM O ON I.ItemCode = O.ItemCode
        INNER JOIN OINV T0 ON I.DocEntry = T0.DocEntry
        LEFT JOIN [@SUBCATEGORIA] S ON O.U_Subcategoria = S.Code
        WHERE 
          T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
          AND T0.CANCELED = 'N'
          AND O.AvgPrice > 0
          AND (@SubcategoriaParam IS NULL OR O.U_Subcategoria = @SubcategoriaParam)
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
      request.input("PeriodoParam", sql.VarChar, periodo);
      request.input("FechaInicioInput", sql.Date, fechaInicio);
      request.input("FechaFinInput", sql.Date, fechaFin);
      request.input("SubcategoriaInput", sql.Int, subcategoria);
      request.input("CanalInput", sql.VarChar, canal);
      request.input("VendedorInput", sql.Int, vendedor);
  
      const result = await request.query(query);
      const data = result.recordset || [];
  
      res.json(data);
    } catch (error) {
      console.error("❌ Error al obtener top rentables por subcategoría:", error);
      res.status(500).json({ error: "Error en el servidor." });
    }
  };
  


module.exports = {obtenerVentasPorSubcategoria, obtenerMargenVentasPorSubcategoria, obtenerCantidadVentasPorSubcategoria,
    obtenerNotasCreditoPorSubcategoria, obtenerItemsVendidosPorSubcategoria, obtenerUnidadesVendidasPorSubcategoria,
    obtenerVentasLineasPorSubcategoria, obtenerVentasPorCanalSubcategoria, obtenerTopProductosSubcategoria, obtenerTopRentablesSubcategoria
};
