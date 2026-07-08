'use client';
import React from 'react';
import TablaProductos from './components/tablaproductos';
import { Box, Typography, Container, Stack } from '@mui/material';
import FiltrosDrawer from './components/FiltrosDrawer'; // ← Asegúrate de que esta ruta sea correcta

const RotacionStockPage = () => {
  return (
    <Container maxWidth={false} disableGutters sx={{ px: { xs: 1.5, md: 4 }, py: { xs: 1, md: 4 } }}>
      <Box width="100%">
        {/* Botón de filtros */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="flex-end"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          gap={{ xs: 0.5, md: 1 }}
          mb={{ xs: 1, md: 2 }}
        >
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
