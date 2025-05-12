"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Divider,
  Avatar,
  useTheme,
} from "@mui/material";
import CrearUsuarioForm from "../components/CrearUsuarioForm";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";

const CrearUsuarioPage = () => {
  const router = useRouter();
  const theme = useTheme();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const rol = localStorage.getItem("rol");
    if (rol === "admin") {
      setIsAuthorized(true);
    } else {
      router.push("/no-autorizado");
    }
  }, [router]);

  if (!isAuthorized) return null;

  return (
    <Box
      sx={{
        p: 4,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        minHeight: "100vh",
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Paper
        elevation={4}
        sx={{
          width: "100%",
          maxWidth: 600,
          p: 4,
          borderRadius: 3,
          boxShadow: theme.shadows[4],
        }}
      >
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Avatar sx={{ bgcolor: "primary.main" }}>
            <PersonAddAlt1Icon />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Crear nuevo usuario
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Completa los campos para registrar un nuevo usuario en el sistema.
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <CrearUsuarioForm />
      </Paper>
    </Box>
  );
};

export default CrearUsuarioPage;
