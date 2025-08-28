/*const { sql, poolPromise } = require("../../models/db");

async function obtenerProductosDetalladoDB(params) {
  const {
    canalesCsv,
    skuCsv,
    vendedor,
    periodo,
    fechaInicio,
    fechaFin,
    proveedor,
    primerNivel,
    categoria,
    subcategoria,
    tipoEnvio,
    limit,
    offset,
    aplicarPaginacion,
    campoOrden,
    direccionOrden,
  } = params;

  const pool = await poolPromise;
  const request = pool.request();

  // ====== INPUTS SQL ======
  request.input("CanalParamInput", sql.VarChar, null); // legacy (no se usa en multi-canal)
  request.input("VendedorParamInput", sql.Int, vendedor);
  request.input("PeriodoParam", sql.VarChar, periodo);
  request.input("FechaInicioInput", sql.Date, fechaInicio);
  request.input("FechaFinInput", sql.Date, fechaFin);
  request.input("Proveedor", sql.VarChar, proveedor);
  request.input("PrimerNivel", sql.VarChar, primerNivel);
  request.input("Categoria", sql.VarChar, categoria);
  request.input("Subcategoria", sql.VarChar, subcategoria);
  request.input("TipoEnvio", sql.VarChar, tipoEnvio);
  request.input("Limit", sql.Int, limit);
  request.input("Offset", sql.Int, offset);

  // NUEVOS
  request.input("CanalesCsv", sql.NVarChar, canalesCsv);
  request.input("SkusCsv", sql.NVarChar, skuCsv);

  const paginacionSQL = aplicarPaginacion
    ? "OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY"
    : "";

  // ====== QUERY (sin DECLARE duplicados de @CanalesCsv y @SkusCsv) ======
  const query = `
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
                WHEN @Periodo = '1D' THEN @FechaFinActual
                WHEN @Periodo = '7D' THEN DATEADD(DAY, -6, @FechaFinActual)
                WHEN @Periodo = '14D' THEN DATEADD(DAY, -13, @FechaFinActual)
                WHEN @Periodo = '1M' THEN DATEADD(MONTH, -1, @FechaFinActual)
                WHEN @Periodo = '3M' THEN DATEADD(MONTH, -3, @FechaFinActual)
                WHEN @Periodo = '6M' THEN DATEADD(MONTH, -6, @FechaFinActual)
                ELSE @FechaFinActual
            END;
    END;

    -- ====== Multi-canal ======
    DECLARE @HasCanal BIT = IIF(@CanalesCsv IS NULL OR LTRIM(RTRIM(@CanalesCsv)) = '', 0, 1);

    DECLARE @HasMeli       BIT = IIF(EXISTS (SELECT 1 FROM STRING_SPLIT(@CanalesCsv, ',') WHERE LTRIM(RTRIM(value)) = 'Meli'), 1, 0);
    DECLARE @HasFalabella  BIT = IIF(EXISTS (SELECT 1 FROM STRING_SPLIT(@CanalesCsv, ',') WHERE LTRIM(RTRIM(value)) = 'Falabella'), 1, 0);
    DECLARE @HasBalmaceda  BIT = IIF(EXISTS (SELECT 1 FROM STRING_SPLIT(@CanalesCsv, ',') WHERE LTRIM(RTRIM(value)) = 'Balmaceda'), 1, 0);
    DECLARE @HasVitex      BIT = IIF(EXISTS (SELECT 1 FROM STRING_SPLIT(@CanalesCsv, ',') WHERE LTRIM(RTRIM(value)) = 'Vitex'), 1, 0);
    DECLARE @HasChorrillo  BIT = IIF(EXISTS (SELECT 1 FROM STRING_SPLIT(@CanalesCsv, ',') WHERE LTRIM(RTRIM(value)) = 'Chorrillo'), 1, 0);
    DECLARE @HasEmpresas   BIT = IIF(EXISTS (SELECT 1 FROM STRING_SPLIT(@CanalesCsv, ',') WHERE LTRIM(RTRIM(value)) = 'Empresas'), 1, 0);

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
        COUNT(DISTINCT T0.DocEntry) AS facturasUnicas,
        AVG(I.PriceAfVAT) AS precioPromedio,
        SUM(I.Quantity * I.StockPrice) AS costoTotal,
        SUM(I.LineTotal - (I.Quantity * I.StockPrice)) AS margenBruto,
        CAST(
            (SUM(I.LineTotal - (I.Quantity * I.StockPrice)) * 100.0) / NULLIF(SUM(I.LineTotal), 0)
            AS DECIMAL(18, 2)
        ) AS margenPorcentaje,

        -- stockCanal multi-canal
        (
          SELECT SUM(W.OnHand)
          FROM OITW W
          WHERE W.ItemCode = I.ItemCode
            AND (
              (@HasCanal = 0 AND W.WhsCode NOT IN ('02', '12'))
              OR (@HasMeli = 1 AND (
                    (@TipoEnvio = 'full'    AND W.WhsCode = '05')
                 OR (@TipoEnvio = 'colecta' AND W.WhsCode = '03')
                 OR (@TipoEnvio IS NULL     AND W.WhsCode IN ('03','05'))
              ))
              OR (@HasFalabella = 1 AND W.WhsCode = '03')
              OR (@HasBalmaceda = 1 AND W.WhsCode = '07')
              OR (@HasVitex     = 1 AND W.WhsCode = '01')
              OR (@HasChorrillo = 1 AND W.WhsCode = '01')
              OR (@HasEmpresas  = 1 AND W.WhsCode = '01')
            )
        ) AS stockCanal,

        -- stockChorrillo
        (
          SELECT SUM(W.OnHand)
          FROM OITW W
          WHERE W.ItemCode = I.ItemCode
            AND W.WhsCode = '01'
        ) AS stockChorrillo,

        -- stockOnOrder
        (
          SELECT SUM(W.OnOrder)
          FROM OITW W
          WHERE W.ItemCode = I.ItemCode
        ) AS stockOnOrder

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
        AND ( @SkusCsv IS NULL OR I.ItemCode IN (SELECT LTRIM(RTRIM(value)) FROM STRING_SPLIT(@SkusCsv, ',')) )
        AND (
          @HasCanal = 0
          OR (
            -- MELI
            ( @HasMeli = 1 AND (
                (I.WhsCode IN ('03','05') AND T0.SlpCode IN (426, 364, 355) AND
                    (
                      @TipoEnvio IS NULL
                      OR (@TipoEnvio = 'full'    AND I.WhsCode = '05' AND I.SlpCode = 355)
                      OR (@TipoEnvio = 'colecta' AND I.WhsCode = '03' AND I.SlpCode = 355)
                    )
                )
                OR (I.WhsCode = '01' AND T0.SlpCode IN (355, 398))
              )
            )
            -- Falabella
            OR ( @HasFalabella = 1 AND I.WhsCode = '03' AND T0.SlpCode = 371 )
            -- Balmaceda
            OR ( @HasBalmaceda = 1 AND I.WhsCode = '07' )
            -- Vitex
            OR ( @HasVitex = 1 AND I.WhsCode = '01' AND T0.SlpCode IN (401, 397) )
            -- Chorrillo
            OR ( @HasChorrillo = 1 AND I.WhsCode = '01'
                 AND I.SlpCode NOT IN (401, 397, 355, 398, 227, 250, 205, 138, 209, 228, 226, 137, 212) )
            -- Empresas
            OR ( @HasEmpresas = 1 AND I.WhsCode = '01'
                 AND I.SlpCode IN (227, 250, 205, 138, 209, 228, 226, 137, 212) )
          )
        )
        AND (@VendedorParam IS NULL OR I.SlpCode = @VendedorParam)
    GROUP BY
        I.ItemCode, O.ItemName, O.U_Imagen, O.U_Primer_Nivel, O.U_Categoria,
        PN.Name, CAT.Name
    ORDER BY ${campoOrden} ${direccionOrden}
    ${paginacionSQL};

    -- ====== Conteo total ======
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
        AND ( @SkusCsv IS NULL OR I.ItemCode IN (SELECT LTRIM(RTRIM(value)) FROM STRING_SPLIT(@SkusCsv, ',')) )
        AND (
          @HasCanal = 0
          OR (
            ( @HasMeli = 1 AND (
                (I.WhsCode IN ('03','05') AND T0.SlpCode IN (426, 364, 355) AND
                    (
                      @TipoEnvio IS NULL
                      OR (@TipoEnvio = 'full'    AND I.WhsCode = '05' AND I.SlpCode = 355)
                      OR (@TipoEnvio = 'colecta' AND I.WhsCode = '03' AND I.SlpCode = 355)
                    )
                )
                OR (I.WhsCode = '01' AND T0.SlpCode IN (355, 398))
              )
            )
            OR ( @HasFalabella = 1 AND I.WhsCode = '03' AND T0.SlpCode = 371 )
            OR ( @HasBalmaceda = 1 AND I.WhsCode = '07' )
            OR ( @HasVitex = 1 AND I.WhsCode = '01' AND T0.SlpCode IN (401, 397) )
            OR ( @HasChorrillo = 1 AND I.WhsCode = '01'
                 AND I.SlpCode NOT IN (401, 397, 355, 398, 227, 250, 205, 138, 209, 228, 226, 137, 212) )
            OR ( @HasEmpresas = 1 AND I.WhsCode = '01'
                 AND I.SlpCode IN (227, 250, 205, 138, 209, 228, 226, 137, 212) )
          )
        )
        AND (@VendedorParam IS NULL OR I.SlpCode = @VendedorParam);
  `;

  const result = await request.query(query);
  return {
    data: result.recordsets[0],
    total: result.recordsets[1]?.[0]?.Total || 0,
  };
}

module.exports = { obtenerProductosDetalladoDB };
*/
const { sql, poolPromise } = require("../../models/db");

