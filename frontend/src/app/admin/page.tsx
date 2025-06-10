"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Divider,
  CircularProgress,
} from "@mui/material";

import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import SystemUpdateAltIcon from "@mui/icons-material/SystemUpdateAlt";
import DashboardCustomizeIcon from "@mui/icons-material/DashboardCustomize";

import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";

const AdminPage = () => {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [ultimaFecha, setUltimaFecha] = useState<string | null>(null);
  const [ultimaHora, setUltimaHora] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const rol = localStorage.getItem("rol");
    if (rol === "admin") {
      setIsAuthorized(true);
    } else {
      router.push("/no-autorizado");
    }
  }, [router]);

  const fetchUltimaActualizacion = async () => {
    try {
      const response = await fetchWithToken(`${BACKEND_URL}/api/ultima-actualizacion`);
      if (!response) return;
      const data = await response.json();
      setUltimaFecha(data.ultimaFecha);
      setUltimaHora(data.ultimaHora);
    } catch (error) {
      console.error("❌ Error al obtener la última actualización:", error);
    }
  };

  const handleActualizarDatos = async () => {
    setLoading(true);
    try {
      const response = await fetchWithToken(`${BACKEND_URL}/api/actualizar-datos`, {
        method: "POST",
      });
      if (!response) return;
      await fetchUltimaActualizacion();
    } catch (error) {
      console.error("❌ Error al actualizar los datos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUltimaActualizacion();
  }, []);

  if (!isAuthorized) return null;

  return (
    <Box p={4}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Panel de Administrador
      </Typography>

      <Typography variant="subtitle1" color="text.secondary" mb={4}>
        Bienvenido al centro de control. Accede a la gestión de usuarios, roles y permisos.
      </Typography>

      <Divider sx={{ mb: 4 }} />

      <Grid container spacing={3}>
        {/* Dashboard Usuarios */}
        <Grid item xs={12} md={3}>
          <Paper
            elevation={12}
            sx={{
              p: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 2,
            }}
          >
            <DashboardCustomizeIcon color="error" fontSize="large" />
            <Typography variant="h6">Dashboard Usuarios</Typography>
            <Typography variant="body2" color="text.secondary">
              Visualiza el comportamiento, métricas y estadísticas de los usuarios.
            </Typography>
            <Button
              variant="contained"
              color="error"
              onClick={() => router.push("/admin/opciones")}
            >
              Ir al Dashboard
            </Button>
          </Paper>
        </Grid>

        {/* Usuarios */}
        <Grid item xs={12} md={3}>
          <Paper
            elevation={12}
            sx={{
              p: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 2,
            }}
          >
            <PeopleAltIcon color="primary" fontSize="large" />
            <Typography variant="h6">Usuarios</Typography>
            <Typography variant="body2" color="text.secondary">
              Crea, edita y administra los usuarios registrados.
            </Typography>
            <Button
              variant="contained"
              onClick={() => router.push("/admin/opciones/usuarios")}
            >
              Administrar Usuarios
            </Button>
          </Paper>
        </Grid>

        {/* Crear usuario */}
        <Grid item xs={12} md={3}>
          <Paper
            elevation={12}
            sx={{
              p: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 2,
            }}
          >
            <PersonAddAltIcon color="success" fontSize="large" />
            <Typography variant="h6">Crear usuario</Typography>
            <Typography variant="body2" color="text.secondary">
              Registra un nuevo usuario en el sistema rápidamente.
            </Typography>
            <Button
              variant="contained"
              color="success"
              onClick={() => router.push("/admin/opciones/crear-usuario")}
            >
              Crear Usuario
            </Button>
          </Paper>
        </Grid>

        {/* Actualizar base de datos */}
        <Grid item xs={12} md={3}>
          <Paper
            elevation={12}
            sx={{
              p: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 2,
            }}
          >
            <SystemUpdateAltIcon color="warning" fontSize="large" />
            <Typography variant="h6">Actualizar Base de Datos</Typography>
            {ultimaFecha && ultimaHora && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Última actualización: El {ultimaFecha} a las {ultimaHora}
              </Typography>
            )}
            <Button
              variant="contained"
              color="warning"
              onClick={handleActualizarDatos}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Actualizar Ahora"}
            </Button>
          </Paper>
        </Grid>

        {/* Revisar sugerencias */}
        <Grid item xs={12} md={3}>
          <Paper
            elevation={12}
            sx={{
              p: 3,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 2,
            }}
          >
            <SystemUpdateAltIcon color="info" fontSize="large" />
            <Typography variant="h6">Revisar Sugerencias</Typography>
            <Typography variant="body2" color="text.secondary">
              Consulta, modifica o elimina las sugerencias de los usuarios.
            </Typography>
            <Button
              variant="contained"
              color="info"
              onClick={() => router.push("/admin/opciones/sugerencias")}
            >
              Ver Sugerencias
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminPage;
