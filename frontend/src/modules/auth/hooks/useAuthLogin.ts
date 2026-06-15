import { useEffect, useState } from "react";
import type { AlertColor } from "@mui/material";
import { loginUser } from "../services/auth.service";
import {
  clearRememberedEmail,
  getRememberedEmail,
  saveSession,
  setRememberedEmail,
} from "../utils/auth.storage";

export function useAuthLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"login" | "otp">("login");

  const [mensajeVisible, setMensajeVisible] = useState(false);
  const [mensajeTexto, setMensajeTexto] = useState("");
  const [mensajeTipo, setMensajeTipo] = useState<AlertColor>("info");

  useEffect(() => {
    const savedEmail = getRememberedEmail();
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const togglePassword = () => setShowPassword((prev) => !prev);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const data = await loginUser({ email, password });

      if (rememberMe) setRememberedEmail(email);
      else clearRememberedEmail();

      if (data.requiresOtp) {
        setMensajeTexto("Se ha enviado un codigo de verificacion a tu correo");
        setMensajeTipo("success");
        setMensajeVisible(true);
        setStep("otp");
        return;
      }

      if (data.token) {
        saveSession(data.token, data.rol);
        setMensajeTexto("Login Correcto");
        setMensajeTipo("success");
        setMensajeVisible(true);
        window.location.href = "/inicio";
      }
    } catch (error: any) {
      setMensajeTexto(error.message || "Error de conexion");
      setMensajeTipo("error");
      setMensajeVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return {
    showPassword,
    email,
    password,
    rememberMe,
    loading,
    step,
    mensajeVisible,
    mensajeTexto,
    mensajeTipo,
    setEmail,
    setPassword,
    setRememberMe,
    setMensajeVisible,
    togglePassword,
    handleLogin,
  };
}
