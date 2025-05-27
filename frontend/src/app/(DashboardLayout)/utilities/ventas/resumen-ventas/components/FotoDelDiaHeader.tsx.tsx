"use client";
import React, { useState } from "react";
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
} from "@mui/material";

export interface Filters {
  temporada: string;
  periodo: string;
  fechaInicio: string;
  fechaFin: string;
  comparacion?: "Periodo anterior" | "Mismo período año anterior" | "";
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

const FotoDelDiaHeader: React.FC<Props> = ({ onFilterChange }) => {
  const [filters, setFilters] = useState<Filters>({
    temporada: "",
    periodo: "",
    fechaInicio: "",
    fechaFin: "",
    comparacion: "",
  });

  const obtenerResumenFiltro = () => {
    if (filters.temporada) return `Temporada: ${filters.temporada}`;
    if (filters.periodo) return `Período: ${filters.periodo}`;
    if (filters.fechaInicio && filters.fechaFin)
      return `Rango: ${filters.fechaInicio} al ${filters.fechaFin}`;
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

    if (key === "comparacion") {
      updated = { ...updated };
    }

    setFilters(updated);

    const puedeFiltrar =
      updated.periodo ||
      updated.temporada ||
      (updated.fechaInicio && updated.fechaFin);

    if (puedeFiltrar) onFilterChange(updated);
  };

  const handleClear = () => {
    const cleared: Filters = {
      temporada: "",
      periodo: "",
      fechaInicio: "",
      fechaFin: "",
      comparacion: "",
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
        backgroundColor: "#ffffff",
        borderRadius: 1,
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
              borderLeft: "4px solid #1976d2",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                fontSize: "1.1rem",
                color: "#1e293b",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Resumen Ventas
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "#555", mt: 0.5, fontSize: "0.75rem" }}
            >
              Estás viendo datos de: <strong>{obtenerResumenFiltro()}</strong>
            </Typography>
          </Box>
        </Grid>
        {/*Canales de venta  */}
        
        <Grid item xs={12} md={10}>
          <Grid container spacing={1.5} justifyContent="flex-end">
            <Grid item xs={6} sm={3} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: "0.75rem" }}>Canal</InputLabel>
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

            {/* Temporada */}
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

            {/* Periodo */}
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

            {/* Fecha Inicio */}
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

            {/* Fecha Fin */}
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

            {/* Botón Limpiar */}
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

          {/* Comparando con (segunda fila) */}
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

export default FotoDelDiaHeader;
