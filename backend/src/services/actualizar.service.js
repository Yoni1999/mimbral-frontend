const { poolPromise } = require("../models/db");
const { spRequestTimeout } = require("../config/env");

const PROCEDIMIENTOS_GENERALES = [
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
  "ActualizarDatosTransacciones",
  "Actualizar_OUSR",
  "Sync_OCTG",
];

const formatDuration = (startedAt) => `${((Date.now() - startedAt) / 1000).toFixed(2)}s`;

const ejecutarListaProcedimientos = async (procedimientos, contexto) => {
  const pool = await poolPromise;

  for (const proc of procedimientos) {
    const startedAt = Date.now();
    console.log(`[${contexto}] Ejecutando: ${proc}`);

    try {
      const request = pool.request();
      request.timeout = Number.isFinite(spRequestTimeout) && spRequestTimeout > 0 ? spRequestTimeout : 0;
      await request.query(`EXEC ${proc}`);
      console.log(
        `[${contexto}] OK: ${proc} completado en ${formatDuration(startedAt)}`
      );
    } catch (error) {
      error.procedimiento = proc;
      error.contexto = contexto;
      error.durationMs = Date.now() - startedAt;

      console.error(
        `[${contexto}] Error en ${proc} tras ${formatDuration(startedAt)}:`,
        error.message
      );
      throw error;
    }
  }
};

const ejecutarProcedimientos = async () => {
  await ejecutarListaProcedimientos(PROCEDIMIENTOS_GENERALES, "actualizacion-general");
  console.log("[actualizacion-general] Procedimientos generales ejecutados");
};

const ejecutarProcedimientosIndividual = async (procedimientos) => {
  await ejecutarListaProcedimientos(procedimientos, "actualizacion-individual");
  console.log("[actualizacion-individual] Procedimientos individuales ejecutados");
};

module.exports = { ejecutarProcedimientos, ejecutarProcedimientosIndividual };
