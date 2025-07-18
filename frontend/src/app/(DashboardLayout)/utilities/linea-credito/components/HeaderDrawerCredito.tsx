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
  Slider,
  Checkbox,
  ListItemText,
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { formatVentas } from "@/utils/format";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";

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
  const [tipoClienteOptions, setTipoClienteOptions] = useState<{ label: string; value: string }[]>([]);
  const [rutOptions, setRutOptions] = useState<{ CardCode: string; CardName: string; LicTradNum: string }[]>([]);
  const [loadingRut, setLoadingRut] = useState(false);

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

  useEffect(() => {
    const fetchTiposCliente = async () => {
      try {
        const res = await fetchWithToken(`${BACKEND_URL}/api/tiposcliente`);
        const data = await res!.json();
        const formatted = data.map((item: any) => ({
          label: item.GroupName,
          value: item.GroupCode.toString()
        }));
        setTipoClienteOptions(formatted);
      } catch (error) {
        console.error("Error al cargar tipos de cliente", error);
      }
    };

    fetchTiposCliente();
  }, []);

  const handleRutInputChange = async (_: any, value: string) => {
    if (!value || value.length < 2) {
      setRutOptions([]);
      return;
    }
    setLoadingRut(true);
    try {
      const res = await fetchWithToken(`${BACKEND_URL}/api/buscar-rut?query=${encodeURIComponent(value)}`);
      const data = await res!.json();
      setRutOptions(data);
    } catch (error) {
      console.error("Error al buscar rut:", error);
    } finally {
      setLoadingRut(false);
    }
  };

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
          <Autocomplete
            freeSolo
            size="small"
            options={rutOptions}
            loading={loadingRut}
            getOptionLabel={(option) =>
              typeof option === "string"
                ? option
                : `${option.CardCode} - ${option.CardName}`
            }
            isOptionEqualToValue={(option, value) =>
              option.LicTradNum === value.LicTradNum
            }
            onInputChange={(_, value) => handleRutInputChange(_, value)}
            onChange={(_, newValue) => {
              if (typeof newValue === "string") {
                handleChange("rut", newValue.split('-')[0]); // por si escriben el RUT completo manualmente
              } else if (newValue) {
                const rutSinDv = newValue.LicTradNum.split('-')[0];
                handleChange("rut", rutSinDv);
              } else {
                handleChange("rut", "");
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Buscar RUT"
                fullWidth
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingRut ? <CircularProgress size={18} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
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
              onChange={(e) =>
                handleChange(
                  "tipoCliente",
                  typeof e.target.value === "string"
                    ? e.target.value.split(",")
                    : e.target.value
                )
              }
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
            Rango Monto ({formatVentas(montoRange[0])} a {formatVentas(montoRange[1])}):
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
