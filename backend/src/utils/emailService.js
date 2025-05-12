const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "tu_correo@gmail.com",
    pass: "tu_contraseña",
  },
});

const sendOTPEmail = (to, otp) => {
  const mailOptions = {
    from: "tu_correo@gmail.com",
    to,
    subject: "Tu Código OTP",
    text: `Tu código de verificación es: ${otp}`,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) console.error("❌ Error enviando email:", err);
    else console.log("📩 Email enviado:", info.response);
  });
};

module.exports = { sendOTPEmail };
