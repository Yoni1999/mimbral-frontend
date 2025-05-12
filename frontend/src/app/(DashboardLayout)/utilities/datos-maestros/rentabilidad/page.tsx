"use client";

import { Box, Grid, Typography } from "@mui/material";
import {
  IconCurrencyDollar,
  IconTrendingUp,
  IconCalculator,
  IconTag,
} from "@tabler/icons-react";
import { useState } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import MetricCard from "@/app/(DashboardLayout)/utilities/datos-maestros/components/MetricCard";
import RentabilidadTable from "../components/RentabilidadTable";
import RentabilidadModal from "../components/modals/RentabilidadModal";
import RentabilidadHeader from "../components/RentabilidadHeader";

export default function RentabilidadPage() {
  const [openModal, setOpenModal] = useState(false);

  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);

  // 🔹 Datos de prueba para el gráfico
  const lineData = [32, 34, 36, 37, 38];
  const lineLabels = ["Ene", "Feb", "Mar", "Abr", "May"];

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 4 }}>
        {/* 🔹 Header de filtros */}
        <Box mb={3}>
          <RentabilidadHeader onFilterChange={(filtros) => console.log("Filtros aplicados:", filtros)} />
        </Box>

        {/* 🔹 Título principal */}
        <Typography variant="h4" fontWeight="bold" gutterBottom textAlign="center">
          Análisis de Rentabilidad por Producto y Canal
        </Typography>

        {/* 🔹 KPIs con datos estáticos */}
        <Grid container spacing={2} mt={2}>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Margen de Ganancia"
              value="38%"
              description="+2 pts vs mes anterior"
              icon={<IconTrendingUp size={28} className="text-green-600" />}
              onClick={handleOpenModal}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Costo Unitario"
              value="$1.200"
              description="Costo promedio del producto"
              icon={<IconCalculator size={28} className="text-blue-600" />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Contribución Marginal"
              value="$800"
              description="Contribución por unidad"
              icon={<IconCurrencyDollar size={28} className="text-yellow-600" />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Precio Venta Promedio"
              value="$2.000"
              description="Promedio últimos 30 días"
              icon={<IconTag size={28} className="text-purple-600" />}
            />
          </Grid>
        </Grid>

        {/* 🔹 Tabla de resultados */}
        <Box mt={4}>
          <RentabilidadTable />
        </Box>

        {/* 🔹 Modal gráfico de evolución */}
        <RentabilidadModal
          open={openModal}
          onClose={handleCloseModal}
          title="Evolución del Margen"
          data={lineData}
          labels={lineLabels}
        />
      </Box>
    </LocalizationProvider>
  );
}
