"use client";
import { Box, Card, Typography } from "@mui/material";
import AuthLogin from "../auth/AuthLogin";
import LogoMimbral from "@/app/(DashboardLayout)/layout/shared/logo/LogoMimbral";
import Header from "../components/Header"; // 🔹 Importamos el Header

export default function LoginPage() {
  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundImage: `url("/images/backgrounds/login-background.jpg")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        position: "relative", // 🔹 Para manejar posiciones absolutas dentro del contenedor
      }}
    >
      {/* 🔹 Header Posicionado en la Parte Superior de la Página */}
      {/* 🔹 Header Responsivo Posicionado en la Parte Superior */}
      <Box
        sx={{
          width: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          padding: { xs: 2, sm: 3 },
          display: "flex",
          justifyContent: { xs: "center", sm: "flex-end" },
          zIndex: 10,
        }}
      >
        <Header />
      </Box>


      {/* 🔹 Formulario de Login */}
      <Card
        elevation={9}
        sx={{
          width: "100%",
          maxWidth: "480px",
          minHeight: "500px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: 3,
          backgroundColor: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(5px)",
          borderRadius: 2,
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
          <LogoMimbral />
        </Box>
        <Typography variant="subtitle1" textAlign="center" color="textSecondary" mb={1}>
          Para análisis de datos
        </Typography>
        <AuthLogin />
      </Card>
    </Box>
  );
}
