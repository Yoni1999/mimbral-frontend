"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Divider,
  Grid,
} from "@mui/material";

import TituloSupply from "./components/TituloSupplyChain";
import HeaderDrawerSupply from "./components/HeaderDrawerSupply";
import MetricCard from "./components/MetricCard";
import AlmacenesSelector from "./components/AlmacenesSelector";
import CategoriasPorTiendaChart from "./components/CategoriasPorTiendaChart"; // ✅ Nuevo import

import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import PlaylistRemoveOutlinedIcon from "@mui/icons-material/PlaylistRemoveOutlined";
import LoopOutlinedIcon from "@mui/icons-material/LoopOutlined";
import TimelapseOutlinedIcon from "@mui/icons-material/TimelapseOutlined";

const PageFiltrosAvanzados = () => {
  const [filtrosAplicados, setFiltrosAplicados] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleApplyFilters = (filtros: any) => {
    setFiltrosAplicados(filtros);
    setDrawerOpen(false);
    console.log("Filtros aplicados:", filtros);
  };

  const obtenerDescripcionPeriodo = () => {
    if (!filtrosAplicados) return "Sin seleccionar";
    if (filtrosAplicados.temporada) return filtrosAplicados.temporada;
    if (filtrosAplicados.periodo) return filtrosAplicados.periodo;
    if (filtrosAplicados.fechaInicio && filtrosAplicados.fechaFin) {
      return `${filtrosAplicados.fechaInicio} a ${filtrosAplicados.fechaFin}`;
    }
    return "Sin filtros de fecha";
  };

  return (
    <Box p={3}>
      {/* Header con título y botón de filtros */}
      <TituloSupply
        obtenerDescripcionPeriodo={obtenerDescripcionPeriodo}
        handleOpenDrawer={() => setDrawerOpen(true)}
      />

      {/* Drawer lateral */}
      <HeaderDrawerSupply
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onApply={handleApplyFilters}
      />

      {/* Métricas principales */}
      <Grid container spacing={2} mt={4}>
        <Grid item xs={12} sm={6} md={2.4}>
          <MetricCard
            title="Valor inventario"
            value="$1.80M"
            stockSubtitle="8.000 unidades en Stock"
            versus="Versus -2%"
            anterior="Período Anterior: $114.12M"
            borderColor="#cfc4ff"
            icon={<Inventory2OutlinedIcon color="primary" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <MetricCard
            title="% de SKUs en quiebre"
            value="48 %"
            versus="Versus -2%"
            anterior="Período Anterior: 66"
            icon={<WarningAmberOutlinedIcon color="warning" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <MetricCard
            title="% de SKUs en sobrestock"
            value="▼ 98.48%"
            anterior="Período Anterior: 66"
            icon={<PlaylistRemoveOutlinedIcon color="error" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <MetricCard
            title="Rotación Promedio"
            value="98"
            versus="▼ 95.73%"
            anterior="Período Anterior: 2294"
            icon={<LoopOutlinedIcon color="secondary" />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <MetricCard
            title="Días Promedio Cobertura"
            value="32 días"
            versus="Variación: ▲ 6.42%"
            icon={<TimelapseOutlinedIcon color="success" />}
          />
        </Grid>
      </Grid>

      {/* Selector de almacenes */}
      <Box mt={4}>
        <AlmacenesSelector />
      </Box>

      {/* 📊 Categorías por tienda */}
      <Box mt={4}>
        <CategoriasPorTiendaChart />
      </Box>

      {/* Filtros aplicados */}
      {filtrosAplicados && (
        <Paper sx={{ mt: 4, p: 3, borderRadius: 3 }}>
          <Typography variant="h6">Filtros aplicados:</Typography>
          <Divider sx={{ my: 2 }} />
          <pre style={{ fontSize: 14 }}>
            {JSON.stringify(filtrosAplicados, null, 2)}
          </pre>
        </Paper>
      )}
    </Box>
  );
};

export default PageFiltrosAvanzados;
