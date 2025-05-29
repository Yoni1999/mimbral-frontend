'use client';

import React, { useState } from "react";
import {
  Box,
  Typography,
  Divider,
} from "@mui/material";
import { TrendingDown } from "@mui/icons-material";
import ProductosEstancadosTable from "./components/ProductosEstancadosTable";
import HeaderProductosDetenidos from "./components/HeaderProductosDetenidos"; // ✅ Asegúrate de que la ruta coincida

const ProductosDetenidosPage = () => {
  const [filters, setFilters] = useState({});

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    // Aquí puedes usar estos filtros para pasarlos a la API o al componente de tabla si lo necesitas
  };

  return (
    <Box p={4}>
      <Typography variant="h4" fontWeight="bold" gutterBottom display="flex" alignItems="center">
        <TrendingDown sx={{ mr: 1 }} />
        Informe de Productos Detenidos
      </Typography>

      <Typography variant="body1" color="text.secondary" gutterBottom>
        Este reporte muestra los productos que no han tenido ventas desde hace varios días, con información detallada sobre inventario y margen 
      </Typography>

      {/* ✅ Header de Filtros */}
      <HeaderProductosDetenidos onFilterChange={handleFilterChange} />

      <Divider sx={{ my: 3 }} />

      {/* Aquí podrías pasar los filtros si la tabla se conecta a la API */}
      <ProductosEstancadosTable />
    </Box>
  );
};

export default ProductosDetenidosPage;
