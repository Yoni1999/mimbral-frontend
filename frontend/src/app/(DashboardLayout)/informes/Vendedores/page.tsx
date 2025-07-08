'use client';
import React from 'react';
import { Box, Typography } from '@mui/material';
import TablaResumenVendedores from './components/TablaResumenVendedores';

const ResumenVendedoresPage = () => {
  return (
    <Box sx={{ px: 3, mt: 4, width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Informe de Vendedores
      </Typography>
      <TablaResumenVendedores />
    </Box>
  );
};

export default ResumenVendedoresPage;
