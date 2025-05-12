"use client";
import { Box, Card, Typography } from "@mui/material";
import AuthRegister from "../auth/AuthRegister";
import LogoMimbral from "@/app/(DashboardLayout)/layout/shared/logo/LogoMimbral";
import Link from "next/link";

const HeaderRegister = () => {
  return (
    <Box width="75%">
      <Box
        sx={{
          padding: "15px 20px",
          borderRadius: "8px",
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(10px)",
        }}
      >
        <Typography variant="body1" fontWeight="500" color="textPrimary">
          ¿Quieres volver al inicio de sesión?
        </Typography>
        <Typography
          component={Link}
          href="/authentication/login"
          sx={{
            textDecoration: "none",
            color: "primary.main",
            fontWeight: "bold",
            "&:hover": { textDecoration: "underline" },
          }}
        >
          Inicia sesión aquí
        </Typography>
      </Box>
    </Box>
  );
};

export default HeaderRegister;