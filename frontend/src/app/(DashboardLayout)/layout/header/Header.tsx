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
} from "@mui/material";
import PropTypes from "prop-types";
import Profile from "./Profile";
import { IconRefresh, IconBellRinging, IconMenu } from "@tabler/icons-react";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";

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
const [dolarData, setDolarData] = useState<any>(null);
const [anchorDolar, setAnchorDolar] = useState<null | HTMLElement>(null);



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
  const obtenerDolar = async () => {
    try {
      const res = await fetch("https://cl.dolarapi.com/v1/cotizaciones/usd");
      const data = await res.json();
      setDolarData(data);
    } catch (error) {
      console.error("❌ Error al obtener datos del dólar:", error);
    }
  };

  obtenerUsuario();
  obtenerDolar();
}, []);


  const handlePopoverClose = () => setAnchorEl(null);
  const open = Boolean(anchorEl);

  return (
    <>
      <AppBar
        position="sticky"
        color="default"
        elevation={1}
        sx={{
          background: "linear-gradient( #ffffff)",
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between", borderRadius: "18px" }}>
          {/* Botón de menú en móviles */}
          {/*<IconButton
            color="inherit"
            aria-label="menu"
            onClick={toggleMobileSidebar}
            sx={{ display: { lg: "none", xs: "inline" } }}
          >
            <IconMenu width="40" height="30" />
          </IconButton> */}
          <IconButton
            color="inherit"
            aria-label="menu"
            onClick={toggleMobileSidebar}
            sx={{ display: "inline-flex" }} // Se muestra siempre
          >
            <IconMenu width="40" height="30" />
          </IconButton>


          {/* Título central */}
          <Box flexGrow={1} display="flex" justifyContent="center">
            <Typography
              variant="h4"
              fontWeight={500}
              color="primary"
              sx={{ letterSpacing: 3 }}
            >
              ANÁLISIS DE DATOS
            </Typography>
          </Box>
          {/* Dólar resumen */}
          <IconButton
            size="large"
            color="inherit"
            onClick={(e) => setAnchorDolar(e.currentTarget)}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              px: 1.5,
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1 }}>
              USD
            </Typography>

            <Box display="flex" gap={0.5}>
              <Typography
                variant="body2"
                fontWeight={600}
                sx={{ color: "success.main" }}
              >
                ${dolarData?.compra ?? "-"}
              </Typography>
              <Typography variant="body2" fontWeight={600} color="text.secondary">
                /
              </Typography>
              <Typography
                variant="body2"
                fontWeight={600}
                sx={{ color: "error.main" }}
              >
                ${dolarData?.venta ?? "-"}
              </Typography>
            </Box>
          </IconButton>


          {/* Botones a la derecha */}
          <Stack
            spacing={1.2}
            direction="row"
            alignItems="center"
            divider={<Divider orientation="vertical" flexItem />}
          >
            {/* Botón de actualizar */}
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

            {/* Notificaciones */}
            <IconButton size="large" aria-label="show notifications" color="inherit">
              <Badge variant="dot" color="primary">
                <IconBellRinging size="21" stroke="1.5" />
              </Badge>
            </IconButton>

            {/* Perfil */}
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
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 400,
                      color: "primary.main",
                      fontStyle: "italic",
                      textTransform: "capitalize",
                    }}
                  >
                    Rol:{usuario.rol}
                  </Typography>
                </Box>
              )}


              <Profile />
            </Box>

          </Stack>
        </Toolbar>
      </AppBar>

      {/* Popover debajo del botón de actualizar */}
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
      <Popover
        open={Boolean(anchorDolar)}
        anchorEl={anchorDolar}
        onClose={() => setAnchorDolar(null)}
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
          <Typography variant="subtitle1" fontWeight="bold" color="primary.main" gutterBottom>
            Dólar USD – Detalle
          </Typography>
          <Typography variant="body2"><strong>Moneda:</strong> {dolarData?.moneda ?? "-"}</Typography>
          <Typography variant="body2"><strong>Compra:</strong> ${dolarData?.compra ?? "-"}</Typography>
          <Typography variant="body2"><strong>Venta:</strong> ${dolarData?.venta ?? "-"}</Typography>
          <Typography variant="body2"><strong>Último cierre:</strong> ${dolarData?.ultimoCierre ?? "-"}</Typography>
          <Typography variant="body2"><strong>Actualizado:</strong> {dolarData?.fechaActualizacion ? new Date(dolarData.fechaActualizacion).toLocaleString() : "-"}</Typography>
        </Box>
      </Popover>

    </>
  );
};

Header.propTypes = {
  sx: PropTypes.object,
};

export default Header;
