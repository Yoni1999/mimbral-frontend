const { sql, poolPromise } = require("../models/db");


const obtenerMargenBrutoPeriodo = async (req, res) => {
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
  
        ;WITH MargenBrutoPeriodo AS (
            SELECT 
                CAST(SUM(T1.LineTotal) AS DECIMAL(18, 2)) AS TotalVentasPeriodo,
                CAST(SUM(T1.StockPrice * T1.Quantity) AS DECIMAL(18, 2)) AS CostoTotalPeriodo
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
        MargenBrutoAnterior AS (
            SELECT 
                CAST(SUM(T1.LineTotal) AS DECIMAL(18, 2)) AS TotalVentasAnterior,
                CAST(SUM(T1.StockPrice * T1.Quantity) AS DECIMAL(18, 2)) AS CostoTotalAnterior
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
            MBP.TotalVentasPeriodo, 
            MBP.CostoTotalPeriodo,
            (MBP.TotalVentasPeriodo - MBP.CostoTotalPeriodo) AS MargenBrutoPeriodo,
            MBA.TotalVentasAnterior,
            MBA.CostoTotalAnterior,
            (MBA.TotalVentasAnterior - MBA.CostoTotalAnterior) AS MargenBrutoAnterior,
            CASE 
                WHEN MBA.TotalVentasAnterior = 0 THEN NULL
                ELSE CAST(((MBP.TotalVentasPeriodo - MBA.TotalVentasAnterior) * 100.0 / MBA.TotalVentasAnterior) AS DECIMAL(18, 2))
            END AS PorcentajeCambio
        FROM MargenBrutoPeriodo MBP, MargenBrutoAnterior MBA;
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
      console.error("❌ Error al obtener margen bruto por período:", error);
      res.status(500).json({ error: "Error en el servidor." });
    }
  };
const obtenerMargenBrutoPorCategoria = async (req, res) => {
  try {
    const pool = await poolPromise;
    const canal = req.query.canal || null;
    const periodo = req.query.periodo || "1D"; 
    const fechaInicio = req.query.fechaInicio || null;
    const fechaFin = req.query.fechaFin || null;

    const query = `
      DECLARE @CanalParam VARCHAR(50) = @CanalParamInput;
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
                  WHEN @Periodo = '7D'  THEN DATEADD(DAY, -7, @FechaFinActual)
                  WHEN @Periodo = '14D' THEN DATEADD(DAY, -14, @FechaFinActual)
                  WHEN @Periodo = '1M'  THEN DATEADD(MONTH, -1, @FechaFinActual) 
                  WHEN @Periodo = '3M'  THEN DATEADD(MONTH, -3, @FechaFinActual)
                  WHEN @Periodo = '6M'  THEN DATEADD(MONTH, -6, @FechaFinActual) -- ✅ Agregado
                  WHEN @Periodo = '1A'  THEN DATEADD(YEAR, -1, @FechaFinActual) -- ✅ Agregado
                  ELSE @FechaFinActual -- Si es '1D', solo hoy
              END;
      END

      -- 🔹 Margen Bruto por Categoría en el período seleccionado
      SELECT 
          C.Name AS Categoria,
          C.U_Imagen,
          ISNULL(SUM(I.LineTotal), 0) AS Ventas,
          ISNULL(SUM(I.Quantity * O.AvgPrice), 0) AS Costo,
          (ISNULL(SUM(I.LineTotal), 0) - ISNULL(SUM(I.Quantity * O.AvgPrice), 0)) AS MargenBruto,
          CASE 
              WHEN ISNULL(SUM(I.LineTotal), 0) = 0 THEN NULL
              ELSE CAST(((ISNULL(SUM(I.LineTotal), 0) - ISNULL(SUM(I.Quantity * O.AvgPrice), 0)) * 100.0 / ISNULL(SUM(I.LineTotal), 0)) AS DECIMAL(18, 2))
          END AS MargenBrutoPorcentaje
      FROM INV1 I
      INNER JOIN OITM O ON I.ItemCode = O.ItemCode
      INNER JOIN [@categoria] C ON O.U_Categoria = C.Code -- ✅ Se usa la tabla correcta de categorías
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
      GROUP BY C.Name, C.U_Imagen
      ORDER BY MargenBruto DESC;
    `;

    const request = pool.request();
    request.input("CanalParamInput", sql.VarChar, canal);
    request.input("PeriodoParam", sql.VarChar, periodo);
    request.input("FechaInicioInput", sql.Date, fechaInicio);
    request.input("FechaFinInput", sql.Date, fechaFin);

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (error) {
    console.error("❌ Error al obtener el margen bruto por categoría:", error);
    res.status(500).json({ error: "Error en el servidor." });
  }
};
module.exports = { obtenerMargenBrutoPeriodo, obtenerMargenBrutoPorCategoria };
