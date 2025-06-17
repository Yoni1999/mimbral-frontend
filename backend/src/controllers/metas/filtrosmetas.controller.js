const sql = require('mssql');
const { poolPromise } = require('../../models/db');

const obtenerMetasPorCanal = async (req, res) => {
  const {
    idPeriodo,
    idCanal,
    slpCodes = null,
    primerNivel = null,
    categoria = null,
    subcategoria = null,
    tipoMeta = null,
  } = req.query;

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('ID_PERIODO', sql.Int, idPeriodo)
      .input('ID_CANAL', sql.Int, idCanal)
      .input('SLPCODES', sql.VarChar(sql.MAX), slpCodes)
      .input('PRIMER_NIVEL', sql.NVarChar(50), primerNivel)
      .input('CATEGORIA', sql.NVarChar(50), categoria)
      .input('SUBCATEGORIA', sql.NVarChar(50), subcategoria)
      .input('TIPO_META', sql.NVarChar(50), tipoMeta)
      .query(`
        DECLARE @DIAS_TRANSCURRIDOS INT = DATEDIFF(DAY, 
            (SELECT FECHA_INICIO FROM PERIODOS_METAS WHERE ID_PERIODO = @ID_PERIODO),
            IIF(
              GETDATE() < (SELECT FECHA_FIN FROM PERIODOS_METAS WHERE ID_PERIODO = @ID_PERIODO),
              GETDATE(),
              (SELECT FECHA_FIN FROM PERIODOS_METAS WHERE ID_PERIODO = @ID_PERIODO)
            )
        ) + 1;

        WITH DEVOLUCIONES AS (
          SELECT 
            inm.ItemCode,
            SUM(inm.InQty) AS CantidadDevuelta,
            SUM(r.LineTotal) AS MontoDevuelto
          FROM OINM inm
          INNER JOIN ORIN n ON n.DocNum = inm.BASE_REF AND n.CANCELED = 'N'
          INNER JOIN RIN1 r ON r.DocEntry = n.DocEntry AND r.ItemCode = inm.ItemCode
          INNER JOIN VENDEDORES v ON v.ID_VENDEDOR = inm.SlpCode AND v.ID_CANAL = @ID_CANAL
          WHERE 
            inm.TransType = 14
            AND inm.DocDate BETWEEN 
                (SELECT FECHA_INICIO FROM PERIODOS_METAS WHERE ID_PERIODO = @ID_PERIODO)
                AND 
                (SELECT FECHA_FIN FROM PERIODOS_METAS WHERE ID_PERIODO = @ID_PERIODO)
          GROUP BY inm.ItemCode
        )

        SELECT 
          itm.U_Imagen AS IMAGEN_PRODUCTO,
          mp.SKU,
          itm.ItemName AS NOMBRE_PRODUCTO,
          mp.META_CANTIDAD,

          ISNULL(SUM(i.Quantity), 0) AS TOTAL_VENDIDO,

          ISNULL(d.CantidadDevuelta, 0) AS CANTIDAD_DEVUELTA,

          ISNULL(SUM(i.Quantity), 0) - ISNULL(d.CantidadDevuelta, 0) AS TOTAL_VENDIDO_NETO,

          CASE 
            WHEN mp.META_CANTIDAD > 0 THEN 
              ROUND((ISNULL(SUM(i.Quantity), 0) - ISNULL(d.CantidadDevuelta, 0)) * 100.0 / mp.META_CANTIDAD, 2)
            ELSE 0 
          END AS CUMPLIMIENTO_PORCENTAJE,

          CASE 
            WHEN SUM(i.Quantity) > 0 THEN 
              ROUND(SUM(i.LineTotal) / SUM(i.Quantity), 2)
            ELSE 0 
          END AS PRECIO_PROMEDIO_VENTA,

          ROUND(itm.AvgPrice, 2) AS PRECIO_COMPRA,

          CASE 
            WHEN SUM(i.Quantity) > 0 AND SUM(i.LineTotal) / SUM(i.Quantity) > 0 THEN
              ROUND(((SUM(i.LineTotal) / SUM(i.Quantity)) - itm.AvgPrice) * 100.0 / (SUM(i.LineTotal) / SUM(i.Quantity)), 2)
            ELSE 0 
          END AS MARGEN_PORCENTAJE,

          ROUND((ISNULL(SUM(i.Quantity), 0) - ISNULL(d.CantidadDevuelta, 0)) * 1.0 / NULLIF(@DIAS_TRANSCURRIDOS, 0), 2) AS PROMEDIO_DIARIO,

          COUNT(DISTINCT i.DocEntry) AS TICKETS_TOTALES

        FROM METAS_PRODUCTO_CANAL mp
        INNER JOIN OITM itm ON mp.SKU = itm.ItemCode
        LEFT JOIN (
            SELECT 
              i.ItemCode, 
              i.Quantity, 
              i.LineTotal,
              i.SlpCode,
              o.DocEntry
            FROM INV1 i
            INNER JOIN OINV o ON o.DocEntry = i.DocEntry
            INNER JOIN VENDEDORES v ON v.ID_VENDEDOR = i.SlpCode AND v.ID_CANAL = @ID_CANAL
            WHERE 
              o.DocDate BETWEEN 
                (SELECT FECHA_INICIO FROM PERIODOS_METAS WHERE ID_PERIODO = @ID_PERIODO)
                AND 
                (SELECT FECHA_FIN FROM PERIODOS_METAS WHERE ID_PERIODO = @ID_PERIODO)
              AND o.CANCELED = 'N'
              AND (
                @SLPCODES IS NULL OR 
                i.SlpCode IN (SELECT value FROM STRING_SPLIT(@SLPCODES, ','))
              )
        ) AS i ON i.ItemCode = mp.SKU
        LEFT JOIN DEVOLUCIONES d ON d.ItemCode = mp.SKU
        WHERE 
          mp.ID_PERIODO = @ID_PERIODO
          AND mp.ID_CANAL = @ID_CANAL
          AND (@TIPO_META IS NULL OR mp.TIPO_META = @TIPO_META)
          AND (@PRIMER_NIVEL IS NULL OR itm.U_PRIMER_NIVEL = @PRIMER_NIVEL)
          AND (@CATEGORIA IS NULL OR itm.U_CATEGORIA = @CATEGORIA)
          AND (@SUBCATEGORIA IS NULL OR itm.U_SUBCATEGORIA = @SUBCATEGORIA)
        GROUP BY 
          itm.U_Imagen,
          mp.SKU,
          itm.ItemName,
          mp.META_CANTIDAD,
          itm.AvgPrice,
          d.CantidadDevuelta
        ORDER BY 
          TOTAL_VENDIDO_NETO DESC
      `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("❌ Error al obtener metas por canal:", error);
    res.status(500).json({ error: "Error al obtener metas por canal" });
  }
};
const obtenerCategoriasPorPrimerNivel = async (req, res) => {
  const { primerNivel } = req.query;

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('primerNivel', sql.NVarChar(50), primerNivel)
      .query(`
        SELECT U_Imagen AS IMAGEN, Code AS codigo_categoria, Name AS nombre_categoria
        FROM [@categoria]
        WHERE (@primerNivel IS NULL OR U_PRIMER_NIVEL = @primerNivel)
        ORDER BY Name
      `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("❌ Error al obtener categorías:", error);
    res.status(500).json({ error: "Error al obtener categorías" });
  }
};


