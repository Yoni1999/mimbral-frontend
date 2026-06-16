require("dotenv").config();
const os = require("os");
const createApp = require("./src/app/createApp");
const { port: PORT, host: HOST } = require("./src/config/env");

const app = createApp();

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const config of iface) {
      if (config.family === "IPv4" && !config.internal) {
        return config.address;
      }
    }
  }
  return "127.0.0.1";
}

const localIP = getLocalIP();

// Jobs automáticos
require("./src/cron/cronJobs");

// Iniciar servidor
app.listen(PORT, HOST, async () => {
  console.log(`Servidor corriendo en:`);
  console.log(`Local:     http://localhost:${PORT}`);
  console.log(`Red local: http://${localIP}:${PORT}`);
});
