'use client';
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  TextField,
  MenuItem,
  Button,
  Select,
  Autocomplete,
  CircularProgress,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { fetchWithToken } from '@/utils/fetchWithToken';
import { BACKEND_URL } from '@/config';

type Producto = {
  itemcode: string;
  itemname: string;
  U_Imagen: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onMetaGuardada?: () => void;
};

const canalSlpMap: Record<string, number> = {
  Empresas: 1,
  Chorrillo: 2,
  Balmaceda: 3,
  Mercado_Libre: 4,
  Vitex: 5,
  Falabella: 6,
};

const MetaFormModal = ({ open, onClose, onMetaGuardada }: Props) => {
  const [canal, setCanal] = useState('');
  const [periodo, setPeriodo] = useState('');
  const [tipoMeta, setTipoMeta] = useState('');
  const [sku, setSku] = useState('');
  const [cantidad, setCantidad] = useState<number | ''>('');
  const [monto, setMonto] = useState<number | ''>('');
  const [periodos, setPeriodos] = useState<any[]>([]);
  const [skuOptions, setSkuOptions] = useState<Producto[]>([]);
  const [loadingSku, setLoadingSku] = useState(false);

  useEffect(() => {
    const fetchPeriodos = async () => {
      try {
        const res = await fetchWithToken(`${BACKEND_URL}/api/periodos`);
        const data = await res!.json();
        const parsed = data.map((p: any) => ({
          id: p.ID_PERIODO,
          nombre: p.NOMBRE,
        }));
        setPeriodos(parsed);
      } catch (error) {
        console.error('Error al obtener períodos:', error);
      }
    };

    fetchPeriodos();
  }, []);

  const fetchSKUs = async (query: string) => {
    try {
      setLoadingSku(true);
      const response = await fetchWithToken(
        `${BACKEND_URL}/api/pv/SKU?query=${encodeURIComponent(query)}`
      );

      if (!response || !response.ok) {
        throw new Error(`Error HTTP: ${response?.status}`);
      }

      const data: Producto[] = await response.json();
      setSkuOptions(data);
    } catch (error) {
      console.error('❌ Error cargando SKUs:', error);
      setSkuOptions([]);
    } finally {
      setLoadingSku(false);
    }
  };

  const resetFormulario = () => {
    setCanal('');
    setPeriodo('');
    setTipoMeta('');
    setSku('');
    setCantidad('');
    setMonto('');
  };

  const handleSubmit = async () => {
    const payload = {
      id_canal: canal && canalSlpMap[canal] ? canalSlpMap[canal] : null,
      id_periodo: parseInt(periodo),
      tipo_meta: tipoMeta,
      sku: tipoMeta === 'cantidad' ? sku : null,
      meta_cantidad: tipoMeta === 'cantidad' ? Number(cantidad) : null,
      meta_monto: tipoMeta === 'monto' ? Number(monto) : null,
    };

    try {
      const res = await fetchWithToken(`${BACKEND_URL}/api/metas/insert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res || !res.ok) {
        const errorData = await res?.json();
        throw new Error(errorData?.error || 'Error al registrar meta');
      }

      alert('Meta registrada exitosamente');
      resetFormulario();
      onMetaGuardada?.();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error al guardar la meta');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" sx={{ '& .MuiDialog-paper': { borderRadius: 4 } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight="bold">
          Crear Nueva Meta
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ px: 4, py: 4 }}>
        <Box display="flex" flexDirection="column" gap={2}>
          <Select
            value={canal}
            onChange={(e) => setCanal(e.target.value)}
            fullWidth
            displayEmpty
          >
            <MenuItem value="">Seleccionar Canal</MenuItem>
            {Object.keys(canalSlpMap).map((c) => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
            ))}
          </Select>

          <Select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            fullWidth
            displayEmpty
          >
            <MenuItem value="">Seleccionar Período</MenuItem>
            {periodos.map((p) => (
              <MenuItem key={p.id} value={p.id.toString()}>
                {p.nombre}
              </MenuItem>
            ))}
          </Select>

          <Select
            value={tipoMeta}
            onChange={(e) => setTipoMeta(e.target.value)}
            fullWidth
            displayEmpty
          >
            <MenuItem value="">Tipo de Meta</MenuItem>
            <MenuItem value="cantidad">Por Cantidad</MenuItem>
            <MenuItem value="monto">Por Monto</MenuItem>
          </Select>

          {tipoMeta === 'cantidad' && (
            <>
              <Autocomplete
                freeSolo
                options={skuOptions}
                getOptionLabel={(option) =>
                  typeof option === 'string'
                    ? option
                    : `${option.itemcode} - ${option.itemname}`
                }
                onInputChange={(_, value) => {
                  if (value.length >= 2) fetchSKUs(value);
                }}
                onChange={(_, value) => {
                  if (typeof value === 'string') {
                    setSku(value);
                  } else if (value) {
                    setSku(value.itemcode);
                  }
                }}
                loading={loadingSku}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Buscar SKU"
                    fullWidth
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingSku ? <CircularProgress size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
              <TextField
                label="Cantidad"
                type="number"
                fullWidth
                value={cantidad}
                onChange={(e) => setCantidad(Number(e.target.value))}
              />
            </>
          )}

          {tipoMeta === 'monto' && (
            <TextField
              label="Monto"
              type="number"
              fullWidth
              value={monto}
              onChange={(e) => setMonto(Number(e.target.value))}
            />
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={handleSubmit}
          disabled={
            !canal || !periodo || !tipoMeta ||
            (tipoMeta === 'cantidad' && (!sku || !cantidad)) ||
            (tipoMeta === 'monto' && !monto)
          }
          sx={{ py: 1.3, fontWeight: 'bold', borderRadius: 2 }}
        >
          Guardar Meta
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MetaFormModal;
