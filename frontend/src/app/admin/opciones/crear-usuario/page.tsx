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
    <Container maxWidth="md" sx={{ py: { xs: 1.5, md: 6 }, px: { xs: 1.5, md: 3 } }}>
      <Paper
        elevation={1}
        sx={{
          p: { xs: 2, md: 4 },
          borderRadius: 4,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: { xs: 1, md: 2 } }}>
          <Avatar sx={{ bgcolor: "primary.main" }}>
            <PersonAddAlt1Icon />
          </Avatar>
          <div>
            <Typography
              variant="h5"
              fontWeight="bold"
              sx={{ fontSize: { xs: "1.05rem", md: "h5.fontSize" } }}
            >
              Crear nuevo usuario
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ display: { xs: "none", md: "block" } }}
            >
              Completa los campos para registrar un nuevo usuario en el sistema.
            </Typography>
          </div>
        </Stack>

        <Divider sx={{ my: { xs: 1.5, md: 3 } }} />

        <CrearUsuarioForm />
      </Paper>
    </Container>
  );
};

export default CrearUsuarioPage;
