"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  Stack,
  IconButton,
  Badge,
  Typography,
  Popover,
  Divider,
  Tooltip,
} from "@mui/material";
import PropTypes from "prop-types";
import { usePathname } from "next/navigation";
import Profile from "./Profile";
import AdminBreadcrumb from "@/app/admin/opciones/components/AdminBreadcrumb";
import { IconRefresh, IconBellRinging, IconMenu } from "@tabler/icons-react";
import { apiJson } from "@/utils/apiClient";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

interface ItemType {
  toggleMobileSidebar: (event: React.MouseEvent<HTMLElement>) => void;
}

// Nombre legible de la sección actual, para mostrarlo en la barra superior.
// El orden importa: las rutas más específicas van antes (coincidencia por prefijo).
const SECCIONES: { prefijo: string; titulo: string }[] = [
  { prefijo: "/inicio", titulo: "Dashboard" },
  { prefijo: "/utilities/ventas/resumen-ventas", titulo: "Resumen de Ventas" },
  { prefijo: "/utilities/ventas/ventas-por-canal", titulo: "Ventas por Canal" },
  { prefijo: "/utilities/ventas/ventas-por-vendedor", titulo: "Ventas por Vendedor" },
  { prefijo: "/utilities/analisis-categoria", titulo: "Análisis por Categoría" },
  { prefijo: "/utilities/analisis-producto", titulo: "Análisis por Producto" },
  { prefijo: "/utilities/gestion-compras", titulo: "Gestión de Compras" },
  { prefijo: "/utilities/linea-credito/detalle", titulo: "Detalle de Crédito" },
  { prefijo: "/utilities/linea-credito", titulo: "Línea de Crédito" },
  { prefijo: "/utilities/supplychain", titulo: "Supply Chain" },
  { prefijo: "/informes/ventas-productos-por-canal", titulo: "Ventas por Canal" },
  { prefijo: "/informes/ventas-productos", titulo: "Ventas de Productos" },
  { prefijo: "/informes/productos-detenidos", titulo: "Productos Detenidos" },
  { prefijo: "/informes/productos-sin-ventas", titulo: "Productos sin Ventas" },
  { prefijo: "/informes/productos-menos-rentables", titulo: "Productos Menos Rentables" },
  { prefijo: "/informes/Vendedores", titulo: "Reporte de Vendedores" },
  { prefijo: "/metas-general", titulo: "Metas" },
  { prefijo: "/metas/crear-meta", titulo: "Crear Meta" },
  { prefijo: "/metas/crear-periodo", titulo: "Crear Período" },
  { prefijo: "/metas", titulo: "Metas" },
  { prefijo: "/sugerencias", titulo: "Sugerencias" },
  { prefijo: "/perfil", titulo: "Mi Perfil" },
  { prefijo: "/admin/opciones/crear-usuario", titulo: "Crear Usuario" },
  { prefijo: "/admin/opciones/usuarios", titulo: "Usuarios" },
  { prefijo: "/admin/opciones/sugerencias", titulo: "Sugerencias" },
  { prefijo: "/admin/opciones", titulo: "Opciones" },
  { prefijo: "/admin", titulo: "Administración" },
];

const obtenerSeccionActual = (pathname: string): string => {
  const match = SECCIONES.find((s) => pathname.startsWith(s.prefijo));
  return match ? match.titulo : "Análisis de Datos";
};

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

