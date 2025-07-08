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
  // CAMBIO 1: Renombrar a 'tipoEnvio' y usar literales de string en minúscula
  tipoEnvio?: 'full' | 'colecta' | 'todas';
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
  { value: "", label: "Todos" },
  { value: "Chorrillo", label: "Chorrillos" },
  { value: "Meli", label: "Mercado Libre" },
  { value: "Vitex", label: "Vtex" },
  { value: "Empresas", label: "Empresas" },
  { value: "Balmaceda", label: "Balmaceda" },
  { value: "Falabella", label: "Falabella" },
];

const periodos = [
  { value: "1D", label: "Hoy" },
  { value: "7D", label: "Últimos 7 días" },
  { value: "14D", label: "Últimos 14 días" },
  { value: "1M", label: "Último mes" },
  { value: "3M", label: "Últimos 3 meses" },
  { value: "6M", label: "Últimos 6 meses" },
  { value: "RANGO", label: "Rango personalizado" },
];

// CAMBIO 2: Opciones para el nuevo selector de tipo de envío con valores en minúsculas
const tiposEnvioMeli = [
    { value: "todas", label: "Todas" }, // Cambiado a minúscula
    { value: "full", label: "Full" },   // Cambiado a minúscula
    { value: "colecta", label: "Colecta" }, // Cambiado a minúscula
];

