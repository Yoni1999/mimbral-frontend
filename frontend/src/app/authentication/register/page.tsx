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
        minHeight: "100vh",
        backgroundImage: `url("/images/backgrounds/login-background.jpg")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        px: 2,
        py: 2,
      }}
    >
      {/* 🔹 Header */}
      <Header />

      {/* 🔹 Wrapper para el contenido con scroll si es necesario */}
      <Box
        sx={{
          width: "100%",
          maxWidth: "580px",
          flexGrow: 1,
          overflowY: "auto",
          mt: { xs: 2, md: 4 },
        }}
      >
        <Card
          elevation={9}
          sx={{
            px: { xs: 3, md: 4 },
            py: { xs: 4, md: 5 },
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(8px)",
            borderRadius: 3,
            boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
            width: "100%",
          }}
        >
          <Box display="flex" justifyContent="center" mb={2}>
            <LogoMimbral width={110} height={60} />
          </Box>

          <Typography
            variant="h6"
            textAlign="center"
            color="text.primary"
            fontWeight="500"
            mb={2}
          >
            Regístrate para obtener acceso
          </Typography>

          <AuthRegister />
        </Card>
      </Box>
    </Box>
  );
};

export default RegisterPage;
