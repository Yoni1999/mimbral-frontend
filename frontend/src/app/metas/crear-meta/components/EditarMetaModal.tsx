'use client';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, MenuItem
} from '@mui/material';
import { useState, useEffect } from 'react';
import { fetchWithToken } from '@/utils/fetchWithToken';
import { BACKEND_URL } from '@/config';

type EditarMetaModalProps = {
  open: boolean;
  onClose: () => void;
  meta: {
    id_meta: number;
    tipoMeta: 'cantidad' | 'monto';
    cantidadMeta: number | null;
    montoMeta: number | null;
  };
  onMetaActualizada: () => void;
};

const EditarMetaModal = ({ open, onClose, meta, onMetaActualizada }: EditarMetaModalProps) => {
  const [cantidad, setCantidad] = useState(meta.cantidadMeta || 0);
  const [monto, setMonto] = useState(meta.montoMeta || 0);
  const [tipo, setTipo] = useState<'cantidad' | 'monto'>(meta.tipoMeta);

  useEffect(() => {
    setCantidad(meta.cantidadMeta || 0);
    setMonto(meta.montoMeta || 0);
    setTipo(meta.tipoMeta);
  }, [meta]);

  const handleGuardar = async () => {
    const res = await fetchWithToken(`${BACKEND_URL}/api/metas/editar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: meta.id_meta,
        metaCantidad: cantidad,
        tipoMeta: tipo,
        montoMeta: monto,
      }),
    });

    const data = await res?.json();
    if (data?.success) {
      onMetaActualizada();
      onClose();
    } else {
      alert('Error al editar la meta');
    }
  };

    return (
    <Dialog
        open={open}
        onClose={onClose}
        PaperProps={{
        sx: {
            border: '1.8px solid',
            borderColor: 'warning.main',
            borderRadius: 4,
        },
        }}
    >
        <DialogTitle>Edita esta Meta</DialogTitle>
        <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
            select
            label="Tipo de Meta"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as 'cantidad' | 'monto')}
            fullWidth
            >
            <MenuItem value="cantidad">Cantidad</MenuItem>
            <MenuItem value="monto">Monto</MenuItem>
            </TextField>

            {tipo === 'cantidad' ? (
            <TextField
                label="Cantidad"
                type="number"
                value={cantidad}
                onChange={(e) => setCantidad(Number(e.target.value))}
                fullWidth
            />
            ) : (
            <TextField
                label="Monto"
                type="number"
                value={monto}
                onChange={(e) => setMonto(Number(e.target.value))}
                fullWidth
            />
            )}
        </Box>
        </DialogContent>
        <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleGuardar} variant="contained">Guardar</Button>
        </DialogActions>
    </Dialog>
    );
};

export default EditarMetaModal;
