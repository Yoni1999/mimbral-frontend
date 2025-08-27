// models/informes/productosSinVentas.model.js
const { sql, poolPromise } = require("..//../models/db");

async function getProductosSinVentas(params = {}) {
  const {
    minStock = 0,
    fechaInicio = null,          
    primerNivel = null,          
    categoria = null,            
    subcategoria = null,        
    page = 1,
    pageSize = 50,
    orderBy = "stockTotal",      // 'stockTotal' | 'createDate'
    order = "asc",               // 'asc' | 'desc'
  } = params;

  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const safeSize = Math.min(Math.max(parseInt(pageSize, 10) || 50, 1), 500);
  const offset = (safePage - 1) * safeSize;

  // whitelist de columnas ordenables
  const orderMap = {
    stockTotal: "stockTotal",
    createDate: "createDate",
  };
  const dir = (String(order).toLowerCase() === "desc") ? "DESC" : "ASC";
  const key = orderMap[orderBy] || "stockTotal";

  // mapeo a columnas SQL reales
  const orderSql =
    key === "createDate"
      ? `O.CreateDate ${dir}`
      : `S.OnHandExcl04 ${dir}`; // stockTotal (default)

  // Query principal (datos + paginación)
  const queryMain = `
    -- parámetros vienen binded desde node (NO redeclarar)
    SELECT
        O.U_Imagen,
        O.ItemCode,
        O.ItemName,
        O.CreateDate,
        S.OnHandExcl04                           AS [Stock Total],
        PN.Name                                  AS PrimerNivelName,
        CAT.Name                                 AS CategoriaName,
        SUBC.Name                                AS SubcategoriaName,
        PO.DocNum                                AS LastPO_DocNum,
        PO.CreateDate                            AS LastPO_CreateDate,
        PO.CardCode                              AS LastPO_SupplierCode,
        PO.CardName                              AS LastPO_SupplierName,
        PO.Quantity                              AS LastPO_Quantity,
        PO.UserName                              AS LastPO_CreatedBy,
        S.Whs01 AS [01 Centro Comercial],
        S.Whs02 AS [02 Devolución],
        S.Whs03 AS [03 Comercio Electronico],
        S.Whs04 AS [04 Control de Perdida],
        S.Whs05 AS [05 Envios FULL- Mercado Libre],
        S.Whs06 AS [06  Bodega Fabrica],
        S.Whs07 AS [07 Ferreteria Balmaceda],
        S.Whs08 AS [08  Bodega Lo Ovalle],
        S.Whs10 AS [10  Reservado con Abono],
        S.Whs12 AS [12  Productos con Falla],
        S.Whs13 AS [13  Reservado FULL]
    FROM OITM O
    LEFT JOIN [@PRIMER_NIVEL]  PN   ON PN.Code   = O.U_Primer_Nivel
    LEFT JOIN [@CATEGORIA]     CAT  ON CAT.Code  = O.U_Categoria
    LEFT JOIN [@SUBCATEGORIA]  SUBC ON SUBC.Code = O.U_Subcategoria
    CROSS APPLY (
        SELECT
            SUM(CASE WHEN W.WhsCode <> '04' THEN W.OnHand ELSE 0 END) AS OnHandExcl04,
            SUM(CASE WHEN W.WhsCode = '01' THEN W.OnHand ELSE 0 END)  AS Whs01,
            SUM(CASE WHEN W.WhsCode = '02' THEN W.OnHand ELSE 0 END)  AS Whs02,
            SUM(CASE WHEN W.WhsCode = '03' THEN W.OnHand ELSE 0 END)  AS Whs03,
            SUM(CASE WHEN W.WhsCode = '04' THEN W.OnHand ELSE 0 END)  AS Whs04,
            SUM(CASE WHEN W.WhsCode = '05' THEN W.OnHand ELSE 0 END)  AS Whs05,
            SUM(CASE WHEN W.WhsCode = '06' THEN W.OnHand ELSE 0 END)  AS Whs06,
            SUM(CASE WHEN W.WhsCode = '07' THEN W.OnHand ELSE 0 END)  AS Whs07,
            SUM(CASE WHEN W.WhsCode = '08' THEN W.OnHand ELSE 0 END)  AS Whs08,
            SUM(CASE WHEN W.WhsCode = '10' THEN W.OnHand ELSE 0 END)  AS Whs10,
            SUM(CASE WHEN W.WhsCode = '12' THEN W.OnHand ELSE 0 END)  AS Whs12,
            SUM(CASE WHEN W.WhsCode = '13' THEN W.OnHand ELSE 0 END)  AS Whs13
        FROM OITW W
        WHERE W.ItemCode = O.ItemCode
    ) S
    OUTER APPLY (
        SELECT TOP 1 
               P0.DocNum,
               P0.DocDate,
               P0.DocDueDate,
               P0.CreateDate,
               P0.CardCode,
               P0.CardName,
               P1.Quantity,
               P1.Price,
               P1.Currency,
               U.U_NAME AS UserName
        FROM POR1 P1
        INNER JOIN OPOR P0 ON P0.DocEntry = P1.DocEntry
        LEFT  JOIN OUSR U  ON U.USERID    = P0.UserSign
        WHERE P1.ItemCode = O.ItemCode
          AND ISNULL(P0.CANCELED,'N') = 'N'
        ORDER BY P0.CreateDate DESC, P0.DocEntry DESC, P1.LineNum DESC
    ) PO
    WHERE
        ISNULL(O.ValidFor, 'N') = 'Y'
        AND ISNULL(S.OnHandExcl04, 0) > @MinStock
        AND (@FechaInicio IS NULL OR O.CreateDate >= @FechaInicio)
        AND (@PrimerNivel  IS NULL OR O.U_Primer_Nivel = @PrimerNivel)
        AND (@Categoria    IS NULL OR O.U_Categoria    = @Categoria)
        AND (@Subcategoria IS NULL OR O.U_Subcategoria = @Subcategoria)
        AND NOT EXISTS (
            SELECT 1
            FROM INV1 I
            INNER JOIN OINV T0 ON I.DocEntry = T0.DocEntry
            WHERE I.ItemCode   = O.ItemCode
              AND I.Quantity   > 0
              AND T0.CANCELED  = 'N'
        )
    ORDER BY ${orderSql}
    OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
  `;

  // Conteo total (mismas condiciones). Recalcula S.OnHandExcl04 para el filtro.
  const queryCount = `
    SELECT COUNT(1) AS Total
    FROM OITM O
    CROSS APPLY (
        SELECT SUM(CASE WHEN W.WhsCode <> '04' THEN W.OnHand ELSE 0 END) AS OnHandExcl04
        FROM OITW W
        WHERE W.ItemCode = O.ItemCode
    ) S
    WHERE
        ISNULL(O.ValidFor, 'N') = 'Y'
        AND ISNULL(S.OnHandExcl04, 0) > @MinStock
        AND (@FechaInicio IS NULL OR O.CreateDate >= @FechaInicio)
        AND (@PrimerNivel  IS NULL OR O.U_Primer_Nivel = @PrimerNivel)
        AND (@Categoria    IS NULL OR O.U_Categoria    = @Categoria)
        AND (@Subcategoria IS NULL OR O.U_Subcategoria = @Subcategoria)
        AND NOT EXISTS (
            SELECT 1
            FROM INV1 I
            INNER JOIN OINV T0 ON I.DocEntry = T0.DocEntry
            WHERE I.ItemCode   = O.ItemCode
              AND I.Quantity   > 0
              AND T0.CANCELED  = 'N'
        );
  `;

  const pool = await poolPromise;
  const reqMain = pool.request();
  reqMain.input("MinStock",     sql.Int,          minStock);
  reqMain.input("FechaInicio",  sql.Date,         fechaInicio);
  reqMain.input("PrimerNivel",  sql.VarChar(100), primerNivel);
  reqMain.input("Categoria",    sql.VarChar(100), categoria);
  reqMain.input("Subcategoria", sql.VarChar(100), subcategoria);
  reqMain.input("Limit",        sql.Int,          safeSize);
  reqMain.input("Offset",       sql.Int,          offset);

  const reqCount = pool.request();
  reqCount.input("MinStock",     sql.Int,          minStock);
  reqCount.input("FechaInicio",  sql.Date,         fechaInicio);
  reqCount.input("PrimerNivel",  sql.VarChar(100), primerNivel);
  reqCount.input("Categoria",    sql.VarChar(100), categoria);
  reqCount.input("Subcategoria", sql.VarChar(100), subcategoria);

  const [rowsRes, countRes] = await Promise.all([
    reqMain.query(queryMain),
    reqCount.query(queryCount),
  ]);

  const rows = rowsRes.recordset || [];
  const total = countRes.recordset?.[0]?.Total || 0;
  const pages = Math.max(Math.ceil(total / safeSize), 1);

  return {
    data: rows,
    page: safePage,
    pageSize: safeSize,
    total,
    pages,
    orderBy: key,
    order: dir.toLowerCase(),
  };
}

module.exports = { getProductosSinVentas };
