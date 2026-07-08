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
        <CrearUsuarioForm />
      </Paper>
    </Container>
  );
};

export default CrearUsuarioPage;
