// src/app/metas/crear-periodo/page.tsx
'use client';
import React from 'react';
import PeriodosTable from './components/PeriodosTable';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Box, Tooltip, Typography } from '@mui/material';

const CrearPeriodoPage = () => {
  return (
    <Box position="relative" sx={{ p: { xs: 1.5, md: 4 } }}>
      <PeriodosTable />
    </Box>
  );
};

export default CrearPeriodoPage;
