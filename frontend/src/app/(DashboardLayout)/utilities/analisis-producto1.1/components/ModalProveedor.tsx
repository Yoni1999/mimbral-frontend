'use client';
import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, Button, Box, Divider, Stack
} from '@mui/material';

interface Proveedor {
  Proveedor_Codigo: string;
  Proveedor_Nombre: string;
  Promedio_Dias_Entrega: number;
}

interface ModalProveedorProps {
  open: boolean;
  onClose: () => void;
  data: Proveedor[]; // 👈 ESTA propiedad estaba faltando
}

const ModalProveedor: React.FC<ModalProveedorProps> = ({ open, onClose, data }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>⏱ Tiempo de Entrega Proveedor</DialogTitle>
      <DialogContent dividers>
        {data.length === 0 ? (
          <Typography>No hay información disponible.</Typography>
        ) : (
          <Stack spacing={2}>
            {data.map((prov, idx) => (
              <Box key={idx}>
                <Typography variant="subtitle2" color="text.secondary">Código:</Typography>
                <Typography>{prov.Proveedor_Codigo}</Typography>

                <Typography variant="subtitle2" color="text.secondary" mt={1}>Nombre:</Typography>
                <Typography>{prov.Proveedor_Nombre}</Typography>

                <Typography variant="subtitle2" color="text.secondary" mt={1}>Promedio de Días de Entrega:</Typography>
                <Typography>{prov.Promedio_Dias_Entrega} días</Typography>

                {/* Divider solo si no es el último elemento */}
                {idx < data.length - 1 && <Divider sx={{ mt: 2 }} />}
              </Box>
            ))}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalProveedor;
