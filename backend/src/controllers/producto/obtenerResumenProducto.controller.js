const sql = require("mssql");
const { poolPromise } = require('../../models/db');

const obtenerResumenProducto = async (req, res) => {
  try {
    const { itemCode } = req.query;

    if (!itemCode) {
      return res.status(400).json({ error: "Falta parámetro itemCode" });
    }

    const pool = await poolPromise;
    const request = pool.request();
    request.input("ItemCode", sql.NVarChar, itemCode);

    // 1. STOCK TOTAL (almacenes específicos)
    const stockTotalQuery = `
      SELECT 
        T0.ItemCode,
        T1.ItemName,
        SUM(T0.OnHand) AS StockTotal
      FROM OITW T0
      INNER JOIN OITM T1 ON T0.ItemCode = T1.ItemCode
      WHERE T0.WhsCode IN ('01', '03', '05', '07', '08', '13')
        AND T0.ItemCode = @ItemCode
      GROUP BY T0.ItemCode, T1.ItemName
    `;

    // 2. DÍAS DE INVENTARIO (cobertura)
    const diasInventarioQuery = `
      DECLARE @FechaHoy DATE = GETDATE();
      DECLARE @FechaInicioActual DATE = DATEADD(DAY, -14, @FechaHoy);
      DECLARE @FechaInicioAnterior DATE = DATEADD(YEAR, -1, @FechaInicioActual);
      DECLARE @FechaFinAnterior DATE = DATEADD(YEAR, -1, @FechaHoy);
      DECLARE @ItemCodeFiltro NVARCHAR(50) = @ItemCode;

      WITH VentasRecientes AS (
        SELECT INV1.ItemCode, SUM(INV1.Quantity) AS CantidadVendidaActual
        FROM INV1
        INNER JOIN OINV ON INV1.DocEntry = OINV.DocEntry
        WHERE OINV.DocDate BETWEEN @FechaInicioActual AND @FechaHoy
          AND INV1.ItemCode = @ItemCodeFiltro
        GROUP BY INV1.ItemCode
      ),
      VentasHistoricas AS (
        SELECT INV1.ItemCode, SUM(INV1.Quantity) AS CantidadVendidaAnterior
        FROM INV1
        INNER JOIN OINV ON INV1.DocEntry = OINV.DocEntry
        WHERE OINV.DocDate BETWEEN @FechaInicioAnterior AND @FechaFinAnterior
          AND INV1.ItemCode = @ItemCodeFiltro
        GROUP BY INV1.ItemCode
      ),
      StockActual AS (
        SELECT OITW.ItemCode, SUM(OITW.OnHand) AS Stock
        FROM OITW
        WHERE OITW.WhsCode <> '04'
          AND OITW.ItemCode = @ItemCodeFiltro
        GROUP BY OITW.ItemCode
      )
      SELECT 
        OITM.ItemCode,
        OITM.ItemName,
        ISNULL(S.Stock, 0) AS Stock,
        ISNULL(VR.CantidadVendidaActual, 0) AS VentasUltimas2Semanas,
        ISNULL(VH.CantidadVendidaAnterior, 0) AS VentasMismoPeriodoAnterior,
        ((ISNULL(VR.CantidadVendidaActual, 0) * 0.8 + ISNULL(VH.CantidadVendidaAnterior, 0) * 0.2) / 14.0) AS PromedioDiario,
        CASE
          WHEN (ISNULL(VR.CantidadVendidaActual, 0) * 0.8 + ISNULL(VH.CantidadVendidaAnterior, 0) * 0.2) = 0 THEN NULL
          ELSE ISNULL(S.Stock, 0) / ((ISNULL(VR.CantidadVendidaActual, 0) * 0.8 + ISNULL(VH.CantidadVendidaAnterior, 0) * 0.2) / 14.0)
        END AS CoberturaEnDias
      FROM OITM
      LEFT JOIN VentasRecientes VR ON OITM.ItemCode = VR.ItemCode
      LEFT JOIN VentasHistoricas VH ON OITM.ItemCode = VH.ItemCode
      LEFT JOIN StockActual S ON OITM.ItemCode = S.ItemCode
      WHERE OITM.SellItem = 'Y' AND OITM.ItemCode = @ItemCodeFiltro;
    `;

    // 3. STOCK EN TRÁNSITO
    const stockTransitoQuery = `
      SELECT 
        T0.ItemCode,
        T1.ItemName,
        SUM(T0.OnOrder) AS OrdenCompra
      FROM OITW T0
      INNER JOIN OITM T1 ON T0.ItemCode = T1.ItemCode
      WHERE T0.ItemCode = @ItemCode
      GROUP BY T0.ItemCode, T1.ItemName;
    `;

    // 4. COSTOS DE ORDEN DE COMPRA
    const costoCompraQuery = `
      WITH OrdenesCompra AS (
        SELECT 
          T1.ItemCode,
          T0.DocEntry,
          T0.DocDate,
          T1.Price,
          ROW_NUMBER() OVER (ORDER BY T0.DocDate DESC, T0.DocEntry DESC) AS RN
        FROM OPOR T0
        INNER JOIN POR1 T1 ON T0.DocEntry = T1.DocEntry
        WHERE T1.ItemCode = @ItemCode
          AND T0.CANCELED = 'N'
      )
      SELECT 
        Ultima.ItemCode,
        Ultima.Price AS UltimoCosto,
        Ultima.DocDate AS FechaUltimaOC,
        Anterior.Price AS CostoAnterior,
        Anterior.DocDate AS FechaOCAnterior
      FROM OrdenesCompra Ultima
      LEFT JOIN OrdenesCompra Anterior ON Ultima.RN = 1 AND Anterior.RN = 2
      WHERE Ultima.RN = 1;
    `;

    const [stockTotal, diasInventario, stockTransito, costoCompra] = await Promise.all([
      request.query(stockTotalQuery),
      request.query(diasInventarioQuery),
      request.query(stockTransitoQuery),
      request.query(costoCompraQuery)
    ]);

    res.json({
      itemCode,
      stockTotal: stockTotal.recordset[0] || null,
      cobertura: diasInventario.recordset[0] || null,
      stockTransito: stockTransito.recordset[0]?.OrdenCompra ?? 0,
      costos: costoCompra.recordset[0] || null
    });

  } catch (error) {
    console.error("❌ Error en obtenerResumenProducto:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
const obtenerDetalleStock = async (req, res) => {
  const { itemCode } = req.query;

  if (!itemCode) {
    return res.status(400).json({ error: 'Se requiere el parámetro itemCode' });
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('ItemCode', sql.NVarChar, itemCode)
      .query(`
      -- Último costo + stock total + valor inventario
      WITH UltimoCosto AS (
        SELECT TOP 1 
          T1.ItemCode,
          T1.Price
        FROM OPOR T0
        INNER JOIN POR1 T1 ON T0.DocEntry = T1.DocEntry
        WHERE T1.ItemCode = @ItemCode AND T0.CANCELED = 'N'
        ORDER BY T0.DocDate DESC, T0.DocEntry DESC
      ),
      StockAlmacenes AS (
        SELECT 
          T0.ItemCode,
          SUM(T0.OnHand) AS StockTotal
        FROM OITW T0
        WHERE T0.WhsCode IN ('01', '03', '05', '07', '08', '13')
          AND T0.ItemCode = @ItemCode
        GROUP BY T0.ItemCode
      ),
      StockTransito AS (
        SELECT 
          T0.ItemCode,
          SUM(T0.OnOrder) AS OrdenCompra
        FROM OITW T0
        WHERE T0.ItemCode = @ItemCode
        GROUP BY T0.ItemCode
      )

      SELECT 
        @ItemCode AS ItemCode,
        ISNULL(U.Price, 0) AS UltimoCosto,
        (ISNULL(S.StockTotal, 0) + ISNULL(O.OrdenCompra, 0)) AS TotalUnidades,
        (ISNULL(S.StockTotal, 0) + ISNULL(O.OrdenCompra, 0)) * ISNULL(U.Price, 0) AS ValorInventario
      FROM StockAlmacenes S
      FULL OUTER JOIN StockTransito O ON S.ItemCode = O.ItemCode
      LEFT JOIN UltimoCosto U ON U.ItemCode = @ItemCode;

      -- Total de notas de venta (IsCommited)
      SELECT 
        T0.ItemCode,
        T1.ItemName,
        SUM(T0.IsCommited) AS TotalNotasDeVenta
      FROM OITW T0
      INNER JOIN OITM T1 ON T0.ItemCode = T1.ItemCode
      WHERE T0.ItemCode = @ItemCode
      GROUP BY T0.ItemCode, T1.ItemName;

      -- Stock con fallas (almacén 12)
      SELECT 
        T0.ItemCode,
        T1.ItemName,
        T0.WhsCode AS Almacen,
        T0.OnHand AS UnidadesConFallas
      FROM OITW T0
      INNER JOIN OITM T1 ON T0.ItemCode = T1.ItemCode
      WHERE T0.WhsCode = '12'
        AND T0.ItemCode = @ItemCode;
    `);

    const [detalleInventario, notasVenta, fallas] = result.recordsets;

    res.json({
      itemCode,
      detalleInventario: detalleInventario[0] || {},
      notasVenta: notasVenta[0]?.TotalNotasDeVenta ?? 0,
      unidadesConFallas: fallas[0]?.UnidadesConFallas ?? 0,
    });

  } catch (error) {
    console.error('Error en obtenerDetalleStock:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const obtenerVentasMensuales = async (req, res) => {
  try {
    const { itemCode } = req.query;

    if (!itemCode) {
      return res.status(400).json({ error: 'El parámetro itemCode es requerido' });
    }

    const pool = await poolPromise;

    const result = await pool.request()
      .input('ItemCode', sql.NVarChar(50), itemCode)
      .query(`
        SELECT 
          FORMAT(T0.DocDate, 'yyyy-MM') AS Mes,
          SUM(T1.Quantity) AS UnidadesVendidas,
          SUM(T1.LineTotal) AS TotalVentas
        FROM OINV T0
        INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
        WHERE T1.ItemCode = @ItemCode
          AND T0.DocDate >= DATEADD(MONTH, -12, GETDATE())
          AND T0.CANCELED = 'N'
        GROUP BY FORMAT(T0.DocDate, 'yyyy-MM')
        ORDER BY Mes;
      `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('❌ Error al obtener ventas mensuales:', error);
    res.status(500).json({ error: 'Error al obtener ventas mensuales' });
  }
};
const obtenerHistoricoOrdenesCompra = async (req, res) => {
  try {
    const { itemCode } = req.query;

    if (!itemCode) {
      return res.status(400).json({ error: 'Parámetro itemCode es requerido' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('itemCode', sql.NVarChar(50), itemCode)
      .query(`
        SELECT 
          T0.DocNum AS NumeroOrdenCompra,
          FORMAT(T0.DocDate, 'yyyy-MM') AS Mes,
          T0.DocDate AS FechaOrden,
          T0.DocTime AS HoraOrden,
          T1.ItemCode,
          T1.Dscription AS DescripcionProducto,
          T1.Quantity AS CantidadComprada,
          T1.Price AS PrecioUnitario,
          T1.LineTotal AS TotalLinea,
          T0.SlpCode,
          V.SlpName AS Vendedor,
          T0.DocStatus AS EstadoDocumento,
          T0.CANCELED AS EstaCancelado
        FROM OPOR T0
        INNER JOIN POR1 T1 ON T0.DocEntry = T1.DocEntry
        LEFT JOIN OSLP V ON T0.SlpCode = V.SlpCode
        WHERE 
          T1.ItemCode = @itemCode
          AND T0.DocDate >= DATEADD(MONTH, -13, GETDATE())
        ORDER BY T0.DocDate DESC, T0.DocTime DESC;
      `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error('❌ Error al obtener historial de órdenes de compra:', error);
    res.status(500).json({ error: 'Error interno al obtener los datos' });
  }
};
const obtenerStockPorAlmacen = async (req, res) => {
  try {
    const { itemCode } = req.query;

    if (!itemCode) {
      return res.status(400).json({ error: 'Falta el parámetro itemCode' });
    }

    const pool = await poolPromise;

    const result = await pool.request()
      .input('ItemCode', sql.NVarChar(50), itemCode)
      .query(`
        SELECT 
            T0.ItemCode,
            MAX(CASE WHEN T0.WhsCode = '01' THEN T0.OnHand ELSE 0 END) AS Almacen_01,
            MAX(CASE WHEN T0.WhsCode = '02' THEN T0.OnHand ELSE 0 END) AS Almacen_02,
            MAX(CASE WHEN T0.WhsCode = '03' THEN T0.OnHand ELSE 0 END) AS Almacen_03,
            MAX(CASE WHEN T0.WhsCode = '05' THEN T0.OnHand ELSE 0 END) AS Almacen_05,
            MAX(CASE WHEN T0.WhsCode = '07' THEN T0.OnHand ELSE 0 END) AS Almacen_07,
            MAX(CASE WHEN T0.WhsCode = '12' THEN T0.OnHand ELSE 0 END) AS Almacen_12,
            MAX(CASE WHEN T0.WhsCode = '13' THEN T0.OnHand ELSE 0 END) AS Almacen_13
        FROM OITW T0
        WHERE T0.ItemCode = @ItemCode
        GROUP BY T0.ItemCode
      `);

    res.json(result.recordset[0] || {}); // Devuelve un objeto o vacío si no hay datos

  } catch (error) {
    console.error('❌ Error al obtener stock por almacén:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

module.exports = { obtenerResumenProducto , obtenerDetalleStock, obtenerVentasMensuales, obtenerHistoricoOrdenesCompra, obtenerStockPorAlmacen };
