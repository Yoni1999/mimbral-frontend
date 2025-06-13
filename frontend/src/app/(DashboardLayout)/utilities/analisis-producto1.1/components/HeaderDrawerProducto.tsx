"use client";

import React, { useState } from "react";
import {
  Box, Drawer, Typography, IconButton, Divider, Grid, Avatar,
  FormControl, InputLabel, Select, MenuItem, TextField, Button, CircularProgress
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import Autocomplete from "@mui/material/Autocomplete";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";

interface Props {
  open: boolean;
  onClose: () => void;
  onApply: (filters: Filters, producto?: Producto | null) => void; // ✅ acepta también el producto seleccionado
}

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

const HeaderDrawerProducto: React.FC<Props> = ({ open, onClose, onApply }) => {
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
  const [inputValue, setInputValue] = useState("");

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
    console.log("Filtros aplicados:", updated);
  };

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
  };

  const fetchSKUs = async (query: string) => {
    try {
      setLoadingSku(true);
      const response = await fetchWithToken(`${BACKEND_URL}/api/pv/SKU?query=${encodeURIComponent(query)}`);
      if (!response || !response.ok) throw new Error(`Error HTTP: ${response?.status}`);
      const data: Producto[] = await response.json();
      setSkuOptions(data);
    } catch (error) {
      console.error("❌ Error cargando SKUs:", error);
      setSkuOptions([]);
    } finally {
      setLoadingSku(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: "100%", sm: 400 }, p: 3 } }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Filtros Avanzados</Typography>
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </Box>
      <Grid container spacing={2} direction="column">
        <Grid item>
          <Autocomplete
            size="small"
            options={skuOptions}
            getOptionLabel={(option) => `${option.itemcode} - ${option.itemname}`}
            filterOptions={(x) => x}
            loading={loadingSku}
            value={selectedProducto}
            inputValue={inputValue}
            onInputChange={(e, value) => {
              setInputValue(value);
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
                  )
                }}
              />
            )}
          />
        </Grid>
        <Grid item>
          <FormControl fullWidth size="small">
            <InputLabel>Temporada</InputLabel>
            <Select
              value={filters.temporada}
              onChange={(e) => handleChange("temporada", e.target.value)}
              label="Temporada"
            >
              {Object.keys(temporadaRangos).map((temp) => (
                <MenuItem key={temp} value={temp}>{temp}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item>
          <FormControl fullWidth size="small">
            <InputLabel>Período</InputLabel>
            <Select
              value={filters.periodo}
              onChange={(e) => handleChange("periodo", e.target.value)}
              label="Período"
            >
              <MenuItem value="1D">Hoy</MenuItem>
              <MenuItem value="7D">Últimos 7 días</MenuItem>
              <MenuItem value="14D">Últimos 14 días</MenuItem>
              <MenuItem value="1M">Últimos 30 días</MenuItem>
              <MenuItem value="3M">Últimos 3 meses</MenuItem>
              <MenuItem value="6M">Últimos 6 meses</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item>
          <FormControl fullWidth size="small">
            <InputLabel>Canal</InputLabel>
            <Select
              value={filters.canal}
              onChange={(e) => handleChange("canal", e.target.value)}
              label="Canal"
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
        <Grid item>
          <TextField
            fullWidth
            label="Fecha inicio"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={filters.fechaInicio}
            onChange={(e) => handleChange("fechaInicio", e.target.value)}
          />
        </Grid>
        <Grid item>
          <TextField
            fullWidth
            label="Fecha fin"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={filters.fechaFin}
            onChange={(e) => handleChange("fechaFin", e.target.value)}
          />
        </Grid>
        <Grid item>
          <FormControl fullWidth size="small">
            <InputLabel>Comparar con</InputLabel>
            <Select
              value={filters.modoComparacion}
              onChange={(e) => handleChange("modoComparacion", e.target.value)}
              label="Comparar con"
            >
              <MenuItem value="PeriodoAnterior">Período anterior</MenuItem>
              <MenuItem value="MismoPeriodoAnoAnterior">Mismo período año anterior</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item container spacing={2}>
          <Grid item xs={6}>
            <Button fullWidth variant="outlined" onClick={handleClear} startIcon={<DeleteOutlineIcon />}>Limpiar</Button>
          </Grid>
          <Button
            fullWidth
            variant="contained"
            onClick={() => {
              onApply(filters, selectedProducto); 
              onClose();
            }}
          >
            Aplicar
          </Button>

        </Grid>
      </Grid>
    </Drawer>
  );
};

export default HeaderDrawerProducto;