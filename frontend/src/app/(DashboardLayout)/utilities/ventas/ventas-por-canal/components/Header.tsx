"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  FormControl,
  Grid,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import DateRangeFilter, {
  DateRangeValue,
} from "../../components/DateRangeFilter";

export interface Filters {
  canal: string;
  fechaInicio: string;
  fechaFin: string;
}

interface HeaderFiltersProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
}

const HeaderFilters = ({ filters, onFilterChange }: HeaderFiltersProps) => {
  const [canal, setCanal] = useState(filters.canal || "");
  const [fechaInicio, setFechaInicio] = useState(filters.fechaInicio || "");
  const [fechaFin, setFechaFin] = useState(filters.fechaFin || "");

  useEffect(() => {
    setCanal(filters.canal || "");
    setFechaInicio(filters.fechaInicio || "");
    setFechaFin(filters.fechaFin || "");
  }, [filters]);

  const handleDateChange = (range: DateRangeValue | null) => {
    setFechaInicio(range?.start || "");
    setFechaFin(range?.end || "");
  };

  const handleApplyFilters = () => {
    onFilterChange({ canal, fechaInicio, fechaFin });
  };

  const handleClearFilters = () => {
    setCanal("");
    setFechaInicio("");
    setFechaFin("");
    localStorage.removeItem("filtrosVentasCanal");
    onFilterChange({ canal: "", fechaInicio: "", fechaFin: "" });
  };

  return (
    <Box
      sx={{
        mb: 3,
        p: 2,
        bgcolor: "background.paper",
        borderRadius: 2,
        boxShadow: 2,
      }}
    >
      <Grid container spacing={2} alignItems="flex-end">
        <Grid item sx={{ display: "flex", alignItems: "center", pb: 0.4 }}>
          <FilterListIcon sx={{ mr: 1, fontSize: 24, color: "primary.main" }} />
          <Typography variant="h6" color="primary" sx={{ mr: 2 }}>
            Filtros
          </Typography>
        </Grid>

        <Grid item xs={12} sm={4} md={2.5}>
          <Typography variant="caption" sx={{ color: "#475569", fontWeight: 700, ml: 0.2 }}>
            Canal
          </Typography>
          <FormControl
            fullWidth
            size="small"
            sx={{
              mt: 0.6,
              backgroundColor: "#ffffff",
              borderRadius: 2,
              ".MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          >
            <Select
              value={canal}
              displayEmpty
              onChange={(e) => setCanal(e.target.value)}
              sx={{ height: 42 }}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="Meli">Mercado Libre</MenuItem>
              <MenuItem value="Falabella">Falabella</MenuItem>
              <MenuItem value="Balmaceda">Balmaceda</MenuItem>
              <MenuItem value="Vitex">Vtex</MenuItem>
              <MenuItem value="Chorrillo">Chorrillos</MenuItem>
              <MenuItem value="Empresas">Empresas</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={5} md={3.5}>
          <DateRangeFilter
            value={fechaInicio && fechaFin ? { start: fechaInicio, end: fechaFin } : null}
            onChange={handleDateChange}
            label="Rango de Fecha"
          />
        </Grid>

        <Grid
          item
          xs={12}
          sm={3}
          md={3}
          sx={{
            display: "flex",
            justifyContent: { xs: "flex-start", md: "flex-end" },
            alignItems: "center",
            gap: 1,
            ml: "auto",
          }}
        >
          <Button
            variant="contained"
            color="primary"
            onClick={handleApplyFilters}
            size="small"
            sx={{ borderRadius: 2, textTransform: "none", height: 40 }}
          >
            Aplicar
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleClearFilters}
            size="small"
            startIcon={<ClearAllIcon />}
            sx={{ borderRadius: 2, textTransform: "none", height: 40 }}
          >
            Limpiar
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HeaderFilters;
