import {
    Box,
    Button,
    MenuItem,
    Select,
    TextField,
    FormControl,
    InputLabel,
    Typography,
  } from "@mui/material";
  import { DatePicker } from "@mui/x-date-pickers";
  import { useState } from "react";
  import dayjs, { Dayjs } from "dayjs";
  import { FilterList } from "@mui/icons-material";
  
  export interface RentabilidadFilters {
    canal: string;
    sku: string;
    fechaInicio: Dayjs | null;
    fechaFin: Dayjs | null;
  }
  
  interface Props {
    onFilterChange: (filters: RentabilidadFilters) => void;
  }
  
  export default function RentabilidadHeader({ onFilterChange }: Props) {
    const [filters, setFilters] = useState<RentabilidadFilters>({
      canal: "",
      sku: "",
      fechaInicio: null,
      fechaFin: null,
    });
  
    const handleChange = (key: keyof RentabilidadFilters, value: any) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    };
  
    const handleApplyFilters = () => {
      onFilterChange(filters);
    };
  
    const handleClearFilters = () => {
      const cleared = {
        canal: "",
        sku: "",
        fechaInicio: null,
        fechaFin: null,
      };
      setFilters(cleared);
      onFilterChange(cleared);
    };
  
    return (
      <Box display="flex" flexWrap="wrap" gap={2} alignItems="center" mb={3}>
        {/* Icono de Filtros */}
        <Box display="flex" alignItems="center" gap={1} sx={{ pr: 1 }}>
          <FilterList sx={{ color: "text.secondary" }} />
          <Typography variant="subtitle2" color="text.secondary">
            Filtros
          </Typography>
        </Box>
  
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Canal</InputLabel>
          <Select
            value={filters.canal}
            onChange={(e) => handleChange("canal", e.target.value)}
            label="Canal"
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="Empresas">Empresas</MenuItem>
            <MenuItem value="Meli">Meli</MenuItem>
            <MenuItem value="Falabella">Falabella</MenuItem>
            <MenuItem value="Balmaceda">Balmaceda</MenuItem>
            <MenuItem value="Vitex">Vitex</MenuItem>
          </Select>
        </FormControl>
  
        <TextField
          size="small"
          label="SKU"
          placeholder="Ej: 001001016"
          value={filters.sku}
          onChange={(e) => handleChange("sku", e.target.value)}
        />
  
        <DatePicker
          label="Fecha Inicio"
          value={filters.fechaInicio}
          onChange={(value) => handleChange("fechaInicio", value)}
          slotProps={{
            textField: {
              size: "small",
              sx: { width: 180 },
            },
          }}
        />
  
        <DatePicker
          label="Fecha Fin"
          value={filters.fechaFin}
          onChange={(value) => handleChange("fechaFin", value)}
          slotProps={{
            textField: {
              size: "small",
              sx: { width: 180 },
            },
          }}
        />
  
        <Button
          variant="contained"
          color="primary"
          onClick={handleApplyFilters}
          sx={{ height: 40 }}
        >
          Aplicar
        </Button>
  
        <Button
          variant="outlined"
          onClick={handleClearFilters}
          sx={{ height: 40 }}
        >
          Limpiar
        </Button>
      </Box>
    );
  }
  