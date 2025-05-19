const { app, BrowserWindow } = require("electron");
const { startServer } = require("next/dist/server/lib/start-server");
const net = require("net");
const path = require("path");
const isDev = require("electron-is-dev");

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, () => {
      const { port } = srv.address();
      console.log("[getFreePort] servidor escuchando en puerto:", port);
      srv.close(() => resolve(port));
    });
    srv.on("error", (err) => {
      console.error("[getFreePort] error al buscar puerto libre:", err);
      reject(err);
    });
  });
}

async function createWindow() {
  console.log("[createWindow] creando ventana principal...");
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    show: false,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  let url;

  try {
    if (isDev) {
      url = "http://localhost:3000";
      console.log("[createWindow] Modo desarrollo, URL:", url);
    } else {
      console.log(
        "[createWindow] Modo producción, preparando Next.js embebido..."
      );
      const dir = app.getAppPath();
      console.log("[createWindow] ruta de la app:", dir);

      const port = await getFreePort();
      console.log("[createWindow] puerto dinámico asignado:", port);

      console.log("[createWindow] arrancando servidor Next.js...");
      await startServer({
        dir,
        port,
        hostname: "localhost",
        dev: false,
        minimalMode: false,
        allowRetry: false,
      });
      console.log("[createWindow] servidor Next.js iniciado correctamente.");

      url = `http://localhost:${port}`;
    }

    console.log("[createWindow] cargando URL en ventana:", url);
    await win.loadURL(url);
    win.show();
    console.log("[createWindow] ventana mostrada con éxito.");
  } catch (err) {
    console.error(
      "[createWindow] ERROR en la inicialización de la ventana:",
      err
    );
  }

  win.webContents.on(
    "did-fail-load",
    (_e, errorCode, errorDescription, validatedURL) => {
      console.error(
        "[did-fail-load] No se pudo cargar la URL:",
        validatedURL,
        "Code:",
        errorCode,
        "Descripción:",
        errorDescription
      );
    }
  );

  win.webContents.on("crashed", () => {
    console.error("[webContents] ¡La ventana se ha bloqueado!");
  });

  win.on("unresponsive", () => {
    console.warn("[BrowserWindow] la ventana está sin responder.");
  });
}

app
  .whenReady()
  .then(() => {
    console.log("[app] Electron listo, llamando a createWindow()");
    return createWindow();
  })
  .catch((err) => {
    console.error("[app] falló app.whenReady():", err);
  });

app.on("window-all-closed", () => {
  console.log("[app] todas las ventanas cerradas.");
  if (process.platform !== "darwin") {
    console.log("[app] cerrando la app (no macOS).");
    app.quit();
  }
});

process.on("unhandledRejection", (reason, promise) => {
  console.error(
    "[unhandledRejection] Promesa rechazada:",
    promise,
    "Razón:",
    reason
  );
});