const HeaderVentasProductosDrawer: React.FC<Props> = ({ onFilterChange, currentFilters }) => {
  const [open, setOpen] = useState(false);
  // Inicializa tipoEnvio a 'todas' por defecto cuando el canal es Meli o si no hay un filtro actual
  const [filters, setFilters] = useState<FiltroVentas>(() => {
    const initialFilters = currentFilters || { periodo: "7D" };
    // Asegurarse de que tipoEnvio se inicialice a 'todas' si el canal es Meli
    // CAMBIO 3: Usar 'tipoEnvio' en lugar de 'tipoEnvioMeli' y 'todas' en minúscula
    if (initialFilters.canal === "Meli" && !initialFilters.tipoEnvio) {
      return { ...initialFilters, tipoEnvio: "todas" };
    }
    return initialFilters;
  });

  const [primerNiveles, setPrimerNiveles] = useState<Categoria[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Categoria[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [proveedorSearchInput, setProveedorSearchInput] = useState("");
  const [loadingProveedores, setLoadingProveedores] = useState(false);
  const [showProveedorSuggestions, setShowProveedorSuggestions] = useState(false);

  // Fetch PrimerNivel and Proveedores data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoadingProveedores(true); // Set loading true for proveedores
      try {
        const [primerNivelData, proveedoresData] = await Promise.all([
          fetchWithToken(`${BACKEND_URL}/api/resumen-categoria/primer-nivel`).then(res => res!.json()),
          fetchWithToken(`${BACKEND_URL}/api/obtenerproveedores`).then(res => res!.json())
        ]);
        setPrimerNiveles(primerNivelData);
        setProveedores(proveedoresData);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setLoadingProveedores(false); // Set loading false for proveedores
      }
    };

    fetchData();
  }, []);

  // Effect para cargar categorías y subcategorías si los filtros iniciales ya las tienen
  useEffect(() => {
    if (filters.primerNivel && categorias.length === 0) {
      fetchCategorias(filters.primerNivel);
    }
    if (filters.categoria && subcategorias.length === 0) {
      fetchSubcategorias(filters.categoria);
    }
    // Set proveedor search input if currentFilters has a supplier
    if (currentFilters?.proveedor && proveedores.length > 0) {
      const selectedProv = proveedores.find(p => p.CardCode === currentFilters.proveedor);
      if (selectedProv) {
        setProveedorSearchInput(selectedProv.CardName);
      }
    }
  }, [filters.primerNivel, filters.categoria, currentFilters, proveedores]); // Dependencias para re-ejecutar


  const handleChange = async (key: keyof FiltroVentas, value: string) => {
    let updatedFilters: FiltroVentas = { ...filters, [key]: value };

    // Lógica para el nuevo filtro de tipo de envío
    if (key === "canal") {
      if (value === "Meli") {
        // Si se selecciona Mercado Libre, asegúrate de que tipoEnvio esté en 'todas' por defecto
        // CAMBIO 4: Usar 'tipoEnvio' en lugar de 'tipoEnvioMeli' y 'todas' en minúscula
        updatedFilters.tipoEnvio = updatedFilters.tipoEnvio || "todas";
      } else {
        // Si no es Mercado Libre, elimina el filtro de tipo de envío
        // CAMBIO 5: Eliminar 'tipoEnvio'
        delete updatedFilters.tipoEnvio;
      }
    }

    // Reset dependent filters
    if (key === "primerNivel") {
      updatedFilters.categoria = undefined;
      updatedFilters.subcategoria = undefined;
      if (value) { // Only fetch if a primerNivel is selected
        await fetchCategorias(value);
      } else {
        setCategorias([]);
      }
      setSubcategorias([]);
    }

    if (key === "categoria") {
      updatedFilters.subcategoria = undefined;
      if (value) { // Only fetch if a categoria is selected
        await fetchSubcategorias(value);
      } else {
        setSubcategorias([]);
      }
    }

    setFilters(updatedFilters);
  };

  const fetchCategorias = async (primerNivel: string) => {
    try {
      const res = await fetchWithToken(`${BACKEND_URL}/api/metas/getcat?primerNivel=${primerNivel}`);
      const data = await res!.json();
      setCategorias(data.map((cat: any) => ({ codigo: cat.codigo_categoria, nombre: cat.nombre_categoria, imagen: cat.IMAGEN })));
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategorias([]);
    }
  };

  const fetchSubcategorias = async (categoria: string) => {
    try {
      const res = await fetchWithToken(`${BACKEND_URL}/api/metas/getsub?categoria=${categoria}`);
      const data = await res!.json();
      setSubcategorias(data.map((sub: any) => ({ codigo: sub.codigo_subcategoria, nombre: sub.nombre_subcategoria, imagen: sub.IMAGEN })));
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      setSubcategorias([]);
    }
  };

  const handleProveedorSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setProveedorSearchInput(value);
    setShowProveedorSuggestions(true);
    if (value === "") {
      setFilters(prev => ({ ...prev, proveedor: undefined }));
    }
  };

  const handleProveedorSelect = (proveedor: Proveedor) => {
    setFilters((prev) => ({ ...prev, proveedor: proveedor.CardCode }));
    setProveedorSearchInput(proveedor.CardName);
    setShowProveedorSuggestions(false);
  };

  const handleApply = () => {
    console.log("Filtros aplicados:", filters);
    onFilterChange(filters);
    setOpen(false);
  };

  const handleClear = () => {
    const cleared: FiltroVentas = { periodo: "7D" };
    setFilters(cleared);
    setProveedorSearchInput("");
    setCategorias([]);
    setSubcategorias([]);
    onFilterChange(cleared);
    setOpen(false);
  };

  const handleChipDelete = (key: keyof FiltroVentas) => {
    let updated: FiltroVentas = { ...filters };

    if (key === "canal") {
      updated.canal = undefined;
      // Si se elimina el filtro de canal, también se debe eliminar tipoEnvio
      // CAMBIO 6: Eliminar 'tipoEnvio'
      delete updated.tipoEnvio;
    } else if (key === "periodo") {
        updated.periodo = "7D"; // Restablecer al valor por defecto
        updated.fechaInicio = undefined;
        updated.fechaFin = undefined;
    } else if (key === "proveedor") {
        updated.proveedor = undefined;
        setProveedorSearchInput(""); // También limpiar el input del buscador
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
    } else if (key === "tipoEnvio") { // CAMBIO 7: Nuevo caso para 'tipoEnvio'
        delete updated.tipoEnvio;
    } else if (key === "fechaInicio" || key === "fechaFin") {
        // Cuando se borra el chip de rango, el periodo vuelve a 7D
        updated.periodo = "7D";
        updated.fechaInicio = undefined;
        updated.fechaFin = undefined;
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
          {filters.canal && (
            <Chip
                label={`Canal: ${canales.find(c => c.value === filters.canal)?.label}`}
                onDelete={() => handleChipDelete("canal")}
            />
          )}
          {filters.tipoEnvio && filters.canal === "Meli" && ( // Mostrar chip solo si canal es Meli
            <Chip
                label={`Envío Meli: ${tiposEnvioMeli.find(t => t.value === filters.tipoEnvio)?.label}`} // CAMBIO 8: Usar 'tipoEnvio'
                onDelete={() => handleChipDelete("tipoEnvio")} // CAMBIO 9: Usar 'tipoEnvio'
            />
          )}
          {filters.periodo && filters.periodo !== "RANGO" && (
            <Chip
                label={`Período: ${periodos.find(p => p.value === filters.periodo)?.label}`}
                onDelete={() => handleChipDelete("periodo")}
            />
          )}
          {filters.proveedor && (
            <Chip
                label={`Proveedor: ${proveedores.find(p => p.CardCode === filters.proveedor)?.CardName || filters.proveedor}`}
                onDelete={() => handleChipDelete("proveedor")}
            />
          )}
          {filters.primerNivel && (
            <Chip
                label={`Primer Nivel: ${primerNiveles.find(pn => pn.codigo === filters.primerNivel)?.nombre || filters.primerNivel}`}
                onDelete={() => handleChipDelete("primerNivel")}
            />
          )}
          {filters.categoria && (
            <Chip
                label={`Categoría: ${categorias.find(c => c.codigo === filters.categoria)?.nombre || filters.categoria}`}
                onDelete={() => handleChipDelete("categoria")}
            />
          )}
          {filters.subcategoria && (
            <Chip
                label={`Subcategoría: ${subcategorias.find(sc => sc.codigo === filters.subcategoria)?.nombre || filters.subcategoria}`}
                onDelete={() => handleChipDelete("subcategoria")}
            />
          )}
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

            {/* Nuevo selector de Tipo de Envío para Mercado Libre */}
            {filters.canal === "Meli" && (
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo de Envío Meli</InputLabel>
                  <Select
                    value={filters.tipoEnvio || "todas"} // CAMBIO 10: Usar 'tipoEnvio' y 'todas' en minúscula
                    onChange={(e) => handleChange("tipoEnvio", e.target.value as 'full' | 'colecta' | 'todas')} // CAMBIO 11: Usar 'tipoEnvio' y los literales de string en minúscula
                  >
                    {tiposEnvioMeli.map((tipo) => (
                      <MenuItem key={tipo.value} value={tipo.value}>{tipo.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

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
                // Usa onBlur para ocultar las sugerencias después de un pequeño retraso
                // Esto permite que el evento onClick del MenuItem se dispare antes de que se oculte la lista
                onBlur={() => setTimeout(() => setShowProveedorSuggestions(false), 200)}
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
                  <MenuItem value="">Todos</MenuItem> {/* Opción "Todos" */}
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
                    <MenuItem value="">Todas</MenuItem> {/* Opción "Todas" */}
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
                    <MenuItem value="">Todas</MenuItem> {/* Opción "Todas" */}
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