async function obtenerProductosDetalladoDB(params) {
  const {
    canalesCsv,
    skuCsv,
    vendedor,
    periodo,
    fechaInicio,
    fechaFin,
    proveedor,
    primerNivel,
    categoria,
    subcategoria,
    tipoEnvio,
    limit,
    offset,
    aplicarPaginacion,
    campoOrden,
    direccionOrden,
  } = params;

  const pool = await poolPromise;
  const request = pool.request();

  // ====== INPUTS SQL ======
  request.input("CanalParamInput", sql.VarChar, null); // legacy (no se usa en multi-canal)
  request.input("VendedorParamInput", sql.Int, vendedor);
  request.input("PeriodoParam", sql.VarChar, periodo);
  request.input("FechaInicioInput", sql.Date, fechaInicio);
  request.input("FechaFinInput", sql.Date, fechaFin);
  request.input("Proveedor", sql.VarChar, proveedor);
  request.input("PrimerNivel", sql.VarChar, primerNivel);
  request.input("Categoria", sql.VarChar, categoria);
  request.input("Subcategoria", sql.VarChar, subcategoria);
  request.input("TipoEnvio", sql.VarChar, tipoEnvio);
  request.input("Limit", sql.Int, limit);
  request.input("Offset", sql.Int, offset);

  // NUEVOS
  request.input("CanalesCsv", sql.NVarChar, canalesCsv);
  request.input("SkusCsv", sql.NVarChar, skuCsv);

  const paginacionSQL = aplicarPaginacion
    ? "OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY"
    : "";

  const query = `
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
                WHEN @Periodo = '1D' THEN @FechaFinActual
                WHEN @Periodo = '7D' THEN DATEADD(DAY, -6, @FechaFinActual)
                WHEN @Periodo = '14D' THEN DATEADD(DAY, -13, @FechaFinActual)
                WHEN @Periodo = '1M' THEN DATEADD(MONTH, -1, @FechaFinActual)
                WHEN @Periodo = '3M' THEN DATEADD(MONTH, -3, @FechaFinActual)
                WHEN @Periodo = '6M' THEN DATEADD(MONTH, -6, @FechaFinActual)
                ELSE @FechaFinActual
            END;
    END;

    -- ====== Multi-canal ======
    DECLARE @HasCanal BIT = IIF(@CanalesCsv IS NULL OR LTRIM(RTRIM(@CanalesCsv)) = '', 0, 1);

    DECLARE @HasMeli       BIT = IIF(EXISTS (SELECT 1 FROM STRING_SPLIT(@CanalesCsv, ',') WHERE LTRIM(RTRIM(value)) = 'Meli'), 1, 0);
    DECLARE @HasFalabella  BIT = IIF(EXISTS (SELECT 1 FROM STRING_SPLIT(@CanalesCsv, ',') WHERE LTRIM(RTRIM(value)) = 'Falabella'), 1, 0);
    DECLARE @HasBalmaceda  BIT = IIF(EXISTS (SELECT 1 FROM STRING_SPLIT(@CanalesCsv, ',') WHERE LTRIM(RTRIM(value)) = 'Balmaceda'), 1, 0);
    DECLARE @HasVitex      BIT = IIF(EXISTS (SELECT 1 FROM STRING_SPLIT(@CanalesCsv, ',') WHERE LTRIM(RTRIM(value)) = 'Vitex'), 1, 0);
    DECLARE @HasChorrillo  BIT = IIF(EXISTS (SELECT 1 FROM STRING_SPLIT(@CanalesCsv, ',') WHERE LTRIM(RTRIM(value)) = 'Chorrillo'), 1, 0);
    DECLARE @HasEmpresas   BIT = IIF(EXISTS (SELECT 1 FROM STRING_SPLIT(@CanalesCsv, ',') WHERE LTRIM(RTRIM(value)) = 'Empresas'), 1, 0);

    /* ===============================
       1) LISTADO PRINCIPAL (por SKU)
       =============================== */
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
        COUNT(DISTINCT T0.DocEntry) AS facturasUnicas,
        AVG(I.PriceAfVAT) AS precioPromedio,
        SUM(I.Quantity * I.StockPrice) AS costoTotal,
        SUM(I.LineTotal - (I.Quantity * I.StockPrice)) AS margenBruto,
        CAST(
            (SUM(I.LineTotal - (I.Quantity * I.StockPrice)) * 100.0) / NULLIF(SUM(I.LineTotal), 0)
            AS DECIMAL(18, 2)
        ) AS margenPorcentaje,

        -- stockCanal total (sin doble conteo)
        (
          SELECT SUM(W.OnHand)
          FROM OITW W
          WHERE W.ItemCode = I.ItemCode
            AND (
              (@HasCanal = 0 AND W.WhsCode NOT IN ('02', '12'))
              OR (@HasMeli = 1 AND (
                    (@TipoEnvio = 'full'    AND W.WhsCode = '05')
                 OR (@TipoEnvio = 'colecta' AND W.WhsCode = '03')
                 OR (@TipoEnvio IS NULL     AND W.WhsCode IN ('03','05'))
              ))
              OR (@HasFalabella = 1 AND W.WhsCode = '03')
              OR (@HasBalmaceda = 1 AND W.WhsCode = '07')
              OR (@HasVitex     = 1 AND W.WhsCode = '01')
              OR (@HasChorrillo = 1 AND W.WhsCode = '01')
              OR (@HasEmpresas  = 1 AND W.WhsCode = '01')
            )
        ) AS stockCanal,

        -- stockChorrillo
        (
          SELECT SUM(W.OnHand)
          FROM OITW W
          WHERE W.ItemCode = I.ItemCode
            AND W.WhsCode = '01'
        ) AS stockChorrillo,

        -- stockOnOrder
        (
          SELECT SUM(W.OnOrder)
          FROM OITW W
          WHERE W.ItemCode = I.ItemCode
        ) AS stockOnOrder

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
        AND ( @SkusCsv IS NULL OR I.ItemCode IN (SELECT LTRIM(RTRIM(value)) FROM STRING_SPLIT(@SkusCsv, ',')) )
        AND (
          @HasCanal = 0
          OR (
            -- MELI
            ( @HasMeli = 1 AND (
                (I.WhsCode IN ('03','05') AND T0.SlpCode IN (426, 364, 355) AND
                    (
                      @TipoEnvio IS NULL
                      OR (@TipoEnvio = 'full'    AND I.WhsCode = '05' AND I.SlpCode = 355)
                      OR (@TipoEnvio = 'colecta' AND I.WhsCode = '03' AND I.SlpCode = 355)
                    )
                )
                OR (I.WhsCode = '01' AND T0.SlpCode IN (355, 398))
              )
            )
            -- Falabella
            OR ( @HasFalabella = 1 AND I.WhsCode = '03' AND T0.SlpCode = 371 )
            -- Balmaceda
            OR ( @HasBalmaceda = 1 AND I.WhsCode = '07' )
            -- Vitex
            OR ( @HasVitex = 1 AND I.WhsCode = '01' AND T0.SlpCode IN (401, 397) )
            -- Chorrillo
            OR ( @HasChorrillo = 1 AND I.WhsCode = '01'
                 AND I.SlpCode NOT IN (401, 397, 355, 398, 227, 250, 205, 138, 209, 228, 226, 137, 212) )
            -- Empresas
            OR ( @HasEmpresas = 1 AND I.WhsCode = '01'
                 AND I.SlpCode IN (227, 250, 205, 138, 209, 228, 226, 137, 212) )
          )
        )
        AND (@VendedorParam IS NULL OR I.SlpCode = @VendedorParam)
    GROUP BY
        I.ItemCode, O.ItemName, O.U_Imagen, O.U_Primer_Nivel, O.U_Categoria,
        PN.Name, CAT.Name
    ORDER BY ${campoOrden} ${direccionOrden}
    ${paginacionSQL};

    /* ==========================
       2) CONTEO TOTAL DE SKUs
       ========================== */
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
        AND ( @SkusCsv IS NULL OR I.ItemCode IN (SELECT LTRIM(RTRIM(value)) FROM STRING_SPLIT(@SkusCsv, ',')) )
        AND (
          @HasCanal = 0
          OR (
            ( @HasMeli = 1 AND (
                (I.WhsCode IN ('03','05') AND T0.SlpCode IN (426, 364, 355) AND
                    (
                      @TipoEnvio IS NULL
                      OR (@TipoEnvio = 'full'    AND I.WhsCode = '05' AND I.SlpCode = 355)
                      OR (@TipoEnvio = 'colecta' AND I.WhsCode = '03' AND I.SlpCode = 355)
                    )
                )
                OR (I.WhsCode = '01' AND T0.SlpCode IN (355, 398))
              )
            )
            OR ( @HasFalabella = 1 AND I.WhsCode = '03' AND T0.SlpCode = 371 )
            OR ( @HasBalmaceda = 1 AND I.WhsCode = '07' )
            OR ( @HasVitex = 1 AND I.WhsCode = '01' AND T0.SlpCode IN (401, 397) )
            OR ( @HasChorrillo = 1 AND I.WhsCode = '01'
                 AND I.SlpCode NOT IN (401, 397, 355, 398, 227, 250, 205, 138, 209, 228, 226, 137, 212) )
            OR ( @HasEmpresas = 1 AND I.WhsCode = '01'
                 AND I.SlpCode IN (227, 250, 205, 138, 209, 228, 226, 137, 212) )
          )
        )
        AND (@VendedorParam IS NULL OR I.SlpCode = @VendedorParam);

    /* ======================================
       3) BREAKDOWN POR CANAL (SKU + Canal)
       ====================================== */
    ;WITH ProductosProveedor AS (
      SELECT DISTINCT POR1.ItemCode
      FROM POR1
      INNER JOIN OPOR ON OPOR.DocEntry = POR1.DocEntry
      WHERE @Proveedor IS NULL OR OPOR.CardCode = @Proveedor
    )
    SELECT
        I.ItemCode AS sku,
        C.Canal,
        SUM(I.Quantity)                         AS cantidadVendida,
        SUM(I.LineTotal)                        AS totalVentas,
        COUNT(DISTINCT T0.DocEntry)             AS facturasUnicas,
        AVG(I.PriceAfVAT)                       AS precioPromedio,
        SUM(I.Quantity * I.StockPrice)          AS costoTotal,
        SUM(I.LineTotal - (I.Quantity * I.StockPrice)) AS margenBruto,
        CAST(
            (SUM(I.LineTotal - (I.Quantity * I.StockPrice)) * 100.0)
              / NULLIF(SUM(I.LineTotal), 0)
            AS DECIMAL(18, 2)
        ) AS margenPorcentaje,

        -- stock mapeado por canal (puede coincidir si comparten warehouse)
        (
          SELECT SUM(W.OnHand)
          FROM OITW W
          WHERE W.ItemCode = I.ItemCode
            AND (
              (C.Canal = 'Meli' AND (
                  (@TipoEnvio = 'full'    AND W.WhsCode = '05')
               OR (@TipoEnvio = 'colecta' AND W.WhsCode = '03')
               OR (@TipoEnvio IS NULL     AND W.WhsCode IN ('03','05'))
              ))
              OR (C.Canal = 'Falabella' AND W.WhsCode = '03')
              OR (C.Canal = 'Balmaceda' AND W.WhsCode = '07')
              OR (C.Canal IN ('Vitex','Chorrillo','Empresas') AND W.WhsCode = '01')
            )
        ) AS stockCanal

    FROM INV1 I
    INNER JOIN OITM O ON I.ItemCode = O.ItemCode
    INNER JOIN OINV T0 ON I.DocEntry = T0.DocEntry
    CROSS APPLY (
      SELECT CASE
        WHEN (
          (I.WhsCode IN ('03','05') AND T0.SlpCode IN (426, 364, 355) AND
            (
              @TipoEnvio IS NULL
              OR (@TipoEnvio = 'full'    AND I.WhsCode = '05' AND I.SlpCode = 355)
              OR (@TipoEnvio = 'colecta' AND I.WhsCode = '03' AND I.SlpCode = 355)
            )
          )
          OR (I.WhsCode = '01' AND T0.SlpCode IN (355, 398))
        ) THEN 'Meli'
        WHEN (I.WhsCode = '03' AND T0.SlpCode = 371) THEN 'Falabella'
        WHEN (I.WhsCode = '07') THEN 'Balmaceda'
        WHEN (I.WhsCode = '01' AND T0.SlpCode IN (401, 397)) THEN 'Vitex'
        WHEN (I.WhsCode = '01'
              AND I.SlpCode NOT IN (401, 397, 355, 398, 227, 250, 205, 138, 209, 228, 226, 137, 212)) THEN 'Chorrillo'
        WHEN (I.WhsCode = '01'
              AND I.SlpCode IN (227, 250, 205, 138, 209, 228, 226, 137, 212)) THEN 'Empresas'
        ELSE NULL
      END AS Canal
    ) AS C
    WHERE
        T0.DocDate BETWEEN @FechaInicioActual AND @FechaFinActual
        AND T0.CANCELED = 'N'
        AND O.AvgPrice > 0
        AND C.Canal IS NOT NULL
        AND (@Proveedor IS NULL OR I.ItemCode IN (SELECT ItemCode FROM ProductosProveedor))
        AND (@PrimerNivel IS NULL OR O.U_Primer_Nivel = @PrimerNivel)
        AND (@Categoria IS NULL OR O.U_Categoria = @Categoria)
        AND (@Subcategoria IS NULL OR O.U_Subcategoria = @Subcategoria)
        AND ( @SkusCsv IS NULL OR I.ItemCode IN (SELECT LTRIM(RTRIM(value)) FROM STRING_SPLIT(@SkusCsv, ',')) )
        AND (
          @HasCanal = 0
          OR ( (@HasMeli=1 AND C.Canal='Meli')
            OR (@HasFalabella=1 AND C.Canal='Falabella')
            OR (@HasBalmaceda=1 AND C.Canal='Balmaceda')
            OR (@HasVitex=1 AND C.Canal='Vitex')
            OR (@HasChorrillo=1 AND C.Canal='Chorrillo')
            OR (@HasEmpresas=1 AND C.Canal='Empresas') )
        )
        AND (@VendedorParam IS NULL OR I.SlpCode = @VendedorParam)
    GROUP BY I.ItemCode, C.Canal
    ORDER BY I.ItemCode, C.Canal;
  `;

  const result = await request.query(query);

  return {
    rows: result.recordsets[0] || [],
    total: result.recordsets[1]?.[0]?.Total || 0,
    breakdown: result.recordsets[2] || [],
  };
}

module.exports = { obtenerProductosDetalladoDB };
