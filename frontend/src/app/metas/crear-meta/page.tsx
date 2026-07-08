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
    <Box position="relative" sx={{ p: { xs: 1.5, md: 4 }, bgcolor: '#FEFEFE', minHeight: '100vh' }}>
      <MetasTable />
    </Box>
  );
};

export default CrearMetaPage;
