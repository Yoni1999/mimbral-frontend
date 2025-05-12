"use client";
import React, { useEffect, useState } from "react";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Typography,
  Autocomplete,
} from "@mui/material";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";

export interface Filters {
  temporada: string;
  periodo: string;
  fechaInicio: string;
  fechaFin: string;
  comparacion?: "Periodo anterior" | "Mismo período año anterior" | "";
  subcategoria?: string;
}

interface Subcategoria {
  codigo: string;
  nombre: string;
  imagen: string;
}

interface Props {
  onFilterChange: (filters: Filters) => void;
  initialFilters?: Filters;
}


const temporadaRangos: Record<string, { inicio: string; fin: string }> = {
  "Verano 2024": { inicio: "2024-01-01", fin: "2024-03-20" },
  "Otoño 2024": { inicio: "2024-03-21", fin: "2024-06-20" },
  "Invierno 2024": { inicio: "2024-06-21", fin: "2024-09-22" },
  "Primavera 2024": { inicio: "2024-09-23", fin: "2024-12-21" },
  "Verano 2025": { inicio: "2025-01-01", fin: "2025-03-20" },
  "Otoño 2025": { inicio: "2025-03-21", fin: "2025-06-20" },
  "Invierno 2025": { inicio: "2025-06-21", fin: "2025-09-22" },
  "Primavera 2025": { inicio: "2025-09-23", fin: "2025-12-21" },
};

