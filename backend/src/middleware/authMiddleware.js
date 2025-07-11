const jwt = require("jsonwebtoken");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

const { poolPromise, sql } = require("../models/db");

dayjs.extend(utc);
dayjs.extend(timezone);

const JWT_SECRET = process.env.JWT_SECRET || "clave_super_secreta";

const authMiddleware = async (req, res, next) => {
  const authHeader = req.header("Authorization");

  const errorResponse = (message) => {
    return res.status(401).json({
      status: "error",
      code: 401,
      message,
      timestamp: dayjs().tz("America/Santiago").format("YYYY-MM-DD HH:mm:ss")
    });
  };

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return errorResponse("Acceso denegado. Esta ruta está protegida y no tiene un token válido.");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Validación normal del token (aún no vencido)
    const pool = await poolPromise;
    const result = await pool.request()
      .input("Token", sql.NVarChar, token)
      .query("SELECT VALIDO FROM TOKENS_ACTIVOS WHERE TOKEN = @Token");

    if (result.recordset.length === 0 || result.recordset[0].VALIDO !== true) {
      return errorResponse("Token inválido o revocado.");
    }

    req.user = decoded;
    next();

  } catch (error) {
    if (error.name === "TokenExpiredError") {
      console.warn("⌛ Token expirado, cerrando sesión automáticamente.");

      try {
        const pool = await poolPromise;

        await pool.request()
          .input("Token", sql.NVarChar, token)
          .query(`
            UPDATE SESIONES_USUARIOS
            SET FechaFin = GETDATE()
            WHERE TOKEN = @Token AND FechaFin IS NULL
          `);

        console.log("🕓 FechaFin registrada por expiración de token");
      } catch (err) {
        console.error("⚠️Error al actualizar Fecha Fin por expiración:", err);
      }

      return errorResponse("Token expirado. Inicia sesión nuevamente.");
    } else {
      console.error("Error en authMiddleware:", error);
      return errorResponse("Token inválido o expirado.");
    }
  }
};

module.exports = authMiddleware;
