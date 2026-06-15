const cron = require("node-cron");
const { ejecutarProcedimientos, ejecutarProcedimientosIndividual } = require("../services/actualizar.service");

const zonaHoraria = "America/Santiago";

// Cron principal: cada 00:00, 06:00, 10:00, 14:00, 18:00 y 22:00
cron.schedule(
  "0 0,6,10,14,18,22 * * *",
  async () => {
    const horaActual = new Date().toLocaleString("es-CL", { timeZone: zonaHoraria });
    console.log(`[${horaActual}] Iniciando actualización automática general`);

    try {
      await ejecutarProcedimientos();
      console.log(`[${horaActual}] Actualización general finalizada con éxito`);
    } catch (error) {
      console.error(`[${horaActual}] Error en actualización general:`, error.message);
    }
  },
  {
    timezone: zonaHoraria,
  }
);

cron.schedule(
  "*/20 * * * *",
  async () => {
    const horaActual = new Date().toLocaleString("es-CL", { timeZone: zonaHoraria });
    console.log(`[${horaActual}] Iniciando actualización de inventario (OITM_ITM1, OITW)`);

    try {
      await ejecutarProcedimientosIndividual([
        "ACTUALIZAR_OITM_ITM1",
        "ACTUALIZAR_OITW"
      ]);
      console.log(`[${horaActual}] Actualización de inventario finalizada con éxito`);
    } catch (error) {
      console.error(`[${horaActual}] Error en actualización de inventario:`, error.message);
    }
  },
  {
    timezone: zonaHoraria,
  }
);
