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
  Dialog,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";

export interface Filters {
  temporada: string;
  periodo: string;
  fechaInicio: string;
  fechaFin: string;
  comparacion?: "Periodo anterior" | "Mismo período año anterior" | "";
  primer_nivel?: string;
  nombre_primer_nivel?: string;
}

interface PrimerNivel {
  codigo: string;
  nombre: string;
  imagen?: string;
}

interface Props {
  onFilterChange: (filters: Filters) => void;
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

const HeaderCategoria: React.FC<Props> = ({ onFilterChange }) => {
  const [filters, setFilters] = useState<Filters>({
    temporada: "",
    periodo: "Ultimos 7 días",
    fechaInicio: "",
    fechaFin: "",
    comparacion: "",
    primer_nivel: "",
  });

  const [primerNiveles, setPrimerNiveles] = useState<PrimerNivel[]>([]);
  const [showNivelModal, setShowNivelModal] = useState(false);

  useEffect(() => {
    const fetchPrimerNiveles = async () => {
      try {
        const response = await fetchWithToken(`${BACKEND_URL}/api/resumen-categoria/primer-nivel`);
        const data = await response!.json();
        setPrimerNiveles(data);
        if (data.length > 0 && !filters.primer_nivel) {
          setShowNivelModal(true);
        }
      } catch (error) {
        console.error("Error al cargar niveles:", error);
      }
    };
    fetchPrimerNiveles();
  }, []);

  const obtenerResumenFiltro = () => {
    if (filters.temporada) return `Temporada: ${filters.temporada}`;
    if (filters.periodo) return `Período: ${filters.periodo}`;
    if (filters.fechaInicio && filters.fechaFin) return `Rango: ${filters.fechaInicio} al ${filters.fechaFin}`;
    if (filters.primer_nivel) {
      const nivel = primerNiveles.find((n) => n.codigo === filters.primer_nivel);
      return `Nivel superior: ${nivel?.nombre || filters.primer_nivel}`;
    }
    return "Sin filtros aplicados";
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
          primer_nivel: filters.primer_nivel || "",
        };
      }
    }

    if (key === "periodo") {
      updated = { ...updated, temporada: "", fechaInicio: "", fechaFin: "" };
    }

    if (key === "fechaInicio" || key === "fechaFin") {
      updated = { ...updated, temporada: "", periodo: "", [key]: value };
    }

    if (key === "primer_nivel") {
      const nivel = primerNiveles.find((n) => n.codigo === value);
      updated = { ...updated, primer_nivel: value, nombre_primer_nivel: nivel?.nombre || "" };
    }

    setFilters(updated);

    const puedeFiltrar = updated.periodo || updated.temporada || (updated.fechaInicio && updated.fechaFin) || updated.primer_nivel;
    if (puedeFiltrar) onFilterChange(updated);
  };

  const handleClear = () => {
    const cleared: Filters = {
      temporada: "",
      periodo: "",
      fechaInicio: "",
      fechaFin: "",
      comparacion: "",
      primer_nivel: "",
    };
    setFilters(cleared);
    onFilterChange(cleared);
  };

  return (
    <>
    <Dialog open={showNivelModal} fullWidth maxWidth="lg">
      <Box p={3} textAlign="center" sx={{ position: "relative" }}>
        {/* Botón de cierre arriba a la derecha */}
        <IconButton
          onClick={() => setShowNivelModal(false)}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            color: "#888",
          }}
        >
          <CloseIcon />
        </IconButton>

        <Typography variant="h6" fontWeight={600} mb={3} color="primary">
          Para analizar el primer nivel, primero debes seleccionar una categoría y luego seguir aplicando los filtros que desees!
        </Typography>

        <Grid container spacing={3} justifyContent="center">
          {primerNiveles.map((nivel) => (
            <Grid item xs={12} sm={6} md={3} key={nivel.codigo}>
              <Box
                onClick={() => {
                  handleChange("primer_nivel", nivel.codigo);
                  setShowNivelModal(false);
                }}
                sx={{
                  border: "2px solid #ccc",
                  borderRadius: 3,
                  p: 1.5,
                  cursor: "pointer",
                  transition: "0.3s",
                  "&:hover": { borderColor: "#213663", boxShadow: 2 },
                }}
              >
                <Box
                  component="img"
                  src={nivel.imagen || "https://cdn-icons-png.flaticon.com/512/891/891419.png"}
                  alt={nivel.nombre}
                  sx={{
                    width: 86,
                    height: 86,
                    borderRadius: "50%",
                    objectFit: "cover",
                    mx: "auto",
                    boxShadow: 2,
                  }}
                />
                <Typography mt={1.5} fontWeight={600} fontSize="0.9rem">
                  {nivel.nombre}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        <Typography variant="body2" color="text.secondary" mt={4}>
          Esta selección es necesaria para cargar los datos correctamente.
        </Typography>
      </Box>
    </Dialog>


    <Box
      sx={{
        mb: 2,
        px: 2,
        py: 2,
        backgroundColor: "rgba(255, 255, 255, 0.5)",
        borderRadius: 2,
        color: "#ffffff",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
        backdropFilter: "blur(6px)",
        border: "1px solid #ffffff",
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
            {filters.primer_nivel
              ? primerNiveles.find((n) => n.codigo === filters.primer_nivel)?.nombre || "Resumen Categorías"
              : "Resumen Categorías"}
          </Typography>

            <Typography
              variant="body2"
              sx={{ color: "#555", mt: 0.5, fontSize: "0.75rem" }}
            >
              Estás viendo: <strong>{obtenerResumenFiltro()}</strong>
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12} md={10}>
          <Grid container spacing={1.5} justifyContent="flex-end">
            <Grid item xs={6} sm={3} md={2.2}>
            <Autocomplete
              size="small"
              fullWidth
              options={primerNiveles}
              getOptionLabel={(option) => option.nombre || ""}
              isOptionEqualToValue={(option, value) => option.codigo === value.codigo}
              value={primerNiveles.find((n) => n.codigo === filters.primer_nivel) || null}
              onChange={(_, selected) => handleChange("primer_nivel", selected?.codigo || "")}
              renderOption={(props, option) => (
                <Box
                  component="li"
                  {...props}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 2,
                    py: 1.2, // ← MÁS ALTO
                  }}
                >
                  {option.imagen ? (
                    <img
                      src={option.imagen}
                      alt={option.nombre}
                      style={{
                        width: 32,         // ← MÁS GRANDE
                        height: 32,        // ← MÁS GRANDE
                        objectFit: "cover",
                        borderRadius: 6,
                      }}
                    />
                  ) : (
                    <Box sx={{ width: 32, height: 32, backgroundColor: "#eee", borderRadius: 6 }} />
                  )}
                  <Typography variant="body1" sx={{ fontSize: "0.9rem" }}> {/* ← MÁS GRANDE */}
                    {option.nombre}
                  </Typography>
                </Box>
              )}
              
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Nivel Superior"
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
                  {["Hoy", "Ultimos 7 días", "Ultimos 14 días", "Ultimo mes", "3 meses", "6 meses"].map((p) => (
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
  </>
  );
};

export default HeaderCategoria;
