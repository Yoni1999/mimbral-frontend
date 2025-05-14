"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Button,
  Stack,
  Checkbox,
  IconButton,
  InputAdornment,
  Alert,
  AlertColor,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Link from "next/link";
import {
  Visibility,
  VisibilityOff,
  EmailOutlined,
} from "@mui/icons-material";

import CustomTextField from "@/app/(DashboardLayout)/components/forms/theme-elements/CustomTextField";
import OtpVerification from "../login/otpVerification";
import { BACKEND_URL } from "@/config";
import { fetchSafe } from "@/utils/fetchSafe";

interface loginType {
  title?: string;
  subtitle?: JSX.Element | JSX.Element[];
  subtext?: JSX.Element | JSX.Element[];
}

const AuthLogin = ({ title, subtitle, subtext }: loginType) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"login" | "otp">("login");

  // Mensajes tipo banner
  const [mensajeVisible, setMensajeVisible] = useState(false);
  const [mensajeTexto, setMensajeTexto] = useState("");
  const [mensajeTipo, setMensajeTipo] = useState<AlertColor>("info");

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

    const handleLogin = async () => {
    setLoading(true);
    try {
      const data = await fetchSafe("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      if (data.requiresOtp) {
        setMensajeTexto(" Se ha enviado un código de verificación a tu correo");
        setMensajeTipo("success");
        setMensajeVisible(true);
        setStep("otp");
      } else if (data.token) {
        setMensajeTexto("Login Correcto ");
        setMensajeTipo("success");
        setMensajeVisible(true);

        localStorage.setItem("token", data.token);
        localStorage.setItem("rol", data.rol);

        window.location.href = "/inicio";
      }

    } catch (err: any) {
      setMensajeTexto(err.message || "Error de conexión");
      setMensajeTipo("error");
      setMensajeVisible(true);
    } finally {
      setLoading(false);
    }
  };

  if (step === "otp") {
    return <OtpVerification email={email} />;
  }

  return (
    <>
      {title && (
        <Typography fontWeight="700" variant="h2" mb={1}>
          {title}
        </Typography>
      )}

      {subtext}

      {/* Mensaje tipo alerta */}
      {mensajeVisible && (
        <Box
          sx={{
            position: "fixed",
            top: 16,
            right: 16,
            zIndex: 1400, // superior a dialogs
            width: "auto",
            maxWidth: 400,
          }}
        >
          <Alert
            severity={mensajeTipo}
            variant="filled"
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => setMensajeVisible(false)}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
            sx={{
              display: "flex",
              alignItems: "center",
              p: 0.9,
              borderRadius: 5,
              fontSize: "0.7rem",
            }}
          >
            {mensajeTexto}
          </Alert>
        </Box>
      )}


      <Stack>
        {/* Correo */}
        <Box>
          <Typography variant="subtitle1" fontWeight={600} mb="5px">
            Correo
          </Typography>
          <CustomTextField
            variant="outlined"
            fullWidth
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <EmailOutlined />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Contraseña */}
        <Box mt="25px">
          <Typography variant="subtitle1" fontWeight={600} mb="5px">
            Contraseña
          </Typography>
          <CustomTextField
            type={showPassword ? "text" : "password"}
            variant="outlined"
            fullWidth
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleTogglePassword} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Recordar sesión */}
        <Stack justifyContent="space-between" direction="row" alignItems="center" my={2}>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
              }
              label="Recordar mi sesión"
            />
          </FormGroup>
          <Typography
            component={Link}
            href="/"
            fontWeight="500"
            sx={{ textDecoration: "none", color: "primary.main" }}
          >
            ¿Olvidaste tu contraseña?
          </Typography>
        </Stack>
      </Stack>

      {/* Botón de Iniciar */}
      <Box>
        <Button
          color="primary"
          variant="contained"
          size="large"
          fullWidth
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Iniciando..." : "Iniciar"}
        </Button>
      </Box>

      {subtitle}
    </>
  );
};

export default AuthLogin;
