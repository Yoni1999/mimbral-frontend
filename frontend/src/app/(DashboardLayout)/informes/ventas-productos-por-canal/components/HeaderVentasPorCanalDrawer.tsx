"use client";

import React, { useEffect, useState } from "react";
import {
  Box, Drawer, IconButton, Typography, Divider,
  FormControl, InputLabel, Select, MenuItem, Button,
  Grid, TextField, Avatar, ListItemIcon, ListItemText,
  Chip, CircularProgress
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import CloseIcon from "@mui/icons-material/Close";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";

export interface FiltrosPorCanal {
  periodo?: "1d" | "7d" | "14d" | "1m" | "3m" | "6m" | "RANGO";
  fechaInicio?: string;
  fechaFin?: string;
  proveedor?: string;     // CardCode (desde buscador)
  primerNivel?: string;   // código
  categoria?: string;     // código
  subcategoria?: string;  // código
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
  onFilterChange: (filters: FiltrosPorCanal) => void;
  currentFilters?: FiltrosPorCanal;
}

const periodos = [
  { value: "1d", label: "Hoy" },
  { value: "7d", label: "Últimos 7 días" },
  { value: "14d", label: "Últimos 14 días" },
  { value: "1m", label: "Último mes" },
  { value: "3m", label: "Últimos 3 meses" },
  { value: "6m", label: "Últimos 6 meses" },
  { value: "RANGO", label: "Rango personalizado" },
];

const HeaderVentasPorCanalDrawer: React.FC<Props> = ({ onFilterChange, currentFilters }) => {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<FiltrosPorCanal>(currentFilters || { periodo: "7d" });

  const [primerNiveles, setPrimerNiveles] = useState<Categoria[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Categoria[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);

  // === Buscador de proveedor (como en el informe original) ===
  const [proveedorSearchInput, setProveedorSearchInput] = useState("");
  const [loadingProveedores, setLoadingProveedores] = useState(false);
  const [showProveedorSuggestions, setShowProveedorSuggestions] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingProveedores(true);
        const [pn, prov] = await Promise.all([
          fetchWithToken(`${BACKEND_URL}/api/resumen-categoria/primer-nivel`).then(res => res!.json()),
          fetchWithToken(`${BACKEND_URL}/api/obtenerproveedores`).then(res => res!.json()),
        ]);
        setPrimerNiveles(pn || []);
        setProveedores(prov || []);

        // Prefill del input si venía un proveedor en filtros actuales
        if (currentFilters?.proveedor && Array.isArray(prov)) {
          const sel = prov.find((p: Proveedor) => p.CardCode === currentFilters.proveedor);
          if (sel) setProveedorSearchInput(sel.CardName);
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setLoadingProveedores(false);
      }
    };
    fetchData();
  }, [currentFilters]);

  const fetchCategorias = async (primerNivel: string) => {
    try {
      const res = await fetchWithToken(`${BACKEND_URL}/api/metas/getcat?primerNivel=${primerNivel}`);
      const data = await res!.json();
      setCategorias((data || []).map((cat: any) => ({
        codigo: cat.codigo_categoria, nombre: cat.nombre_categoria, imagen: cat.IMAGEN
      })));
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategorias([]);
    }
  };

  const fetchSubcategorias = async (categoria: string) => {
    try {
      const res = await fetchWithToken(`${BACKEND_URL}/api/metas/getsub?categoria=${categoria}`);
      const data = await res!.json();
      setSubcategorias((data || []).map((sub: any) => ({
        codigo: sub.codigo_subcategoria, nombre: sub.nombre_subcategoria, imagen: sub.IMAGEN
      })));
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      setSubcategorias([]);
    }
  };

  // === Cascada ===
  useEffect(() => {
    if (filters.primerNivel) fetchCategorias(filters.primerNivel);
    setFilters((prev) => ({ ...prev, categoria: undefined, subcategoria: undefined }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.primerNivel]);

  useEffect(() => {
    if (filters.categoria) {
      fetchSubcategorias(filters.categoria);
    } else {
      setSubcategorias([]);
    }
    setFilters((prev) => ({ ...prev, subcategoria: undefined }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.categoria]);

  // === Chips: quitar filtros desde la “píldora” ===
  const handleChipDelete = (key: keyof FiltrosPorCanal) => {
    const updated: FiltrosPorCanal = { ...filters };
    if (key === "periodo") {
      updated.periodo = "7d";
      updated.fechaInicio = undefined;
      updated.fechaFin = undefined;
    } else if (key === "proveedor") {
      updated.proveedor = undefined;
      setProveedorSearchInput("");
    } else if (key === "primerNivel") {
      updated.primerNivel = undefined;
      updated.categoria = undefined;
      updated.subcategoria = undefined;
      setCategorias([]);
      setSubcategorias([]);
    } else if (key === "categoria") {
      updated.categoria = undefined;
      updated.subcategoria = undefined;
      setSubcategorias([]);
    } else if (key === "subcategoria") {
      updated.subcategoria = undefined;
    } else if (key === "fechaInicio" || key === "fechaFin") {
      updated.periodo = "7d";
      updated.fechaInicio = undefined;
      updated.fechaFin = undefined;
    }
    setFilters(updated);
    onFilterChange(updated);
  };

  // === Buscador de proveedor ===
  const handleProveedorSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setProveedorSearchInput(value);
    setShowProveedorSuggestions(true);
    if (value === "") {
      setFilters(prev => ({ ...prev, proveedor: undefined }));
    }
  };

  const handleProveedorSelect = (prov: Proveedor) => {
    setFilters(prev => ({ ...prev, proveedor: prov.CardCode }));
    setProveedorSearchInput(prov.CardName);
    setShowProveedorSuggestions(false);
  };

  const filteredProveedores = proveedores.filter(p =>
    p.CardCode.toLowerCase().includes(proveedorSearchInput.toLowerCase()) ||
    p.CardName.toLowerCase().includes(proveedorSearchInput.toLowerCase())
  );

  const handleApply = () => {
    onFilterChange(filters);
    setOpen(false);
  };

  const handleClear = () => {
    const cleared: FiltrosPorCanal = { periodo: "7d" };
    setFilters(cleared);
    setProveedorSearchInput("");
    setCategorias([]);
    setSubcategorias([]);
    onFilterChange(cleared);
    setOpen(false);
  };

  return (
    <Box mb={2}>
      {/* Chips visibles (con onDelete) */}
      <Box mt={1} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
        <Box display="flex" gap={1} flexWrap="wrap">
          {filters.periodo && filters.periodo !== "RANGO" && (
            <Chip label={`Período: ${periodos.find(p => p.value === filters.periodo)?.label}`} onDelete={() => handleChipDelete("periodo")} />
          )}
          {filters.periodo === "RANGO" && filters.fechaInicio && filters.fechaFin && (
            <Chip label={`Rango: ${filters.fechaInicio} - ${filters.fechaFin}`} onDelete={() => handleChipDelete("fechaInicio")} />
          )}
          {filters.proveedor && (
            <Chip label={`Proveedor: ${filters.proveedor}`} onDelete={() => handleChipDelete("proveedor")} />
          )}
          {filters.primerNivel && (
            <Chip label={`Primer Nivel: ${filters.primerNivel}`} onDelete={() => handleChipDelete("primerNivel")} />
          )}
          {filters.categoria && (
            <Chip label={`Categoría: ${filters.categoria}`} onDelete={() => handleChipDelete("categoria")} />
          )}
          {filters.subcategoria && (
            <Chip label={`Subcategoría: ${filters.subcategoria}`} onDelete={() => handleChipDelete("subcategoria")} />
          )}
        </Box>
        <Button variant="outlined" startIcon={<FilterListIcon />} onClick={() => setOpen(true)}>
          Filtros
        </Button>
      </Box>

      <Drawer anchor="right" open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { width: 360, p: 3 } }}>
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Filtros</Typography>
            <IconButton onClick={() => setOpen(false)}><CloseIcon /></IconButton>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Período</InputLabel>
                <Select
                  value={filters.periodo || "7d"}
                  onChange={(e) => setFilters({ ...filters, periodo: e.target.value as FiltrosPorCanal["periodo"] })}
                >
                  {periodos.map((p) => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>

            {filters.periodo === "RANGO" && (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth size="small" type="date" label="Fecha inicio" InputLabelProps={{ shrink: true }}
                    value={filters.fechaInicio || ""} onChange={(e) => setFilters({ ...filters, fechaInicio: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth size="small" type="date" label="Fecha fin" InputLabelProps={{ shrink: true }}
                    value={filters.fechaFin || ""} onChange={(e) => setFilters({ ...filters, fechaFin: e.target.value })}
                  />
                </Grid>
              </>
            )}

            {/* === Buscador de proveedor === */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Buscar proveedor"
                size="small"
                value={proveedorSearchInput}
                onChange={handleProveedorSearchInputChange}
                onFocus={() => setShowProveedorSuggestions(true)}
                onBlur={() => setTimeout(() => setShowProveedorSuggestions(false), 200)} // permite click en la sugerencia
              />
              {loadingProveedores && (
                <Box display="flex" justifyContent="center" my={2}><CircularProgress size={24} /></Box>
              )}
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
                <Select
                  value={filters.primerNivel || ""}
                  onChange={(e) => setFilters({ ...filters, primerNivel: e.target.value || undefined })}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {primerNiveles.map((pn) => (
                    <MenuItem key={pn.codigo} value={pn.codigo}>
                      <ListItemIcon><Avatar src={pn.imagen} sx={{ width: 24, height: 24 }} /></ListItemIcon>
                      <ListItemText primary={pn.nombre} />
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
                  <Select
                    value={filters.categoria || ""}
                    onChange={(e) => setFilters({ ...filters, categoria: e.target.value || undefined })}
                  >
                    <MenuItem value="">Todas</MenuItem>
                    {categorias.map((c) => (
                      <MenuItem key={c.codigo} value={c.codigo}>
                        <ListItemIcon><Avatar src={c.imagen} sx={{ width: 24, height: 24 }} /></ListItemIcon>
                        <ListItemText primary={c.nombre} />
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
                  <Select
                    value={filters.subcategoria || ""}
                    onChange={(e) => setFilters({ ...filters, subcategoria: e.target.value || undefined })}
                  >
                    <MenuItem value="">Todas</MenuItem>
                    {subcategorias.map((s) => (
                      <MenuItem key={s.codigo} value={s.codigo}>
                        <ListItemIcon><Avatar src={s.imagen} sx={{ width: 24, height: 24 }} /></ListItemIcon>
                        <ListItemText primary={s.nombre} />
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

export default HeaderVentasPorCanalDrawer;
