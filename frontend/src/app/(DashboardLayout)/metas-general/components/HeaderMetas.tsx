"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  Avatar,
  ListItemText,
  ListItemIcon,
  Collapse,
  Chip,
  Paper,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";

export interface MetaFilters {
  periodo: string;
  categoria: string;
  subcategoria?: string;
  subsubcategoria?: string;
  canal: string;
  marca?: string;
  vendedor?: string;
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
      marca: "",
      vendedor: "",
    }
  );

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<string[]>([]);
  const [subsubcategorias, setSubsubcategorias] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const marcas = ["Bosch", "Makita", "DeWalt", "Stanley"];
  const vendedoresPorCanal: Record<string, string[]> = {
    Empresas: ["Camila", "Matías", "Ignacio"],
    Meli: ["Juan", "Ana"],
    Falabella: ["Tomás", "Josefa"],
    Balmaceda: ["Daniela"],
    Vitex: ["Pedro"],
    Chorrillo: ["Claudia", "Luis"],
  };

  const [periodos, setPeriodos] = useState<string[]>([]);

  useEffect(() => {
    const fetchPeriodos = async () => {
      try {
        const response = await fetchWithToken(`${BACKEND_URL}/api/periodos`);
        if (!response) throw new Error("Error al obtener los períodos");
        const data = await response.json();

        // Si el backend devuelve objetos con nombre, extrae solo los textos:
        const nombres = data.map((p: { NOMBRE: string }) => p.NOMBRE);
        setPeriodos(nombres);
      } catch (error) {
        console.error("Error al cargar períodos:", error);
      }
    };

    fetchPeriodos();
  }, []);

  const canales = Object.keys(vendedoresPorCanal);

  useEffect(() => {
    if (initialFilters) {
      setFilters(initialFilters);
      onFilterChange(initialFilters);
    }
  }, [initialFilters]);

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const response = await fetchWithToken(`${BACKEND_URL}/api/resumen-categoria/primer-nivel`);
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

    if (key === "categoria") {
      updated.subcategoria = "";
      updated.subsubcategoria = "";
      setSubcategorias(["Subcat A", "Subcat B", "Subcat C"]);
      setSubsubcategorias([]);
    }

    if (key === "subcategoria") {
      updated.subsubcategoria = "";
      setSubsubcategorias(["SubSub 1", "SubSub 2"]);
    }

    if (key === "canal") {
      updated.vendedor = "";
    }

    setFilters(updated);
  };

  const handleApply = () => {
    onFilterChange(filters);
    setShowFilters(false); // Ocultar el panel al aplicar
  };


  const handleClear = () => {
    const cleared: MetaFilters = {
      periodo: "",
      categoria: "",
      subcategoria: "",
      subsubcategoria: "",
      canal: "",
      marca: "",
      vendedor: "",
    };
    setFilters(cleared);
    onFilterChange(cleared);
  };

  return (
    <>
      <Box sx={{ px: 1, mb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters(!showFilters)}
            sx={{ fontWeight: 600 }}
          >
            {showFilters ? "Ocultar filtros" : "Filtros"}
          </Button>

          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            sx={{ fontWeight: 600 }}
            onClick={() => console.log("Exportar a Excel (próximamente)")}
          >
            Exportar
          </Button>
        </Box>

        {/* Chips con filtros activos */}
        <Box mt={1} display="flex" flexWrap="wrap" gap={1}>
          {filters.periodo && <Chip label={`Período: ${filters.periodo}`} />}
          {filters.categoria && <Chip label={`Categoría: ${filters.categoria}`} />}
          {filters.subcategoria && <Chip label={`Subcat: ${filters.subcategoria}`} />}
          {filters.subsubcategoria && <Chip label={`Sub-sub: ${filters.subsubcategoria}`} />}
          {filters.canal && <Chip label={`Canal: ${filters.canal}`} />}
          {filters.marca && <Chip label={`Marca: ${filters.marca}`} />}
          {filters.vendedor && <Chip label={`Vendedor: ${filters.vendedor}`} />}
        </Box>
      </Box>

      <Collapse in={showFilters} timeout="auto" unmountOnExit>
        <Paper elevation={1} sx={{ mx: 2, mb: 2, p: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
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
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
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
            </Grid>

            {filters.categoria && (
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Subcategoría</InputLabel>
                  <Select
                    value={filters.subcategoria || ""}
                    onChange={(e) => handleChange("subcategoria", e.target.value)}
                    label="Subcategoría"
                  >
                    {subcategorias.map((subcat) => (
                      <MenuItem key={subcat} value={subcat}>
                        {subcat}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {filters.subcategoria && (
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sub-subcategoría</InputLabel>
                  <Select
                    value={filters.subsubcategoria || ""}
                    onChange={(e) => handleChange("subsubcategoria", e.target.value)}
                    label="Sub-subcategoría"
                  >
                    {subsubcategorias.map((ssc) => (
                      <MenuItem key={ssc} value={ssc}>
                        {ssc}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
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
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Marca</InputLabel>
                <Select
                  value={filters.marca || ""}
                  onChange={(e) => handleChange("marca", e.target.value)}
                  label="Marca"
                >
                  {marcas.map((marca) => (
                    <MenuItem key={marca} value={marca}>
                      {marca}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {filters.canal === "Empresas" && (
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Vendedor</InputLabel>
                  <Select
                    value={filters.vendedor || ""}
                    onChange={(e) => handleChange("vendedor", e.target.value)}
                    label="Vendedor"
                  >
                    {(vendedoresPorCanal["Empresas"] || []).map((v) => (
                      <MenuItem key={v} value={v}>
                        {v}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12} display="flex" justifyContent="flex-end" gap={1}>
              <Button
                variant="outlined"
                onClick={handleClear}
                sx={{ fontWeight: 500 }}
              >
                Limpiar
              </Button>
              <Button
                variant="contained"
                onClick={handleApply}
                sx={{ fontWeight: 600 }}
              >
                Aplicar
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Collapse>
    </>
  );
};

export default HeaderMetas;
