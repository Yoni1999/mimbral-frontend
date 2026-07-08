'use client';
import React from 'react';
import { Box } from '@mui/material';
import TablaResumenVendedores from './components/TablaResumenVendedores';

const ResumenVendedoresPage = () => {
  return (
    <Box sx={{ px: { xs: 1.5, md: 3 }, mt: { xs: 1.5, md: 4 }, width: '100%' }}>
      <TablaResumenVendedores />
    </Box>
  );
};

export default ResumenVendedoresPage;
