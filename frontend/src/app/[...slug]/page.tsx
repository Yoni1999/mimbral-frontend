"use client";
import { Box, Typography, Button } from "@mui/material";
import { useRouter } from "next/navigation";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

const NotFoundSlugPage = () => {
  const router = useRouter();

  const handleContactAdmin = () => {
    router.push("/no-autorizado");
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      bgcolor="#f9f9f9"
      textAlign="center"
      px={2}
      position="relative"
    >
      {/* GIF en la parte superior */}
      <Box
        component="img"
        src="/images/backgrounds/404-error-idea.gif"
        alt="404"
        sx={{
          position: "absolute",
          top: 0,
          width: "100%",
          maxHeight: { xs: 200, sm: 300, md: 400 },
          objectFit: "contain",
          pointerEvents: "none",
        }}
      />

      {/* Contenido principal */}
      <Box
        sx={{
          backgroundColor: "#fff",
          padding: { xs: 4, sm: 6 },
          borderRadius: 4,
          boxShadow: "0px 4px 20px rgba(0,0,0,0.1)",
          maxWidth: 500,
          width: "100%",
          mt: { xs: 28, sm: 22 }, // espacio extra en móviles
        }}
      >
        <WarningAmberRoundedIcon color="warning" sx={{ fontSize: 80, mb: 2 }} />
        <Typography variant="h4" gutterBottom fontWeight="bold">
          ¡Ups! Lo sentimos...
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={4}>
          Esta ruta no ha sido encontrada. Asegúrate de que la dirección sea
          correcta o vuelve al inicio.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={() => router.push("/inicio")}
        >
          Volver al Inicio
        </Button>
      </Box>
    </Box>
  );
};

export default NotFoundSlugPage;
