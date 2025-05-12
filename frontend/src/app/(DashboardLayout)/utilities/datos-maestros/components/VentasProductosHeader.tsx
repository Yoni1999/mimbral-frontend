"use client";

import { useState } from "react";
import {
  Box, TextField, MenuItem, Button, Popover, Stack, Paper
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { FilterList, Clear } from "@mui/icons-material";
import dayjs, { Dayjs } from "dayjs";

// 🔹 Tipado para los filtros
export interface Filters {
  periodo: string | null;
  fechaInicio: Dayjs | null;
  fechaFin: Dayjs | null;
}

interface Props {
  onFilterChange: (filters: Filters) => void;
}

export default function VentasProductosHeader({ onFilterChange }: Props) {
  const [filters, setFilters] = useState<Filters>({
    periodo: "30D",
    fechaInicio: null,
    fechaFin: null,
  });

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleOpenFilters = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseFilters = () => {
    setAnchorEl(null);
  };

  const handleChange = (key: keyof Filters, value: any) => {
    setFilters((prev) => {
      let updatedFilters = { ...prev, [key]: value };

      // 🔹 Si el usuario selecciona un período, limpiar fechas manuales
      if (key === "periodo" && value) {
        updatedFilters.fechaInicio = null;
        updatedFilters.fechaFin = null;
      }

      // 🔹 Si el usuario selecciona fechas manuales, limpiar período
      if ((key === "fechaInicio" || key === "fechaFin") && value) {
        updatedFilters.periodo = null;
      }

      return updatedFilters;
    });
  };

  const handleApplyFilters = () => {
    onFilterChange(filters);
    handleCloseFilters();
  };

  const handleClearFilters = () => {
    setFilters({ periodo: null, fechaInicio: null, fechaFin: null });
  };

  return (
    <Box>
      {/* 🔹 Botón de "Filtrar" */}
      <Button
        variant="contained"
        color="primary"
        startIcon={<FilterList />}
        onClick={handleOpenFilters}
        sx={{ fontSize: "0.875rem", padding: "6px 12px", minWidth: "auto", borderRadius: 2 }}
      >
        Filtrar por fecha
      </Button>

      {/* 🔹 Popover con los filtros */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleCloseFilters}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{
          sx: {
            p: 2,
            borderRadius: 3, // 🔹 Bordes redondeados
            boxShadow: 4, // 🔹 Sombra suave
            minWidth: 280,
          }
        }}
      >
        <Stack spacing={2}>
          {/* 🔹 Período */}
          <TextField
            select
            label="Período"
            value={filters.periodo || ""}
            onChange={(e) => handleChange("periodo", e.target.value)}
            disabled={filters.fechaInicio !== null || filters.fechaFin !== null} // 🔹 Deshabilitado si hay fechas
            sx={{ fontSize: "0.875rem", borderRadius: 2, "& .MuiInputBase-root": { height: 40 } }}
          >
            <MenuItem value="7D">Últimos 7 días</MenuItem>
            <MenuItem value="30D">Últimos 30 días</MenuItem>
            <MenuItem value="3M">Últimos 3 meses</MenuItem>
            <MenuItem value="6M">Últimos 6 meses</MenuItem>
          </TextField>

          {/* 🔹 Selección de Fechas */}
          <DatePicker
            label="Fecha Inicio"
            value={filters.fechaInicio}
            onChange={(value) => handleChange("fechaInicio", value)}
            disabled={filters.periodo !== null}
            sx={{ fontSize: "0.875rem", borderRadius: 2, "& .MuiInputBase-root": { height: 40 } }}
          />

          <DatePicker
            label="Fecha Fin"
            value={filters.fechaFin}
            onChange={(value) => handleChange("fechaFin", value)}
            disabled={filters.periodo !== null}
            sx={{ fontSize: "0.875rem", borderRadius: 2, "& .MuiInputBase-root": { height: 40 } }}
          />

          {/* 🔹 Botones con estilo mejorado */}
          <Stack direction="row" spacing={1} justifyContent="space-between">
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<Clear />}
              onClick={handleClearFilters}
              sx={{
                fontSize: "0.65rem",
                padding: "6px 12px",
                borderRadius: 2,
                fontWeight: "bold",
                borderColor: "#b0bec5",
                color: "#546e7a",
                "&:hover": {
                  backgroundColor: "#eceff1",
                }
              }}
            >
              Limpiar
            </Button>

            <Button
              variant="contained"
              color="primary"
              onClick={handleApplyFilters}
              disabled={!filters.fechaInicio && !filters.fechaFin && !filters.periodo}
              sx={{
                fontSize: "0.65rem",
                padding: "6px 12px",
                borderRadius: 2,
                fontWeight: "bold",
                backgroundColor: filters.periodo || filters.fechaInicio ? "#2979ff" : "#b0bec5",
                "&:hover": {
                  backgroundColor: filters.periodo || filters.fechaInicio ? "#2962ff" : "#90a4ae",
                }
              }}
            >
              Aplicar Filtros
            </Button>
          </Stack>
        </Stack>
      </Popover>
    </Box>
  );
}
