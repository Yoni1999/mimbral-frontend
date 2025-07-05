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
import Profile from "./Profile";
import { IconRefresh, IconBellRinging, IconMenu } from "@tabler/icons-react";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

interface ItemType {
  toggleMobileSidebar: (event: React.MouseEvent<HTMLElement>) => void;
}

const Header = ({ toggleMobileSidebar }: ItemType) => {
  const [ultimaFecha, setUltimaFecha] = useState<string | null>(null);
  const [ultimaHora, setUltimaHora] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const refreshButtonRef = useRef<HTMLButtonElement | null>(null);

  interface Usuario {
    id: number;
    nombre: string;
    email: string;
    rol: string;
  }

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [indicadoresData, setIndicadoresData] = useState<any>(null);
  const [anchorIndicador, setAnchorIndicador] = useState<null | HTMLElement>(null);
  const [indicadorSeleccionado, setIndicadorSeleccionado] = useState<any>(null);

  const handleRefreshClick = async () => {
    try {
      const response = await fetchWithToken(`${BACKEND_URL}/api/ultima-actualizacion`);
      if (!response) return;
      const data = await response.json();
      setUltimaFecha(data.ultimaFecha);
      setUltimaHora(data.ultimaHora);
      setAnchorEl(refreshButtonRef.current);
    } catch (error) {
      console.error("❌ Error al obtener la última actualización:", error);
    }
  };

  useEffect(() => {
    const obtenerUsuario = async () => {
      try {
        const response = await fetchWithToken(`${BACKEND_URL}/api/auth/usuario`);
        if (!response) throw new Error("Error al obtener el usuario");
        const data = await response.json();
        setUsuario(data);
      } catch (err) {
        console.error("❌ Error al obtener datos del usuario:", err);
      }
    };

    const obtenerIndicadores = async () => {
      try {
        const res = await fetch("https://mindicador.cl/api");
        const data = await res.json();
        setIndicadoresData(data);
      } catch (error) {
        console.error("❌ Error al obtener indicadores:", error);
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

  return (
    <>
      <AppBar position="sticky" color="default" elevation={1} sx={{ background: "linear-gradient(#ffffff)" }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between", borderRadius: "18px" }}>
          <IconButton
            color="inherit"
            aria-label="menu"
            onClick={toggleMobileSidebar}
            sx={{ display: "inline-flex" }}
          >
            <IconMenu width="40" height="30" />
          </IconButton>

          <Box flexGrow={1} display="flex" justifyContent="center">
            <Typography variant="h4" fontWeight={500} color="primary" sx={{ letterSpacing: 3 }}>
              ANÁLISIS DE DATOS
            </Typography>
          </Box>

          {/* Indicadores Económicos con separadores */}
          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            divider={<Divider orientation="vertical" flexItem />}
            sx={{ mr: 2 }}
          >
            {[
              { key: "dolar", label: "USD", color: "success.main" },
              { key: "uf", label: "UF", color: "primary.main" },
              { key: "utm", label: "UTM", color: "warning.main" },
              { key: "ipc", label: "IPC", color: "error.main" },
              { key: "euro", label: "EURO", color: "info.main" },
            ].map((item) => {
              const indicador = indicadoresData?.[item.key];
              const valor = item.key === "ipc"
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
                  <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ color: item.color }}>
                    {valor}
                  </Typography>
                </IconButton>
              );
            })}
          </Stack>

          <Stack spacing={1.2} direction="row" alignItems="center" divider={<Divider orientation="vertical" flexItem />}>
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
      </AppBar>

      {/* Popover Última Actualización */}
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
              Última Actualización
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

      {/* Popover individual de indicador */}
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
              <Tooltip title="Esta información está obtenida desde el Banco Central de Chile" arrow>
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
