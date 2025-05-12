"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  Avatar,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import { SlidersHorizontal } from "lucide-react";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";

export interface MetaFilters {
  periodo: string;
  categoria: string;
  canal: string;
}

interface Props {
  onFilterChange: (filters: MetaFilters) => void;
  initialFilters?: MetaFilters;
}

interface Categoria {
  codigo: string;
  nombre: string;
  imagen?: string;
}

const HeaderMetas: React.FC<Props> = ({ onFilterChange, initialFilters }) => {
  const [filters, setFilters] = useState<MetaFilters>(
    initialFilters || {
      periodo: "Marzo-Abril 2025",
      categoria: "",
      canal: "",
    }
  );

  const [categorias, setCategorias] = useState<Categoria[]>([]);

  useEffect(() => {
    if (initialFilters) {
      setFilters(initialFilters);
      onFilterChange(initialFilters);
    }
  }, [initialFilters]);

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const response = await fetchWithToken(
          `${BACKEND_URL}/api/resumen-categoria/primer-nivel`
        );
        if (!response) throw new Error("No se pudo cargar categorías");
        const data = await response.json();
        setCategorias(data);
      } catch (error) {
        console.error("Error al cargar categorías:", error);
      }
    };
    fetchCategorias();
  }, []);

  const handleChange = (key: keyof MetaFilters, value: string) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
  };

  const handleApply = () => {
    onFilterChange(filters);
  };

  const handleClear = () => {
    const cleared: MetaFilters = {
      periodo: "",
      categoria: "",
      canal: "",
    };
    setFilters(cleared);
    onFilterChange(cleared);
  };

  const periodos = ["Marzo-Abril 2024", "Marzo-Abril 2025"];
  const canales = ["Empresas", "Balmaceda", "Meli", "Falabella", "Vitex", "Chorrillo"];

  return (
        <Box
        sx={{
            width: "100%",
            backgroundColor: "transparent",
            display: "flex",
            justifyContent: "flex-start", 
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
            px: 2,
            py: 2,
        }}
        >
      <Box sx={{ display: "flex", alignItems: "center", mr: 1 }}>
        <SlidersHorizontal size={18} strokeWidth={2} style={{ marginRight: 6, color: "#3b82f6" }} />
        <Typography variant="body2" sx={{ fontWeight: 600, color: "#3b82f6" }}>
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
          {canales.map((canal) => (
            <MenuItem key={canal} value={canal}>
              {canal}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel>Categoría</InputLabel>
        <Select
          value={filters.categoria}
          onChange={(e) => handleChange("categoria", e.target.value)}
          label="Categoría"
          renderValue={(selected) => {
            const selectedCat = categorias.find((cat) => cat.codigo === selected);
            return (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {selectedCat?.imagen && (
                  <Avatar src={selectedCat.imagen} sx={{ width: 24, height: 24 }} />
                )}
                <Typography variant="body2">{selectedCat?.nombre || selected}</Typography>
              </Box>
            );
          }}
        >
          {categorias.map((cat) => (
            <MenuItem key={cat.codigo} value={cat.codigo}>
              <ListItemIcon>
                {cat.imagen ? (
                  <Avatar src={cat.imagen} sx={{ width: 24, height: 24 }} />
                ) : (
                  <Avatar sx={{ width: 24, height: 24, bgcolor: "#e0e0e0" }} />
                )}
              </ListItemIcon>
              <ListItemText primary={cat.nombre} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Período</InputLabel>
        <Select
          value={filters.periodo}
          onChange={(e) => handleChange("periodo", e.target.value)}
          label="Período"
        >
          {periodos.map((p) => (
            <MenuItem key={p} value={p}>
              {p}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button
        variant="contained"
        sx={{
          textTransform: "none",
          fontWeight: 600,
          bgcolor: "#3b82f6",
          px: 2.5,
          "&:hover": {
            backgroundColor: "#2563eb",
          },
        }}
        onClick={handleApply}
      >
        Aplicar
      </Button>

      <Button
        variant="outlined"
        sx={{
          textTransform: "none",
          fontWeight: 500,
          color: "#3b82f6",
          borderColor: "#3b82f6",
        }}
        onClick={handleClear}
      >
        <SlidersHorizontal size={16} style={{ marginRight: 6 }} />
        Limpiar
      </Button>
    </Box>
  );
};

export default HeaderMetas;
