'use client';
import React from 'react';
import { Box, Typography } from '@mui/material';

const Loading = () => {
  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
      }}
    >
      <Box
        component="img"
        src="/images/logos/logoitem.jpg"
        alt="Logo Mimbral"
        sx={{
          width: 70, 
          height: 70,
          borderRadius: '50%',
          objectFit: 'cover',
          animation: 'spin 2s linear infinite',
          mb: 2, 
        }}
      />
      <Typography variant="body1" color="text.secondary" fontWeight={500}>
        Cargando...
      </Typography>

      <style jsx global>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </Box>
  );
};

export default Loading;
