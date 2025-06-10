"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Typography,
  Paper,
  Divider,
  Avatar,
  useTheme,
  Container,
  Stack,
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
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper
        elevation={1}
        sx={{
          p: 4,
          borderRadius: 4,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2} mb={2}>
          <Avatar sx={{ bgcolor: "primary.main" }}>
            <PersonAddAlt1Icon />
          </Avatar>
          <div>
            <Typography variant="h5" fontWeight="bold">
              Crear nuevo usuario
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Completa los campos para registrar un nuevo usuario en el sistema.
            </Typography>
          </div>
        </Stack>

        <Divider sx={{ my: 3 }} />

        <CrearUsuarioForm />
      </Paper>
    </Container>
  );
};

export default CrearUsuarioPage;
