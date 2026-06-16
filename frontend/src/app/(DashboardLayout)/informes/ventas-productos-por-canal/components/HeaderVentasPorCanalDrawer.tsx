"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Popover,
  IconButton,
  Typography,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  TextField,
  Avatar,
  ListItemIcon,
  ListItemText,
  Chip,
  CircularProgress,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import CloseIcon from "@mui/icons-material/Close";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import { apiJson } from "@/utils/apiClient";
import { BACKEND_URL } from "@/config";
import DateRangeFilter, { DateRangeValue } from "../../../utilities/ventas/components/DateRangeFilter";
import SubmitOnEnter from "../../../components/SubmitOnEnter";

export interface FiltrosPorCanal {
  periodo?: "1d" | "7d" | "14d" | "1m" | "3m" | "6m" | "RANGO";
  fechaInicio?: string;
  fechaFin?: string;
  sku?: string;
  familia?: string;
  subfamilia?: string;
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
  onFilterChange: (filters: FiltrosPorCanal) => void;
  currentFilters?: FiltrosPorCanal;
}

const chipPrimarySx = {
  borderRadius: 999,
  backgroundColor: "#eef3ff",
  color: "#274690",
  fontWeight: 700,
} as const;

const chipNeutralSx = {
  borderRadius: 999,
  backgroundColor: "#f6f8fc",
  color: "#40506c",
} as const;

const textFieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2.5,
    backgroundColor: "#fff",
    minHeight: 46,
    "& fieldset": {
      borderColor: "#d7e0f0",
    },
    "&:hover fieldset": {
      borderColor: "#9bb0da",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#4c6edb",
    },
  },
  "& .MuiInputLabel-root": {
    color: "#5b6b87",
    fontWeight: 600,
  },
} as const;

const selectSx = {
  borderRadius: 2.5,
  backgroundColor: "#fff",
  minHeight: 46,
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "#d7e0f0",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "#9bb0da",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#4c6edb",
  },
} as const;

const cardPanelSx = {
  p: 2,
  borderRadius: 3,
  background: "linear-gradient(180deg, #ffffff 0%, #fbfcff 100%)",
  border: "1px solid #e1e8f6",
  height: "100%",
} as const;

const sectionLabelSx = {
  mb: 1.5,
  fontSize: "0.78rem",
  fontWeight: 800,
  letterSpacing: "0.04em",
  color: "#5b6b87",
  textTransform: "uppercase",
} as const;