const Header = ({ toggleMobileSidebar }: ItemType) => {
  const [ultimaFecha, setUltimaFecha] = useState<string | null>(null);
  const [ultimaHora, setUltimaHora] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const refreshButtonRef = useRef<HTMLButtonElement | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [indicadoresData, setIndicadoresData] = useState<any>(null);
  const [anchorIndicador, setAnchorIndicador] = useState<null | HTMLElement>(null);
  const [indicadorSeleccionado, setIndicadorSeleccionado] = useState<any>(null);

  const handleRefreshClick = async () => {
    try {
      const data = await apiJson<{ ultimaFecha: string; ultimaHora: string }>("/api/ultima-actualizacion");
      setUltimaFecha(data.ultimaFecha);
      setUltimaHora(data.ultimaHora);
      setAnchorEl(refreshButtonRef.current);
    } catch (error) {
      console.error("Error al obtener la ultima actualizacion:", error);
    }
  };

  useEffect(() => {
    const obtenerUsuario = async () => {
      try {
        const data = await apiJson<Usuario>("/api/auth/usuario");
        setUsuario(data);
      } catch (err) {
        console.error("Error al obtener datos del usuario:", err);
      }
    };

    const obtenerIndicadores = async () => {
      try {
        const res = await fetch("https://mindicador.cl/api");
        const data = await res.json();
        setIndicadoresData(data);
      } catch (error) {
        console.error("Error al obtener indicadores:", error);
      }
    };

    obtenerUsuario();
    obtenerIndicadores();
  }, []);

  const abrirPopoverIndicador = (event: React.MouseEvent<HTMLElement>, indicador: any) => {
    setAnchorIndicador(event.currentTarget);
    setIndicadorSeleccionado(indicador);
  };

  const cerrarPopoverIndicador = () => {
    setAnchorIndicador(null);
    setIndicadorSeleccionado(null);
  };

  const handlePopoverClose = () => setAnchorEl(null);
  const open = Boolean(anchorEl);

  const pathname = usePathname() ?? "";
  const seccionActual = obtenerSeccionActual(pathname);

  return (
    <>
      <AppBar position="sticky" color="default" elevation={1} sx={{ background: "#ffffff" }}>
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            px: { xs: 1, sm: 2 },
            gap: { xs: 0.5, sm: 1 },
            minHeight: { xs: 52, sm: 64 },
          }}
        >
          <IconButton
            color="inherit"
            aria-label="menu"
            onClick={toggleMobileSidebar}
            sx={{ display: "inline-flex" }}
          >
            <IconMenu width="40" height="30" />
          </IconButton>

          <Box flexGrow={1} display="flex" justifyContent="flex-start" minWidth={0}>
            <Typography
              variant="h6"
              fontWeight={600}
              color="primary"
              noWrap
              sx={{
                fontSize: { xs: "1rem", sm: "1.2rem", md: "1.35rem" },
              }}
            >
              {seccionActual}
            </Typography>
          </Box>

          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            divider={<Divider orientation="vertical" flexItem />}
            sx={{ mr: 2, display: { xs: "none", lg: "flex" } }}
          >
            {[
              { key: "dolar", label: "USD", color: "success.main" },
              { key: "uf", label: "UF", color: "primary.main" },
              { key: "utm", label: "UTM", color: "warning.main" },
              { key: "ipc", label: "IPC", color: "error.main" },
              { key: "euro", label: "EURO", color: "info.main" },
            ].map((item) => {
              const indicador = indicadoresData?.[item.key];
              const valor =
                item.key === "ipc"
                  ? `${indicador?.valor ?? "-"}%`
                  : `$${indicador?.valor?.toLocaleString("es-CL") ?? "-"}`;

              return (
                <IconButton
                  key={item.key}
                  size="large"
                  color="inherit"
                  onClick={(e) => abrirPopoverIndicador(e, indicador)}
                  sx={{ flexDirection: "column", px: 1.5 }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {item.label}
                  </Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ color: item.color }}>
                    {valor}
                  </Typography>
                </IconButton>
              );
            })}
          </Stack>

          <Stack
            spacing={{ xs: 0.25, sm: 1.2 }}
            direction="row"
            alignItems="center"
            divider={<Divider orientation="vertical" flexItem />}
          >
            <IconButton
              ref={refreshButtonRef}
              size="large"
              color="inherit"
              onClick={handleRefreshClick}
              sx={{
                "&:active svg": {
                  transform: "rotate(180deg)",
                  transition: "transform 0.4s ease",
                },
              }}
            >
              <IconRefresh size="21" stroke="1.5" />
            </IconButton>

            <IconButton size="large" aria-label="show notifications" color="inherit">
              <Badge variant="dot" color="primary">
                <IconBellRinging size="21" stroke="1.5" />
              </Badge>
            </IconButton>

            <Box display="flex" alignItems="center">
              {usuario && (
                <Box
                  sx={{
                    mr: 1,
                    display: { xs: "none", md: "flex" },
                    flexDirection: "column",
                    alignItems: "flex-end",
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500, color: "text.primary" }}>
                    Hola, <strong>{usuario.nombre.trim()}</strong>!
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 400, color: "primary.main", fontStyle: "italic", textTransform: "capitalize" }}>
                    Rol: {usuario.rol}
                  </Typography>
                </Box>
              )}
              <Profile />
            </Box>
          </Stack>
        </Toolbar>

        {/* Segunda fila integrada en el mismo header: ruta de navegación */}
        <AdminBreadcrumb />
      </AppBar>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handlePopoverClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        PaperProps={{
          elevation: 4,
          sx: {
            borderRadius: 2,
            padding: 2,
            minWidth: 260,
            backgroundColor: "#f9fafb",
            border: "1px solid #213663",
          },
        }}
      >
        <Box>
          <Box display="flex" alignItems="center" mb={1}>
            <IconRefresh size="18" color="#1976d2" style={{ marginRight: 8 }} />
            <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
              Ultima Actualizacion
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            <strong>Fecha:</strong> {ultimaFecha || "Cargando..."}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Hora:</strong> {ultimaHora || "Cargando..."}
          </Typography>
        </Box>
      </Popover>

      <Popover
        open={Boolean(anchorIndicador)}
        anchorEl={anchorIndicador}
        onClose={cerrarPopoverIndicador}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        PaperProps={{
          elevation: 4,
          sx: {
            borderRadius: 2,
            p: 2,
            maxWidth: 280,
            backgroundColor: "#f9fafb",
            border: "1px solid #213663",
          },
        }}
      >
        {indicadorSeleccionado && (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                {indicadorSeleccionado.nombre}
              </Typography>
              <Tooltip title="Esta informacion esta obtenida desde el Banco Central de Chile" arrow>
                <IconButton size="small" sx={{ color: "text.secondary" }}>
                  <InfoOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <strong>Valor:</strong>{" "}
              {indicadorSeleccionado.codigo === "ipc"
                ? `${indicadorSeleccionado.valor}%`
                : `$${indicadorSeleccionado.valor.toLocaleString("es-CL")}`}
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              <strong>Unidad:</strong> {indicadorSeleccionado.unidad_medida}
            </Typography>
            <Typography variant="body2">
              <strong>Fecha:</strong>{" "}
              {new Date(indicadorSeleccionado.fecha).toLocaleDateString("es-CL")}
            </Typography>
          </Box>
        )}
      </Popover>
    </>
  );
};

Header.propTypes = {
  sx: PropTypes.object,
};

export default Header;
