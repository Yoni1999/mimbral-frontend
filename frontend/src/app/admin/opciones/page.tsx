"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Grid,
  Fab,
  Tooltip,
} from "@mui/material";
import dynamic from "next/dynamic";

const EstadoCuentasChart = dynamic(() => import("./components/EstadoCuentasChart"), {
  ssr: false,
});

const UsuariosPorRolChart = dynamic(() => import("./components/UsuariosPorRolChart"), {
  ssr: false,
});

import UsuarioKpiCard from "./components/UsuarioKpiCard";
import UserSessionTable from "./components/UserSessionTable";
import { fetchWithToken } from "@/utils/fetchWithToken";

// Iconos
import PeopleIcon from "@mui/icons-material/People";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import AddIcon from "@mui/icons-material/Add";
import { BACKEND_URL } from "@/config";

const OpcionesAdminPage = () => {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [usuariosData, setUsuariosData] = useState({
    total: 0,
    activos: 0,
    inactivos: 0,
    admins: 0,
  });

  useEffect(() => {
    const rol = localStorage.getItem("rol");
    if (rol === "admin") {
      setIsAuthorized(true);
    } else {
      router.push("/no-autorizado");
    }

    const fetchResumen = async () => {
      try {
        const res = await fetchWithToken(`${BACKEND_URL}/api/admin/usuarios`);
        if (!res) throw new Error("Respuesta nula del servidor");
        const data = await res.json();
        const total = data.length;
        const activos = data.filter((u: any) => u.ESTADO == 1 || u.ESTADO === true).length;
        const inactivos = total - activos;
        const admins = data.filter((u: any) => u.ROL === "admin").length;

        setUsuariosData({ total, activos, inactivos, admins });
      } catch (err) {
        console.error("❌ Error al obtener resumen de usuarios:", err);
      }
    };

    fetchResumen();
  }, [router]);

  if (!isAuthorized) return null;

  return (
    <Box p={4} position="relative" sx={{backgroundColor: "#FEFEFE", minHeight: "100vh"}} >
      <Typography variant="h4" fontWeight="bold" mb={2}>
        Dashboard de Administración
      </Typography>

      <Typography variant="subtitle1" mb={4}>
        Visualiza información clave de los usuarios registrados en el sistema.
      </Typography>

      {/* 🔹 Fila 1 - Tarjetas resumen */}
      <Grid container spacing={2} mb={6}>
        <Grid item xs={6} md={3}>
          <UsuarioKpiCard title="Total Usuarios" value={usuariosData.total} icon={<PeopleIcon fontSize="large" />} />
        </Grid>
        <Grid item xs={6} md={3}>
          <UsuarioKpiCard title="Activos" value={usuariosData.activos} color="#4caf50" icon={<VerifiedUserIcon fontSize="large" />} />
        </Grid>
        <Grid item xs={6} md={3}>
          <UsuarioKpiCard title="Inactivos" value={usuariosData.inactivos} color="#f44336" icon={<PersonOffIcon fontSize="large" />} />
        </Grid>
        <Grid item xs={6} md={3}>
          <UsuarioKpiCard title="Admins" value={usuariosData.admins} color="#9c27b0" icon={<AdminPanelSettingsIcon fontSize="large" />} />
        </Grid>
      </Grid>

     {/* 🔹 Fila 2 - Gráficos y Tabla */}
      <Grid container spacing={3} alignItems="stretch">
        <Grid item xs={12} md={4}>
          <Box
            sx={{
              height: "100%",
              minHeight: 360,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              p: 2,
              borderRadius: 2,
            }}
          >
            <EstadoCuentasChart width="100%" height={260} />
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <Box
            sx={{
              height: "100%",
              minHeight: 360,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              p: 2,
              borderRadius: 2,
            }}
          >
            <UsuariosPorRolChart />
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <Box
            sx={{
              height: "100%",
              minHeight: 360,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              p: 2,
              borderRadius: 2,
            }}
          >

            <UserSessionTable />
          </Box>
        </Grid>
      </Grid>




      {/* 🔹 Botón flotante: crear usuario */}
      <Tooltip title="Crear nuevo usuario" placement="left">
        <Fab
          color="primary"
          aria-label="add"
          sx={{
            position: "fixed",
            bottom: 32,
            right: 32,
            zIndex: 1000,
            boxShadow: 4,
          }}
          onClick={() => router.push("/admin/opciones/crear-usuario")}
        >
          <AddIcon />
        </Fab>
      </Tooltip>

      {/* 🔹 Botón flotante: administrar usuarios */}
      <Tooltip title="Administrar usuarios" placement="left">
        <Fab
          color="secondary"
          aria-label="manage"
          sx={{
            position: "fixed",
            bottom: 100,
            right: 32,
            zIndex: 1000,
            boxShadow: 4,
          }}
          onClick={() => router.push("/admin/opciones/usuarios")}
        >
          <PeopleIcon />
        </Fab>
      </Tooltip>
    </Box>
  );
};

export default OpcionesAdminPage;
