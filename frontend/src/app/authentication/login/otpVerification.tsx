"use client";
import React from "react";
import {
  Box,
  Typography,
  Stack,
  Button,
  Grid,
  Snackbar,
  Alert,
} from "@mui/material";
import { useAuthOtp } from "@/modules/auth/hooks/useAuthOtp";

interface Props {
  email: string;
}

const OtpVerification = ({ email }: Props) => {
  const {
    otpValues,
    inputsRef,
    timer,
    loading,
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    formatTime,
    setSnackbarOpen,
    handleChange,
    handleKeyDown,
    handleVerify,
  } = useAuthOtp(email);

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
          Es necesario tu codigo de acceso unico
        </Typography>

        <Typography variant="body1" color="text.secondary" textAlign="center">
          Te enviamos un correo a <strong>{email}</strong> con un codigo de seis digitos que vencera en 5 minutos para que lo escribas a continuacion
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
          {loading ? "Verificando..." : "Verificar codigo"}
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
