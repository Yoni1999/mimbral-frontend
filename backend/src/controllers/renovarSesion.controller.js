const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { poolPromise, sql } = require("../models/db");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

const JWT_SECRET = process.env.JWT_SECRET || "clave_super_secreta";

const renovarSesion = async (req, res) => {
  const { password } = req.body;
  const userId = req.user.id;
  const tokenAnterior = req.headers.authorization?.split(" ")[1];

  try {
    const pool = await poolPromise;

    // 1. Obtener el hash y correo del usuario
    const result = await pool.request()
      .input("ID", sql.Int, userId)
      .query("SELECT password_hash, EMAIL FROM USUARIOS WHERE ID = @ID");

    if (result.recordset.length === 0) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    const user = result.recordset[0];

    // 2. Verificar contraseña
    const esValida = await bcrypt.compare(password, user.password_hash);
    if (!esValida) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    // 3. Invalidar token anterior
    if (tokenAnterior) {
      await pool.request()
        .input("Token", sql.NVarChar, tokenAnterior)
        .query(`UPDATE TOKENS_ACTIVOS SET VALIDO = 0 WHERE TOKEN = @Token`);

      await pool.request()
        .input("Token", sql.NVarChar, tokenAnterior)
        .input("FechaFin", sql.DateTime, dayjs().tz("America/Santiago").toDate())
        .query(`UPDATE SESIONES_USUARIOS SET FechaFin = @FechaFin WHERE Token = @Token AND FechaFin IS NULL`);
    }

    // 4. Crear nuevo token
    const nuevoToken = jwt.sign(
      { id: userId, email: user.EMAIL },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    const fechaInicio = dayjs().tz("America/Santiago").toDate();

    // 5. Registrar nueva sesión
    await pool.request()
      .input("UsuarioID", sql.Int, userId)
      .input("FechaInicio", sql.DateTime, fechaInicio)
      .input("Token", sql.NVarChar, nuevoToken)
      .query(`
        INSERT INTO SESIONES_USUARIOS (UsuarioID, FechaInicio, FechaFin, Token)
        VALUES (@UsuarioID, @FechaInicio, NULL, @Token)
      `);

    // 6. Insertar nuevo token válido
    await pool.request()
      .input("UsuarioID", sql.Int, userId)
      .input("Token", sql.NVarChar, nuevoToken)
      .query(`
        INSERT INTO TOKENS_ACTIVOS (USUARIO_ID, TOKEN, VALIDO)
        VALUES (@UsuarioID, @Token, 1)
      `);

    // 7. Retornar token
    res.status(200).json({ token: nuevoToken });

  } catch (err) {
    console.error("Error en renovación de sesión:", err);
    res.status(500).json({ error: "Error al renovar sesión" });
  }
};

module.exports = renovarSesion;
