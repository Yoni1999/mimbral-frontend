const { poolPromise } = require("../models/db");

const ejecutarProcedimientos = async () => {
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
    "ActualizarDatosTransacciones",
    "Actualizar_OUSR",
    "ACTUALIZAR_OBCD",
    "Actualizar_TABLA_CONVERSION",
  ];

  for (const proc of procedimientos) {
    console.log(`▶ Ejecutando: ${proc}`);
    await pool.request().query(`EXEC ${proc}`);
  }

  console.log("✅ Procedimientos generales ejecutados");
};

const ejecutarProcedimientosIndividual = async (procedimientos) => {
  const pool = await poolPromise;

  for (const proc of procedimientos) {
    console.log(`▶ Ejecutando (individual): ${proc}`);
    await pool.request().query(`EXEC ${proc}`);
  }

  console.log("✅ Procedimientos individuales ejecutados");
};

module.exports = { ejecutarProcedimientos, ejecutarProcedimientosIndividual };
