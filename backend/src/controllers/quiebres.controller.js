const { sql, poolPromise } = require("../models/db");
const { getCachedData } = require("../utils/cache");

// 🔹 Obtener los productos en quiebre por subcategoría
const obtenerProductosEnQuiebre = async (req, res) => {
    try {
        const { subcategoriaId } = req.params;
        const proveedor = req.query.proveedor || null; // 🔹 Obtener el proveedor desde la URL

        if (!subcategoriaId) {
            return res.status(400).json({ error: "Debes proporcionar un código de subcategoría." });
        }

        const pool = await poolPromise;
        const query = `
            DECLARE @Proveedor NVARCHAR(20) = @proveedorInput;
            DECLARE @SubCategoria NVARCHAR(50) = @subcategoriaId;

            SELECT 
                I.ItemCode AS Codigo_Producto, 
                I.ItemName AS Nombre_Producto, 
                I.U_SubCategoria AS SubCategoria, 
                CASE 
                    WHEN I.PrchseItem = 'Y' THEN 'Activo' 
                    WHEN I.PrchseItem = 'N' THEN 'Inactivo' 
                    ELSE 'Desconocido' 
                END AS Estado_Compra, 
                SUM(CASE WHEN W.WhsCode IN (1, 3, 7) THEN W.OnHand ELSE 0 END) AS Stock_Total_Almacenes_1_3_7,
                CASE 
                    WHEN SUM(CASE WHEN W.WhsCode IN (1, 3, 7) THEN W.OnHand ELSE 0 END) = 0 THEN 'En Quiebre'
                    ELSE 'Disponible'
                END AS Estado_Stock
            FROM OITM I
            LEFT JOIN OITW W ON I.ItemCode = W.ItemCode
            LEFT JOIN OSCN S ON I.ItemCode = S.ItemCode -- 🔹 Relación con proveedores
            WHERE I.U_SubCategoria = @SubCategoria -- ✅ Filtrar por subcategoría
            AND (@Proveedor IS NULL OR S.CardCode = @Proveedor)  -- ✅ Filtrar por proveedor si se especifica
            GROUP BY I.ItemCode, I.ItemName, I.U_SubCategoria, I.PrchseItem
            ORDER BY I.ItemName;
        `;

        const result = await pool.request()
            .input("proveedorInput", sql.NVarChar, proveedor)
            .input("subcategoriaId", sql.NVarChar, subcategoriaId)
            .query(query);

        res.json(result.recordset);
    } catch (error) {
        console.error("❌ Error al obtener productos en quiebre:", error);
        res.status(500).json({ error: "Error interno del servidor." });
    }
};


// 🔹 Obtener stock de un producto en todas las bodegas
const obtenerStockPorBodega = async (req, res) => {
    try {
        const { itemCode } = req.params;
        if (!itemCode) {
            return res.status(400).json({ error: "Debes proporcionar un código de producto." });
        }

        const pool = await poolPromise;
        const query = `
            SELECT 
                W.WhsCode AS Codigo_Almacen,
                CASE 
                    WHEN W.WhsCode = '01' THEN 'Centro Comercial'
                    WHEN W.WhsCode = '02' THEN 'Devoluciones'
                    WHEN W.WhsCode = '03' THEN 'Comercio Electrónico'
                    WHEN W.WhsCode = '04' THEN 'Control de Pérdidas'
                    WHEN W.WhsCode = '05' THEN 'Envíos FULL - Mercado Libre'
                    WHEN W.WhsCode = '06' THEN 'Bodega Fábrica'
                    WHEN W.WhsCode = '07' THEN 'Ferretería Balmaceda'
                    WHEN W.WhsCode = '08' THEN 'Bodega Lo Ovalle'
                    WHEN W.WhsCode = '10' THEN 'Reservado con Abono'
                    WHEN W.WhsCode = '12' THEN 'Producto con Falla'
                    WHEN W.WhsCode = '13' THEN 'Reservado FULL'
                    ELSE 'Otro Almacén' 
                END AS Nombre_Almacen,
                W.OnHand AS Stock
            FROM OITW W
            WHERE W.ItemCode = @itemCode
            ORDER BY W.WhsCode;
        `;

        const result = await pool.request()
            .input("itemCode", sql.NVarChar, itemCode)
            .query(query);

        res.json(result.recordset);
    } catch (error) {
        console.error("❌ Error al obtener stock por bodega:", error);
        res.status(500).json({ error: "Error en el servidor." });
    }
};



