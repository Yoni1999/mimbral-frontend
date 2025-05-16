"use client";
import { Box, Card, Typography } from "@mui/material";
import AuthRegister from "../auth/AuthRegister";
import LogoMimbral from "@/app/(DashboardLayout)/layout/shared/logo/LogoMimbral";
import Header from "../components/HeaderRegister"; 

const RegisterPage = () => {
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
        position: "relative",
      }}
    >
    {/* 🔹 Header Responsivo */}
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        padding: { xs: 2, sm: 3 },
        display: "flex",
        justifyContent: { xs: "center", sm: "flex-end" },
        zIndex: 10,
      }}
    >
      <Header />
    </Box>

      {/* 🔹 Card de Registro */}
      <Card
        elevation={9}
        sx={{
          width: "100%",
          maxWidth: "580px",
          minHeight: "600px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: 2,
          backgroundColor: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(5px)",
          borderRadius: 2,
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
          <LogoMimbral />
        </Box>
        <Typography variant="subtitle1" textAlign="center" color="textSecondary" mb={2}>
          Regístrate para obtener acceso
        </Typography>
        <AuthRegister />
      </Card>
    </Box>
  );
};

export default RegisterPage;
