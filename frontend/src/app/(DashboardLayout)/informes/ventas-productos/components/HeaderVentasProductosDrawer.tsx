"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Drawer, IconButton, Typography, Divider,
  FormControl, InputLabel, Select, MenuItem, Button,
  Grid, TextField, Chip, Avatar, ListItemIcon, ListItemText,
  CircularProgress
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import CloseIcon from "@mui/icons-material/Close";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";

// Interfaces moved out for clarity
interface FiltroVentas {
  canal?: string;
  periodo: string;
  fechaInicio?: string;
  fechaFin?: string;
  proveedor?: string;
  primerNivel?: string;
  categoria?: string;
  subcategoria?: string;
}

interface Categoria {
  codigo: string;
  nombre: string;
  imagen?: string;
}

interface Proveedor {
  CardCode: string;
  CardName: string;
}

interface Props {
  onFilterChange: (filters: FiltroVentas) => void;
  currentFilters?: FiltroVentas;
}

const canales = [
  { value: "Chorrillo", label: "Sucrusal Chorrillo" },
  { value: "Meli", label: "Mercado Libre" },
  { value: "Vitex", label: "Vtex" },
  { value: "Empresas", label: "Ventas Empresas" },
  { value: "Balmaceda", label: "Sucursal Balmaceda" },
  { value: "Falabella", label: "Falabella" },
];

const periodos = [
  { value: "1D", label: "Hoy" },
  { value: "7D", label: "Últimos 7 días" },
  { value: "14D", label: "Últimos 14 días" },
  { value: "1M", label: "Último mes" },
  { value: "3M", label: "Últimos 3 meses" },
  { value: "6M", label: "Últimos 6 meses" },
  { value: "1Y", label: "Último año" },
  { value: "RANGO", label: "Rango personalizado" },
];

