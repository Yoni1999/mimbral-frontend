"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Drawer,
  Typography,
  IconButton,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Checkbox,
  ListItemText,
  OutlinedInput,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";

interface Props {
  open: boolean;
  onClose: () => void;
  onApply: (filters: Filters) => void;
}

export type Filters = {
  almacen: string;
  primerNivel: string[];
  categoria: string[];
  subcategoria: string[];
  marca: string[];
  proveedor: string[];
  fechaInicio: string;
  fechaFin: string;
  modoComparacion: "PeriodoAnterior" | "MismoPeriodoAnoAnterior" | "";
};

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 6.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const HeaderDrawerSupply: React.FC<Props> = ({ open, onClose, onApply }) => {
  const [filters, setFilters] = useState<Filters>({
    almacen: "",
    primerNivel: [],
    categoria: [],
    subcategoria: [],
    marca: [],
    proveedor: [],
    fechaInicio: "",
    fechaFin: "",
    modoComparacion: "",
  });

  const [categorias, setCategorias] = useState<string[]>([]);
  const [proveedores, setProveedores] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resCat = await fetchWithToken(`${BACKEND_URL}/api/resumen-categoria/primer-nivel`);
        const resProv = await fetchWithToken(`${BACKEND_URL}/api/proveedores/listado`);
        const dataCat = await resCat!.json();
        const dataProv = await resProv!.json();
        setCategorias(dataCat.map((c: any) => c.name));
        setProveedores(dataProv.map((p: any) => p.NombreProveedor));
      } catch (error) {
        console.error("Error cargando filtros:", error);
      }
    };
    fetchData();
  }, []);

  const handleChange = (key: keyof Filters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClear = () => {
    setFilters({
      almacen: "",
      primerNivel: [],
      categoria: [],
      subcategoria: [],
      marca: [],
      proveedor: [],
      fechaInicio: "",
      fechaFin: "",
      modoComparacion: "",
    });
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", sm: 400 }, p: 3 } }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Filtros Supply Chain</Typography>
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </Box>

      <Grid container spacing={2} direction="column">
        <Grid item>
          <FormControl fullWidth size="small">
            <InputLabel>Almacén</InputLabel>
            <Select
              value={filters.almacen}
              onChange={(e) => handleChange("almacen", e.target.value)}
              label="Almacén"
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="07">Almacén 07</MenuItem>
              <MenuItem value="08">Almacén 08</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {["primerNivel", "categoria", "subcategoria", "marca", "proveedor"].map((key) => (
          <Grid item key={key}>
            <FormControl fullWidth size="small">
              <InputLabel>{key.charAt(0).toUpperCase() + key.slice(1)}</InputLabel>
              <Select
                multiple
                value={filters[key as keyof Filters] as string[]}
                onChange={(e) => handleChange(key as keyof Filters, e.target.value)}
                input={<OutlinedInput label={key} />}
                renderValue={(selected) => (selected as string[]).join(", ")}
                MenuProps={MenuProps}
              >
                {(key === "proveedor" ? proveedores : categorias).map((name) => (
                  <MenuItem key={name} value={name}>
                    <Checkbox checked={(filters[key as keyof Filters] as string[]).indexOf(name) > -1} />
                    <ListItemText primary={name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        ))}

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
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="contained"
              onClick={() => {
                onApply(filters);
                onClose();
              }}
            >
              Aplicar
            </Button>
          </Grid>
        </Grid>
      </Grid>
    </Drawer>
  );
};

export default HeaderDrawerSupply;