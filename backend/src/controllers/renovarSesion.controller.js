const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { poolPromise, sql } = require("../models/db");
const dayjs = require("dayjs");

const JWT_SECRET = process.env.JWT_SECRET || "clave_super_secreta";

const renovarSesion = async (req, res) => {
  const { password } = req.body;
  const userId = req.user.id;

  try {
    const pool = await poolPromise;

    // 1. Obtener el hash y el correo del usuario
    const result = await pool.request()
      .input("ID", sql.Int, userId)
      .query("SELECT password_hash, EMAIL FROM USUARIOS WHERE ID = @ID");

    if (result.recordset.length === 0) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    const user = result.recordset[0];

    // 2. Verificar la contraseña ingresada
    const esValida = await bcrypt.compare(password, user.password_hash);
    if (!esValida) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    // 3. Generar nuevo token (ej: 2h para pruebas)
    const nuevoToken = jwt.sign(
      { id: userId, email: user.EMAIL },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    // 4. Registrar nueva sesión en la tabla
    const fechaInicio = dayjs().toDate();

    await pool.request()
      .input("UsuarioID", sql.Int, userId)
      .input("FechaInicio", sql.DateTime, fechaInicio)
      .input("Token", sql.NVarChar, nuevoToken)
      .query(`
        INSERT INTO SESIONES_USUARIOS (UsuarioID, FechaInicio, FechaFin, Token)
        VALUES (@UsuarioID, @FechaInicio, NULL, @Token)
      `);

    // 5. Enviar nuevo token
    res.status(200).json({ token: nuevoToken });

  } catch (err) {
    console.error("Error en renovación de sesión:", err);
    res.status(500).json({ error: "Error al renovar sesión" });
  }
};

module.exports = renovarSesion;
