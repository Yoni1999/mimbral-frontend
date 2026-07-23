const express = require("express");
const cors = require("cors");
const authMiddleware = require("../middleware/authMiddleware");
const registerRoutes = require("../routes");

function createApp() {
  const app = express();

  app.use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  app.use(express.json());

  app.use((req, res, next) => {
    if (req.method === "OPTIONS") {
      return next();
    }

    const publicRoutes = ["/v1/api/auth", "/v1/api/entradas", "/v1/api/templace", "/v1/api/pricing", "/v1/api/public"];
    const isPublic = publicRoutes.some((route) => req.path.startsWith(route));
    if (isPublic) return next();
    authMiddleware(req, res, next);
  });

  app.use("/v1", registerRoutes);

  return app;
}

module.exports = createApp;
