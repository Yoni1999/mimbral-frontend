"use client";

import { Box, Typography, Grid } from "@mui/material";
import { useState } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import VentasProductosHeader, { Filters } from "../components/VentasProductosHeader";
import VentasProductosTable from "../components/VentasProductosTable";
import VentasCanalChart from "@/app/(DashboardLayout)/utilities/datos-maestros/components/VentasCanalChart";

// 🔹 Datos de prueba para la tabla
const mockData = [
  { sku: "1001", nombre: "Producto A", ventasTotales: 1500000, crecimiento: 12.5, ticketPromedio: 45.5, cantidadVendida: 120, rentabilidad: 30 },
  { sku: "1002", nombre: "Producto B", ventasTotales: 950000, crecimiento: -5.2, ticketPromedio: 38.2, cantidadVendida: 85, rentabilidad: 25 },
  { sku: "1003", nombre: "Producto C", ventasTotales: 2000000, crecimiento: 8.3, ticketPromedio: 52.7, cantidadVendida: 160, rentabilidad: 35 },
  { sku: "1004", nombre: "Producto D", ventasTotales: 720000, crecimiento: 3.9, ticketPromedio: 40.1, cantidadVendida: 60, rentabilidad: 28 },
];

export default function ProductosVentas() {
  const [filteredData, setFilteredData] = useState(mockData);

  const handleFilterChange = (filters: Filters) => {
    let dataFiltrada = [...mockData];

    // 🗓️ (Opcional) Aplica filtros de fechas si hay lógica definida en el futuro
    if (filters.fechaInicio && filters.fechaFin) {
      // Aquí podrías filtrar los productos basados en su fecha de venta si la tuvieras en la data
    }

    setFilteredData(dataFiltrada);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom textAlign="center">
          Análisis de Ventas por Producto
        </Typography>

        {/* 🔹 Header de filtros */}
        <VentasProductosHeader onFilterChange={handleFilterChange} />

        {/* 🔹 Gráficos lado a lado */}
        <Grid container spacing={2} sx={{ my: 3 }}>
          <Grid item xs={12} md={6}>
            <VentasCanalChart
              title="Ventas por Canal"
              canal=""
              periodo=""
              onVendedorSeleccionado={() => {}}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <VentasCanalChart
              title="Vendedores"
              canal=""
              periodo=""
              labelsData={["Juan", "Pedro", "Antonia", "Sofía"]}
              seriesData={[35, 30, 25, 10]}
              onVendedorSeleccionado={() => {}}
            />
          </Grid>
        </Grid>


        {/* 🔹 Tabla de resultados */}
        <VentasProductosTable data={filteredData} />
      </Box>
    </LocalizationProvider>
  );
}
