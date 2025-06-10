const { sql, poolPromise } = require("../models/db");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const getUsuarios = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT ID, EMAIL, NOMBRE, ROL, ESTADO, FECHA_CREACION, TELEFONO FROM USUARIOS
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error("❌ Error al obtener usuarios:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

const updateUsuario = async (req, res) => {
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  const { nombre, email, rol, estado, telefono } = req.body;

  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .input("Id", sql.Int, userId)
      .query("SELECT * FROM USUARIOS WHERE ID = @Id");

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const current = result.recordset[0];
    const newEstado = estado ?? current.ESTADO;

    await pool.request()
      .input("Id", sql.Int, userId)
      .input("Nombre", sql.NVarChar, nombre ?? current.NOMBRE)
      .input("Email", sql.NVarChar, email ?? current.EMAIL)
      .input("Rol", sql.NVarChar, rol ?? current.ROL)
      .input("Estado", sql.Int, newEstado)
      .input("Telefono", sql.NVarChar, telefono ?? current.TELEFONO)
      .query(`
        UPDATE USUARIOS
        SET NOMBRE = @Nombre,
            EMAIL = @Email,
            ROL = @Rol,
            ESTADO = @Estado,
            TELEFONO = @Telefono
        WHERE ID = @Id
      `);

    // 📧 Notificar al usuario si el estado cambió
    if (current.ESTADO !== newEstado) {
      const estadoTexto = newEstado === 1 ? "activada" : "suspendida temporalmente";
      const asunto = newEstado === 1
        ? "✅ Tu cuenta ha sido activada"
        : "⚠️ Tu cuenta ha sido suspendida";

      const mensajeHTML = `
        <div style="font-family: Arial, sans-serif; background: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #333;">Estado de cuenta actualizado</h2>
          <p>Hola <strong>${nombre ?? current.NOMBRE}</strong>,</p>
          <p>Tu cuenta en la plataforma <strong>Mimbral</strong> ha sido <strong>${estadoTexto}</strong> por un administrador.</p>
          <p style="margin-top: 16px;">Puedes iniciar sesión para verificar tu estado actual.</p>
          <a href="https://mimbral-frontend.vercel.app/authentication/login" style="display: inline-block; margin-top: 14px; background-color: #007bff; color: white; padding: 10px 18px; border-radius: 6px; text-decoration: none;">Ir al login</a>
          <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #888;">Este mensaje fue generado automáticamente por el sistema Mimbral.</p>
        </div>
      `;

      await transporter.sendMail({
        from: `"Equipo Mimbral" <${process.env.EMAIL_USER}>`,
        to: email ?? current.EMAIL,
        subject: asunto,
        html: mensajeHTML,
        text: `Tu cuenta ha sido ${estadoTexto} por un administrador.`
      });

      console.log(`📩 Notificación de cambio de estado enviada a ${email ?? current.EMAIL}`);
    }

    res.json({ message: "Usuario actualizado correctamente" });
  } catch (error) {
    console.error("❌ Error al actualizar usuario:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};


const deleteUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input("Id", sql.Int, id)
      .query("DELETE FROM USUARIOS WHERE ID = @Id");
    res.json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar usuario:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

module.exports = {
  getUsuarios,
  updateUsuario,
  deleteUsuario,
};
