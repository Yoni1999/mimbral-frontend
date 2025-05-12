"use client";

import React, { useState } from "react";
import {
  Box, Grid, Typography, Avatar,
  FormControl, InputLabel, Select, MenuItem,
  TextField, Button, CircularProgress,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import Autocomplete from "@mui/material/Autocomplete";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";

type Producto = {
  itemcode: string;
  itemname: string;
  U_Imagen: string;
};

export type Filters = {
  itemCode: string;
  temporada: string;
  periodo: string;
  fechaInicio: string;
  fechaFin: string;
  canal: string;
  modoComparacion: "PeriodoAnterior" | "MismoPeriodoAnoAnterior" | "";
};

interface Props {
  onFilterChange: (filters: Filters) => void;
  initialFilters: Filters;
}

// Rangos de temporada
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

const HeaderProducto: React.FC<Props> = ({ onFilterChange }) => {
  const [filters, setFilters] = useState<Filters>({
    itemCode: "",
    temporada: "",
    periodo: "",
    fechaInicio: "",
    fechaFin: "",
    canal: "",
    modoComparacion: "",
  });

  const [skuOptions, setSkuOptions] = useState<Producto[]>([]);
  const [loadingSku, setLoadingSku] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);

  const handleChange = (key: keyof Filters, value: string) => {
    let updated = { ...filters, [key]: value };

    if (key === "temporada") {
      const fechas = temporadaRangos[value];
      if (fechas) {
        updated = {
          ...filters,
          temporada: value,
          periodo: "",
          fechaInicio: fechas.inicio,
          fechaFin: fechas.fin,
        };
      }
    }

    if (key === "periodo") {
      const hoy = new Date();
      const fin = hoy.toISOString().split("T")[0];
      let inicio = fin;

      updated = {
        ...filters,
        periodo: value,
        temporada: "",
        fechaInicio: "",
        fechaFin: "",
      };
      
    }

    if (key === "fechaInicio" || key === "fechaFin") {
      updated = {
        ...filters,
        [key]: value,
        periodo: "",
        temporada: "",
      };
    }

    setFilters(updated);
    onFilterChange(updated);
  };
  
  const [inputValue, setInputValue] = useState("");

  const handleClear = () => {
    const reset: Filters = {
      itemCode: "",
      temporada: "",
      periodo: "",
      fechaInicio: "",
      fechaFin: "",
      canal: "",
      modoComparacion: "",
    };
    setFilters(reset);
    setSelectedProducto(null);
    setInputValue("");
    onFilterChange(reset);
  };

  const fetchSKUs = async (query: string) => {
    try {
      setLoadingSku(true);
  
      const response = await fetchWithToken(
        `${BACKEND_URL}/api/pv/SKU?query=${encodeURIComponent(query)}`
      );
  
      if (!response || !response.ok) {
        throw new Error(`Error HTTP: ${response?.status}`);
      }
  
      const data: Producto[] = await response.json();
      setSkuOptions(data); // Ya viene filtrado desde el backend
    } catch (error) {
      console.error("❌ Error cargando SKUs:", error);
      setSkuOptions([]);
    } finally {
      setLoadingSku(false);
    }
  };
  

  return (
    <Box sx={{
      mb: 2, px: 2, py: 2,
      backgroundColor: "rgba(255, 255, 255, 0.5)",
      borderRadius: 1,
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
      backdropFilter: "blur(6px)",
      border: "1px solid rgba(255, 255, 255, 0.3)",
    }}>
      <Grid container alignItems="center" spacing={2}>
        <Grid item xs={12} md={3}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar src={selectedProducto?.U_Imagen || ""} sx={{ width: 46, height: 46 }} />
            <Box>
              <Typography variant="h6" fontWeight={700} color="text.primary">
                {selectedProducto?.itemname || "Seleccione un SKU"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Canal: {filters.canal || "Todos"}
              </Typography>
            </Box>
          </Box>
        </Grid>

        <Grid item xs={12} md={9}>
          <Grid container spacing={1.5} justifyContent="flex-end">

            <Grid item xs={12} sm={6} md={3}>
              <Autocomplete
                size="small"
                options={skuOptions}
                getOptionLabel={(option) => `${option.itemcode} - ${option.itemname}`}
                filterOptions={(x) => x}
                loading={loadingSku}
                value={selectedProducto}            
                inputValue={inputValue}   
                onInputChange={(e, value) => {
                  setInputValue(value); // ✅ actualiza el texto del input
                  if (value.length >= 2) fetchSKUs(value);
                }}
                onChange={(e, value) => {
                  setSelectedProducto(value);
                  handleChange("itemCode", value?.itemcode || "");
                }}
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option.itemcode}>
                    <Avatar src={option.U_Imagen} sx={{ width: 34, height: 34, mr: 1 }} />
                    {option.itemcode} - {option.itemname}
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Buscar SKU"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingSku && <CircularProgress color="inherit" size={18} />}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                      style: { fontSize: "0.75rem", height: 34 },
                    }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={6} sm={3} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Temporada</InputLabel>
                <Select
                  value={filters.temporada}
                  onChange={(e) => handleChange("temporada", e.target.value)}
                  label="Temporada"
                  sx={{ fontSize: "0.75rem", height: 34 }}
                >
                  {Object.keys(temporadaRangos).map((temp) => (
                    <MenuItem key={temp} value={temp}>{temp}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} sm={3} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Período</InputLabel>
                <Select
                  value={filters.periodo}
                  onChange={(e) => handleChange("periodo", e.target.value)}
                  label="Período"
                  sx={{ fontSize: "0.75rem", height: 34 }}
                >
                  <MenuItem value="1D">Hoy</MenuItem>
                  <MenuItem value="7D">Últimos 7 días</MenuItem>
                  <MenuItem value="14D">Últimos 14 días</MenuItem>
                  <MenuItem value="1M">Último mes</MenuItem>
                  <MenuItem value="3M">Últimos 3 meses</MenuItem>
                  <MenuItem value="6M">Últimos 6 meses</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} sm={3} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Canal</InputLabel>
                <Select
                  value={filters.canal}
                  onChange={(e) => handleChange("canal", e.target.value)}
                  label="Canal"
                  sx={{ fontSize: "0.75rem", height: 34 }}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="Empresas">Empresas</MenuItem>
                  <MenuItem value="Chorrillo">Tienda Chorrillo</MenuItem>
                  <MenuItem value="Balmaceda">Tienda Balmaceda</MenuItem>
                  <MenuItem value="Meli">Mercado Libre</MenuItem>
                  <MenuItem value="Falabella">Falabella</MenuItem>
                  <MenuItem value="Vitex">Vitex</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} sm={3} md={1.5}>
              <TextField
                label="Inicio"
                type="date"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={filters.fechaInicio}
                onChange={(e) => handleChange("fechaInicio", e.target.value)}
                inputProps={{ style: { fontSize: "0.65rem", height: 16 } }}
              />
            </Grid>

            <Grid item xs={6} sm={3} md={1.5}>
              <TextField
                label="Fin"
                type="date"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={filters.fechaFin}
                onChange={(e) => handleChange("fechaFin", e.target.value)}
                inputProps={{ style: { fontSize: "0.65rem", height: 16 } }}
              />
            </Grid>

            <Grid item xs={6} sm={3} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Comparar con</InputLabel>
                <Select
                  value={filters.modoComparacion || ""}
                  onChange={(e) => handleChange("modoComparacion", e.target.value)}
                  label="Comparar con"
                  sx={{ fontSize: "0.75rem", height: 34 }}
                >
                  <MenuItem value="PeriodoAnterior">Período anterior</MenuItem>
                  <MenuItem value="MismoPeriodoAnoAnterior">Mismo período año anterior</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} sm={3} md={1.3}>
              <Button
                variant="contained"
                color="primary"
                size="small"
                fullWidth
                onClick={handleClear}
                startIcon={<DeleteOutlineIcon />}
              >
                Limpiar
              </Button>
            </Grid>

          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HeaderProducto;
