'use client';
import { Box, Grid, Typography } from "@mui/material";
import NivelNavigation from "./components/NivelNavigation";
import MetricCard from "./components/MetricCard"; 
import dynamic from 'next/dynamic';
import { IconTargetArrow, IconUserCheck, IconUserX, IconListNumbers } from "@tabler/icons-react";
const DonutAsignacionMetas = dynamic(() => import('./components/DonutAsignacionMetas'), {
  ssr: false,
});

const PanelMetasPage = () => {
  return (
    <Box sx={{ bgcolor: '#FEFEFE', minHeight: '100vh', px: 5, pt: 0 }}>
      {/* Navegación superior */}
      <Box display="flex" flexDirection="column" gap={1} mb={2}>
        <NivelNavigation />
        <Typography variant="h5" fontWeight="bold" color="primary" mt={1}>
          KPI Metas
        </Typography>
      </Box>

      {/* KPIs */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Metas"
            value={128}
            subtitle="Período Mayo 2025"
            percentageChange={8.5}
            icon={<IconTargetArrow size={20} />}
            tooltipMessage="Comparado con el período anterior"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Metas Asignadas"
            value={96}
            subtitle="Vendedores con meta activa"
            percentageChange={5.2}
            icon={<IconUserCheck size={20} />}
            tooltipMessage="Incremento semanal"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Sin Asignar"
            value={32}
            subtitle="Metas pendientes por asignar"
            percentageChange={-4.3}
            icon={<IconUserX size={20} />}
            tooltipMessage="Reducción respecto a la semana pasada"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Tipos de Meta"
            value="60 / 68"
            subtitle="Cantidad vs Monto"
            icon={<IconListNumbers size={20} />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DonutAsignacionMetas asignadas={96} noAsignadas={32} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default PanelMetasPage;
