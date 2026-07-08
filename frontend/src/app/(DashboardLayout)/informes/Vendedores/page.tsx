'use client';
import React from 'react';
import { Box, Typography } from '@mui/material';
import TablaResumenVendedores from './components/TablaResumenVendedores';

const ResumenVendedoresPage = () => {
  return (
    <Box sx={{ px: { xs: 1.5, md: 3 }, mt: { xs: 1.5, md: 4 }, width: '100%' }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ fontSize: { xs: '1.05rem', sm: '2.125rem' }, mb: { xs: 0.5, md: 1 } }}
      >
        Informe de Vendedores
      </Typography>
      <TablaResumenVendedores />
    </Box>
  );
};

export default ResumenVendedoresPage;
