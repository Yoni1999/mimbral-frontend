const jwt = require("jsonwebtoken");
const { poolPromise, sql } = require("../models/db");

const JWT_SECRET = process.env.JWT_SECRET || "clave_super_secreta";

const authMiddleware = async (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Acceso denegado. No hay token." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET); 

    const expInMs = decoded.exp * 1000;
    const nowInMs = Date.now();
    const segundosRestantes = Math.floor((expInMs - nowInMs) / 1000);

    if (segundosRestantes <= 10) {
      try {
        const pool = await poolPromise;
        await pool.request()
          .input("Token", sql.NVarChar, token)
          .query(`
            UPDATE SESIONES_USUARIOS
            SET FECHA_FIN = GETDATE()
            WHERE TOKEN = @Token AND FECHA_FIN IS NULL
          `);
        console.log("⏳ FECHA_FIN marcada por vencimiento inminente");
      } catch (err) {
        console.error("❌ Error al marcar FECHA_FIN anticipadamente:", err);
      }
    }

    // Verifica si el token sigue marcado como válido
    const pool = await poolPromise;
    const result = await pool.request()
      .input("Token", sql.NVarChar, token)
      .query("SELECT VALIDO FROM TOKENS_ACTIVOS WHERE TOKEN = @Token");

    if (result.recordset.length === 0 || result.recordset[0].VALIDO !== true) {
      return res.status(401).json({ error: "Token inválido o revocado" });
    }

    req.user = decoded;
    next();

  } catch (error) {
    console.error("❌ Error en authMiddleware:", error);

    if (error.name === "TokenExpiredError") {
      try {
        const pool = await poolPromise;
        await pool.request()
          .input("Token", sql.NVarChar, token)
          .query(`
            UPDATE SESIONES_USUARIOS
            SET FECHA_FIN = GETDATE()
            WHERE TOKEN = @Token AND FECHA_FIN IS NULL
          `);
        console.log("❌ FECHA_FIN registrada por token expirado");
      } catch (err) {
        console.error("❌ Error al actualizar FECHA_FIN por expiración:", err);
      }

      return res.status(401).json({ error: "Token expirado. Inicia sesión nuevamente." });
    }

    return res.status(401).json({ error: "Token inválido o expirado." });
  }
};

module.exports = authMiddleware;
