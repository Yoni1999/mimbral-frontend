const sql = require("mssql");
const { poolPromise } = require('../../models/db');

// RESUMEN DE CATEGORÍAS

const obtenerCategorias = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        c.Code AS codigo,
        c.Name AS nombre,
        p.Name AS primerNivelNombre,
        c.U_Imagen as imagen
      FROM 
        [@CATEGORIA] c
      LEFT JOIN 
        [@PRIMER_NIVEL] p ON c.U_PRIMER_NIVEL = p.Code
      ORDER BY 
        c.Name;
    `);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    res.status(500).json({ error: "Error al obtener categorías" });
  }
};
const obtenerprimernivel = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT Code AS codigo, Name AS nombre, U_Imagen as imagen
      FROM [@PRIMER_NIVEL]
      ORDER BY Name
    `);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error al obtener categorías primer nivel :", error);
    res.status(500).json({ error: "Error al obtener datos" });
  }
};

const obtenertercernivel = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT Code AS codigo, Name AS nombre, U_Imagen as imagen
      FROM [@SUBCATEGORIA]
      ORDER BY Name
    `);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error al obtener categorías primer nivel :", error);
    res.status(500).json({ error: "Error al obtener datos" });
  }
};

// 1. Total Ventas por Categoría
const obtenerVentasPorCategoria = async (req, res) => {
  try {
    const pool = await poolPromise;

    const canal = req.query.canal || null;
    const vendedorEmpresa = req.query.vendedorEmpresa || null;
    const categoria = req.query.categoria || null;
    const periodo = req.query.periodo || "1D";
    const fechaInicio = req.query.fechaInicio || null;
    const fechaFin = req.query.fechaFin || null;

    const query = `
      DECLARE @CanalParam VARCHAR(50) = @CanalParamInput;
      DECLARE @VendedorEmpresaParam INT = @VendedorEmpresaInput;
      DECLARE @CategoriaParam INT = @CategoriaInput;
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
          WHERE 
              T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
              AND T0.CANCELED = 'N'
              AND (@CategoriaParam IS NULL OR I.U_Categoria = @CategoriaParam)
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
          WHERE 
              T0.DocDate BETWEEN @FechaInicioAnterior AND @FechaFinAnterior
              AND T0.CANCELED = 'N'
              AND (@CategoriaParam IS NULL OR I.U_Categoria = @CategoriaParam)
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
    request.input("CategoriaInput", sql.Int, categoria);
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
    console.error("❌ Error al obtener ventas por período:", error);
    res.status(500).json({ error: "Error en el servidor." });
  }
};


