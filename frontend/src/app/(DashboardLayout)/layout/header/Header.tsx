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
import Link from "next/link";
import { IconRefresh, IconBellRinging } from "@tabler/icons-react";
import { apiJson } from "@/utils/apiClient";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

const Header = () => {
  const [ultimaFecha, setUltimaFecha] = useState<string | null>(null);
  const [ultimaHora, setUltimaHora] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const refreshButtonRef = useRef<HTMLButtonElement | null>(null);
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
    const obtenerIndicadores = async () => {
      try {
        const res = await fetch("https://mindicador.cl/api");
        const data = await res.json();
        setIndicadoresData(data);
      } catch (error) {
        console.error("Error al obtener indicadores:", error);
      }
    };

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
        <Toolbar sx={{ display: "flex", justifyContent: "space-between", borderRadius: "18px", position: "relative", px: { xs: 1, sm: 2 }, minHeight: { xs: 56 } }}>
          {/* Centrado absoluto respecto a TODA la barra: con flex normal, el
              hamburger (oculto en escritorio) y el stack de indicadores/iconos
              a la derecha no pesan lo mismo, asi que un centrado por flexbox
              quedaba corrido hacia la izquierda. */}
          <Box
            sx={{
              // En celular no cabe junto a los indicadores: el nombre ya está en la barra de abajo.
              display: { xs: "none", md: "block" },
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
            }}
          >
            {/* Solo el texto vuelve a aceptar clicks -el Box de arriba sigue
                sin bloquear nada a su alrededor-, y por eso lleva a /inicio. */}
            <Typography
              component={Link}
              href="/inicio"
              variant="h4"
              fontWeight={500}
              color="primary"
              sx={{ letterSpacing: 3, pointerEvents: "auto", textDecoration: "none" }}
            >
              ANÁLISIS 360
            </Typography>
          </Box>

          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            divider={<Divider orientation="vertical" flexItem />}
            // En celular, una línea que se desliza de lado si no caben los cinco.
            sx={{ mr: { xs: 0.5, sm: 2 }, flex: { xs: 1, md: "0 0 auto" }, minWidth: 0, overflowX: "auto", scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}
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
                  sx={{ flexDirection: "column", px: { xs: 1, sm: 1.5 }, py: { xs: 0.5, sm: 1 }, flexShrink: 0 }}
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

            <IconButton size="large" aria-label="show notifications" color="inherit" sx={{ display: { xs: "none", sm: "inline-flex" } }}>
              <Badge variant="dot" color="primary">
                <IconBellRinging size="21" stroke="1.5" />
              </Badge>
            </IconButton>
          </Stack>
        </Toolbar>
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
