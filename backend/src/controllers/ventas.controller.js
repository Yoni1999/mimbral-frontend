const { poolPromise } = require("../models/db");

//RESUMNE VENTAS 
  // OBTENER VENTAS POR CANAL
const getVentascanal = async (req, res) => {
  try {
    const pool = await poolPromise;

    const { periodo, itemCode } = req.query;

    let fechaFin = new Date();
    let fechaInicio;

    // Calcular fechaInicio según periodo
    if (periodo) {
      switch (periodo.toLowerCase()) {
        case "1d":
          fechaInicio = new Date(fechaFin);
          break;
        case "7d":
          fechaInicio = new Date(fechaFin);
          fechaInicio.setDate(fechaFin.getDate() - 6);
          break;
        case "14d":
          fechaInicio = new Date(fechaFin);
          fechaInicio.setDate(fechaFin.getDate() - 13);
          break;
        case "1m":
          fechaInicio = new Date(fechaFin);
          fechaInicio.setMonth(fechaFin.getMonth() - 1);
          break;
        case "3m":
          fechaInicio = new Date(fechaFin);
          fechaInicio.setMonth(fechaFin.getDate() - 30);
          break;
        case "6m":
          fechaInicio = new Date(fechaFin);
          fechaInicio.setMonth(fechaFin.getMonth() - 6);
          break;
        default:
          fechaInicio = new Date(fechaFin);
      }
    } else if (req.query.fechaInicio && req.query.fechaFin) {
      fechaInicio = new Date(req.query.fechaInicio);
      fechaFin = new Date(req.query.fechaFin);
    } else {
      const today = new Date();
      fechaInicio = new Date(today);
      fechaFin = new Date(today);
    }

    const fechaInicioStr = fechaInicio.toISOString().split("T")[0];
    const fechaFinStr = fechaFin.toISOString().split("T")[0];

    const request = pool.request()
      .input("FechaInicio", fechaInicioStr)
      .input("FechaFin", fechaFinStr);

    if (itemCode) {
      request.input("ItemCode", itemCode);
    }

    const query = `
      SELECT 
          SUM(CASE 
              WHEN (I.WhsCode IN ('03', '05') AND OI.SlpCode IN (426, 364, 355)) 
                OR (I.WhsCode = '01' AND OI.SlpCode IN (355, 398)) 
              THEN I.LineTotal ELSE 0 
          END) AS Meli,
          SUM(CASE WHEN I.WhsCode = '03' AND OI.SlpCode = 371 THEN I.LineTotal ELSE 0 END) AS Falabella,
          SUM(CASE WHEN I.WhsCode = '07' THEN I.LineTotal ELSE 0 END) AS Balmaceda,
          SUM(CASE WHEN I.WhsCode = '01' AND OI.SlpCode IN (401, 397) THEN I.LineTotal ELSE 0 END) AS Vitex,
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
      WHERE I.DocDate BETWEEN @FechaInicio AND @FechaFin
      AND OI.CANCELED = 'N'AND OI.CANCELED = 'N'
        AND OI.CANCELED = 'N'
        AND I.ItemCode <> '701001008'
        ${itemCode ? "AND I.ItemCode = @ItemCode" : ""}
    `;

    const result = await request.query(query);

    res.json(result.recordset);
  } catch (error) {
    console.error("❌ Error en consulta de ventas por canal:", error);
    res.status(500).send("Error en el servidor");
  }
};



// RESUMEN VENTAS TOP 10 PRODUCTOS CON MAYOR RENTABILIDAD
const getMayorRentabilidad = async (req, res) => {
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
                  WHEN @Periodo = '1A' THEN DATEADD(YEAR, -1, @FechaFin)
                  ELSE @FechaFin
              END;
      END;

      SELECT TOP 10
          I.ItemCode AS Codigo_Producto,
          O.ItemName AS Nombre_Producto,
          SUM(I.Quantity) AS Cantidad_Vendida,
          AVG(I.Price) AS Precio_Venta_Promedio,
          AVG(I.StockPrice) AS Costo_Promedio,
          SUM((I.Price - I.StockPrice) * I.Quantity) AS Rentabilidad_Total,
          CASE 
              WHEN AVG(I.Price) = 0 THEN 0
              ELSE ((AVG(I.Price) - AVG(I.StockPrice)) / NULLIF(AVG(I.Price), 0)) * 100
          END AS Margen_Porcentaje
      FROM INV1 I
      INNER JOIN OITM O ON I.ItemCode = O.ItemCode
      INNER JOIN OINV T0 ON I.DocEntry = T0.DocEntry
      WHERE 
          T0.DocDate BETWEEN @FechaInicio AND @FechaFin
          AND T0.CANCELED = 'N'
          AND I.ItemCode <> '701001008'
          AND I.StockPrice > 0
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
      ORDER BY Rentabilidad_Total DESC;
    `;

    const request = pool.request();
    request.input("CanalParamInput", canal);
    request.input("VendedorParamInput", vendedor);
    request.input("PeriodoParam", periodo);
    request.input("FechaInicioInput", fechaInicio);
    request.input("FechaFinInput", fechaFin);

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (error) {
    console.error("❌ Error al obtener los productos con mayor rentabilidad:", error);
    res.status(500).json({ error: "Error en el servidor." });
  }
};

const getMenorRentabilidad = async (req, res) => {
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
                  WHEN @Periodo = '1A' THEN DATEADD(YEAR, -1, @FechaFin)
                  ELSE @FechaFin
              END;
      END;

      SELECT TOP 10
          I.ItemCode AS Codigo_Producto,
          O.ItemName AS Nombre_Producto,
          SUM(I.Quantity) AS Cantidad_Vendida,
          AVG(I.Price) AS Precio_Venta_Promedio,
          AVG(I.StockPrice) AS Costo_Promedio,
          SUM((I.Price - I.StockPrice) * I.Quantity) AS Rentabilidad_Total,
          CASE 
              WHEN AVG(I.Price) = 0 THEN 0
              ELSE ((AVG(I.Price) - AVG(I.StockPrice)) / NULLIF(AVG(I.Price), 0)) * 100
          END AS Margen_Porcentaje
      FROM INV1 I
      INNER JOIN OITM O ON I.ItemCode = O.ItemCode
      INNER JOIN OINV T0 ON I.DocEntry = T0.DocEntry
      WHERE 
          T0.DocDate BETWEEN @FechaInicio AND @FechaFin
          AND T0.CANCELED = 'N'
          AND I.Quantity > 0
          AND I.ItemCode <> '701001008'
          AND I.StockPrice > 0
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
      ORDER BY Rentabilidad_Total ASC;
    `;

    const request = pool.request();
    request.input("CanalParamInput", canal);
    request.input("VendedorParamInput", vendedor);
    request.input("PeriodoParam", periodo);
    request.input("FechaInicioInput", fechaInicio);
    request.input("FechaFinInput", fechaFin);

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (error) {
    console.error("❌ Error al obtener los productos con menor rentabilidad:", error);
    res.status(500).json({ error: "Error en el servidor." });
  }
};



module.exports = { getVentascanal, getMayorRentabilidad, getMenorRentabilidad};
