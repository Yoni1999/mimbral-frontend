'use client';
import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Snackbar,
  Alert as MuiAlert,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { fetchWithToken } from '@/utils/fetchWithToken';
import { BACKEND_URL } from '@/config';

const Alert = React.forwardRef<HTMLDivElement, any>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

interface Vendedor {
  id: number;
  NOMBRE: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  idMeta: number;
  idCanal: number;
  tipoMeta: 'cantidad' | 'monto';
  metaTotal: number;
  onAsignado?: () => void;
}

const AsignarMetaModal: React.FC<Props> = ({
  open,
  onClose,
  idMeta,
  idCanal,
  tipoMeta,
  metaTotal,
  onAsignado,
}) => {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [valores, setValores] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [metaAsignadaActual, setMetaAsignadaActual] = useState(0);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });

  useEffect(() => {
    if (!open) return;

    const fetchDatosIniciales = async () => {
      try {
        const [resVendedores, resAsignadas] = await Promise.all([
          fetchWithToken(`${BACKEND_URL}/api/metas/vendedores?id_canal=${idCanal}`),
          fetchWithToken(`${BACKEND_URL}/api/metas/metaasig/${idMeta}`),
        ]);

        const vendedoresData = await resVendedores!.json();
        const asignadasData = await resAsignadas!.json();

        if (Array.isArray(vendedoresData)) {
          setVendedores(vendedoresData);
        } else if (vendedoresData.message) {
          setVendedores([]);
          setErrorMsg(vendedoresData.message);
        }

        const totalAsignado = tipoMeta === 'cantidad'
          ? Number(asignadasData?.TOTAL_ASIGNADA) || 0
          : Number(asignadasData?.TOTAL_MONTO_ASIGNADO) || 0;

        setMetaAsignadaActual(totalAsignado);
      } catch (error) {
        console.error('Error cargando datos iniciales:', error);
        setErrorMsg('No se pudieron cargar los datos');
      }
    };

    setVendedores([]);
    setValores({});
    setErrorMsg('');
    fetchDatosIniciales();
  }, [open, idCanal, idMeta]);

  const handleChange = (id: number, value: string) => {
    setValores(prev => ({ ...prev, [id]: Number(value) }));
  };

  const sumaAsignada = Object.values(valores).reduce((acc, val) => acc + (val || 0), 0);
  const disponible = metaTotal - metaAsignadaActual;
  const excedeMeta = sumaAsignada > disponible;

  const handleGuardar = async () => {
    const asignaciones = Object.entries(valores)
      .filter(([_, valor]) => valor > 0)
      .map(([id, valor]) => ({
        id_vendedor: Number(id),
        meta_asignada: valor,
      }));

    if (asignaciones.length === 0) {
      setSnackbar({ open: true, message: 'Debes asignar al menos una meta', severity: 'warning' });
      return;
    }

    if (excedeMeta) {
      setSnackbar({
        open: true,
        message: `La suma asignada (${sumaAsignada}) excede el disponible (${disponible})`,
        severity: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetchWithToken(`${BACKEND_URL}/api/metas/asignar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_meta: idMeta, asignaciones }),
      });

      if (!res || !res.ok) throw new Error(await res!.text());

      setSnackbar({ open: true, message: 'Metas asignadas correctamente', severity: 'success' });
      onAsignado?.();
      onClose();
    } catch (error) {
      console.error('Error al asignar metas:', error);
      setSnackbar({ open: true, message: 'Ocurrió un error al guardar las metas', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" sx={{ '& .MuiDialog-paper': { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="bold">
            Asignar Metas a Vendedores
          </Typography>
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ px: 3, py: 2 }}>
          {errorMsg ? (
            <MuiAlert severity="info" sx={{ mt: 2 }}>{errorMsg}</MuiAlert>
          ) : vendedores.length === 0 ? (
            <Box display="flex" justifyContent="center" py={3}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <Box display="flex" flexDirection="column" gap={2} mt={1}>
              <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                {`Disponible para asignar: ${disponible} ${tipoMeta === 'monto' ? '(monto $)' : '(unidades)'}`}
              </Typography>

              {disponible <= 0 && (
                <MuiAlert severity="info">
                  Ya se han asignado todas las metas disponibles para esta meta.
                </MuiAlert>
              )}

              {excedeMeta && (
                <MuiAlert severity="warning">
                  La suma de las metas asignadas ({sumaAsignada}) excede el total disponible ({disponible}).
                </MuiAlert>
              )}

              {vendedores.map(v => (
                <Box key={v.id} display="flex" justifyContent="space-between" alignItems="center">
                  <Typography>{v.NOMBRE}</Typography>
                  <TextField
                    size="small"
                    type="number"
                    value={valores[v.id] || ''}
                    onChange={(e) => handleChange(v.id, e.target.value)}
                    label={tipoMeta === 'monto' ? 'Meta $' : 'Meta cantidad'}
                    sx={{ width: 150 }}
                  />
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="outlined" onClick={onClose} sx={{ borderRadius: 2 }}>Cancelar</Button>
          <Button
            variant="contained"
            color="primary"
            disabled={loading || excedeMeta || disponible <= 0}
            onClick={handleGuardar}
            sx={{ borderRadius: 2, fontWeight: 'bold' }}
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AsignarMetaModal;
