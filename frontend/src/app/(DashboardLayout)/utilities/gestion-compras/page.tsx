'use client';
import React from 'react';
import TablaProductos from './components/tablaproductos';
import { Box, Typography, Container, Stack } from '@mui/material';
import FiltrosDrawer from './components/FiltrosDrawer'; // ← Asegúrate de que esta ruta sea correcta

const RotacionStockPage = () => {
  return (
    <Container maxWidth={false} disableGutters sx={{ px: { xs: 1.5, md: 4 }, py: { xs: 1, md: 4 } }}>
      <Box width="100%">
        {/* Header con título y botón de filtros */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          gap={{ xs: 0.5, md: 1 }}
          mb={{ xs: 1, md: 2 }}
        >
          <Box>
            <Typography
              variant="h4"
              fontWeight={700}
              gutterBottom
              sx={{ fontSize: { xs: "1.05rem", md: "2.125rem" }, mb: { xs: 0.25, md: 0.35 } }}
            >
              Análisis Gestión de Compras
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ display: { xs: "none", md: "block" } }}
            >
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
