const { poolPromise } = require("../models/db");
const { ejecutarProcedimientos } = require("../services/actualizar.service");

const actualizarDatos = async (req, res) => {
  req.setTimeout(0);
  res.setTimeout(0);

  try {
    await ejecutarProcedimientos();
    res.json({ success: true, message: "Datos actualizados correctamente." });
  } catch (error) {
    console.error("Error al actualizar los datos:", {
      procedimiento: error.procedimiento,
      durationMs: error.durationMs,
      message: error.message,
      code: error.code,
    });

    res.status(500).json({
      success: false,
      message: "Error en el servidor al actualizar los datos.",
      procedimiento: error.procedimiento || null,
    });
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
  
        UltimaFecha = new Date(UltimaFecha).toISOString().split("T")[0];
  
        const horaStr = UltimaHora.toString().padStart(4, "0"); 
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
