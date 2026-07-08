"use client";

import React, { useMemo, useState } from "react";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import {
  Box,
  Button,
  Divider,
  FormControl,
  Grid,
  MenuItem,
  Popover,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import DateRangeFilter, {
  DateRangeValue,
} from "./DateRangeFilter";

export interface Filters {
  canal: string;
  temporada: string;
  fechaInicio: string;
  fechaFin: string;
  sku?: string;
  familia?: string;
  subfamilia?: string;
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

const canalSlpMap: Record<string, number> = {
  Empresas: 1,
  Chorrillo: 2,
  Balmaceda: 3,
  Vitex: 4,
  Meli: 5,
  Falabella: 6,
};

const FotoDelDiaHeader: React.FC<Props> = ({ onFilterChange }) => {
  const [filters, setFilters] = useState<Filters>({
    canal: "",
    temporada: "",
    fechaInicio: "",
    fechaFin: "",
    comparacion: "",
  });
  const [filtrosAnchorEl, setFiltrosAnchorEl] = useState<HTMLElement | null>(null);
  const [busquedaSku, setBusquedaSku] = useState("");
  const [busquedaFamilia, setBusquedaFamilia] = useState("");
  const [busquedaSubfamilia, setBusquedaSubfamilia] = useState("");
  const [comparacionVisual, setComparacionVisual] = useState("");

  const filtrosAbiertos = Boolean(filtrosAnchorEl);

  const resumen = useMemo(() => {
    if (filters.temporada) return `Temporada: ${filters.temporada}`;
    if (filters.fechaInicio && filters.fechaFin) {
      return `Rango: ${dayjs(filters.fechaInicio).format("DD/MM/YYYY")} al ${dayjs(filters.fechaFin).format("DD/MM/YYYY")}`;
    }
    return "Hoy";
  }, [filters.fechaInicio, filters.fechaFin, filters.temporada]);

  const handleChange = (key: keyof Filters, value: string) => {
    let updated: Filters = { ...filters, [key]: value };

    if (key === "temporada") {
      const fechas = temporadaRangos[value];
      updated = fechas
        ? {
            ...updated,
            fechaInicio: fechas.inicio,
            fechaFin: fechas.fin,
          }
        : {
            ...updated,
            fechaInicio: "",
            fechaFin: "",
          };
    }

    if (key === "fechaInicio" || key === "fechaFin") {
      updated = {
        ...updated,
        temporada: "",
      };
    }

    setFilters(updated);
    onFilterChange(updated);
  };

  const handleDateChange = (range: DateRangeValue | null) => {
    const updated: Filters = {
      ...filters,
      temporada: "",
      fechaInicio: range?.start ?? "",
      fechaFin: range?.end ?? "",
    };
    setFilters(updated);
    onFilterChange(updated);
  };

  const handleClear = () => {
    const cleared: Filters = {
      canal: "",
      temporada: "",
      fechaInicio: "",
      fechaFin: "",
      sku: "",
      familia: "",
      subfamilia: "",
      comparacion: "",
    };
    setFilters(cleared);
    setBusquedaSku("");
    setBusquedaFamilia("");
    setBusquedaSubfamilia("");
    setComparacionVisual("");
    onFilterChange(cleared);
  };

  const abrirFiltros = (event: React.MouseEvent<HTMLElement>) => {
    setFiltrosAnchorEl(event.currentTarget);
  };

  const cerrarFiltros = () => {
    setFiltrosAnchorEl(null);
  };

  const aplicarFiltrosAdicionales = () => {
    const updated: Filters = {
      ...filters,
      sku: busquedaSku.trim(),
      familia: busquedaFamilia.trim(),
      subfamilia: busquedaSubfamilia.trim(),
      comparacion: (comparacionVisual || "") as Filters["comparacion"],
    };

    setFilters(updated);
    onFilterChange(updated);
    cerrarFiltros();
  };

  const tieneFiltros =
    !!filters.canal ||
    !!filters.temporada ||
    !!filters.fechaInicio ||
    !!filters.fechaFin ||
    !!filters.sku ||
    !!filters.familia ||
    !!filters.subfamilia ||
    !!filters.comparacion;

  return (
    <Box
      sx={{
        mb: 2,
        px: { xs: 1.5, md: 2.25 },
        py: { xs: 1.5, md: 1.75 },
        background: "linear-gradient(180deg, #ffffff 0%, #fbfcff 100%)",
        borderRadius: 2,
        boxShadow: "0 8px 30px rgba(15, 23, 42, 0.06)",
        border: "1px solid rgba(148, 163, 184, 0.18)",
      }}
    >
      <Grid container alignItems="center" justifyContent="space-between" spacing={2}>
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
                fontWeight: 700,
                fontSize: "1rem",
                color: "#0f172a",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                lineHeight: 1.1,
              }}
            >
              Resumen Ventas
            </Typography>
            <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5, fontSize: "0.78rem" }}>
              Estás viendo datos de: <strong>{resumen}</strong>
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12} md={10}>
          <Stack
            direction={{ xs: "column", xl: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", xl: "flex-end" }}
            justifyContent="space-between"
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              sx={{ flex: 1, width: "100%" }}
              alignItems="flex-end"
            >
              <Box sx={{ minWidth: { xs: "100%", sm: 160, lg: 185 }, flex: 1 }}>
                <Typography
                  variant="caption"
                  sx={{ color: "#475569", fontWeight: 700, ml: 0.2, letterSpacing: 0.2 }}
                >
                  Canal
                </Typography>
                <FormControl fullWidth size="small" sx={{ mt: 0.6 }}>
                  <Select
                    value={filters.canal}
                    onChange={(e) => handleChange("canal", e.target.value)}
                    displayEmpty
                    sx={{
                      height: 42,
                      bgcolor: "#fff",
                      borderRadius: 1.75,
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
                      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#94a3b8" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#2563eb" },
                    }}
                  >
                    <MenuItem value="">
                      <em>Canal</em>
                    </MenuItem>
                    {Object.keys(canalSlpMap).map((canal) => {
                      let label = canal;
                      if (label === "Meli") label = "Mercado Libre";
                      if (label === "Vitex") label = "Vtex";
                      if (label === "Chorrillo") label = "Chorrillos";

                      return (
                        <MenuItem key={canal} value={canal}>
                          {label}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ minWidth: { xs: "100%", sm: 160, lg: 185 }, flex: 1 }}>
                <Typography
                  variant="caption"
                  sx={{ color: "#475569", fontWeight: 700, ml: 0.2, letterSpacing: 0.2 }}
                >
                  Temporada
                </Typography>
                <FormControl fullWidth size="small" sx={{ mt: 0.6 }}>
                  <Select
                    value={filters.temporada}
                    onChange={(e) => handleChange("temporada", e.target.value)}
                    displayEmpty
                    sx={{
                      height: 42,
                      bgcolor: "#fff",
                      borderRadius: 1.75,
                      "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
                      "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#94a3b8" },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#2563eb" },
                    }}
                  >
                    <MenuItem value="">
                      <em>Temporada</em>
                    </MenuItem>
                    {Object.keys(temporadaRangos).map((season) => (
                      <MenuItem key={season} value={season}>
                        {season}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ minWidth: { xs: "100%", sm: 200, lg: 260 }, flex: 1.25 }}>
                <DateRangeFilter value={filters.fechaInicio && filters.fechaFin ? { start: filters.fechaInicio, end: filters.fechaFin } : null} onChange={handleDateChange} label="Rango de Fecha" />
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
              <Button
                variant="outlined"
                startIcon={<FilterAltOutlinedIcon />}
                onClick={abrirFiltros}
                sx={{
                  textTransform: "none",
                  borderRadius: 999,
                  px: 2.1,
                  height: 40,
                  borderColor: "#cbd5e1",
                  color: "#334155",
                  bgcolor: "#fff",
                  fontWeight: 600,
                  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
                  "&:hover": {
                    borderColor: "#94a3b8",
                    bgcolor: "#f8fafc",
                  },
                }}
              >
                Filtros
              </Button>

              <Button
                onClick={handleClear}
                startIcon={<DeleteOutlineIcon />}
                disabled={!tieneFiltros}
                sx={{
                  textTransform: "none",
                  color: "#cbd5e1",
                  fontWeight: 500,
                  "&.Mui-disabled": {
                    color: "#cbd5e1",
                  },
                }}
              >
                Limpiar
              </Button>
            </Stack>
          </Stack>
        </Grid>
      </Grid>

      <Popover
        open={filtrosAbiertos}
        anchorEl={filtrosAnchorEl}
        onClose={cerrarFiltros}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{
          sx: {
            mt: 1,
            p: 2.25,
            width: { xs: "calc(100vw - 32px)", sm: 580, md: 680 },
            maxWidth: "calc(100vw - 16px)",
            borderRadius: 3,
            border: "1px solid rgba(148, 163, 184, 0.22)",
            background: "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)",
            boxShadow: "0 24px 60px rgba(15, 23, 42, 0.18)",
          },
        }}
      >
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2" sx={{ color: "#0f172a", fontWeight: 700, mb: 1, fontSize: "0.98rem" }}>
              Opciones adicionales
            </Typography>
            <Divider />
          </Box>

          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" sx={{ color: "#475569", fontWeight: 700, ml: 0.2 }}>
                Comparando con
              </Typography>
              <FormControl fullWidth size="small" sx={{ mt: 0.6 }}>
                <Select
                  value={comparacionVisual}
                  onChange={(e) => setComparacionVisual(e.target.value)}
                  displayEmpty
                  sx={{
                    height: 42,
                    bgcolor: "#fff",
                    borderRadius: 1.75,
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
                  }}
                >
                  <MenuItem value="">
                    <em>Seleccionar</em>
                  </MenuItem>
                  <MenuItem value="Periodo anterior">Periodo anterior</MenuItem>
                  <MenuItem value="Mismo período año anterior">Mismo período año anterior</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="caption" sx={{ color: "#475569", fontWeight: 700, ml: 0.2 }}>
                Buscar SKU
              </Typography>
              <TextField
                fullWidth
                size="small"
                sx={{
                  mt: 0.6,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.75,
                    backgroundColor: "#fff",
                  },
                }}
                placeholder="SKU"
                value={busquedaSku}
                onChange={(e) => setBusquedaSku(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="caption" sx={{ color: "#475569", fontWeight: 700, ml: 0.2 }}>
                Buscar familia
              </Typography>
              <TextField
                fullWidth
                size="small"
                sx={{
                  mt: 0.6,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.75,
                    backgroundColor: "#fff",
                  },
                }}
                placeholder="Familia"
                value={busquedaFamilia}
                onChange={(e) => setBusquedaFamilia(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="caption" sx={{ color: "#475569", fontWeight: 700, ml: 0.2 }}>
                Buscar subfamilia
              </Typography>
              <TextField
                fullWidth
                size="small"
                sx={{
                  mt: 0.6,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1.75,
                    backgroundColor: "#fff",
                  },
                }}
                placeholder="Subfamilia"
                value={busquedaSubfamilia}
                onChange={(e) => setBusquedaSubfamilia(e.target.value)}
              />
            </Grid>
          </Grid>

          <Stack direction="row" justifyContent="space-between" spacing={1}>
            <Button
              onClick={() => {
                setBusquedaSku("");
                setBusquedaFamilia("");
                setBusquedaSubfamilia("");
                setComparacionVisual("");
              }}
              sx={{
                textTransform: "none",
                color: "#64748b",
                borderRadius: 999,
                px: 2,
              }}
            >
              Limpiar campos
            </Button>
            <Button
              onClick={aplicarFiltrosAdicionales}
              variant="contained"
              sx={{
                textTransform: "none",
                borderRadius: 999,
                px: 2,
                boxShadow: "none",
              }}
            >
              Aplicar
            </Button>
          </Stack>

          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            <Button
              onClick={cerrarFiltros}
              sx={{
                textTransform: "none",
                color: "#334155",
                borderRadius: 999,
                px: 2,
              }}
            >
              Cerrar
            </Button>
          </Stack>
        </Stack>
      </Popover>
    </Box>
  );
};

export default FotoDelDiaHeader;