const HeaderVentasProductosDrawer: React.FC<Props> = ({ onFilterChange, currentFilters }) => {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<FiltroVentas>(currentFilters || { periodo: "7D" });

  const [primerNiveles, setPrimerNiveles] = useState<Categoria[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Categoria[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [proveedorSearchInput, setProveedorSearchInput] = useState(""); // Added search input for proveedores
  const [loadingProveedores, setLoadingProveedores] = useState(false); // Loading state for proveedores
  const [showProveedorSuggestions, setShowProveedorSuggestions] = useState(false); // State to show supplier suggestions

  // Fetch PrimerNivel and Proveedores data on component mount
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

  const handleChange = async (key: keyof FiltroVentas, value: string) => {
    const updatedFilters = { ...filters, [key]: value };

    // Reset dependent filters
    if (key === "primerNivel") {
      updatedFilters.categoria = undefined;
      updatedFilters.subcategoria = undefined;
      await fetchCategorias(value);
      setSubcategorias([]);
    }

    if (key === "categoria") {
      updatedFilters.subcategoria = undefined;
      await fetchSubcategorias(value);
    }

    setFilters(updatedFilters);
  };

  const fetchCategorias = async (primerNivel: string) => {
    const res = await fetchWithToken(`${BACKEND_URL}/api/metas/getcat?primerNivel=${primerNivel}`);
    const data = await res!.json();
    setCategorias(data.map((cat: any) => ({ codigo: cat.codigo_categoria, nombre: cat.nombre_categoria, imagen: cat.IMAGEN })));
  };

  const fetchSubcategorias = async (categoria: string) => {
    const res = await fetchWithToken(`${BACKEND_URL}/api/metas/getsub?categoria=${categoria}`);
    const data = await res!.json();
    setSubcategorias(data.map((sub: any) => ({ codigo: sub.codigo_subcategoria, nombre: sub.nombre_subcategoria, imagen: sub.IMAGEN })));
  };

  const handleProveedorSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setProveedorSearchInput(value);
    setShowProveedorSuggestions(true); // Show suggestions when user types
    if (value === "") {
      setFilters(prev => ({ ...prev, proveedor: undefined }));
    }
  };

  const handleProveedorSelect = (proveedor: Proveedor) => {
    setFilters((prev) => ({ ...prev, proveedor: proveedor.CardCode }));
    setProveedorSearchInput(proveedor.CardName); // Display name in the input
    setShowProveedorSuggestions(false); // Hide suggestions after selection
  };

  const handleApply = () => {
    onFilterChange(filters);
    setOpen(false);
  };

  const handleClear = () => {
    const cleared: FiltroVentas = { periodo: "7D" };
    setFilters(cleared);
    setProveedorSearchInput(""); // Clear supplier search input
    setCategorias([]); // Clear dependent dropdowns
    setSubcategorias([]); // Clear dependent dropdowns
    onFilterChange(cleared);
    setOpen(false); // Close the drawer after clearing
  };

  const handleChipDelete = (key: keyof FiltroVentas) => {
    const updated = { ...filters, [key]: undefined };
    if (key === "primerNivel") {
      updated.categoria = undefined;
      updated.subcategoria = undefined;
      setCategorias([]);
      setSubcategorias([]);
    }
    if (key === "categoria") {
      updated.subcategoria = undefined;
      setSubcategorias([]);
    }
    setFilters(updated);
    onFilterChange(updated);
  };

  const filteredProveedores = proveedores.filter(p =>
    p.CardCode.toLowerCase().includes(proveedorSearchInput.toLowerCase()) ||
    p.CardName.toLowerCase().includes(proveedorSearchInput.toLowerCase())
  );

  return (
    <Box mb={2}>
      <Box mt={1} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
        <Box display="flex" gap={1} flexWrap="wrap">
          {filters.canal && <Chip label={`Canal: ${canales.find(c => c.value === filters.canal)?.label}`} onDelete={() => handleChipDelete("canal")} />}
          {filters.periodo && <Chip label={`Período: ${periodos.find(p => p.value === filters.periodo)?.label}`} onDelete={() => handleChipDelete("periodo")} />}
          {filters.proveedor && <Chip label={`Proveedor: ${proveedores.find(p => p.CardCode === filters.proveedor)?.CardName || filters.proveedor}`} onDelete={() => handleChipDelete("proveedor")} />}
          {filters.primerNivel && <Chip label={`Primer Nivel`} onDelete={() => handleChipDelete("primerNivel")} />}
          {filters.categoria && <Chip label={`Categoría`} onDelete={() => handleChipDelete("categoria")} />}
          {filters.subcategoria && <Chip label={`Subcategoría`} onDelete={() => handleChipDelete("subcategoria")} />}
          {filters.periodo === "RANGO" && filters.fechaInicio && filters.fechaFin && (
            <Chip label={`Rango: ${filters.fechaInicio} - ${filters.fechaFin}`} onDelete={() => handleChipDelete("fechaInicio")} />
          )}
        </Box>
        <Button variant="outlined" startIcon={<FilterListIcon />} onClick={() => setOpen(true)}>Filtros</Button>
      </Box>

      <Drawer anchor="right" open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { width: 360, p: 3 } }}>
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Filtros de ventas</Typography>
            <IconButton onClick={() => setOpen(false)}><CloseIcon /></IconButton>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Canal</InputLabel>
                <Select value={filters.canal || ""} onChange={(e) => handleChange("canal", e.target.value)}>
                  {canales.map((c) => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Período</InputLabel>
                <Select value={filters.periodo} onChange={(e) => handleChange("periodo", e.target.value)}>
                  {periodos.map((p) => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>

            {filters.periodo === "RANGO" && (
              <>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" type="date" label="Fecha inicio" InputLabelProps={{ shrink: true }} value={filters.fechaInicio || ""} onChange={(e) => setFilters({ ...filters, fechaInicio: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" type="date" label="Fecha fin" InputLabelProps={{ shrink: true }} value={filters.fechaFin || ""} onChange={(e) => setFilters({ ...filters, fechaFin: e.target.value })} />
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Buscar proveedor"
                size="small"
                value={proveedorSearchInput}
                onChange={handleProveedorSearchInputChange}
                onFocus={() => setShowProveedorSuggestions(true)}
                onBlur={() => setTimeout(() => setShowProveedorSuggestions(false), 100)}
              />
              {loadingProveedores && <Box display="flex" justifyContent="center" my={2}><CircularProgress size={24} /></Box>}
              {showProveedorSuggestions && filteredProveedores.length > 0 && (
                <Box mt={1} maxHeight={200} overflow="auto" borderRadius={1} border="1px solid #ddd">
                  {filteredProveedores.map((prov) => (
                    <Box
                      key={prov.CardCode}
                      p={1}
                      sx={{
                        cursor: 'pointer',
                        backgroundColor: filters.proveedor === prov.CardCode ? '#e3f2fd' : 'transparent',
                        '&:hover': { backgroundColor: '#f5f5f5' },
                      }}
                      onClick={() => handleProveedorSelect(prov)}
                    >
                      <Typography variant="body2" fontWeight={500}>{prov.CardName}</Typography>
                      <Typography variant="caption" color="text.secondary">{prov.CardCode}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
              {showProveedorSuggestions && !loadingProveedores && filteredProveedores.length === 0 && proveedorSearchInput.length > 0 && (
                <Box mt={1} p={1} borderRadius={1} border="1px solid #ddd" textAlign="center">
                  <Typography variant="body2" color="text.secondary">No se encontraron proveedores.</Typography>
                </Box>
              )}
            </Grid>

            {/* Primer Nivel */}
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Primer Nivel</InputLabel>
                <Select value={filters.primerNivel || ""} onChange={(e) => handleChange("primerNivel", e.target.value)}>
                  {primerNiveles.map((cat) => (
                    <MenuItem key={cat.codigo} value={cat.codigo}>
                      <ListItemIcon><Avatar src={cat.imagen} sx={{ width: 24, height: 24 }} /></ListItemIcon>
                      <ListItemText primary={cat.nombre} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Categoría */}
            {filters.primerNivel && (
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Categoría</InputLabel>
                  <Select value={filters.categoria || ""} onChange={(e) => handleChange("categoria", e.target.value)}>
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

            {/* Subcategoría */}
            {filters.categoria && (
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Subcategoría</InputLabel>
                  <Select value={filters.subcategoria || ""} onChange={(e) => handleChange("subcategoria", e.target.value)}>
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

            <Grid item xs={12} display="flex" justifyContent="space-between">
              <Button variant="outlined" onClick={handleClear}>Limpiar</Button>
              <Button variant="contained" onClick={handleApply}>Aplicar</Button>
            </Grid>
          </Grid>
        </Box>
      </Drawer>
    </Box>
  );
};

export default HeaderVentasProductosDrawer;