// 🔹 Obtener quiebres en un rango de fechas y opcionalmente por código de producto
const obtenerQuiebresPorRango = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin, itemCodes } = req.body; // 📌 Debe venir en req.body, no req.query

        if (!fecha_inicio || !fecha_fin) {
            return res.status(400).json({ error: "Debes proporcionar un rango de fechas válido." });
        }

        console.log("🛠️ Datos recibidos:", req.body); // 📌 Verificar si se reciben bien los datos

        const pool = await poolPromise;
        let query = `
            WITH Movimientos AS (
                SELECT 
                    TransType, 
                    CreateDate, 
                    DocTime,
                    TransNum,  
                    InQty, 
                    OutQty, 
                    SUM(InQty - OutQty) OVER (
                        PARTITION BY ItemCode 
                        ORDER BY CreateDate, DocTime, TransNum ASC 
                        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                    ) AS flujo_stock,
                    ItemCode,
                    ROW_NUMBER() OVER (PARTITION BY ItemCode ORDER BY CreateDate, DocTime, TransNum ASC) AS row_num
                FROM OINM
        `;

        if (itemCodes && itemCodes.length > 0) {
            query += ` WHERE ItemCode IN (${itemCodes.map((_, i) => `@code${i}`).join(", ")})`;
        }

        query += `),
        Quiebres AS (
            SELECT *,
                CASE 
                    WHEN LAG(flujo_stock) OVER (PARTITION BY ItemCode ORDER BY CreateDate, DocTime, TransNum ASC) > 0 
                    AND flujo_stock = 0 THEN 1 
                    ELSE 0 
                END AS inicio_quiebre
            FROM Movimientos
        ),
        FinalesBase AS (
            SELECT 
                q.ItemCode,
                q.CreateDate AS fecha_inicio_quiebre,
                q.DocTime AS hora_inicio_quiebre,
                q.TransNum AS transnum_inicio_quiebre,
                MIN(m.CreateDate) AS fecha_fin_quiebre,
                MIN(m.TransNum) AS transnum_fin_quiebre,
                MIN(m.TransType) AS trans_type_fin_quiebre
            FROM Quiebres q
            LEFT JOIN Movimientos m
                ON q.ItemCode = m.ItemCode
                AND (
                    m.CreateDate > q.CreateDate 
                    OR (m.CreateDate = q.CreateDate AND m.DocTime > q.DocTime)
                    OR (m.CreateDate = q.CreateDate AND m.DocTime = q.DocTime AND m.TransNum > q.TransNum)
                )
                AND m.TransType = 20
            WHERE q.inicio_quiebre = 1
            GROUP BY q.ItemCode, q.CreateDate, q.DocTime, q.TransNum
        ),
        HorasFinales AS (
            SELECT 
                f.ItemCode,
                f.fecha_inicio_quiebre,
                f.hora_inicio_quiebre,
                f.transnum_inicio_quiebre,
                f.fecha_fin_quiebre,
                m.DocTime AS hora_fin_quiebre,
                f.transnum_fin_quiebre,
                f.trans_type_fin_quiebre
            FROM FinalesBase f
            LEFT JOIN Movimientos m 
                ON f.ItemCode = m.ItemCode 
                AND f.transnum_fin_quiebre = m.TransNum
        ),
        Filtrado AS (
            SELECT 
                f.*,
                LAG(fecha_fin_quiebre) OVER (PARTITION BY ItemCode ORDER BY fecha_inicio_quiebre, hora_inicio_quiebre, transnum_inicio_quiebre) AS fin_quiebre_anterior,
                LAG(hora_fin_quiebre) OVER (PARTITION BY ItemCode ORDER BY fecha_inicio_quiebre, hora_inicio_quiebre, transnum_inicio_quiebre) AS hora_fin_quiebre_anterior,
                LAG(transnum_fin_quiebre) OVER (PARTITION BY ItemCode ORDER BY fecha_inicio_quiebre, hora_inicio_quiebre, transnum_inicio_quiebre) AS transnum_fin_quiebre_anterior
            FROM HorasFinales f
        ),
        Resultados AS (
            SELECT 
                ItemCode,
                fecha_inicio_quiebre,
                hora_inicio_quiebre,
                transnum_inicio_quiebre,
                fecha_fin_quiebre,
                hora_fin_quiebre,
                transnum_fin_quiebre,
                trans_type_fin_quiebre
            FROM Filtrado
            WHERE fin_quiebre_anterior IS NULL 
                OR (fecha_inicio_quiebre > fin_quiebre_anterior AND trans_type_fin_quiebre = 20)
        )
        SELECT 
            ItemCode,
            fecha_inicio_quiebre,
            hora_inicio_quiebre,
            transnum_inicio_quiebre,
            fecha_fin_quiebre,
            hora_fin_quiebre,
            transnum_fin_quiebre,
            trans_type_fin_quiebre,
            DATEDIFF(DAY, fecha_inicio_quiebre, ISNULL(fecha_fin_quiebre, GETDATE())) AS dias
        FROM Resultados
        WHERE fecha_inicio_quiebre BETWEEN @FechaInicio AND @FechaFin
        ORDER BY fecha_inicio_quiebre ASC, hora_inicio_quiebre ASC, transnum_inicio_quiebre ASC;
        `;

        const request = pool.request()
            .input("FechaInicio", sql.Date, fecha_inicio)
            .input("FechaFin", sql.Date, fecha_fin);

        if (itemCodes && itemCodes.length > 0) {
            itemCodes.forEach((code, index) => {
                request.input(`code${index}`, sql.NVarChar, code);
            });
        }

        const result = await request.query(query);
        res.json(result.recordset);

    } catch (error) {
        console.error("❌ Error al obtener quiebres por rango:", error);
        res.status(500).json({ error: "Error en el servidor." });
    }
};

module.exports = {obtenerProductosEnQuiebre, obtenerStockPorBodega, obtenerQuiebresPorRango };
