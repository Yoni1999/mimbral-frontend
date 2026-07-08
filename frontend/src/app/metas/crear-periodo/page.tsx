// src/app/metas/crear-periodo/page.tsx
'use client';
import React from 'react';
import PeriodosTable from './components/PeriodosTable';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Box, Tooltip, Typography } from '@mui/material';

const CrearPeriodoPage = () => {
  return (
    <Box position="relative" sx={{ p: { xs: 1.5, md: 4 } }}>
      <Box display="flex" alignItems="center" gap={1} mb={0}>
        <Typography
          variant="h5"
          fontWeight="bold"
          sx={{ fontSize: { xs: "1.05rem", md: "h5.fontSize" } }}
        >
          Administra tus Periodos
        </Typography>
        <Tooltip
          title="Para crear un nuevo período solo debes escribir el nombre, definir el rango de fechas y presionar 'Agregar período'"
          arrow
        >
          <InfoOutlinedIcon sx={{ color: 'primary', cursor: 'pointer' }} />
        </Tooltip>
      </Box>

      <PeriodosTable />
    </Box>
  );
};

export default CrearPeriodoPage;
