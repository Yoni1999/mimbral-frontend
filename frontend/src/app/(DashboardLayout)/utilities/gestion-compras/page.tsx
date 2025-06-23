'use client';
import React from 'react';
import TablaProductos from './components/tablaproductos';
import { Box, Typography, Container, Stack } from '@mui/material';
import FiltrosDrawer from './components/FiltrosDrawer'; // ← Asegúrate de que esta ruta sea correcta

const RotacionStockPage = () => {
  return (
    <Container maxWidth={false} disableGutters sx={{ px: { xs: 2, md: 4 }, py: 4 }}>
      <Box width="100%">
        {/* Header con título y botón de filtros */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Análisis Gestión de Compras
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Visualiza la rotación diaria histórica, el stock actual y el pronóstico de compras.
            </Typography>
          </Box>

          {/* Botón que abre el Drawer */}
          <FiltrosDrawer />
        </Stack>

        {/* Tabla principal */}
        <TablaProductos />
      </Box>
    </Container>
  );
};

export default RotacionStockPage;
