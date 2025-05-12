const { poolPromise } = require("../models/db");
const { getCachedData } = require("../utils/cache");

// ✅ Controlador para obtener los proveedores desde SAP B1
const obtenerProveedores = async (req, res) => {
    try {
        const pool = await poolPromise;

        const query = `
            SELECT 
                CardCode AS CodigoProveedor, 
                CardName AS NombreProveedor
            FROM OCRD
            WHERE CardType = 'S'
            ORDER BY CardName;
        `;

        const result = await pool.request().query(query);

        res.status(200).json(result.recordset);
    } catch (error) {
        console.error("❌ Error al obtener proveedores desde SAP:", error);
        res.status(500).json({ error: "Error en el servidor al obtener proveedores." });
    }
};

module.exports = { obtenerProveedores };
