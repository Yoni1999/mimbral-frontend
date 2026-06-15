"use client";
import React from "react";
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
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Link from "next/link";
import { Visibility, VisibilityOff, EmailOutlined } from "@mui/icons-material";

import CustomTextField from "@/app/(DashboardLayout)/components/forms/theme-elements/CustomTextField";
import OtpVerification from "../login/otpVerification";
import { useAuthLogin } from "@/modules/auth/hooks/useAuthLogin";

interface LoginProps {
  title?: JSX.Element | string;
  subtitle?: JSX.Element | JSX.Element[];
  subtext?: JSX.Element | JSX.Element[];
}

const AuthLogin = ({ title, subtitle, subtext }: LoginProps) => {
  const {
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
  } = useAuthLogin();

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

      <Stack>
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

        <Box mt="25px">
          <Typography variant="subtitle1" fontWeight={600} mb="5px">
            Contrasena
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
                  <IconButton onClick={togglePassword} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Stack justifyContent="space-between" direction="row" alignItems="center" my={2}>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
              }
              label="Recordar mi sesion"
            />
          </FormGroup>
          <Typography
            component={Link}
            href="/"
            fontWeight="500"
            sx={{ textDecoration: "none", color: "primary.main" }}
          >
            Olvidaste tu contrasena?
          </Typography>
        </Stack>
      </Stack>

      {mensajeVisible && (
        <Box mt={2}>
          <Alert
            severity={mensajeTipo}
            variant="outlined"
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
            sx={{ fontSize: "0.85rem", borderRadius: 2 }}
          >
            {mensajeTexto}
          </Alert>
        </Box>
      )}

      <Box mt={2}>
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
