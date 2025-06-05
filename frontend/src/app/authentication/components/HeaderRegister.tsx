"use client";
import { Box, Typography, Stack } from "@mui/material";
import Link from "next/link";
import LogoMimbral from "@/app/(DashboardLayout)/layout/shared/logo/LogoMimbral";
import React from "react";

const HeaderRegister = () => {
  return (
    <Box
      sx={{
        width: "100%",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(10px)",
        borderRadius: "12px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
        px: 4,
        py: 2,
        position: "relative", // Necesario para posicionar el centro
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 4,
      }}
    >
      {/* Logo a la izquierda */}
      <Stack direction="row" alignItems="center" spacing={2}>
        <LogoMimbral width={110} height={80} />
      </Stack>

      {/* Texto centrado */}
      <Box
        sx={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        <Typography
          variant="h6"
          fontWeight={600}
          color="primary.main"
          textAlign="center"
        >
          Registro de Usuarios
        </Typography>
      </Box>

      {/* Enlace login a la derecha */}
      <Typography variant="body2" color="text.secondary">
        ¿Ya tienes una cuenta?{" "}
        <Box
          component={Link}
          href="/authentication/login"
          sx={{
            color: "primary.main",
            fontWeight: "bold",
            textDecoration: "none",
            ml: 0.5,
            "&:hover": { textDecoration: "underline" },
          }}
        >
          Inicia sesión aquí
        </Box>
      </Typography>
    </Box>
  );
};

export default HeaderRegister;
