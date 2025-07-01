const cron = require("node-cron");
const { ejecutarProcedimientos } = require("../services/actualizar.service");

const zonaHoraria = "America/Santiago";

cron.schedule(
  "0 0,6,10,14,18,22 * * *",
  async () => {
    const horaActual = new Date().toLocaleString("es-CL", { timeZone: zonaHoraria });
    console.log(`[${horaActual}] Iniciando actualización automática`);

    try {
      await ejecutarProcedimientos();
      console.log(` [${horaActual}] Actualización finalizada con éxito`);
    } catch (error) {
      console.error(` [${horaActual}] Error en la actualización automática:`, error.message);
    }
  },
  {
    timezone: zonaHoraria
  }
);


