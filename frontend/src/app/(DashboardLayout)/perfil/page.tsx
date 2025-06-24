"use client";
import {
  Box,
  Typography,
  Avatar,
  Grid,
  Paper,
  Chip,
  useTheme,
} from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import EventIcon from "@mui/icons-material/Event";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PublicIcon from "@mui/icons-material/Public";
import LanIcon from "@mui/icons-material/Lan";
import LockResetIcon from "@mui/icons-material/LockReset";
import { useEffect, useState } from "react";
import EditarPasswordModal from "./components/EditarPasswordModal"; // ajusta la ruta si es necesario

const userData = {
  nombre: "Jonathan Molina González",
  email: "jonathan.molina@alu.ucm.cl",
  rol: "Administrador",
  estado: "Activo",
  fechaCreacion: "2024-01-15",
  telefono: "+56 9 1234 5678",
  direccion: "Av. Principal 123, Talca",
  foto: "/images/users/avatar-jonathan.jpg",
};

export default function PerfilPage() {
  const [user, setUser] = useState<any>(null);
  const [openModal, setOpenModal] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    setUser(userData);
  }, []);

  if (!user) return <div>Cargando perfil...</div>;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "#ffffff", minHeight: "100vh" }}>
    <Chip
    label="Mi Perfil"
    icon={<Avatar sx={{ bgcolor: "#ffffff", color: theme.palette.primary.main, width: 28, height: 28 }}>👤</Avatar>}
    sx={{
        fontSize: "1rem",
        fontWeight: "bold",
        px: 2,
        py: 1.2,
        mb: 3,
        borderRadius: "999px",
        backgroundColor: theme.palette.primary.main,
        color: "#fff",
        boxShadow: "0px 3px 8px rgba(0, 0, 0, 0.1)",
        ".MuiChip-icon": {
        mr: 1,
        },
    }}
    />


      <Paper elevation={1} sx={{ borderRadius: 4, overflow: "hidden" }}>
        {/* Encabezado tipo portada */}
        <Box
          sx={{
            bgcolor: theme.palette.primary.light,
            p: 4,
            display: "flex",
            alignItems: "center",
            flexDirection: { xs: "column", md: "row" },
            gap: 3,
          }}
        >
          <Avatar
            alt={user.nombre}
            src={user.foto}
            sx={{
              width: 120,
              height: 120,
              border: "4px solid white",
              boxShadow: 3,
            }}
          />
          <Box textAlign={{ xs: "center", md: "left" }}>
            <Typography variant="h5" fontWeight={700}>
              {user.nombre}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {user.rol}
            </Typography>
          </Box>
        </Box>

        {/* Información detallada */}
        <Box sx={{ p: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Email
              </Typography>
              <Chip
                icon={<EmailIcon />}
                label={user.email}
                color="default"
                variant="outlined"
                sx={{ maxWidth: "100%" }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Teléfono
              </Typography>
              <Chip
                icon={<PhoneIcon />}
                label={user.telefono}
                color="default"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Dirección
              </Typography>
              <Chip
                icon={<LocationOnIcon />}
                label={user.direccion}
                color="default"
                variant="outlined"
                sx={{ maxWidth: "100%" }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Estado
              </Typography>
              <Chip
                icon={
                  user.estado === "Activo" ? (
                    <CheckCircleIcon />
                  ) : (
                    <HighlightOffIcon />
                  )
                }
                label={user.estado}
                color={user.estado === "Activo" ? "success" : "default"}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Fecha de creación
              </Typography>
              <Chip
                icon={<EventIcon />}
                label={user.fechaCreacion}
                color="default"
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Seguridad
              </Typography>
              <Chip
                icon={<LockResetIcon />}
                label="Editar contraseña"
                color="primary"
                variant="outlined"
                clickable
                onClick={() => setOpenModal(true)}
              />
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Historial de conexiones */}
      <Paper elevation={1} sx={{ borderRadius: 4, overflow: "hidden", mt: 4 }}>
        <Box sx={{ p: 4 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Historial de conexiones
          </Typography>

          <Grid container spacing={2}>
            {[
              { fecha: "2025-06-21 14:33", ip: "192.168.1.10", ubicacion: "Talca, Chile" },
              { fecha: "2025-06-20 09:12", ip: "192.168.1.12", ubicacion: "Santiago, Chile" },
              { fecha: "2025-06-19 18:50", ip: "192.168.1.15", ubicacion: "Talca, Chile" },
            ].map((item, index) => (
              <Grid item xs={12} key={index}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    alignItems: { xs: "flex-start", sm: "center" },
                    justifyContent: "space-between",
                    bgcolor: "#f4f6f8",
                    borderRadius: 3,
                    px: 3,
                    py: 2,
                    boxShadow: 1,
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      bgcolor: "#e9eff5",
                      boxShadow: 3,
                    },
                    gap: 2,
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <AccessTimeIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.primary">
                      <strong>Fecha:</strong> {item.fecha}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <LanIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.primary">
                      <strong>IP:</strong> {item.ip}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <PublicIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="text.primary">
                      <strong>Ubicación:</strong> {item.ubicacion}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Paper>

      {/* Modal externo para editar contraseña */}
      <EditarPasswordModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        // Puedes pasar props extra como `userId` si lo necesitas
      />
    </Box>
  );
}
