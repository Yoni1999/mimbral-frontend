"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  Stack,
  Button,
  Grid,
  Snackbar,
  Alert,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/config";

interface Props {
  email: string;
}

const OtpVerification = ({ email }: Props) => {
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(""));
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [timer, setTimer] = useState(300); // 10 minutos
  const [resendEnabled, setResendEnabled] = useState(false);

  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  const router = useRouter();

  // Temporizador
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    } else {
      setResendEnabled(true);
    }
  }, [timer]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleChange = (index: number, value: string) => {
    if (/^\d?$/.test(value)) {
      const newValues = [...otpValues];
      newValues[index] = value;
      setOtpValues(newValues);

      if (value && index < 5) {
        inputsRef.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otp = otpValues.join("");
    if (otp.length < 6) {
      setSnackbarMessage("Debes ingresar los 6 dígitos");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Código inválido");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("rol", data.rol);

      setSnackbarMessage("Verificación exitosa");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setTimeout(() => router.push("/inicio"), 1500);
    } catch (err: any) {
      setSnackbarMessage(err.message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      const response = await fetch("http://192.168.0.126:3001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: "" }), // opcional: ajusta si necesitas password
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "No se pudo reenviar el código");

      setSnackbarMessage(data.message || "Código reenviado");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      setOtpValues(Array(6).fill(""));
      setTimer(600);
      setResendEnabled(false);
    } catch (err: any) {
      setSnackbarMessage(err.message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  return (
    <Box
      sx={{
        maxWidth: 450,
        mx: "auto",
        mt: 6,
        px: 4,
        py: 5,
        boxShadow: 3,
        borderRadius: 2,
        backgroundColor: "#fff",
      }}
    >
      <Stack spacing={2}>
        <Typography variant="h4" fontWeight={700} textAlign="center">
          Es necesario tu código de acceso único
        </Typography>

        <Typography variant="body1" color="text.secondary" textAlign="center">
          Te enviamos un correo a  <strong>{email}</strong> con un código de seis dígitos que vencerá en 5 minutos para que lo escribas a continuación
        </Typography>

        <Grid container spacing={1} justifyContent="center">
          {otpValues.map((value, index) => (
            <Grid item key={index}>
              <input
                ref={(el) => (inputsRef.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={value}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                style={{
                  width: "40px",
                  height: "50px",
                  fontSize: "24px",
                  textAlign: "center",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                }}
              />
            </Grid>
          ))}
        </Grid>

        <Typography
          textAlign="center"
          mt={2}
          fontWeight={300}
          color={timer <= 60 ? "error" : "text.secondary"}
        >
          Expira en: {formatTime(timer)}
        </Typography>

        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={handleVerify}
          disabled={loading}
        >
          {loading ? "Verificando..." : "Verificar código"}
        </Button>

      </Stack>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OtpVerification;
