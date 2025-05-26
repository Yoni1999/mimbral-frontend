'use client';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography
} from '@mui/material';
import { fetchWithToken } from '@/utils/fetchWithToken';
import { BACKEND_URL } from '@/config';
import { useState } from 'react';

type EliminarMetaModalProps = {
  open: boolean;
  onClose: () => void;
  idMeta: number;
  onMetaEliminada: () => void;
};

const EliminarMetaModal = ({ open, onClose, idMeta, onMetaEliminada }: EliminarMetaModalProps) => {
  const [requiereConfirmacion, setRequiereConfirmacion] = useState(false);

  const handleEliminar = async (forzar = false) => {
    try {
      const res = await fetchWithToken(
        `${BACKEND_URL}/api/metas/eliminar/${idMeta}${forzar ? '?force=true' : ''}`,
        {
          method: 'DELETE',
        }
      );

      if (res?.status === 409) {
        const data = await res.json();
        if (data.requiereConfirmacion) {
          setRequiereConfirmacion(true); // Mostramos segunda confirmación
          return;
        }
      }

      const data = await res?.json();
      if (data?.success) {
        onMetaEliminada();
        setRequiereConfirmacion(false);
        onClose();
      } else {
        alert(data?.message || 'Error al eliminar la meta');
      }
    } catch (error) {
      console.error(error);
      alert('Error al conectar con el servidor');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        setRequiereConfirmacion(false);
        onClose();
      }}
      PaperProps={{
        sx: {
          border: '2px solid',
          borderColor: 'error.main',
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle color="error">Eliminar Meta</DialogTitle>
      <DialogContent>
        <Typography>
          {requiereConfirmacion
            ? 'Esta meta está asignada a vendedores. ¿Deseas eliminarla de todos modos?'
            : '¿Estás seguro que deseas eliminar esta meta?'}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            setRequiereConfirmacion(false);
            onClose();
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={() => handleEliminar(requiereConfirmacion)}
          variant="contained"
          color="error"
        >
          {requiereConfirmacion ? 'Eliminar de todos modos' : 'Eliminar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EliminarMetaModal;
