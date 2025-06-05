"use client";
import { Box, Typography, Stack, useMediaQuery, useTheme } from "@mui/material";
import Link from "next/link";
import LogoMimbral from "@/app/(DashboardLayout)/layout/shared/logo/LogoMimbral";
import React from "react";

const HeaderRegister = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box
      sx={{
        width: "100%",
        position: "relative",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(10px)",
        borderRadius: "12px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
        px: 3,
        py: 2,
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: "center",
        justifyContent: isMobile ? "center" : "space-between",
        gap: isMobile ? 1.5 : 0,
        textAlign: "center",
        mb: 4,
      }}
    >
      {/* 🔹 Logo a la izquierda */}
      <Box sx={{ zIndex: 2 }}>
        <LogoMimbral width={100} height={70} />
      </Box>

      {/* 🔹 Título centrado absolutamente */}
      <Box
        sx={{
          position: isMobile ? "relative" : "absolute",
          left: isMobile ? "auto" : "50%",
          transform: isMobile ? "none" : "translateX(-50%)",
          zIndex: 1,
        }}
      >
        <Typography
          variant="h6"
          fontWeight={600}
          color="primary.main"
        >
          Registro de Usuarios
        </Typography>
      </Box>

      {/* 🔹 Enlace login a la derecha */}
      <Box
        sx={{
          zIndex: 2,
          mt: isMobile ? 1 : 0,
        }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
          textAlign={isMobile ? "center" : "right"}
        >
          ¿Ya tienes una cuenta?{" "}
          <Box
            component={Link}
            href="/authentication/login"
            sx={{
              color: "primary.main",
              fontWeight: "bold",
              textDecoration: "none",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            Inicia sesión aquí
          </Box>
        </Typography>
      </Box>
    </Box>
  );
};

export default HeaderRegister;
