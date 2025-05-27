'use client';
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tooltip,
  IconButton,
  Fab
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import MetasTable from './components/MetasTable';
import NivelNavigation from "../components/NivelNavigation"; 

const CrearMetaPage = () => {
  const [openForm, setOpenForm] = useState(false);

  return (
    <Box p={4} position="relative" sx={{ bgcolor: '#FEFEFE', minHeight: '100vh' }}>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <Typography variant="h5" color="primary" fontWeight="bold">
          Crea / asigna Metas y Periodos
        </Typography>
        <Tooltip
          title={
            <Box>
              <Typography fontSize={12}>
                 1. En esta sección podras ver las metas por SKU o monto $ asociadas a los canales.
              </Typography>
              <Typography fontSize={12}>
                2. Puedes crear una nueva meta, periodo, asignar a vendedores y exportar los datos en excel.
              </Typography>
            </Box>
          }
          arrow
          placement="top"
        >
          <InfoOutlinedIcon sx={{ color: 'primary', cursor: 'pointer' }} />
        </Tooltip>
      </Box>

      <MetasTable />
    </Box>
  );
};

export default CrearMetaPage;
