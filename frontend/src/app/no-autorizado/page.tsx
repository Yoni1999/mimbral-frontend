"use client";
import { Box, Typography, Button, Fab, Tooltip } from "@mui/material";
import { useRouter } from "next/navigation";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import ChatRoundedIcon from "@mui/icons-material/ChatRounded";

const NotAuthorizedPage = () => {
  const router = useRouter();

  const handleContactAdmin = () => {
    // Puedes redirigir a una página de contacto o abrir un modal
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
        <WarningAmberRoundedIcon
          color="warning"
          sx={{ fontSize: 80, mb: 2 }}
        />
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Acceso no autorizado
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={4}>
          No tienes permisos para acceder a esta función o sección del sistema.
          Si crees que esto es un error, contacta con el administrador.
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

      {/* Botón flotante para contactar al administrador */}
      <Tooltip title="Contactar al administrador" placement="left">
        <Fab
          color="secondary"
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            boxShadow: "0px 4px 15px rgba(0,0,0,0.2)",
          }}
          onClick={handleContactAdmin}
        >
          <ChatRoundedIcon />
        </Fab>
      </Tooltip>
    </Box>
  );
};

export default NotAuthorizedPage;
