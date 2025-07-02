"use client";

import React, { useState } from "react";
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
  Slider,
  Checkbox,
  ListItemText
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { formatVentas } from "@/utils/format";

interface Props {
  open: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
}

const HeaderDrawerLineaCredito: React.FC<Props> = ({ open, onClose, onApply }) => {
  const [filters, setFilters] = useState({
    rut: "",
    estado: "",
    tieneDeuda: "",
    tipoCliente: [] as string[],
    montoInicio: 0,
    montoFin: 150000000,
  });

  const [montoRange, setMontoRange] = useState<number[]>([0, 150000000]);

  const handleChange = (key: string, value: any) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleClear = () => {
    setMontoRange([0, 150000000]);
    setFilters({
      rut: "",
      estado: "",
      tieneDeuda: "",
      tipoCliente: [],
      montoInicio: 0,
      montoFin: 150000000,
    });
  };

  const handleMontoChange = (_: Event, newValue: number | number[]) => {
    const [desde, hasta] = newValue as number[];
    setMontoRange([desde, hasta]);
    setFilters({ ...filters, montoInicio: desde, montoFin: hasta });
  };

  const tipoClienteOptions = [
    { label: "Clientes", value: "100" },
    { label: "Prov.Nacional", value: "101" },
    { label: "Cliente Terreno", value: "102" },
    { label: "Cliente Agricola", value: "103" },
    { label: "Prov.Honorario", value: "104" },
    { label: "Prov.Extranjero", value: "105" },
    { label: "Cliente Personal", value: "106" },
    { label: "Club del Maestro", value: "108" },
    { label: "Cliente Proveedor", value: "109" },
    { label: "Grupo Mimbral", value: "110" },
    { label: "Cliente interno", value: "111" },
    { label: "Venta Empresa", value: "112" },
    { label: "Entidades Publicas", value: "113" },
    { label: "Cliente Premium", value: "115" },
    { label: "Cliente Preferencial", value: "116" },
    { label: "EERR", value: "117" },
    { label: "Grupo Proyecto", value: "118" },
    { label: "Grupo Red", value: "119" }
  ];

  const opciones = {
    estado: ["Y", "N"],
    tieneDeuda: [
      { label: "Todos", value: "" },
      { label: "Con deuda", value: "1" },
      { label: "Sin deuda", value: "0" }
    ]
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
          <TextField
            label="RUT"
            fullWidth
            size="small"
            value={filters.rut}
            onChange={(e) => handleChange("rut", e.target.value)}
          />
        </Grid>

        <Grid item>
          <FormControl fullWidth size="small">
            <InputLabel>Estado</InputLabel>
            <Select
              value={filters.estado}
              onChange={(e) => handleChange("estado", e.target.value)}
              label="Estado"
            >
              <MenuItem value="">Todos</MenuItem>
              {opciones.estado.map((valor) => (
                <MenuItem key={valor} value={valor}>{valor === "Y" ? "Activo" : "Inactivo"}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item>
          <FormControl fullWidth size="small">
            <InputLabel>Estado Deuda</InputLabel>
            <Select
              value={filters.tieneDeuda}
              onChange={(e) => handleChange("tieneDeuda", e.target.value)}
              label="Estado Deuda"
            >
              {opciones.tieneDeuda.map((op) => (
                <MenuItem key={op.value} value={op.value}>{op.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item>
          <FormControl fullWidth size="small">
            <InputLabel>Tipo Cliente</InputLabel>
            <Select
              multiple
              value={filters.tipoCliente}
              onChange={(e) => handleChange("tipoCliente", typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
              renderValue={(selected) => {
                const items = selected as string[];
                if (items.length <= 2) return tipoClienteOptions.filter(opt => items.includes(opt.value)).map(opt => opt.label).join(", ");
                const visibles = tipoClienteOptions.filter(opt => items.includes(opt.value)).slice(0, 2).map(opt => opt.label);
                return `${visibles.join(", ")} +${items.length - 2}`;
              }}
              label="Tipo Cliente"
            >
              {tipoClienteOptions.map((op) => (
                <MenuItem key={op.value} value={op.value}>
                  <Checkbox checked={filters.tipoCliente.indexOf(op.value) > -1} />
                  <ListItemText primary={op.label} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item>
          <Typography variant="subtitle2" gutterBottom>
            Rango Monto ({ formatVentas(montoRange[0])} a { formatVentas(montoRange[1])}):
          </Typography>
          <Slider
            value={montoRange}
            min={0}
            max={150000000}
            step={1000000}
            onChange={handleMontoChange}
            valueLabelDisplay="auto"
            getAriaLabel={() => "Rango de monto"}
            getAriaValueText={(value) => formatVentas(value)}
            valueLabelFormat={(value) => formatVentas(value)}
          />
        </Grid>

        <Grid item container spacing={2}>
          <Grid item xs={6}>
            <Button fullWidth variant="outlined" onClick={handleClear} startIcon={<DeleteOutlineIcon />}>Limpiar</Button>
          </Grid>
          <Grid item xs={6}>
            <Button fullWidth variant="contained" onClick={() => { onApply(filters); onClose(); }}>Aplicar</Button>
          </Grid>
        </Grid>
      </Grid>
    </Drawer>
  );
};

export default HeaderDrawerLineaCredito;