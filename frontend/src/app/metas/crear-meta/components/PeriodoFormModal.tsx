'use client';
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import { fetchWithToken } from '@/utils/fetchWithToken';
import { BACKEND_URL } from '@/config';
import CloseIcon from '@mui/icons-material/Close';

type Props = {
  open: boolean;
  onClose: () => void;
  onPeriodoCreado?: () => void;
};

const PeriodoFormModal = ({ open, onClose, onPeriodoCreado }: Props) => {
  const [nombre, setNombre] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGuardar = async () => {
    if (!nombre || !fechaInicio || !fechaFin) {
      alert('Completa todos los campos');
      return;
    }

    setLoading(true);

    try {
      const payload = { nombre, fechaInicio, fechaFin };
      console.log('📤 Enviando período:', payload); // Verifica lo que se envía

      const res = await fetchWithToken(`${BACKEND_URL}/api/periodos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res || !res.ok) {
        const contentType = res!.headers.get('content-type');
        const errorMessage = contentType?.includes('application/json')
          ? (await res!.json()).error
          : await res!.text();

        console.error('❌ Error al guardar período:', errorMessage);
        throw new Error(errorMessage || 'No se pudo guardar el período');
      }

      // Reset form
      setNombre('');
      setFechaInicio('');
      setFechaFin('');

      alert('✅ Período guardado correctamente');
      onPeriodoCreado?.();
      onClose();
    } catch (error) {
      console.error('⛔ Error capturado:', error);
      alert(`Ocurrió un error al guardar el período:\n${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };


  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight="bold">
          Crear Nuevo Período
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ px: 3, py: 2 }}>
        <Box display="flex" flexDirection="column" gap={2}>
          <TextField
            label="Nombre del período"
            fullWidth
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <TextField
            label="Fecha Inicio"
            type="date"
            InputLabelProps={{ shrink: true }}
            fullWidth
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
          <TextField
            label="Fecha Fin"
            type="date"
            InputLabelProps={{ shrink: true }}
            fullWidth
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{ borderRadius: 2 }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleGuardar}
          variant="contained"
          color="primary"
          disabled={loading}
          sx={{ py: 1.3, fontWeight: 'bold', borderRadius: 2 }}
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PeriodoFormModal;
