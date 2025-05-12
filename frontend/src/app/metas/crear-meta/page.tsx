'use client';
import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import MetasTable from './components/MetasTable';

const CrearMetaPage = () => {
  return (
    <Box p={4}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Crear y Administrar Metas
      </Typography>
      <MetasTable />
    </Box>
  );
};

export default CrearMetaPage;
