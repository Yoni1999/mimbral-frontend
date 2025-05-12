const express = require("express");
const { registerUser, loginUser, verifyOTP,logoutUser,crearUsuarioPorAdmin } = require("../controllers/auth.controller");

const router = express.Router();

router.post("/register", registerUser);   // ✅ Registro de usuarios
router.post("/login", loginUser);         // ✅ Login y envío de OTP
router.post("/verify-otp", verifyOTP);    // ✅ Verificar OTP y generar JWT
router.post("/logout", logoutUser);
router.post("/crearusuarioadmin", crearUsuarioPorAdmin);



module.exports = router;
