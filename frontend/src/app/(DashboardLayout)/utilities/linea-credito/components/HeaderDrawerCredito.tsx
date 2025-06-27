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
  ListItemText,
  Chip
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { formatVentas } from "@/utils/format";

interface Props {
  open: boolean;
  onClose: () => void;
  onApply: (filters: FiltrosLineaCredito) => void;
}

export type FiltrosLineaCredito = {
  rut: string;
  estadoCuenta: string;
  riesgo: string[];
  tipoCliente: string[];
  estadoDeuda: string;
  canal: string[];
  montoDesde: string;
  montoHasta: string;
  fechaInicio: string;
  fechaFin: string;
};

const HeaderDrawerLineaCredito: React.FC<Props> = ({ open, onClose, onApply }) => {
  const [filters, setFilters] = useState<FiltrosLineaCredito>({
    rut: "",
    estadoCuenta: "",
    riesgo: [],
    tipoCliente: [],
    estadoDeuda: "",
    canal: [],
    montoDesde: "0",
    montoHasta: "150000000",
    fechaInicio: "",
    fechaFin: "",
  });

  const [montoRange, setMontoRange] = useState<number[]>([0, 150000000]);

  const handleChange = (key: keyof FiltrosLineaCredito, value: any) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleClear = () => {
    setMontoRange([0, 150000000]);
    setFilters({
      rut: "",
      estadoCuenta: "",
      riesgo: [],
      tipoCliente: [],
      estadoDeuda: "",
      canal: [],
      montoDesde: "0",
      montoHasta: "150000000",
      fechaInicio: "",
      fechaFin: "",
    });
  };

  const handleMontoChange = (_: Event, newValue: number | number[]) => {
    const [desde, hasta] = newValue as number[];
    setMontoRange([desde, hasta]);
    setFilters({ ...filters, montoDesde: desde.toString(), montoHasta: hasta.toString() });
  };

  const opciones = {
    estadoCuenta: ["Activo", "Inactivo"],
    riesgo: ["Alto", "Medio", "Bajo"],
    tipoCliente: [
      "Clientes", "Prov.Nacional", "Cliente Terreno", "Cliente Agricola",
      "Prov.Honorario", "Prov.Extranjero", "Cliente Personal", "Club del Maestro",
      "Cliente Proveedor", "Grupo Mimbral", "Cliente interno", "Venta Empresa",
      "Entidades Publicas", "Cliente Premium", "Cliente Preferencial", "EERR",
      "Grupo Proyecto", "Grupo Red"
    ],
    estadoDeuda: ["Activo", "Inactivo"],
    canal: ["Empresas", "Meli", "Vitex", "Chorrillo", "Balmaceda"]
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

        {(["estadoCuenta", "estadoDeuda"] as const).map((key) => (
          <Grid item key={key}>
            <FormControl fullWidth size="small">
              <InputLabel>{key.replace(/([A-Z])/g, " $1")}</InputLabel>
              <Select
                value={filters[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                label={key.replace(/([A-Z])/g, " $1")}
              >
                <MenuItem value="">Todos</MenuItem>
                {opciones[key].map((valor) => (
                  <MenuItem key={valor} value={valor}>{valor}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        ))}

        {(["riesgo", "tipoCliente", "canal"] as const).map((key) => (
          <Grid item key={key}>
            <FormControl fullWidth size="small">
              <InputLabel>{key.replace(/([A-Z])/g, " $1")}</InputLabel>
              <Select
                multiple
                value={filters[key]}
                onChange={(e) => handleChange(key, typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                renderValue={(selected) => {
                  const items = selected as string[];
                  if (items.length <= 2) return items.join(", ");
                  return `${items.slice(0, 2).join(", ")} +${items.length - 2}`;
                }}
                label={key.replace(/([A-Z])/g, " $1")}
              >
                {opciones[key].map((valor) => (
                  <MenuItem key={valor} value={valor}>
                    <Checkbox checked={filters[key].indexOf(valor) > -1} />
                    <ListItemText primary={valor} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        ))}

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

        <Grid item>
          <TextField
            label="Fecha inicio"
            type="date"
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
            value={filters.fechaInicio}
            onChange={(e) => handleChange("fechaInicio", e.target.value)}
          />
        </Grid>
        <Grid item>
          <TextField
            label="Fecha fin"
            type="date"
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
            value={filters.fechaFin}
            onChange={(e) => handleChange("fechaFin", e.target.value)}
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
