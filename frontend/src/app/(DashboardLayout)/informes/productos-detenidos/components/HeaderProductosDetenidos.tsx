"use client";

import React, { useEffect, useState } from "react";
import {
  Box, Drawer, IconButton, Typography, Divider,
  FormControl, InputLabel, Select, MenuItem, Button,
  Grid, Chip, Avatar, TextField, ListItemIcon, ListItemText
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import CloseIcon from "@mui/icons-material/Close";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";

interface FiltroProductos {
  periodo: string;
  fechaInicio?: string;
  fechaFin?: string;
  primerNivel?: string;
  categoria?: string;
  subcategoria?: string;
}

interface Categoria {
  codigo: string;
  nombre: string;
  imagen?: string;
}

interface Props {
  onFilterChange: (filters: FiltroProductos) => void;
}

const HeaderProductosDrawer: React.FC<Props> = ({ onFilterChange }) => {
  const [openDrawer, setOpenDrawer] = useState(false);
  const [filters, setFilters] = useState<FiltroProductos>({ periodo: "7D" });

  const [primerNiveles, setPrimerNiveles] = useState<Categoria[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Categoria[]>([]);

  const periodos = [
    { value: "7D", label: "Últimos 7 días" },
    { value: "14D", label: "Últimos 14 días" },
    { value: "1M", label: "Último mes" },
    { value: "3M", label: "Últimos 3 meses" },
    { value: "6M", label: "Últimos 6 meses" },
    { value: "1Y", label: "último año"},
    { value: "2Y", label: "Últimos 2 años"},
    { value: "RANGO", label: "Rango personalizado" },
  ];

  useEffect(() => {
    const fetchPrimerNivel = async () => {
      const res = await fetchWithToken(`${BACKEND_URL}/api/resumen-categoria/primer-nivel`);
      const data = await res!.json();
      setPrimerNiveles(data);
    };
    fetchPrimerNivel();
  }, []);

  const handleChange = async (key: keyof FiltroProductos, value: string) => {
    const updated = { ...filters, [key]: value };

    if (key === "primerNivel") {
      updated.categoria = "";
      updated.subcategoria = "";
      const res = await fetchWithToken(`${BACKEND_URL}/api/metas/getcat?primerNivel=${value}`);
      const data = await res!.json();
      setCategorias(data.map((cat: any) => ({
        codigo: cat.codigo_categoria,
        nombre: cat.nombre_categoria,
        imagen: cat.IMAGEN,
      })));
      setSubcategorias([]);
    }

    if (key === "categoria") {
      updated.subcategoria = "";
      const res = await fetchWithToken(`${BACKEND_URL}/api/metas/getsub?categoria=${value}`);
      const data = await res!.json();
      setSubcategorias(data.map((sub: any) => ({
        codigo: sub.codigo_subcategoria,
        nombre: sub.nombre_subcategoria,
        imagen: sub.IMAGEN,
      })));
    }

    setFilters(updated);
  };

  const handleChipDelete = (key: keyof FiltroProductos) => {
    const updated = { ...filters, [key]: "" };

    if (key === "primerNivel") {
      updated.categoria = "";
      updated.subcategoria = "";
      setCategorias([]);
      setSubcategorias([]);
    }

    if (key === "categoria") {
      updated.subcategoria = "";
      setSubcategorias([]);
    }

    setFilters(updated);
    onFilterChange(updated);
  };

  const handleApply = () => {
    onFilterChange(filters);
    setOpenDrawer(false);
  };

  const handleClear = () => {
    const cleared: FiltroProductos = { periodo: "7D" };
    setFilters(cleared);
    onFilterChange(cleared);
  };

  return (
    <Box mb={2}>
      {/* Chips + Botón */}
      <Box mt={1} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
        <Box display="flex" gap={1} flexWrap="wrap">
          {filters.periodo && (
            <Chip label={`Período: ${periodos.find(p => p.value === filters.periodo)?.label}`} onDelete={() => handleChipDelete("periodo")} />
          )}
          {filters.primerNivel && (
            <Chip label={`Primer Nivel: ${primerNiveles.find(p => p.codigo === filters.primerNivel)?.nombre}`} onDelete={() => handleChipDelete("primerNivel")} />
          )}
          {filters.categoria && (
            <Chip label={`Categoría: ${categorias.find(p => p.codigo === filters.categoria)?.nombre}`} onDelete={() => handleChipDelete("categoria")} />
          )}
          {filters.subcategoria && (
            <Chip label={`Subcategoría: ${subcategorias.find(p => p.codigo === filters.subcategoria)?.nombre}`} onDelete={() => handleChipDelete("subcategoria")} />
          )}
        </Box>
        <Button variant="outlined" startIcon={<FilterListIcon />} onClick={() => setOpenDrawer(true)}>
          Filtros
        </Button>
      </Box>

      {/* Drawer lateral */}
      <Drawer anchor="right" open={openDrawer} onClose={() => setOpenDrawer(false)}>
        <Box sx={{ width: 360, p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Filtros de búsqueda</Typography>
            <IconButton onClick={() => setOpenDrawer(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            {/* Periodo */}
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Período</InputLabel>
                <Select
                  value={filters.periodo}
                  onChange={(e) => handleChange("periodo", e.target.value)}
                >
                  {periodos.map((p) => (
                    <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Fechas si es personalizado */}
            {filters.periodo === "RANGO" && (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Fecha inicio"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    value={filters.fechaInicio || ""}
                    onChange={(e) => setFilters({ ...filters, fechaInicio: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Fecha fin"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    value={filters.fechaFin || ""}
                    onChange={(e) => setFilters({ ...filters, fechaFin: e.target.value })}
                  />
                </Grid>
              </>
            )}

            {/* Primer Nivel */}
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Primer Nivel</InputLabel>
                <Select
                  value={filters.primerNivel || ""}
                  onChange={(e) => handleChange("primerNivel", e.target.value)}
                  renderValue={(selected) => {
                    const selectedCat = primerNiveles.find((cat) => cat.codigo === selected);
                    return (
                      <Box display="flex" alignItems="center" gap={1}>
                        {selectedCat?.imagen && <Avatar src={selectedCat.imagen} sx={{ width: 24, height: 24 }} />}
                        {selectedCat?.nombre || selected}
                      </Box>
                    );
                  }}
                >
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
                  <Select
                    value={filters.categoria || ""}
                    onChange={(e) => handleChange("categoria", e.target.value)}
                    renderValue={(selected) => {
                      const cat = categorias.find(c => c.codigo === selected);
                      return (
                        <Box display="flex" alignItems="center" gap={1}>
                          {cat?.imagen && <Avatar src={cat.imagen} sx={{ width: 24, height: 24 }} />}
                          {cat?.nombre || selected}
                        </Box>
                      );
                    }}
                  >
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
                  <Select
                    value={filters.subcategoria || ""}
                    onChange={(e) => handleChange("subcategoria", e.target.value)}
                    renderValue={(selected) => {
                      const sub = subcategorias.find(c => c.codigo === selected);
                      return (
                        <Box display="flex" alignItems="center" gap={1}>
                          {sub?.imagen && <Avatar src={sub.imagen} sx={{ width: 24, height: 24 }} />}
                          {sub?.nombre || selected}
                        </Box>
                      );
                    }}
                  >
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

            {/* Botones */}
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

export default HeaderProductosDrawer;