const HeaderVentasPorCanalDrawer: React.FC<Props> = ({
  onFilterChange,
  currentFilters,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [filters, setFilters] = useState<FiltrosPorCanal>(
    currentFilters || { periodo: "7d" }
  );
  const [fechaRange, setFechaRange] = useState<DateRangeValue | null>(
    currentFilters?.fechaInicio && currentFilters?.fechaFin
      ? { start: currentFilters.fechaInicio, end: currentFilters.fechaFin }
      : null
  );

  const [primerNiveles, setPrimerNiveles] = useState<Categoria[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Categoria[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);

  const [proveedorSearchInput, setProveedorSearchInput] = useState("");
  const [loadingProveedores, setLoadingProveedores] = useState(false);
  const [showProveedorSuggestions, setShowProveedorSuggestions] =
    useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingProveedores(true);
        const [pn, prov] = await Promise.all([
          apiJson(`${BACKEND_URL}/api/resumen-categoria/primer-nivel`).then(
            (res) => res!.json()
          ),
          apiJson(`${BACKEND_URL}/api/obtenerproveedores`).then((res) =>
            res!.json()
          ),
        ]);

        setPrimerNiveles(pn || []);
        setProveedores(prov || []);

        if (currentFilters?.proveedor && Array.isArray(prov)) {
          const selected = prov.find(
            (p: Proveedor) => p.CardCode === currentFilters.proveedor
          );
          if (selected) setProveedorSearchInput(selected.CardName);
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
      const res = await apiJson(
        `${BACKEND_URL}/api/metas/getcat?primerNivel=${primerNivel}`
      );
      const data = await res!.json();
      setCategorias(
        (data || []).map((cat: any) => ({
          codigo: cat.codigo_categoria,
          nombre: cat.nombre_categoria,
          imagen: cat.IMAGEN,
        }))
      );
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategorias([]);
    }
  };

  const fetchSubcategorias = async (categoria: string) => {
    try {
      const res = await apiJson(
        `${BACKEND_URL}/api/metas/getsub?categoria=${categoria}`
      );
      const data = await res!.json();
      setSubcategorias(
        (data || []).map((sub: any) => ({
          codigo: sub.codigo_subcategoria,
          nombre: sub.nombre_subcategoria,
          imagen: sub.IMAGEN,
        }))
      );
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      setSubcategorias([]);
    }
  };

  useEffect(() => {
    if (filters.primerNivel) fetchCategorias(filters.primerNivel);
    setFilters((prev) => ({ ...prev, categoria: undefined, subcategoria: undefined }));
  }, [filters.primerNivel]);

  useEffect(() => {
    if (filters.categoria) {
      fetchSubcategorias(filters.categoria);
    } else {
      setSubcategorias([]);
    }
    setFilters((prev) => ({ ...prev, subcategoria: undefined }));
  }, [filters.categoria]);

  const handleChipDelete = (key: keyof FiltrosPorCanal) => {
    const updated: FiltrosPorCanal = { ...filters };

    if (key === "proveedor") {
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
      updated.fechaInicio = undefined;
      updated.fechaFin = undefined;
      updated.periodo = undefined;
      setFechaRange(null);
    } else if (key === "sku") {
      updated.sku = undefined;
    } else if (key === "familia") {
      updated.familia = undefined;
    } else if (key === "subfamilia") {
      updated.subfamilia = undefined;
    }

    setFilters(updated);
    onFilterChange(updated);
  };

  const handleProveedorSearchInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setProveedorSearchInput(value);
    setShowProveedorSuggestions(true);
    if (value === "") {
      setFilters((prev) => ({ ...prev, proveedor: undefined }));
    }
  };

  const handleProveedorSelect = (prov: Proveedor) => {
    setFilters((prev) => ({ ...prev, proveedor: prov.CardCode }));
    setProveedorSearchInput(prov.CardName);
    setShowProveedorSuggestions(false);
  };

  const filteredProveedores = proveedores.filter(
    (p) =>
      p.CardCode.toLowerCase().includes(proveedorSearchInput.toLowerCase()) ||
      p.CardName.toLowerCase().includes(proveedorSearchInput.toLowerCase())
  );

  const handleApply = () => {
    const updated: FiltrosPorCanal = {
      ...filters,
      periodo: fechaRange ? "RANGO" : undefined,
      fechaInicio: fechaRange?.start || undefined,
      fechaFin: fechaRange?.end || undefined,
    };

    setFilters(updated);
    onFilterChange(updated);
    setAnchorEl(null);
  };

  const handleClear = () => {
    const cleared: FiltrosPorCanal = {};
    setFilters(cleared);
    setFechaRange(null);
    setProveedorSearchInput("");
    setCategorias([]);
    setSubcategorias([]);
    onFilterChange(cleared);
    setAnchorEl(null);
  };

  const handleDateRangeChange = (value: DateRangeValue | null) => {
    setFechaRange(value);
    if (value) {
      setFilters((prev) => ({
        ...prev,
        periodo: "RANGO",
        fechaInicio: value.start,
        fechaFin: value.end,
      }));
    }
  };

  return (
    <Box mb={2}>
      <Box
        mt={1}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={1.5}
      >
        <Box display="flex" gap={1} flexWrap="wrap">
          {filters.fechaInicio && filters.fechaFin && (
            <Chip
              label={`Rango: ${filters.fechaInicio} - ${filters.fechaFin}`}
              onDelete={() => handleChipDelete("fechaInicio")}
              sx={chipPrimarySx}
            />
          )}
          {filters.sku && (
            <Chip
              label={`Producto: ${filters.sku}`}
              onDelete={() => handleChipDelete("sku")}
              sx={chipPrimarySx}
            />
          )}
          {filters.familia && (
            <Chip
              label={`Familia: ${filters.familia}`}
              onDelete={() => handleChipDelete("familia")}
              sx={chipNeutralSx}
            />
          )}
          {filters.subfamilia && (
            <Chip
              label={`Subfamilia: ${filters.subfamilia}`}
              onDelete={() => handleChipDelete("subfamilia")}
              sx={chipNeutralSx}
            />
          )}
          {filters.proveedor && (
            <Chip
              label={`Proveedor: ${filters.proveedor}`}
              onDelete={() => handleChipDelete("proveedor")}
              sx={chipNeutralSx}
            />
          )}
          {filters.primerNivel && (
            <Chip
              label={`Primer Nivel: ${filters.primerNivel}`}
              onDelete={() => handleChipDelete("primerNivel")}
              sx={chipNeutralSx}
            />
          )}
          {filters.categoria && (
            <Chip
              label={`Categoría: ${filters.categoria}`}
              onDelete={() => handleChipDelete("categoria")}
              sx={chipNeutralSx}
            />
          )}
          {filters.subcategoria && (
            <Chip
              label={`Subcategoría: ${filters.subcategoria}`}
              onDelete={() => handleChipDelete("subcategoria")}
              sx={chipNeutralSx}
            />
          )}
        </Box>

        <Button
          variant="outlined"
          startIcon={<TuneRoundedIcon />}
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            borderRadius: 2.5,
            px: 2.2,
            py: 1.1,
            textTransform: "none",
            fontWeight: 700,
            color: "#294273",
            borderColor: "#b7c7e8",
            background: "linear-gradient(180deg, #ffffff 0%, #f7faff 100%)",
            "&:hover": {
              borderColor: "#89a6df",
              background: "#f5f8ff",
            },
          }}
        >
          Filtros
        </Button>
      </Box>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{
          sx: {
            mt: 1,
            p: 0,
            width: { xs: "calc(100vw - 24px)", sm: 700 },
            maxWidth: "100%",
            borderRadius: 4,
            overflow: "hidden",
            border: "1px solid #dfe7f6",
            boxShadow: "0 28px 70px rgba(25, 44, 86, 0.16)",
          },
        }}
      >
        <Box
          sx={{
            px: 3,
            py: 2.2,
            background: "linear-gradient(135deg, #f8fbff 0%, #eef3ff 100%)",
            borderBottom: "1px solid #e1e8f6",
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1.25}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 2.5,
                  display: "grid",
                  placeItems: "center",
                  backgroundColor: "#dfe9ff",
                  color: "#294273",
                }}
              >
                <FilterListIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: "#22324f" }}>
                  Filtros
                </Typography>
                <Typography variant="body2" sx={{ color: "#667792" }}>
                  Refina productos, fechas y categorías del informe.
                </Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={() => setAnchorEl(null)} sx={{ color: "#50627f" }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <SubmitOnEnter onSubmit={handleApply}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={2.2}>
            <Grid item xs={12} md={6}>
              <Box sx={cardPanelSx}>
                <Typography sx={sectionLabelSx}>Rango de fecha</Typography>
                <DateRangeFilter
                  value={fechaRange}
                  onChange={handleDateRangeChange}
                  label="Periodo de análisis"
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={cardPanelSx}>
                <Typography sx={sectionLabelSx}>Producto</Typography>
                <TextField
                  fullWidth
                  label="Buscar por SKU o nombre"
                  placeholder="Ej: 001001016 o Polpaico"
                  size="small"
                  value={filters.sku || ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      sku: e.target.value || undefined,
                    }))
                  }
                  sx={textFieldSx}
                  InputProps={{
                    startAdornment: (
                      <SearchRoundedIcon sx={{ color: "#6a7c98", mr: 1 }} />
                    ),
                  }}
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Buscar proveedor"
                placeholder="Código o nombre del proveedor"
                size="small"
                value={proveedorSearchInput}
                onChange={handleProveedorSearchInputChange}
                onFocus={() => setShowProveedorSuggestions(true)}
                onBlur={() => setTimeout(() => setShowProveedorSuggestions(false), 200)}
                sx={textFieldSx}
                InputProps={{
                  startAdornment: (
                    <LocalShippingOutlinedIcon sx={{ color: "#6a7c98", mr: 1 }} />
                  ),
                }}
              />
              {loadingProveedores && (
                <Box display="flex" justifyContent="center" my={2}>
                  <CircularProgress size={24} />
                </Box>
              )}
              {showProveedorSuggestions &&
                filteredProveedores.length > 0 && (
                  <Box
                    mt={1}
                    maxHeight={220}
                    overflow="auto"
                    borderRadius={2.5}
                    border="1px solid #dfe7f6"
                    bgcolor="#fff"
                  >
                    {filteredProveedores.map((prov) => (
                      <Box
                        key={prov.CardCode}
                        p={1.25}
                        sx={{
                          cursor: "pointer",
                          backgroundColor:
                            filters.proveedor === prov.CardCode
                              ? "#eef3ff"
                              : "transparent",
                          borderBottom: "1px solid #f0f3f9",
                          "&:hover": { backgroundColor: "#f8fbff" },
                        }}
                        onClick={() => handleProveedorSelect(prov)}
                      >
                        <Typography variant="body2" fontWeight={700} color="#22324f">
                          {prov.CardName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {prov.CardCode}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              {showProveedorSuggestions &&
                !loadingProveedores &&
                filteredProveedores.length === 0 &&
                proveedorSearchInput.length > 0 && (
                  <Box
                    mt={1}
                    p={1.4}
                    borderRadius={2.5}
                    border="1px solid #dfe7f6"
                    textAlign="center"
                    bgcolor="#fff"
                  >
                    <Typography variant="body2" color="text.secondary">
                      No se encontraron proveedores.
                    </Typography>
                  </Box>
                )}
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Familia"
                placeholder="Nombre de familia SAP"
                size="small"
                value={filters.familia || ""}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    familia: e.target.value || undefined,
                  }))
                }
                sx={textFieldSx}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Subfamilia"
                placeholder="Nombre de subfamilia SAP"
                size="small"
                value={filters.subfamilia || ""}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    subfamilia: e.target.value || undefined,
                  }))
                }
                sx={textFieldSx}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Primer Nivel</InputLabel>
                <Select
                  value={filters.primerNivel || ""}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      primerNivel: e.target.value || undefined,
                    })
                  }
                  sx={selectSx}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {primerNiveles.map((pn) => (
                    <MenuItem key={pn.codigo} value={pn.codigo}>
                      <ListItemIcon>
                        <Avatar src={pn.imagen} sx={{ width: 24, height: 24 }} />
                      </ListItemIcon>
                      <ListItemText primary={pn.nombre} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {filters.primerNivel && (
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Categoría</InputLabel>
                  <Select
                    value={filters.categoria || ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        categoria: e.target.value || undefined,
                      })
                    }
                    sx={selectSx}
                  >
                    <MenuItem value="">Todas</MenuItem>
                    {categorias.map((c) => (
                      <MenuItem key={c.codigo} value={c.codigo}>
                        <ListItemIcon>
                          <Avatar src={c.imagen} sx={{ width: 24, height: 24 }} />
                        </ListItemIcon>
                        <ListItemText primary={c.nombre} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {filters.categoria && (
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Subcategoría</InputLabel>
                  <Select
                    value={filters.subcategoria || ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        subcategoria: e.target.value || undefined,
                      })
                    }
                    sx={selectSx}
                  >
                    <MenuItem value="">Todas</MenuItem>
                    {subcategorias.map((s) => (
                      <MenuItem key={s.codigo} value={s.codigo}>
                        <ListItemIcon>
                          <Avatar src={s.imagen} sx={{ width: 24, height: 24 }} />
                        </ListItemIcon>
                        <ListItemText primary={s.nombre} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12}>
              <Divider sx={{ my: 0.5 }} />
              <Box
                display="flex"
                justifyContent="space-between"
                gap={2}
                flexWrap="wrap"
                pt={1}
              >
                <Button
                  fullWidth
                  sx={{
                    maxWidth: 150,
                    borderRadius: 2.5,
                    textTransform: "none",
                    fontWeight: 700,
                  }}
                  variant="outlined"
                  onClick={handleClear}
                >
                  Limpiar
                </Button>
                <Button
                  fullWidth
                  sx={{
                    maxWidth: 160,
                    borderRadius: 2.5,
                    textTransform: "none",
                    fontWeight: 800,
                    background:
                      "linear-gradient(135deg, #3558c8 0%, #274690 100%)",
                    boxShadow: "0 10px 24px rgba(39, 70, 144, 0.25)",
                  }}
                  variant="contained"
                  onClick={handleApply}
                >
                  Aplicar
                </Button>
              </Box>
            </Grid>
            </Grid>
          </Box>
        </SubmitOnEnter>
      </Popover>
    </Box>
  );
};

export default HeaderVentasPorCanalDrawer;

