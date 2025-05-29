"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Drawer,
  IconButton,
  Typography,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Chip,
  Avatar,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import CloseIcon from "@mui/icons-material/Close";
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

interface Categoria {
  codigo: string;
  nombre: string;
  imagen?: string;
}

interface Props {
  onFilterChange: (filters: MetaFilters) => void;
  initialFilters?: MetaFilters;
}

const canalSlpMap: Record<string, number> = {
  Mercado_Libre: 4,
  Chorrillo: 2,
  Balmaceda: 3,
  Empresas: 1,
  Vtex: 5,
  Falabella: 6,
};

const HeaderMetasDrawer: React.FC<Props> = ({ onFilterChange, initialFilters }) => {
  const [openDrawer, setOpenDrawer] = useState(false);
  const [filters, setFilters] = useState<MetaFilters>(
    initialFilters || {
      periodo: "",
      categoria: "",
      canal: "",
      marca: "",
      vendedor: "",
    }
  );

  const [primerNiveles, setPrimerNiveles] = useState<Categoria[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<Categoria[]>([]);
  const [periodos, setPeriodos] = useState<{ id: number; nombre: string }[]>([]);
  const [vendedores, setVendedores] = useState<{ id: number; nombre: string }[]>([]);

  const marcas = ["Bosch", "Makita", "DeWalt", "Stanley"];

  useEffect(() => {
    const fetchPeriodos = async () => {
      const res = await fetchWithToken(`${BACKEND_URL}/api/periodos`);
      const data = await res!.json();

      const hoy = new Date();
      const periodoActual = data.find((p: any) => {
        const inicio = new Date(p.FECHA_INICIO);
        const fin = new Date(p.FECHA_FIN);
        return hoy >= inicio && hoy <= fin;
      });

      setPeriodos(data.map((p: any) => ({
        id: p.ID_PERIODO,
        nombre: p.NOMBRE,
        inicio: p.FECHA_INICIO,
        fin: p.FECHA_FIN
      })));

      setFilters((prev) => ({
        ...prev,
        periodo: periodoActual ? periodoActual.ID_PERIODO.toString() : "",
        canal: "Empresas"
      }));

      onFilterChange({
        ...filters,
        periodo: periodoActual ? periodoActual.ID_PERIODO.toString() : "",
        canal: "Empresas"
      });
    };

    fetchPeriodos();
  }, []);


  useEffect(() => {
    const fetchPrimerNivel = async () => {
      const res = await fetchWithToken(`${BACKEND_URL}/api/resumen-categoria/primer-nivel`);
      const data = await res!.json();
      setPrimerNiveles(data);
    };
    fetchPrimerNivel();
  }, []);

  useEffect(() => {
    const fetchVendedores = async () => {
      const idCanal = canalSlpMap[filters.canal];
      if (!idCanal) {
        setVendedores([]);
        return;
      }

      const res = await fetchWithToken(`${BACKEND_URL}/api/metas/vendedores?id_canal=${idCanal}`);
      const data = await res!.json();
      setVendedores(data.map((v: any) => ({ id: v.id, nombre: v.NOMBRE })));
    };

    if (filters.canal) fetchVendedores();
  }, [filters.canal]);

  const handleChange = async (key: keyof MetaFilters, value: string) => {
    const updated = { ...filters, [key]: value };

    if (key === "categoria") {
      updated.subcategoria = "";
      updated.subsubcategoria = "";
      const res = await fetchWithToken(`${BACKEND_URL}/api/metas/getcat?primerNivel=${value}`);
      const data = await res!.json();
      setCategorias(data.map((cat: any) => ({
        codigo: cat.codigo_categoria,
        nombre: cat.nombre_categoria,
        imagen: cat.IMAGEN,
      })));
      setSubcategorias([]);
    }

    if (key === "subcategoria") {
      updated.subsubcategoria = "";
      const res = await fetchWithToken(`${BACKEND_URL}/api/metas/getsub?categoria=${value}`);
      const data = await res!.json();
      setSubcategorias(data.map((sub: any) => ({
        codigo: sub.codigo_subcategoria,
        nombre: sub.nombre_subcategoria,
        imagen: sub.IMAGEN,
      })));
    }

    if (key === "canal") {
      updated.vendedor = "";
    }

    setFilters(updated);
  };

  const handleChipDelete = (key: keyof MetaFilters) => {
    const updated = { ...filters, [key]: "" };

    if (key === "categoria") {
      updated.subcategoria = "";
      updated.subsubcategoria = "";
      setCategorias([]);
      setSubcategorias([]);
    }

    if (key === "subcategoria") {
      updated.subsubcategoria = "";
      setSubcategorias([]);
    }

    if (key === "canal") {
      updated.vendedor = "";
      setVendedores([]);
    }

    setFilters(updated);
    onFilterChange(updated);
  };

  const handleApply = () => {
    onFilterChange(filters);
    setOpenDrawer(false);
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
    <Box mb={2}>


    <Box mt={1} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
      {/* Chips alineados a la izquierda */}
      <Box display="flex" gap={1} flexWrap="wrap">
        {filters.periodo && (
          <Chip
            label={`Período: ${
              periodos.find((p) => p.id.toString() === filters.periodo)?.nombre || filters.periodo
            }`}
            onDelete={() => handleChipDelete("periodo")}
          />
        )}
        {filters.categoria && (
          <Chip
            label={`Primer Nivel: ${
              primerNiveles.find((cat) => cat.codigo === filters.categoria)?.nombre || filters.categoria
            }`}
            onDelete={() => handleChipDelete("categoria")}
          />
        )}
        {filters.subcategoria && (
          <Chip
            label={`Categoría: ${
              categorias.find((cat) => cat.codigo === filters.subcategoria)?.nombre || filters.subcategoria
            }`}
            onDelete={() => handleChipDelete("subcategoria")}
          />
        )}
        {filters.subsubcategoria && (
          <Chip
            label={`Subcategoría: ${
              subcategorias.find((cat) => cat.codigo === filters.subsubcategoria)?.nombre || filters.subsubcategoria
            }`}
            onDelete={() => handleChipDelete("subsubcategoria")}
          />
        )}
        {filters.canal && (
          <Chip label={`Canal: ${filters.canal}`} onDelete={() => handleChipDelete("canal")} />
        )}
        {filters.marca && (
          <Chip label={`Marca: ${filters.marca}`} onDelete={() => handleChipDelete("marca")} />
        )}
        {filters.vendedor && (
          <Chip
            label={`Vendedor: ${
              vendedores.find((v) => v.id.toString() === filters.vendedor)?.nombre || filters.vendedor
            }`}
            onDelete={() => handleChipDelete("vendedor")}
          />
        )}
      </Box>

      {/* Botón alineado a la derecha */}
      <Button
        variant="outlined"
        color="primary"
        startIcon={<FilterListIcon />}
        onClick={() => setOpenDrawer(true)}
        sx={{ whiteSpace: "nowrap" }}
      >
        Filtros
      </Button>
    </Box>



      <Drawer anchor="right" open={openDrawer} onClose={() => setOpenDrawer(false)}>
        <Box sx={{ width: 360, p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Filtros de búsqueda</Typography>
            <IconButton onClick={() => setOpenDrawer(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Período</InputLabel>
                <Select
                  value={filters.periodo}
                  onChange={(e) => handleChange("periodo", e.target.value)}
                >
                  {periodos.map((p) => (
                    <MenuItem key={p.id} value={p.id.toString()}>
                      {p.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Primer Nivel</InputLabel>
                <Select
                  value={filters.categoria}
                  onChange={(e) => handleChange("categoria", e.target.value)}
                  renderValue={(selected) => {
                    const selectedCat = primerNiveles.find((cat) => cat.codigo === selected);
                    return (
                      <Box display="flex" alignItems="center" gap={1}>
                        {selectedCat?.imagen && (
                          <Avatar src={selectedCat.imagen} sx={{ width: 24, height: 24 }} />
                        )}
                        {selectedCat?.nombre || selected}
                      </Box>
                    );
                  }}
                >
                  {primerNiveles.map((cat) => (
                    <MenuItem key={cat.codigo} value={cat.codigo}>
                      <ListItemIcon>
                        <Avatar src={cat.imagen} sx={{ width: 24, height: 24 }} />
                      </ListItemIcon>
                      <ListItemText primary={cat.nombre} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {filters.categoria && (
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Categoría</InputLabel>
                  <Select
                    value={filters.subcategoria || ""}
                    onChange={(e) => handleChange("subcategoria", e.target.value)}
                    renderValue={(selected) => {
                      const selectedCat = categorias.find((cat) => cat.codigo === selected);
                      return (
                        <Box display="flex" alignItems="center" gap={1}>
                          {selectedCat?.imagen && (
                            <Avatar src={selectedCat.imagen} sx={{ width: 24, height: 24 }} />
                          )}
                          {selectedCat?.nombre || selected}
                        </Box>
                      );
                    }}
                  >
                    {categorias.map((cat) => (
                      <MenuItem key={cat.codigo} value={cat.codigo}>
                        <ListItemIcon>
                          <Avatar src={cat.imagen} sx={{ width: 24, height: 24 }} />
                        </ListItemIcon>
                        <ListItemText primary={cat.nombre} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {filters.subcategoria && (
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Subcategoría</InputLabel>
                  <Select
                    value={filters.subsubcategoria || ""}
                    onChange={(e) => handleChange("subsubcategoria", e.target.value)}
                    renderValue={(selected) => {
                      const selectedSub = subcategorias.find((cat) => cat.codigo === selected);
                      return (
                        <Box display="flex" alignItems="center" gap={1}>
                          {selectedSub?.imagen && (
                            <Avatar src={selectedSub.imagen} sx={{ width: 24, height: 24 }} />
                          )}
                          {selectedSub?.nombre || selected}
                        </Box>
                      );
                    }}
                  >
                    {subcategorias.map((cat) => (
                      <MenuItem key={cat.codigo} value={cat.codigo}>
                        <ListItemIcon>
                          <Avatar src={cat.imagen} sx={{ width: 24, height: 24 }} />
                        </ListItemIcon>
                        <ListItemText primary={cat.nombre} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Canal</InputLabel>
                <Select
                  value={filters.canal}
                  onChange={(e) => handleChange("canal", e.target.value)}
                >
                  {Object.entries(canalSlpMap).map(([nombre, id]) => (
                    <MenuItem key={id} value={nombre}>
                      {nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {vendedores.length > 0 && (
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Vendedor</InputLabel>
                  <Select
                    value={filters.vendedor || ""}
                    onChange={(e) => handleChange("vendedor", e.target.value)}
                  >
                    {vendedores.map((v) => (
                      <MenuItem key={v.id} value={v.id.toString()}>
                        {v.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Marca</InputLabel>
                <Select
                  value={filters.marca || ""}
                  onChange={(e) => handleChange("marca", e.target.value)}
                >
                  {marcas.map((m) => (
                    <MenuItem key={m} value={m}>{m}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} display="flex" justifyContent="space-between">
              <Button variant="outlined" onClick={handleClear}>Limpiar</Button>
              <Button variant="contained" onClick={handleApply}>Aplicar</Button>
            </Grid>
          </Grid>
        </Box>
      </Drawer>
    </Box>
  );
};

export default HeaderMetasDrawer;