const HeaderSubcategoria: React.FC<Props> = ({ onFilterChange, initialFilters }) => {
  const [filters, setFilters] = useState<Filters>(() => ({
    temporada: initialFilters?.temporada || "",
    periodo: initialFilters?.periodo || "",
    fechaInicio: initialFilters?.fechaInicio || "",
    fechaFin: initialFilters?.fechaFin || "",
    comparacion: initialFilters?.comparacion || "",
    subcategoria: initialFilters?.subcategoria || "",
  }));
  

  const [subcategoriasApi, setSubcategoriasApi] = useState<Subcategoria[]>([]);

  useEffect(() => {
    const fetchSubcategorias = async () => {
      try {
        const response = await fetchWithToken(`${BACKEND_URL}/api/resumen-categoria/tercer-nivel`);
        if (!response) {
          console.error("No se recibió respuesta del servidor.");
          return;
        }
        const data = await response.json();
        setSubcategoriasApi(data);
      } catch (error) {
        console.error("Error al cargar subcategorías:", error);
      }
    };

    fetchSubcategorias();
  }, []);

  const obtenerResumenFiltro = () => {
  
    if (filters.temporada) return `Temporada: ${filters.temporada}`;
    if (filters.periodo) return `Período: ${filters.periodo}`;
    if (filters.fechaInicio && filters.fechaFin)
      return `Rango: ${filters.fechaInicio} al ${filters.fechaFin}`;
    return "Sin filtros aplicados";
  };

  const obtenerTituloSubcategoria = () => {
    const seleccionada = subcategoriasApi.find(
      (s) => s.codigo === filters.subcategoria
    );
    return seleccionada ? seleccionada.nombre : "Resumen 3° Nivel";
  };
  

  const handleChange = (key: keyof Filters, value: string) => {
    let updated: Filters = { ...filters, [key]: value };

    if (key === "temporada") {
      const fechas = temporadaRangos[value];
      if (fechas) {
        updated = {
          temporada: value,
          periodo: "",
          fechaInicio: fechas.inicio,
          fechaFin: fechas.fin,
          comparacion: filters.comparacion || "",
          subcategoria: filters.subcategoria || "",
        };
      }
    }

    if (key === "periodo") {
      updated = {
        ...updated,
        temporada: "",
        fechaInicio: "",
        fechaFin: "",
      };
    }

    if (key === "fechaInicio" || key === "fechaFin") {
      updated = {
        ...updated,
        temporada: "",
        periodo: "",
        [key]: value,
      };
    }

    if (key === "subcategoria") {
      updated = { ...updated, subcategoria: value };
    }

    setFilters(updated);

    const puedeFiltrar =
      updated.periodo ||
      updated.temporada ||
      (updated.fechaInicio && updated.fechaFin) ||
      updated.subcategoria;

    if (puedeFiltrar) onFilterChange(updated);
  };

  const handleClear = () => {
    const cleared: Filters = {
      temporada: "",
      periodo: "",
      fechaInicio: "",
      fechaFin: "",
      comparacion: "",
      subcategoria: "",
    };
    setFilters(cleared);
    onFilterChange(cleared);
  };

  return (
    <Box
      sx={{
        mb: 2,
        px: 2,
        py: 2,
        backgroundColor: "rgba(255, 255, 255, 0.5)",
        borderRadius: 2,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
        backdropFilter: "blur(6px)",
        border: "1px solid rgba(255, 255, 255, 0.3)",
      }}
    >
      <Grid container alignItems="center" justifyContent="space-between">
        <Grid item xs={12} md={2}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              pl: 1,
              borderLeft: "4px solid #d93a3a",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                fontSize: "1.1rem",
                color: "primary.main",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {obtenerTituloSubcategoria()}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "#555", mt: 0.5, fontSize: "0.75rem" }}
            >
              Estás viendo <strong>{obtenerResumenFiltro()}</strong>
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12} md={10}>
          <Grid container spacing={1.5} justifyContent="flex-end">
            <Grid item xs={6} sm={3} md={2.2}>
            <Autocomplete
              size="small"
              fullWidth
              options={subcategoriasApi}
              getOptionLabel={(option) =>
                typeof option === "string" ? option : option?.nombre || ""
              }
              isOptionEqualToValue={(option, value) => option.codigo === value.codigo}
              value={subcategoriasApi.find((s) => s.codigo === filters.subcategoria) || null}
              onChange={(_, selected) =>
                handleChange("subcategoria", selected?.codigo || "")
              }
              renderOption={(props, option) => (
                <Box
                  component="li"
                  {...props}
                  sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.5, px: 1 }}
                >
                  <Box
                    component="img"
                    src={option.imagen}
                    alt={option.nombre}
                    sx={{
                      width: 26,
                      height: 26,
                      borderRadius: 1,
                      objectFit: "cover",
                      backgroundColor: "#f5f5f5",
                      border: "1px solid #ddd",
                      flexShrink: 0,
                    }}
                  />
                  <Typography variant="body2" fontSize={13}>
                    {option.nombre}
                  </Typography>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Subcategoría"
                  InputLabelProps={{ style: { fontSize: "0.75rem" } }}
                  inputProps={{
                    ...params.inputProps,
                    style: { fontSize: "0.75rem", height: 16 },
                  }}
                />
              )}
            />

            </Grid>

            <Grid item xs={6} sm={3} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: "0.75rem" }}>Temporada</InputLabel>
                <Select
                  value={filters.temporada}
                  onChange={(e) => handleChange("temporada", e.target.value)}
                  label="Temporada"
                  sx={{ fontSize: "0.75rem", height: 36 }}
                >
                  {Object.keys(temporadaRangos).map((s) => (
                    <MenuItem key={s} value={s} sx={{ fontSize: "0.75rem" }}>
                      {s}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} sm={3} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: "0.75rem" }}>Período</InputLabel>
                <Select
                  value={filters.periodo}
                  onChange={(e) => handleChange("periodo", e.target.value)}
                  label="Período"
                  sx={{ fontSize: "0.75rem", height: 36 }}
                >
                  {[
                    "Hoy",
                    "Ultimos 7 días",
                    "Ultimos 14 días",
                    "Ultimo mes",
                    "3 meses",
                    "6 meses",
                  ].map((p) => (
                    <MenuItem key={p} value={p} sx={{ fontSize: "0.75rem" }}>
                      {p}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} sm={3} md={1.8}>
              <TextField
                label="Inicio"
                type="date"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true, style: { fontSize: "0.75rem" } }}
                inputProps={{ style: { fontSize: "0.75rem", height: 16 } }}
                value={filters.fechaInicio}
                onChange={(e) => handleChange("fechaInicio", e.target.value)}
              />
            </Grid>

            <Grid item xs={6} sm={3} md={1.8}>
              <TextField
                label="Fin"
                type="date"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true, style: { fontSize: "0.75rem" } }}
                inputProps={{ style: { fontSize: "0.75rem", height: 16 } }}
                value={filters.fechaFin}
                onChange={(e) => handleChange("fechaFin", e.target.value)}
              />
            </Grid>

            <Grid item xs={6} sm={2} md={1.9}>
              <Button
                onClick={handleClear}
                fullWidth
                size="small"
                sx={{
                  justifyContent: "space-between",
                  textTransform: "none",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  color: "#1e88e5",
                  backgroundColor: "transparent",
                  border: "none",
                  "&:hover": {
                    backgroundColor: "rgba(30, 136, 229, 0.1)",
                  },
                }}
                endIcon={<DeleteOutlineIcon sx={{ color: "#1e88e5" }} />}
              >
                Limpiar filtros
              </Button>
            </Grid>
          </Grid>

          <Grid container spacing={1.5} justifyContent="flex-end" mt={1}>
            <Grid item xs={12} sm={3} md={1.5}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: "0.65rem" }}>Comparando con</InputLabel>
                <Select
                  value={filters.comparacion || ""}
                  onChange={(e) => handleChange("comparacion", e.target.value)}
                  label="Comparando con"
                  sx={{ fontSize: "0.75rem", height: 36 }}
                >
                  {["Periodo anterior"].map((op) => (
                    <MenuItem key={op} value={op} sx={{ fontSize: "0.75rem" }}>
                      {op}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HeaderSubcategoria;
