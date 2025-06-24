// utils/emailService.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,                    // Ej: mail.cmimbral.cl
  port: Number(process.env.EMAIL_PORT),            // Ej: 465
  secure: process.env.EMAIL_SECURE === "true",     // true para SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Envía un correo electrónico usando la configuración predeterminada.
 * @param {Object} options
 * @param {string|string[]} options.to - Dirección de correo(s) destino.
 * @param {string} options.subject - Asunto del correo.
 * @param {string} options.html - Contenido HTML del correo.
 * @param {string} [options.text] - Versión de texto plano (opcional).
 * @param {string} [options.fromName] - Nombre que aparece como remitente.
 */
const sendEmail = async ({ to, subject, html, text = "", fromName = "Equipo Mimbral" }) => {
  try {
    await transporter.sendMail({
      from: `"${fromName}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text,
    });
    console.log(`📧 Correo enviado a: ${to}`);
  } catch (err) {
    console.error("❌ Error al enviar correo:", err);
    throw err;
  }
};

module.exports = { sendEmail };
