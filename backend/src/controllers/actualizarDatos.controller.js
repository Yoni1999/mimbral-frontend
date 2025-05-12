const { poolPromise } = require("../models/db");

// ✅ Controlador para actualizar los datos
const actualizarDatos = async (req, res) => {
  try {
      const pool = await poolPromise;

      const procedimientos = [
          "ACTUALIZAR_FAMILIA_SUBFAMILIA",
          "ACTUALIZAR_CATEGORIA_SUBCATEGORIA",
          "ACTUALIZAR_OITM_ITM1",
          "ACTUALIZAR_OSLP",
          "ACTUALIZAR_OITW",
          "ACTUALIZAR_OPOR_POR1",
          "ACTUALIZAR_OPDN_PDN1",
          "ACTUALIZAR_OINV_INV1",
          "ACTUALIZAR_OPCH_PCH1",
          "ACTUALIZAR_OINM",
          "Actualizar_OCRD",
          "Actualizar_ODLN_DLN1",
          "Actualizar_OBNK",
          "Actualizar_ORIN_RIN1",
          "ActualizarDatosTransacciones"
      ];

      for (const proc of procedimientos) {
          await pool.request().query(`EXEC ${proc}`);
      }

      res.json({ success: true, message: "Datos actualizados correctamente." });
  } catch (error) {
      console.error("❌ Error al actualizar los datos:", error);
      res.status(500).json({ success: false, message: "Error en el servidor al actualizar los datos." });
  }
};

const getUltimaActualizacion = async (req, res) => {
    try {
      const pool = await poolPromise;
      const query = `
        SELECT TOP 1 
            OI.DocDate AS UltimaFecha, 
            OI.DocTime AS UltimaHora
        FROM OINV OI
        INNER JOIN INV1 I ON OI.DocEntry = I.DocEntry
        ORDER BY OI.DocDate DESC, OI.DocTime DESC;
      `;
  
      const result = await pool.request().query(query);
  
      if (result.recordset.length > 0) {
        let { UltimaFecha, UltimaHora } = result.recordset[0];
  
        // 🔥 Convertir la fecha a formato YYYY-MM-DD
        UltimaFecha = new Date(UltimaFecha).toISOString().split("T")[0];
  
        // 🔥 Convertir DocTime de formato HHMM a HH:MM (sin segundos)
        const horaStr = UltimaHora.toString().padStart(4, "0"); // Asegurar que tenga 4 dígitos (ej: 920 → "0920")
        const horas = horaStr.substring(0, 2);
        const minutos = horaStr.substring(2, 4);
        const horaFormateada = `${horas}:${minutos}`;
  
        res.json({ ultimaFecha: UltimaFecha, ultimaHora: horaFormateada });
      } else {
        res.json({ ultimaFecha: null, ultimaHora: null });
      }
    } catch (error) {
      console.error("❌ Error obteniendo la última actualización:", error);
      res.status(500).send("Error en el servidor");
    }
  };
module.exports = { actualizarDatos, getUltimaActualizacion };
