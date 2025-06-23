'use client';
import React, { useEffect, useState } from 'react';
import {
  Drawer, Button, IconButton, Typography, Box, Divider, Stack, TextField,
  Select, MenuItem, InputLabel, FormControl, Avatar, ListItemIcon, ListItemText, Chip, Grid, Autocomplete
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import dayjs, { Dayjs } from 'dayjs';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { fetchWithToken } from '@/utils/fetchWithToken';
import { BACKEND_URL } from '@/config';

interface Categoria {
  codigo: string;
  nombre: string;
  imagen?: string;
}

interface Proveedor {
  CardCode: string;
  CardName: string;
}

const canales = [
  { value: "Chorrillo", label: "Sucursal Chorrillo" },
  { value: "Meli", label: "Mercado Libre" },
  { value: "Vitex", label: "Vtex" },
  { value: "Empresas", label: "Ventas Empresas" },
  { value: "Balmaceda", label: "Sucursal Balmaceda" },
  { value: "Falabella", label: "Falabella" },
];

const marcas = ["Sipa", "Topex", "Tricolor", "Tigre"];

const FiltrosDrawer = () => {
  const [open, setOpen] = useState(false);
  const [filtros, setFiltros] = useState({
    proveedor: '',
    canal: '',
    subcategoria: '',
    categoria: '',
    primerNivel: '',
    marca: '',
    fechaInicio: null as Dayjs | null,
    fechaFin: null as Dayjs | null,
  });

  const [primerNiveles, setPrimerNiveles] = useState<Categoria[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Categoria[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [errores, setErrores] = useState<{ fechaInicio?: boolean; fechaFin?: boolean }>({});


  useEffect(() => {
    const fetchData = async () => {
      const [primerNivelData, proveedoresData] = await Promise.all([
        fetchWithToken(`${BACKEND_URL}/api/resumen-categoria/primer-nivel`).then(res => res!.json()),
        fetchWithToken(`${BACKEND_URL}/api/obtenerproveedores`).then(res => res!.json())
      ]);
      setPrimerNiveles(primerNivelData);
      setProveedores(proveedoresData);
    };
    fetchData();
  }, []);

  const handleChange = async (key: string, value: string | Dayjs | null) => {
    const updated = { ...filtros, [key]: value };

    if (key === "primerNivel") {
      updated.categoria = '';
      updated.subcategoria = '';
      const res = await fetchWithToken(`${BACKEND_URL}/api/metas/getcat?primerNivel=${value}`);
      const data = await res!.json();
      setCategorias(data.map((c: any) => ({ codigo: c.codigo_categoria, nombre: c.nombre_categoria, imagen: c.IMAGEN })));
      setSubcategorias([]);
    }

    if (key === "categoria") {
      updated.subcategoria = '';
      const res = await fetchWithToken(`${BACKEND_URL}/api/metas/getsub?categoria=${value}`);
      const data = await res!.json();
      setSubcategorias(data.map((s: any) => ({ codigo: s.codigo_subcategoria, nombre: s.nombre_subcategoria, imagen: s.IMAGEN })));
    }

    setFiltros(updated);
  };

  const handleChipDelete = (key: keyof typeof filtros) => {
    const updated = { ...filtros, [key]: '' };
    if (key === 'primerNivel') {
      updated.categoria = '';
      updated.subcategoria = '';
      setCategorias([]);
      setSubcategorias([]);
    }
    if (key === 'categoria') {
      updated.subcategoria = '';
      setSubcategorias([]);
    }
    setFiltros(updated);
  };

  const handleLimpiar = () => {
    setFiltros({
      proveedor: '',
      canal: '',
      subcategoria: '',
      categoria: '',
      primerNivel: '',
      marca: '',
      fechaInicio: null,
      fechaFin: null,
    });
    setCategorias([]);
    setSubcategorias([]);
  };
  const validarFiltros = () => {
  const filtrosActivos = ['proveedor', 'canal', 'primerNivel', 'categoria', 'subcategoria', 'marca']
    .some((campo) => filtros[campo as keyof typeof filtros]);

  const nuevosErrores: typeof errores = {};

  if (filtrosActivos) {
    if (!filtros.fechaInicio) nuevosErrores.fechaInicio = true;
    if (!filtros.fechaFin) nuevosErrores.fechaFin = true;
  }

  setErrores(nuevosErrores);
  return Object.keys(nuevosErrores).length === 0;
};


  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box mb={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
          <Box display="flex" gap={1} flexWrap="wrap">
            {filtros.canal && <Chip label={`Canal: ${canales.find(c => c.value === filtros.canal)?.label}`} onDelete={() => handleChipDelete("canal")} />}
            {filtros.proveedor && <Chip label={`Proveedor`} onDelete={() => handleChipDelete("proveedor")} />}
            {filtros.primerNivel && <Chip label={`Primer Nivel`} onDelete={() => handleChipDelete("primerNivel")} />}
            {filtros.categoria && <Chip label={`Categoría`} onDelete={() => handleChipDelete("categoria")} />}
            {filtros.subcategoria && <Chip label={`Subcategoría`} onDelete={() => handleChipDelete("subcategoria")} />}
            {filtros.marca && <Chip label={`Marca: ${filtros.marca}`} onDelete={() => handleChipDelete("marca")} />}
            {filtros.fechaInicio && filtros.fechaFin && (
              <Chip label={`Rango: ${dayjs(filtros.fechaInicio).format("DD/MM")} - ${dayjs(filtros.fechaFin).format("DD/MM")}`} onDelete={() => handleChipDelete("fechaInicio")} />
            )}
          </Box>

          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setOpen(true)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderColor: '#6c63ff',
              color: '#6c63ff',
              '&:hover': { backgroundColor: '#f0efff', borderColor: '#5a52d4' },
            }}
          >
            Filtros
          </Button>
        </Stack>

        <Drawer anchor="right" open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { width: 360, p: 3 } }}>
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Filtros</Typography>
              <IconButton onClick={() => setOpen(false)}><CloseIcon /></IconButton>
            </Stack>

            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
                <Grid item xs={12}>
                <Autocomplete
                    options={proveedores}
                    getOptionLabel={(option) => `${option.CardCode} - ${option.CardName}`}
                    value={proveedores.find((p) => p.CardCode === filtros.proveedor) || null}
                    onChange={(_, newValue) => handleChange('proveedor', newValue?.CardCode || '')}
                    renderInput={(params) => (
                    <TextField {...params} label="Proveedor" size="small" fullWidth />
                    )}
                    isOptionEqualToValue={(option, value) => option.CardCode === value.CardCode}
                />
                </Grid>


              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Canal</InputLabel>
                  <Select value={filtros.canal} onChange={(e) => handleChange('canal', e.target.value)}>
                    {canales.map((c) => (
                      <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Primer Nivel</InputLabel>
                  <Select value={filtros.primerNivel} onChange={(e) => handleChange('primerNivel', e.target.value)}>
                    {primerNiveles.map((cat) => (
                      <MenuItem key={cat.codigo} value={cat.codigo}>
                        <ListItemIcon><Avatar src={cat.imagen} sx={{ width: 24, height: 24 }} /></ListItemIcon>
                        <ListItemText primary={cat.nombre} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {filtros.primerNivel && (
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Categoría</InputLabel>
                    <Select value={filtros.categoria} onChange={(e) => handleChange('categoria', e.target.value)}>
                      {categorias.map((cat) => (
                        <MenuItem key={cat.codigo} value={cat.codigo}>
                          <ListItemIcon><Avatar src={cat.imagen} sx={{ width: 24, height: 24 }} /></ListItemIcon>
                          <ListItemText primary={cat.nombre} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {filtros.categoria && (
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Subcategoría</InputLabel>
                    <Select value={filtros.subcategoria} onChange={(e) => handleChange('subcategoria', e.target.value)}>
                      {subcategorias.map((sub) => (
                        <MenuItem key={sub.codigo} value={sub.codigo}>
                          <ListItemIcon><Avatar src={sub.imagen} sx={{ width: 24, height: 24 }} /></ListItemIcon>
                          <ListItemText primary={sub.nombre} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Marca</InputLabel>
                  <Select value={filtros.marca} onChange={(e) => handleChange('marca', e.target.value)}>
                    {marcas.map((m) => (
                      <MenuItem key={m} value={m}>{m}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6}>
                <DatePicker
                label="Fecha Inicio"
                value={filtros.fechaInicio}
                onChange={(date) => handleChange('fechaInicio', date)}
                slotProps={{
                    textField: {
                    fullWidth: true,
                    size: 'small',
                    error: errores.fechaInicio,
                    helperText: errores.fechaInicio ? 'Campo requerido' : '',
                    }
                }}
                />

              </Grid>
              <Grid item xs={6}>
                <DatePicker
                label="Fecha Fin"
                value={filtros.fechaFin}
                onChange={(date) => handleChange('fechaFin', date)}
                slotProps={{
                    textField: {
                    fullWidth: true,
                    size: 'small',
                    error: errores.fechaFin,
                    helperText: errores.fechaFin ? 'Campo requerido' : '',
                    }
                }}
                />
              </Grid>

              <Grid item xs={12} display="flex" justifyContent="space-between" mt={2}>
                <Button variant="outlined" onClick={handleLimpiar}>Limpiar</Button>
                <Button
                variant="contained"
                onClick={() => {
                    if (validarFiltros()) {
                    setOpen(false);
                    // Aquí podrías emitir los filtros aplicados si lo necesitas
                    }
                }}
                >
                Aplicar
                </Button>

              </Grid>
            </Grid>
          </Box>
        </Drawer>
      </Box>
    </LocalizationProvider>
  );
};

export default FiltrosDrawer;