const obtenerSubcategoriasPorCategoria = async (req, res) => {
  const { categoria } = req.query;

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('categoria', sql.NVarChar(50), categoria)
      .query(`
        SELECT U_Imagen AS IMAGEN, Code AS codigo_subcategoria, Name AS nombre_subcategoria
        FROM [@Subcategoria]
        WHERE (@categoria IS NULL OR U_CATEGORIA = @categoria)
        ORDER BY Name
      `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("❌ Error al obtener subcategorías:", error);
    res.status(500).json({ error: "Error al obtener subcategorías" });
  }
};

const obtenerResumenMetasPorCanal = async (req, res) => {
  const { idPeriodo } = req.query;

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input('ID_PERIODO', sql.Int, idPeriodo)
      .query(`
        DECLARE @FECHA_INICIO DATE = (SELECT FECHA_INICIO FROM PERIODOS_METAS WHERE ID_PERIODO = @ID_PERIODO);
        DECLARE @FECHA_FIN DATE = (SELECT FECHA_FIN FROM PERIODOS_METAS WHERE ID_PERIODO = @ID_PERIODO);
        DECLARE @DIAS_TRANSCURRIDOS INT = DATEDIFF(DAY, @FECHA_INICIO, IIF(GETDATE() < @FECHA_FIN, GETDATE(), @FECHA_FIN)) + 1;

        -- DEVOLUCIONES por SKU y Vendedor
        WITH DEVOLUCIONES AS (
          SELECT 
            inm.ItemCode,
            inm.SlpCode,
            SUM(inm.InQty) AS CantidadDevuelta
          FROM OINM inm
          INNER JOIN ORIN n ON n.DocNum = inm.BASE_REF AND n.CANCELED = 'N'
          INNER JOIN RIN1 r ON r.DocEntry = n.DocEntry AND r.ItemCode = inm.ItemCode
          WHERE inm.TransType = 14
            AND inm.DocDate BETWEEN @FECHA_INICIO AND @FECHA_FIN
          GROUP BY inm.ItemCode, inm.SlpCode
        ),

        -- VENTAS por SKU y Vendedor
        VENTAS AS (
          SELECT 
            i.ItemCode,
            i.SlpCode,
            SUM(i.Quantity) AS CantidadVendida,
            SUM(i.LineTotal) AS MontoTotal
          FROM INV1 i
          INNER JOIN OINV o ON o.DocEntry = i.DocEntry
          WHERE o.CANCELED = 'N'
            AND o.DocDate BETWEEN @FECHA_INICIO AND @FECHA_FIN
          GROUP BY i.ItemCode, i.SlpCode
        ),

        -- COMBINAMOS VENTAS Y DEVOLUCIONES para calcular el porcentaje de cumplimiento
        METAS_CALCULADAS AS (
          SELECT 
            m.ID_CANAL,
            c.NOMBRE_CANAL,
            m.SKU,
            m.META_CANTIDAD,
            ISNULL(v.CantidadVendida, 0) AS CANTIDAD_VENDIDA,
            ISNULL(d.CantidadDevuelta, 0) AS CANTIDAD_DEVUELTA,
            ISNULL(v.CantidadVendida, 0) - ISNULL(d.CantidadDevuelta, 0) AS TOTAL_VENDIDO_NETO,
            CASE 
              WHEN m.META_CANTIDAD > 0 THEN 
                ROUND(((ISNULL(v.CantidadVendida, 0) - ISNULL(d.CantidadDevuelta, 0)) * 100.0) / m.META_CANTIDAD, 2)
              ELSE 0 
            END AS CUMPLIMIENTO_PORCENTAJE
          FROM METAS_PRODUCTO_CANAL m
          INNER JOIN CANALES_VENTA c ON c.ID_CANAL = m.ID_CANAL
          LEFT JOIN VENDEDORES ve ON ve.ID_CANAL = m.ID_CANAL
          LEFT JOIN VENTAS v ON v.ItemCode = m.SKU AND v.SlpCode = ve.ID_VENDEDOR
          LEFT JOIN DEVOLUCIONES d ON d.ItemCode = m.SKU AND d.SlpCode = ve.ID_VENDEDOR
          WHERE m.ID_PERIODO = @ID_PERIODO
        )

        -- AGRUPAMOS por canal
        SELECT 
          ID_CANAL,
          NOMBRE_CANAL,
          COUNT(*) AS TOTAL_METAS,
          SUM(CASE WHEN CUMPLIMIENTO_PORCENTAJE >= 100 THEN 1 ELSE 0 END) AS METAS_CUMPLIDAS,
          ROUND(100.0 * SUM(CASE WHEN CUMPLIMIENTO_PORCENTAJE >= 100 THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 2) AS PORCENTAJE_CUMPLIMIENTO
        FROM METAS_CALCULADAS
        GROUP BY ID_CANAL, NOMBRE_CANAL
        ORDER BY PORCENTAJE_CUMPLIMIENTO DESC;
      `);

    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("❌ Error al obtener resumen de metas por canal:", error);
    res.status(500).json({ error: "Error al obtener resumen de metas por canal" });
  }
};



module.exports = {
  obtenerMetasPorCanal,obtenerCategoriasPorPrimerNivel,obtenerResumenMetasPorCanal,obtenerSubcategoriasPorCategoria
};
