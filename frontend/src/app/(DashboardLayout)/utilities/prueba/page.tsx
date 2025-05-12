"use client";

import { Box, Container, Typography } from "@mui/material";
import ProgressGauge from "../ventas/resumen-ventas/components/ProgressGauge"; // Ajusta el path si es necesario

export default function ProgressGaugePage() {
  return (
    <Container maxWidth="sm" sx={{ mt: 5 }}>
      <Typography variant="h5" align="center" gutterBottom>
        Test Gauge de Progreso
      </Typography>
      <Box display="flex" justifyContent="center" alignItems="center">
        <ProgressGauge value={7200000} total={10000000} title="Ventas Diarias" />
      </Box>
    </Container>
  );
}