// MARGEN VENTAS POR CATEGORÍA
const obtenerMargenVentasPorCategoria = async (req, res) => {
  try {
    const pool = await poolPromise;

    const canal = req.query.canal || null;
    const vendedorEmpresa = req.query.vendedorEmpresa || null;
    const categoria = req.query.categoria || null;
    const periodo = req.query.periodo || "1D";
    const fechaInicio = req.query.fechaInicio || null;
    const fechaFin = req.query.fechaFin || null;

    const query = `
      DECLARE @CanalParam VARCHAR(50) = @CanalParamInput;
      DECLARE @VendedorEmpresaParam INT = @VendedorEmpresaInput;
      DECLARE @CategoriaParam INT = @CategoriaInput;
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
        WHERE 
          O.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
          AND O.CANCELED = 'N'
          AND (@CategoriaParam IS NULL OR M.U_Categoria = @CategoriaParam)
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
        WHERE 
          O.DocDate BETWEEN @FechaInicioAnterior AND @FechaFinAnterior
          AND O.CANCELED = 'N'
          AND (@CategoriaParam IS NULL OR M.U_Categoria = @CategoriaParam)
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
    request.input("CategoriaInput", sql.Int, categoria);
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
    console.error("❌ Error al obtener margen de ventas por período:", error);
    res.status(500).json({ error: "Error en el servidor." });
  }
};

const obtenerTransaccionesPeriodo = async (req, res) => {
  try {
    const pool = await poolPromise;

    const canal = req.query.canal || null;
    const vendedorEmpresa = req.query.vendedorEmpresa || null;
    const categoria = req.query.categoria || null;
    const periodo = req.query.periodo || "1D";
    const fechaInicio = req.query.fechaInicio || null;
    const fechaFin = req.query.fechaFin || null;

    const query = `
      DECLARE @CanalParam VARCHAR(50) = @CanalParamInput;
      DECLARE @VendedorEmpresaParam INT = @VendedorEmpresaInput;
      DECLARE @CategoriaParam INT = @CategoriaInput;
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
      END;

      DECLARE @Dias INT = DATEDIFF(DAY, @FechaInicioActual, @FechaFinActual) + 1;
      SET @FechaFinAnterior = DATEADD(DAY, -1, @FechaInicioActual);
      SET @FechaInicioAnterior = DATEADD(DAY, -@Dias, @FechaInicioActual);

      WITH TransaccionesPeriodo AS (
        SELECT COUNT(DISTINCT T0.DocEntry) AS CantidadTransacciones
        FROM [dbo].[OINV] T0
        INNER JOIN [dbo].[INV1] T1 ON T0.DocEntry = T1.DocEntry
        INNER JOIN [dbo].[OITM] I ON T1.ItemCode = I.ItemCode
        WHERE 
            T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
            AND T0.CANCELED = 'N'
            AND (@CategoriaParam IS NULL OR I.U_Categoria = @CategoriaParam)
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
        WHERE 
            T0.DocDate BETWEEN @FechaInicioAnterior AND @FechaFinAnterior
            AND T0.CANCELED = 'N'
            AND (@CategoriaParam IS NULL OR I.U_Categoria = @CategoriaParam)
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
    request.input("CategoriaInput", sql.Int, categoria);
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
    console.error("❌ Error al obtener transacciones por período:", error);
    res.status(500).json({ error: "Error en el servidor." });
  }
};



const obtenerNotasCreditoPorCategoria = async (req, res) => {
  try {
    const pool = await poolPromise;

    const canal = req.query.canal || null;
    const vendedorEmpresa = req.query.vendedorEmpresa || null;
    const categoria = req.query.categoria || null;
    const periodo = req.query.periodo || "1D";
    const fechaInicio = req.query.fechaInicio || null;
    const fechaFin = req.query.fechaFin || null;

    const query = `
      DECLARE @CanalParam VARCHAR(50) = @CanalParamInput;
      DECLARE @VendedorEmpresaParam INT = @VendedorEmpresaInput;
      DECLARE @CategoriaParam INT = @CategoriaInput;
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
        INNER JOIN [dbo].[OITM] I ON T1.ItemCode = I.ItemCode
        WHERE 
          T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
          AND (@CategoriaParam IS NULL OR I.U_Categoria = @CategoriaParam)
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
        WHERE 
          T0.DocDate BETWEEN @FechaInicioAnterior AND @FechaFinAnterior
          AND (@CategoriaParam IS NULL OR I.U_Categoria = @CategoriaParam)
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
    request.input("CategoriaInput", sql.Int, categoria);
    request.input("PeriodoParam", sql.VarChar, periodo);
    request.input("FechaInicioInput", sql.Date, fechaInicio);
    request.input("FechaFinInput", sql.Date, fechaFin);

    const result = await request.query(query);
    const data = result.recordset[0] || {
      CantidadNotasCreditoPeriodo: 0,
      CantidadNotasCreditoAnterior: 0,
      PorcentajeCambioNotasCredito: null,
      CantidadProductosDevueltosPeriodo: 0,
      CantidadProductosDevueltosAnterior: 0,
      PorcentajeCambioProductosDevueltos: null
    };

    res.json(data);
  } catch (error) {
    console.error("❌ Error al obtener notas de crédito por período:", error);
    res.status(500).json({ error: "Error en el servidor." });
  }
};

const obtenerProductosDistintosPorCategoria = async (req, res) => {
  try {
    const pool = await poolPromise;

    const canal = req.query.canal || null;
    const vendedorEmpresa = req.query.vendedorEmpresa || null;
    const categoria = req.query.categoria || null;
    const periodo = req.query.periodo || "1D";
    const fechaInicio = req.query.fechaInicio || null;
    const fechaFin = req.query.fechaFin || null;

    const query = `
      DECLARE @CanalParam VARCHAR(50) = @CanalParamInput;
      DECLARE @VendedorEmpresaParam INT = @VendedorEmpresaInput;
      DECLARE @CategoriaParam INT = @CategoriaInput;
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
                  WHEN @Periodo = '1D'  THEN @FechaFinActual
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

      WITH ProductosPeriodo AS (
          SELECT COUNT(DISTINCT T1.ItemCode) AS ProductosDistintosVendidos
          FROM [dbo].[OINV] T0
          INNER JOIN [dbo].[INV1] T1 ON T0.DocEntry = T1.DocEntry
          INNER JOIN [dbo].[OITM] I ON T1.ItemCode = I.ItemCode
          WHERE 
              T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
              AND T0.CANCELED = 'N'
              AND (@CategoriaParam IS NULL OR I.U_Categoria = @CategoriaParam)
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
      ProductosAnterior AS (
          SELECT COUNT(DISTINCT T1.ItemCode) AS ProductosDistintosVendidosAnterior
          FROM [dbo].[OINV] T0
          INNER JOIN [dbo].[INV1] T1 ON T0.DocEntry = T1.DocEntry
          INNER JOIN [dbo].[OITM] I ON T1.ItemCode = I.ItemCode
          WHERE 
              T0.DocDate BETWEEN @FechaInicioAnterior AND @FechaFinAnterior
              AND T0.CANCELED = 'N'
              AND (@CategoriaParam IS NULL OR I.U_Categoria = @CategoriaParam)
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
    request.input("CategoriaInput", sql.Int, categoria);
    request.input("PeriodoParam", sql.VarChar, periodo);
    request.input("FechaInicioInput", sql.Date, fechaInicio);
    request.input("FechaFinInput", sql.Date, fechaFin);

    const result = await request.query(query);
    const data = result.recordset[0] || {
      ProductosPeriodoActual: 0,
      ProductosPeriodoAnterior: 0,
      PorcentajeCambio: null
    };
    res.json(data);
  } catch (error) {
    console.error("❌ Error al obtener productos por categoría:", error);
    res.status(500).json({ error: "Error en el servidor." });
  }
};

const obtenerUnidadesVendidasPorCategoria = async (req, res) => {
  try {
    const {
      canal,
      vendedorEmpresa,
      periodo,
      fechaInicio,
      fechaFin,
      categoria,
    } = req.query;

    const pool = await poolPromise;
    const request = pool.request();

    request.input("CanalParam", sql.VarChar(50), canal || null);
    request.input("VendedorEmpresaParam", sql.Int, vendedorEmpresa || null);
    request.input("Periodo", sql.VarChar(10), periodo || null);
    request.input("FechaInicioCustom", sql.Date, fechaInicio || null);
    request.input("FechaFinCustom", sql.Date, fechaFin || null);
    request.input("CategoriaParam", sql.Int, categoria || null);

    const result = await request.query(`
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
          FROM OINV T0
          INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
          INNER JOIN OITM I ON T1.ItemCode = I.ItemCode
          WHERE 
              T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
              AND T0.CANCELED = 'N'
              AND (@CategoriaParam IS NULL OR I.U_Categoria = @CategoriaParam)
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
          FROM OINV T0
          INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
          INNER JOIN OITM I ON T1.ItemCode = I.ItemCode
          WHERE 
              T0.DocDate BETWEEN @FechaInicioAnterior AND @FechaFinAnterior
              AND T0.CANCELED = 'N'
              AND (@CategoriaParam IS NULL OR I.U_Categoria = @CategoriaParam)
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
    `);

    res.status(200).json(result.recordset[0]);
  } catch (error) {
    console.error("Error en obtenerUnidadesVendidasPorCategoria:", error);
    res.status(500).json({ error: "Error al obtener las unidades vendidas por categoría" });
  }
};

// Graficos
const obtenerVentasCanalPorFecha = async (req, res) => {
  try {
    const pool = await poolPromise;

    const periodo = req.query.periodo || null;
    const fechaInicio = req.query.fechaInicio || null;
    const fechaFin = req.query.fechaFin || null;
    const categoria = req.query.categoria || null; // lo dejamos como string porque es texto (nvarchar)

    const query = `
      DECLARE @Periodo VARCHAR(10) = @PeriodoParam;    
      DECLARE @FechaInicioCustom DATE = @FechaInicioInput;      
      DECLARE @FechaFinCustom DATE = @FechaFinInput;
      DECLARE @CategoriaParam NVARCHAR(50) = @CategoriaInput;  

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
                  WHEN @Periodo = '1D'  THEN @FechaFin
                  WHEN @Periodo = '7D'  THEN DATEADD(DAY, -6, @FechaFin)
                  WHEN @Periodo = '14D' THEN DATEADD(DAY, -13, @FechaFin)
                  WHEN @Periodo = '1M'  THEN DATEADD(MONTH, -1, @FechaFin)
                  WHEN @Periodo = '3M'  THEN DATEADD(MONTH, -3, @FechaFin)
                  WHEN @Periodo = '6M'  THEN DATEADD(MONTH, -6, @FechaFin)
                  WHEN @Periodo = '1A'  THEN DATEADD(YEAR, -1, @FechaFin)
                  ELSE @FechaFin
              END;
      END


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
      WHERE 
          OI.DocDate BETWEEN @FechaInicio AND @FechaFin
          AND OI.CANCELED = 'N'
          AND (@CategoriaParam IS NULL OR ITM.U_Categoria = @CategoriaParam) 
      GROUP BY 
          OI.DocDate
      ORDER BY 
          OI.DocDate ASC;
    `;

    const request = pool.request();
    request.input("PeriodoParam", sql.VarChar, periodo);
    request.input("FechaInicioInput", sql.Date, fechaInicio);
    request.input("FechaFinInput", sql.Date, fechaFin);
    request.input("CategoriaInput", sql.NVarChar, categoria || null); // 💡 nvarchar correcto aquí

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (error) {
    console.error("❌ Error al obtener ventas por fecha y canal:", error);
    res.status(500).json({ error: "Error en el servidor." });
  }
};

const obtenerVentasCanalChart = async (req, res) => {
  try {
    const pool = await poolPromise;

    const periodo = req.query.periodo || null;
    const fechaInicio = req.query.fechaInicio || null;
    const fechaFin = req.query.fechaFin || null;
    const categoria = req.query.categoria || null; // tipo nvarchar

    const query = `
      DECLARE @Periodo VARCHAR(10) = @PeriodoParam;
      DECLARE @FechaInicioCustom DATE = @FechaInicioInput;
      DECLARE @FechaFinCustom DATE = @FechaFinInput;
      DECLARE @CategoriaParam NVARCHAR(50) = @CategoriaInput;

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
                  WHEN @Periodo = '1D'  THEN @FechaFin
                  WHEN @Periodo = '7D'  THEN DATEADD(DAY, -6, @FechaFin)
                  WHEN @Periodo = '14D' THEN DATEADD(DAY, -13, @FechaFin)
                  WHEN @Periodo = '1M'  THEN DATEADD(MONTH, -1, @FechaFin)
                  WHEN @Periodo = '3M'  THEN DATEADD(MONTH, -3, @FechaFin)
                  WHEN @Periodo = '6M'  THEN DATEADD(MONTH, -6, @FechaFin)
                  WHEN @Periodo = '1A'  THEN DATEADD(YEAR, -1, @FechaFin)
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
      WHERE 
          OI.DocDate BETWEEN @FechaInicio AND @FechaFin
          AND OI.CANCELED = 'N'
          AND (@CategoriaParam IS NULL OR ITM.U_Categoria = @CategoriaParam);
    `;

    const request = pool.request();
    request.input("PeriodoParam", sql.VarChar, periodo);
    request.input("FechaInicioInput", sql.Date, fechaInicio);
    request.input("FechaFinInput", sql.Date, fechaFin);
    request.input("CategoriaInput", sql.NVarChar, categoria || null);

    const result = await request.query(query);
    res.json(result.recordset[0]); // Se espera solo un objeto (no array)
  } catch (error) {
    console.error("❌ Error al obtener datos de Ventas CanalChart:", error);
    res.status(500).json({ error: "Error en el servidor." });
  }
};
const obtenerTopSubcategorias = async (req, res) => {
  try {
    const pool = await poolPromise;

    const periodo = req.query.periodo || null;
    const fechaInicio = req.query.fechaInicio || null;
    const fechaFin = req.query.fechaFin || null;
    const categoria = req.query.categoria || null;

    const query = `
      DECLARE @Periodo VARCHAR(10) = @PeriodoParam;
      DECLARE @FechaInicioCustom DATE = @FechaInicioInput;
      DECLARE @FechaFinCustom DATE = @FechaFinInput;
      DECLARE @CategoriaParam INT = @CategoriaInput;

      DECLARE @FechaInicioActual DATE;
      DECLARE @FechaFinActual DATE;

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
                  WHEN @Periodo = '1A'  THEN DATEADD(YEAR, -1, @FechaFinActual)
                  ELSE @FechaFinActual
              END;
      END;

      SELECT 
          S.Code AS Codigo_SubCategoria,
          S.Name AS Nombre_SubCategoria,
          S.U_Imagen AS Imagen_URL,
          COUNT(DISTINCT T0.DocEntry) AS NumTransacciones,
          SUM(I.Quantity) AS Cantidad_Vendida,
          SUM(I.LineTotal) AS Total_Ventas
      FROM INV1 I
      INNER JOIN OITM O ON I.ItemCode = O.ItemCode
      INNER JOIN OINV T0 ON I.DocEntry = T0.DocEntry
      LEFT JOIN [@SUBCATEGORIA] S ON O.U_SubCategoria = S.Code
      WHERE 
          T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
          AND T0.CANCELED = 'N'
          AND O.AvgPrice > 0
          AND (@CategoriaParam IS NULL OR O.U_Categoria = @CategoriaParam)
      GROUP BY S.Code, S.Name, S.U_Imagen
      ORDER BY Total_Ventas DESC;
    `;

    const request = pool.request();
    request.input("PeriodoParam", sql.VarChar, periodo);
    request.input("FechaInicioInput", sql.Date, fechaInicio);
    request.input("FechaFinInput", sql.Date, fechaFin);
    request.input("CategoriaInput", sql.Int, categoria || null);

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (error) {
    console.error("❌ Error al obtener subcategorías más vendidas:", error);
    res.status(500).json({ error: "Error en el servidor al consultar subcategorías." });
  }
};
const obtenerTopRentables = async (req, res) => {
  try {
    const pool = await poolPromise;

    const canal = req.query.canal || null;
    const vendedor = req.query.vendedorEmpresa || null;
    const periodo = req.query.periodo || null;
    const fechaInicio = req.query.fechaInicio || null;
    const fechaFin = req.query.fechaFin || null;
    const categoria = req.query.categoria || null;

    const query = `
      DECLARE @CanalParam VARCHAR(50) = @CanalInput;
      DECLARE @VendedorParam INT = @VendedorInput;
      DECLARE @Periodo VARCHAR(10) = @PeriodoInput;
      DECLARE @FechaInicioCustom DATE = @FechaInicioInput;
      DECLARE @FechaFinCustom DATE = @FechaFinInput;
      DECLARE @CategoriaParam INT = @CategoriaInput;

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
          O.U_Imagen,
          SUM(I.Quantity) AS Cantidad_Vendida,
          CAST(SUM(I.LineTotal) / NULLIF(SUM(I.Quantity), 0) AS DECIMAL(18,2)) AS Precio_Promedio,
          CAST(SUM(I.Quantity * O.AvgPrice) / NULLIF(SUM(I.Quantity), 0) AS DECIMAL(18,2)) AS Costo_Promedio,
          CAST(SUM(I.LineTotal - (I.Quantity * O.AvgPrice)) AS DECIMAL(18,2)) AS Margen_Absoluto,
          CAST((SUM(I.LineTotal - (I.Quantity * O.AvgPrice)) * 100.0) / NULLIF(SUM(I.LineTotal), 0) AS DECIMAL(5, 2)) AS Margen_Porcentaje,
          CAST((SUM(I.LineTotal - I.Quantity * O.AvgPrice) / NULLIF(SUM(I.Quantity), 0)) AS DECIMAL(18,2)) AS Margen_Unitario
      FROM INV1 I
      INNER JOIN OITM O ON I.ItemCode = O.ItemCode
      INNER JOIN OINV T0 ON I.DocEntry = T0.DocEntry
      WHERE 
          T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
          AND T0.CANCELED = 'N'
          AND O.AvgPrice > 0
          AND (@CategoriaParam IS NULL OR O.U_Categoria = @CategoriaParam)
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
    request.input("CanalInput", sql.VarChar, canal);
    request.input("VendedorInput", sql.Int, vendedor ? parseInt(vendedor) : null);
    request.input("PeriodoInput", sql.VarChar, periodo);
    request.input("FechaInicioInput", sql.Date, fechaInicio);
    request.input("FechaFinInput", sql.Date, fechaFin);
    request.input("CategoriaInput", sql.Int, categoria ? parseInt(categoria) : null);

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (error) {
    console.error("❌ Error al obtener top productos rentables:", error);
    res.status(500).json({ error: "Error en el servidor al consultar productos rentables." });
  }
};




module.exports = {obtenerVentasPorCategoria, obtenerCategorias,
obtenerMargenVentasPorCategoria, obtenerTransaccionesPeriodo, 
obtenerNotasCreditoPorCategoria, obtenerProductosDistintosPorCategoria,
obtenerUnidadesVendidasPorCategoria, obtenerVentasCanalPorFecha,obtenerVentasCanalChart,
obtenerTopSubcategorias, obtenerTopRentables,obtenerprimernivel,obtenertercernivel 
};
