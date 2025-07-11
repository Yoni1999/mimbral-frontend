// HeaderProductosDrawer.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Box, Drawer, IconButton, Typography, Divider,
  FormControl, InputLabel, Select, MenuItem, Button,
  Grid, Chip, Avatar, TextField, ListItemIcon, ListItemText,
  CircularProgress // You've already imported this, good!
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import CloseIcon from "@mui/icons-material/Close";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";

// --- INTERFACES (Moved out from within the component for clarity) ---
interface FiltroProductos {
  periodo: string;
  fechaInicio?: string | undefined;
  fechaFin?: string | undefined;
  primerNivel?: string | undefined;
  categoria?: string | undefined;
  subcategoria?: string | undefined;
  proveedor?: string | undefined;
  almacenes?: string[]; // Add almacenes to the filter interface
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
  onFilterChange: (filters: FiltroProductos) => void;
  // It's good practice to pass currentFilters down for initial state sync
  currentFilters?: FiltroProductos;
}

const HeaderProductosDrawer: React.FC<Props> = ({ onFilterChange, currentFilters }) => {
  const [openDrawer, setOpenDrawer] = useState(false);
  // Initialize filters with currentFilters if provided, otherwise default to "7D"
  // Initialize almacenes as an empty array if not provided
  const [filters, setFilters] = useState<FiltroProductos>(currentFilters || { periodo: "1M", almacenes: [] });

  const [primerNiveles, setPrimerNiveles] = useState<Categoria[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Categoria[]>([]);

  // State for all fetched suppliers
  const [allProveedores, setAllProveedores] = useState<Proveedor[]>([]);
  // State for the text in the supplier search input
  const [proveedorSearchInput, setProveedorSearchInput] = useState("");
  // State to manage loading indicator for suppliers
  const [loadingProveedores, setLoadingProveedores] = useState(false);
  // State to control visibility of supplier suggestion list
  const [showProveedorSuggestions, setShowProveedorSuggestions] = useState(false);

  const periodos = [
    { value: "7D", label: "Últimos 7 días" },
    { value: "14D", label: "Últimos 14 días" },
    { value: "1M", label: "Último mes" },
    { value: "3M", label: "Últimos 3 meses" },
    { value: "6M", label: "Últimos 6 meses" },
    { value: "1Y", label: "último año" },
    { value: "2Y", label: "Últimos 2 años" },
    { value: "RANGO", label: "Rango personalizado" },
  ];

  // Define the almacenes options with their descriptions
  const almacenesDisponibles = [
    { value: "01", label: "Centro comercial" },
    { value: "02", label: "Devoluciones" },
    { value: "03", label: "Comercio electrónico" },
    { value: "04", label: "Control de pérdida" },
    { value: "05", label: "Envíos full" },
    { value: "06", label: "Bodega fábrica" },
    { value: "07", label: "Ferretería Balmaceda" },
    { value: "08", label: "Bodega Ovalle" },
    { value: "10", label: "Reservado con abono" },
    { value: "12", label: "Producto con falla" },
    { value: "13", label: "Reservado full" },
  ];

  // Sync internal state with external filters when currentFilters changes
  useEffect(() => {
    // Ensure almacenes is an array, even if undefined in currentFilters
    setFilters(currentFilters ? { ...currentFilters, almacenes: currentFilters.almacenes || [] } : { periodo: "1M", almacenes: [] });
    // Also update the supplier search input if a supplier is already selected
    if (currentFilters?.proveedor) {
      const selectedProv = allProveedores.find(p => p.CardCode === currentFilters.proveedor);
      if (selectedProv) {
        setProveedorSearchInput(selectedProv.CardName);
      } else {
        // If the selected supplier is not in allProveedores yet, fetch it or set input to code
        setProveedorSearchInput(currentFilters.proveedor); // Fallback to code
      }
    } else {
      setProveedorSearchInput("");
    }
  }, [currentFilters, allProveedores]); // Added allProveedores to dependencies

  // Fetch Primer Nivel Categories on component mount
  useEffect(() => {
    const fetchPrimerNivel = async () => {
      try {
        const res = await fetchWithToken(`${BACKEND_URL}/api/resumen-categoria/primer-nivel`);
        const data = await res!.json();
        setPrimerNiveles(data);
      } catch (error) {
        console.error("Error fetching primer nivel categories:", error);
      }
    };
    fetchPrimerNivel();
  }, []);

  // Fetch all suppliers only once or when the drawer opens for the first time
  const fetchAllProveedores = useCallback(async () => {
    if (allProveedores.length === 0 && openDrawer) { // Only fetch if not already fetched and drawer is open
      setLoadingProveedores(true);
      try {
        const res = await fetchWithToken(`${BACKEND_URL}/api/obtenerproveedores`);
        const data = await res!.json();
        setAllProveedores(data);
      } catch (error) {
        console.error("Error fetching suppliers:", error);
      } finally {
        setLoadingProveedores(false);
      }
    }
  }, [allProveedores.length, openDrawer]);

  useEffect(() => {
    if (openDrawer) {
      fetchAllProveedores();
    }
  }, [openDrawer, fetchAllProveedores]);


  const handleChange = async (key: keyof FiltroProductos, value: string | string[]) => {
    const updated = { ...filters, [key]: value };

    if (key === "primerNivel") {
      updated.categoria = undefined; // Use undefined to explicitly clear
      updated.subcategoria = undefined; // Use undefined to explicitly clear
      try {
        const res = await fetchWithToken(`${BACKEND_URL}/api/metas/getcat?primerNivel=${value}`);
        const data = await res!.json();
        setCategorias(data.map((cat: any) => ({
          codigo: cat.codigo_categoria,
          nombre: cat.nombre_categoria,
          imagen: cat.IMAGEN,
        })));
        setSubcategorias([]);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    }

    if (key === "categoria") {
      updated.subcategoria = undefined; // Use undefined to explicitly clear
      try {
        const res = await fetchWithToken(`${BACKEND_URL}/api/metas/getsub?categoria=${value}`);
        const data = await res!.json();
        setSubcategorias(data.map((sub: any) => ({
          codigo: sub.codigo_subcategoria,
          nombre: sub.nombre_subcategoria,
          imagen: sub.IMAGEN,
        })));
      } catch (error) {
        console.error("Error fetching subcategories:", error);
      }
    }

    setFilters(updated);
  };

  const handleProveedorSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setProveedorSearchInput(value);
    setShowProveedorSuggestions(true); // Show suggestions when user types
    // If the input is cleared, clear the selected supplier filter
    if (value === "") {
      setFilters(prev => ({ ...prev, proveedor: undefined }));
    }
  };

  const handleProveedorSelect = (proveedor: Proveedor) => {
    setFilters((prev) => ({ ...prev, proveedor: proveedor.CardCode }));
    setProveedorSearchInput(proveedor.CardName); // Display name in the input
    setShowProveedorSuggestions(false); // Hide suggestions after selection
  };

  const handleChipDelete = (key: keyof FiltroProductos | "fechaRango") => {
    let updated: FiltroProductos = { ...filters };

    if (key === "periodo" || key === "primerNivel" || key === "categoria" || key === "subcategoria" || key === "proveedor") { // Use undefined for optional fields
    } else if (key === "almacenes") {
      updated.almacenes = []; // Clear the array for almacenes
    } else if (key === "fechaRango") { // Special case for date range chip
      updated.fechaInicio = undefined;
      updated.fechaFin = undefined;
    }

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

    if (key === "proveedor") {
      setProveedorSearchInput(""); // Clear the search input if supplier chip is deleted
    }

    setFilters(updated);
    onFilterChange(updated);
  };

  const handleAlmacenChipDelete = (almacenToDelete: string) => {
    const updatedAlmacenes = filters.almacenes?.filter(a => a !== almacenToDelete) || [];
    const updatedFilters = { ...filters, almacenes: updatedAlmacenes };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const handleApply = () => {
    console.log("Applying filters:", filters);
    onFilterChange(filters);
    setOpenDrawer(false);
  };

  const handleClear = () => {
    const cleared: FiltroProductos = { periodo: "1M", almacenes: [] }; // Reset to default period and empty almacenes
    setFilters(cleared);
    setProveedorSearchInput(""); // Clear supplier search input
    setCategorias([]); // Clear dependent dropdowns
    setSubcategorias([]); // Clear dependent dropdowns
    onFilterChange(cleared);
    setOpenDrawer(false); // Close the drawer after clearing
  };

  // Filter suppliers based on search input
  const filteredProveedores = allProveedores.filter(p =>
    p.CardCode.toLowerCase().includes(proveedorSearchInput.toLowerCase()) ||
    p.CardName.toLowerCase().includes(proveedorSearchInput.toLowerCase())
  );

  return (
    <Box mb={2}>
      {/* Chips + Button */}
      <Box mt={1} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
        <Box display="flex" gap={1} flexWrap="wrap">
          {filters.periodo && (
            <Chip label={`Período: ${periodos.find(p => p.value === filters.periodo)?.label}`} onDelete={() => handleChipDelete("periodo")} />
          )}
          {filters.proveedor && (
            <Chip
              label={`Proveedor: ${allProveedores.find(p => p.CardCode === filters.proveedor)?.CardName || filters.proveedor}`}
              onDelete={() => handleChipDelete("proveedor")}
            />
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
          {filters.almacenes && filters.almacenes.length > 0 && (
            // Render a chip for each selected almacen
            filters.almacenes.map(almacenCode => {
              const almacen = almacenesDisponibles.find(a => a.value === almacenCode);
              return (
                <Chip
                  key={almacenCode}
                  label={`Almacén: ${almacen?.label || almacenCode}`}
                  onDelete={() => handleAlmacenChipDelete(almacenCode)}
                />
              );
            })
          )}
          {filters.periodo === "RANGO" && filters.fechaInicio && filters.fechaFin && (
            <Chip label={`Rango: ${filters.fechaInicio} - ${filters.fechaFin}`} onDelete={() => handleChipDelete("fechaRango")} />
          )}
        </Box>
        <Button variant="outlined" startIcon={<FilterListIcon />} onClick={() => setOpenDrawer(true)}>
          Filtros
        </Button>
      </Box>

      {/* Side Drawer */}
      <Drawer
        anchor="right"
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        PaperProps={{
          sx: {
            width: 380,
            borderTopLeftRadius: 12,
            borderBottomLeftRadius: 12,
            boxShadow: 6,
            p: 3,
            backgroundColor: "#fafafa",
          },
        }}
      >
        <Box sx={{ width: 360, p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Filtros de búsqueda</Typography>
            <IconButton onClick={() => setOpenDrawer(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            {/* Period */}
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

            {/* Almacenes */}
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Almacenes</InputLabel>
                <Select
                  multiple // Allow multiple selections
                  value={filters.almacenes || []} // Ensure it's an array for multiple select
                  onChange={(e) => handleChange("almacenes", e.target.value as string[])} // Cast to string[]
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => (
                        <Chip
                          key={value}
                          label={almacenesDisponibles.find(a => a.value === value)?.label || value}
                          size="small"
                        />
                      ))}
                    </Box>
                  )}
                >
                  {almacenesDisponibles.map((almacen) => (
                    <MenuItem key={almacen.value} value={almacen.value}>
                      {almacen.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Dates if custom range */}
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

            {/* Proveedor Search */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Buscar proveedor"
                size="small"
                value={proveedorSearchInput} // Bind to proveedorSearchInput
                onChange={handleProveedorSearchInputChange}
                onFocus={() => setShowProveedorSuggestions(true)} // Show suggestions on focus
                onBlur={() => setTimeout(() => setShowProveedorSuggestions(false), 100)} // Hide after slight delay to allow click
              />
              {loadingProveedores && (
                <Box display="flex" justifyContent="center" my={2}>
                  <CircularProgress size={24} />
                </Box>
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
                      onClick={() => handleProveedorSelect(prov)} // Use the dedicated handler
                    >
                      <Typography variant="body2" fontWeight={500}>
                        {prov.CardName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {prov.CardCode}
                      </Typography>
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

            {/* Category */}
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

            {/* Subcategory */}
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

            {/* Buttons */}
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