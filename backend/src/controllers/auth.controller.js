const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sql, poolPromise } = require("../models/db");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);


const { sendEmail } = require("../utils/emailService");

const JWT_SECRET = process.env.JWT_SECRET || "clave_super_secreta";

const generateOTP = () => Math.floor(100000 + Math.random() * 900000);

const registerUser = async (req, res) => {
  try {
    const {
      nombre,
      email,
      password,
      telefono = "",
      direccion = "",
      ip_registro,
      ciudad = "",
      region = "",
      pais = "",
      latitud = null,
      longitud = null,
    } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const pool = await poolPromise;

    await pool.request()
      .input("Nombre", sql.NVarChar, nombre)
      .input("Email", sql.NVarChar, email)
      .input("PasswordHash", sql.NVarChar, hashedPassword)
      .input("Rol", sql.NVarChar, "usuario")
      .input("Estado", sql.Int, 0)
      .input("Telefono", sql.NVarChar, telefono)
      .input("Direccion", sql.NVarChar, direccion)
      .input("IPRegistro", sql.NVarChar, ip_registro || "")
      .input("Ciudad", sql.NVarChar, ciudad)
      .input("Region", sql.NVarChar, region)
      .input("Pais", sql.NVarChar, pais)
      .input("Latitud", sql.Float, latitud)
      .input("Longitud", sql.Float, longitud)
      .query(`
        INSERT INTO USUARIOS (Nombre, Email, Password_Hash, Rol, Estado, Telefono, Direccion, IP_Registro, Ciudad, Region, Pais, Latitud, Longitud)
        VALUES (@Nombre, @Email, @PasswordHash, @Rol, @Estado, @Telefono, @Direccion, @IPRegistro, @Ciudad, @Region, @Pais, @Latitud, @Longitud)
      `);

    // ✉️ Email al usuario registrado
    await sendEmail({
      to: email,
      subject: "Registro exitoso - Plataforma de Análisis de Datos Mimbral",
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 30px; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); background-color: #ffffff; border: 1px solid #e0e0e0;">
          <div style="text-align: center; margin-bottom: 25px;">
            <img src="https://res.cloudinary.com/dhzahos7u/image/upload/v1747080896/mimbral_af8zz8.png" alt="Mimbral Logo" style="max-height: 60px;" />
          </div>
          <h2 style="color: #1a1a1a; text-align: center; margin-bottom: 16px;">¡Registro exitoso!</h2>
          <p style="font-size: 16px; color: #444; text-align: center; margin-bottom: 24px;">
            Hola <strong>${nombre}</strong>, gracias por registrarte en la plataforma de análisis de datos de Mimbral.
          </p>
          <div style="background-color: #f9f9f9; padding: 15px 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="font-size: 15px; color: #333; margin: 0 0 10px;"><strong>Datos de tu cuenta:</strong></p>
            <ul style="font-size: 14px; color: #555; padding-left: 20px; margin: 0;">
              <li><strong>Email:</strong> ${email}</li>
              <li><strong>Contraseña:</strong> ${password}</li>
              <li><strong>Teléfono:</strong> ${telefono}</li>
              <li><strong>Departamento:</strong> ${direccion}</li>
            </ul>
          </div>
          <p style="font-size: 15px; color: #d9534f; text-align: center;">
            Tu cuenta aún <strong>no está activa</strong>. Deberás esperar a que un administrador apruebe tu acceso.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 12px; color: #aaa; text-align: center;">
            © ${new Date().getFullYear()} Mimbral - Todos los derechos reservados.
          </p>
        </div>
      `,
      text: `Hola ${nombre}, gracias por registrarte. Tu cuenta aún no está activa. Debes esperar la aprobación del administrador.`
    });

    // 🔔 Email a administradores
    const result = await pool.request().query(`
      SELECT Email FROM USUARIOS WHERE Rol = 'admin' AND Estado = 1
    `);

    const adminEmails = result.recordset.map(row => row.Email);

    if (adminEmails.length > 0) {
      await sendEmail({
        to: adminEmails,
        subject: "Nuevo usuario pendiente de autorización",
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 30px; font-family: 'Segoe UI', Arial, sans-serif; background-color: #ffffff; border-radius: 10px; border: 1px solid #e6e6e6; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
            <div style="text-align: center; margin-bottom: 30px;">
              <img src="https://res.cloudinary.com/dhzahos7u/image/upload/v1747080896/mimbral_af8zz8.png" alt="Logo Mimbral" style="height: 50px;" />
            </div>

            <h2 style="color: #333333; font-size: 22px; margin-bottom: 12px; text-align: center;">🔔 Nuevo usuario pendiente de autorización</h2>
            <p style="color: #555555; font-size: 15px; text-align: center; margin-bottom: 25px;">
              Un nuevo usuario se ha registrado y requiere tu aprobación.
            </p>
            <table style="width: 100%; font-size: 14px; color: #333; margin-bottom: 20px;">
              <tbody>
                <tr><td><strong>👤 Nombre:</strong></td><td>${nombre}</td></tr>
                <tr><td><strong>📧 Email:</strong></td><td>${email}</td></tr>
                <tr><td><strong>📞 Teléfono:</strong></td><td>${telefono || "-"}</td></tr>
                <tr><td><strong>📍 Departamento:</strong></td><td>${direccion || "-"}</td></tr>
              </tbody>
            </table>
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://mimbral-frontend.vercel.app/authentication/login"
                style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                Ir al panel de administración
              </a>
            </div>
            <p style="margin-top: 40px; text-align: center; color: #999999; font-size: 12px;">
              © ${new Date().getFullYear()} Mimbral - Todos los derechos reservados.
            </p>
          </div>
        `,
        text: `Nuevo usuario registrado: ${nombre} (${email}). Ingresa al panel de administración para autorizar.`
      });
    }

    res.json({ message: "Usuario registrado correctamente. Se ha enviado un correo con los detalles." });

  } catch (error) {
    console.error("❌ Error en registerUser:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};


const crearUsuarioPorAdmin = async (req, res) => {
  try {
    const { nombre, email, password, telefono = "", direccion = "", rol = "usuario", estado = 0 } = req.body;

    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({ message: "Faltan datos obligatorios" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const pool = await poolPromise;

    await pool.request()
      .input("Nombre", sql.NVarChar, nombre)
      .input("Email", sql.NVarChar, email)
      .input("PasswordHash", sql.NVarChar, hashedPassword)
      .input("Rol", sql.NVarChar, rol)
      .input("Estado", sql.Int, estado)
      .input("Telefono", sql.NVarChar, telefono)
      .input("Direccion", sql.NVarChar, direccion)
      .query(`
        INSERT INTO USUARIOS (Nombre, Email, Password_Hash, Rol, Estado, Telefono, Direccion)
        VALUES (@Nombre, @Email, @PasswordHash, @Rol, @Estado, @Telefono, @Direccion)
      `);

    // Contenido HTML del correo
    const htmlMensaje = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #fff; border: 1px solid #ddd; border-radius: 8px;">
        <h2>Se te ha dado acceso a la plataforma de análisis de datos de Mimbral</h2>
        <p>Un administrador ha creado tu cuenta con los siguientes datos:</p>
        <ul>
          <li><strong>Nombre:</strong> ${nombre}</li>
          <li><strong>Correo:</strong> ${email}</li>
          <li><strong>Teléfono:</strong> ${telefono || "No registrado"}</li>
          <li><strong>Contraseña:</strong> ${password}</li>
        </ul>
        <p>Puedes ingresar desde el siguiente enlace:</p>
        <a href="https://mimbral-frontend.vercel.app/authentication/login" style="display: inline-block; background-color: #28a745; color: #fff; padding: 10px 18px; border-radius: 6px; text-decoration: none;">Ir al login</a>
        <p style="margin-top: 20px; font-size: 12px; color: #999;">Te recomendamos cambiar tu contraseña una vez dentro del sistema.</p>
      </div>
    `;

    // Envío del correo usando emailService
    try {
      await sendEmail({
        to: email,
        subject: "Tu cuenta ha sido creada",
        html: htmlMensaje,
        text: `Hola ${nombre}, tu cuenta ha sido creada. Accede con el correo ${email} y contraseña: ${password}.`,
        from: `"Administrador Mimbral" <${process.env.EMAIL_USER}>`,
      });

      console.log("✅ Correo enviado a:", email);
    } catch (envioError) {
      console.error("❌ Error al enviar correo al usuario:", envioError);
    }

    res.json({ message: "Usuario creado correctamente por administrador y correo enviado" });
  } catch (error) {
    console.error("❌ Error al crear usuario por admin:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validación básica
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !password) {
      return res.status(400).json({ error: "Faltan datos" });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Error de sintaxis en el correo" });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input("Email", sql.NVarChar, email)
      .query("SELECT * FROM USUARIOS WHERE Email = @Email");

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Correo incorrecto" });
    }

    const user = result.recordset[0];
    console.log("🧪 Usuario encontrado:", user);

    if (user.ESTADO === false) {
      return res.status(403).json({
        error: "El usuario está inactivo temporalmente. Comunícate con área de TI."
      });
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.PASSWORD_HASH);
    if (!validPassword) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    // Decidir aleatoriamente si se pide OTP (50% de las veces)
    const pedirOTP = Math.random() < 0.5;

    if (!pedirOTP) {
      const token = jwt.sign(
        { id: user.ID, email: user.Email, rol: user.ROL, nombre: user.NOMBRE },
        JWT_SECRET,
        { expiresIn: "4h" }
      );

      // Guardar en TOKENS_ACTIVOS
      await pool.request()
        .input("UsuarioID", sql.Int, user.ID)
        .input("Token", sql.NVarChar, token)
        .query(`
          INSERT INTO TOKENS_ACTIVOS (USUARIO_ID, TOKEN, VALIDO)
          VALUES (@UsuarioID, @Token, 1)
        `);

      // Registrar inicio de sesión
      const fechaInicio = dayjs().tz("America/Santiago").format("YYYY-MM-DD HH:mm:ss");

      await pool.request()
        .input("UsuarioID", sql.Int, user.ID)
        .input("FechaInicio", sql.DateTime, fechaInicio)
        .input("Token", sql.NVarChar, token)
        .query(`
          INSERT INTO SESIONES_USUARIOS (UsuarioID, FechaInicio, Token)
          VALUES (@UsuarioID, @FechaInicio, @Token)
        `);


      return res.json({ message: "Login exitoso sin OTP", token, rol: user.ROL });
    }

    // 🔐 Si se decide pedir OTP:
    const otpCode = generateOTP().toString();
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + 5);

    // Guardar OTP
    await pool.request()
      .input("UsuarioID", sql.Int, user.ID)
      .input("OTP", sql.NVarChar(6), otpCode)
      .input("ExpiraEn", sql.DateTime, expirationTime)
      .query(`
        INSERT INTO OTP_CODES (USUARIO_ID, OTP, EXPIRA_EN) 
        VALUES (@UsuarioID, @OTP, @ExpiraEn)
      `);

    // Enviar correo con OTP
    await sendEmail({
      to: email,
      subject: "Código de acceso - Equipo Mimbral",
      html: `
        <div style="
          font-family: 'Segoe UI', Arial, sans-serif;
          max-width: 520px;
          margin: 0 auto;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.1);
          background-color: #ffffff;
          border: 1px solid #e0e0e0;
        ">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://res.cloudinary.com/dhzahos7u/image/upload/v1747080896/mimbral_af8zz8.png" alt="Mimbral Logo" style="max-height: 60px;" />
          </div>

          <h2 style="color: #1a1a1a; text-align: center; margin-bottom: 10px;">
            Código de acceso temporal
          </h2>

          <p style="font-size: 15px; color: #333; text-align: center; margin-bottom: 24px;">
            Estimado usuario, tu código de acceso es:
          </p>

          <div style="
            font-size: 32px;
            font-weight: 600;
            color: #0a7cff;
            text-align: center;
            margin-bottom: 30px;
            padding: 12px 24px;
            background-color: #f3f9ff;
            border-radius: 8px;
            display: inline-block;
          ">
            ${otpCode}
          </div>

          <p style="font-size: 14px; color: #555; line-height: 1.6; text-align: center;">
            Este código tiene una validez de <strong>5 minutos</strong> desde su emisión y <strong>solo puede ser utilizado una vez</strong>.
            Si no solicitaste este código, puedes ignorar este correo.
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />

          <p style="font-size: 12px; color: #aaa; text-align: center;">
            © ${new Date().getFullYear()} Mimbral mts - Todos los derechos reservados.
          </p>
        </div>
      `,
      text: `Tu código de acceso es: ${otpCode} (válido por 5 minutos, solo se puede usar una vez).`,
    });


    // Registrar sesión (sin token aún, se guardará en verifyOTP)
    await pool.request()
      .input("UsuarioID", sql.Int, user.ID)
      .input("FechaInicio", sql.DateTime, dayjs().tz("America/Santiago").format("YYYY-MM-DD HH:mm:ss"))
      .query(`
        INSERT INTO SESIONES_USUARIOS (UsuarioID, FechaInicio)
        VALUES (@UsuarioID, GETDATE())
      `);

    return res.json({
      message: "Código enviado al correo electrónico",
      requiresOtp: true
    });
      

  } catch (error) {
    console.error("❌ Error en loginUser:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};


const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    const pool = await poolPromise;
    const now = new Date();

    const result = await pool.request()
      .input("Email", sql.NVarChar, email)
      .input("OTP", sql.NVarChar, otp)
      .input("Now", sql.DateTime, now)
      .query(`
        SELECT * FROM OTP_CODES 
        WHERE USUARIO_ID = (SELECT ID FROM USUARIOS WHERE EMAIL = @Email) 
          AND OTP = @OTP 
          AND EXPIRA_EN > @Now 
          AND USADO = 0
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ error: "Código incorrecto o expirado" });
    }

    const userQuery = await pool.request()
      .input("Email", sql.NVarChar, email)
      .query("SELECT ID, Email, ROL, NOMBRE FROM USUARIOS WHERE EMAIL = @Email");

    const user = userQuery.recordset[0];

    const token = jwt.sign(
      { id: user.ID, email: user.Email, rol: user.ROL, nombre: user.NOMBRE },
      JWT_SECRET,
      { expiresIn: "4h" }
    );

    const expirationTime = new Date();
    expirationTime.setHours(expirationTime.getHours() + 1);
    expirationTime.setMinutes(expirationTime.getMinutes() - expirationTime.getTimezoneOffset());

    await pool.request()
      .input("Email", sql.NVarChar, email)
      .input("OTP", sql.NVarChar, otp)
      .input("Token", sql.NVarChar, token)
      .input("ExpiraEn", sql.DateTime, expirationTime)
      .query(`
        UPDATE OTP_CODES 
        SET USADO = 1, TOKEN = @Token, EXPIRA_EN = @ExpiraEn
        WHERE USUARIO_ID = (SELECT ID FROM USUARIOS WHERE EMAIL = @Email) 
          AND OTP = @OTP
      `);

    // 🆕 Insertar el token en TOKENS_ACTIVOS
    await pool.request()
      .input("UsuarioID", sql.Int, user.ID)
      .input("Token", sql.NVarChar, token)
      .query(`
        INSERT INTO TOKENS_ACTIVOS (USUARIO_ID, TOKEN, VALIDO)
        VALUES (@UsuarioID, @Token, 1)
      `);

    res.json({ message: "Código correcto", token, rol: user.ROL });
  } catch (error) {
    console.error("❌ Error en verifyOTP:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};
const logoutUser = async (req, res) => {
  try {
    const token = req.header("Authorization")?.split(" ")[1];
    if (!token) return res.status(400).json({ error: "Token no proporcionado" });

    const pool = await poolPromise;

    // Invalidar token en la tabla TOKENS_ACTIVOS
    await pool.request()
      .input("Token", sql.NVarChar, token)
      .query("UPDATE TOKENS_ACTIVOS SET VALIDO = 0 WHERE TOKEN = @Token");

    // Obtener el UsuarioID desde el token
    const userResult = await pool.request()
      .input("Token", sql.NVarChar, token)
      .query("SELECT USUARIO_ID FROM TOKENS_ACTIVOS WHERE TOKEN = @Token");

    if (userResult.recordset.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado para este token" });
    }

    const usuarioId = userResult.recordset[0].USUARIO_ID;

    //  Actualizar la última sesión abierta (FechaFin = ahora)
    await pool.request()
      .input("UsuarioID", sql.Int, usuarioId)
      .input("FechaFin", sql.DateTime, dayjs().tz("America/Santiago").format("YYYY-MM-DD HH:mm:ss"))
      .query(`
        UPDATE SESIONES_USUARIOS
        SET FechaFin = GETDATE()
        WHERE UsuarioID = @UsuarioID AND FechaFin IS NULL
      `);
      

    res.json({ message: "Sesión cerrada correctamente" });

  } catch (error) {
    console.error("❌ Error al cerrar sesión:", error);
    res.status(500).json({ error: "Error al cerrar sesión" });
  }
};
const obtenerUsuarioDesdeToken = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token no proporcionado" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const usuarioId = decoded.id;

    const pool = await poolPromise;

    const result = await pool.request()
      .input("ID", sql.Int, usuarioId)
      .query(`
        SELECT ID, NOMBRE, EMAIL, ROL, TELEFONO, ESTADO, FECHA_CREACION, DIRECCION
        FROM USUARIOS
        WHERE ID = @ID
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const usuario = result.recordset[0];

    res.json({
      id: usuario.ID,
      nombre: usuario.NOMBRE,
      email: usuario.EMAIL,
      rol: usuario.ROL,
      telefono: usuario.TELEFONO,
      estado: usuario.ESTADO,
      fecha_creacion: usuario.FECHA_CREACION,
      direccion: usuario.DIRECCION
    });

  } catch (err) {
    console.error("❌ Error al verificar token:", err.message);
    res.status(401).json({ error: "Token inválido o expirado" });
  }
};



module.exports = { registerUser, loginUser, verifyOTP, logoutUser, crearUsuarioPorAdmin,obtenerUsuarioDesdeToken };
