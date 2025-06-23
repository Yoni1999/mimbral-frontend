"use client";
import { Box, Typography, Button, Fab, Tooltip } from "@mui/material";
import { useRouter } from "next/navigation";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import ChatRoundedIcon from "@mui/icons-material/ChatRounded";

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
      {/* Contenido principal */}
      <Box
        sx={{
          backgroundColor: "#fff",
          padding: 6,
          borderRadius: 4,
          boxShadow: "0px 4px 20px rgba(0,0,0,0.1)",
          maxWidth: 500,
          width: "100%",
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
