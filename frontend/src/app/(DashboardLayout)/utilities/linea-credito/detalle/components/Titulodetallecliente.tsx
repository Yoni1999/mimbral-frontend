"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Paper,
  Button,
  Slider,
  TextField,
} from "@mui/material";
import { DeleteOutline } from "@mui/icons-material";
import { formatVentas } from "@/utils/format";

// ✅ Cambiado: ahora recibe `descripcionPeriodo` como string
interface Props {
  descripcionPeriodo: string;
  onApply: (filters: {
    rut: string;
    montoDesde: number;
    montoHasta: number;
    fechaInicio: string;
    fechaFin: string;
  }) => void;
}

const HeaderLineaCredito: React.FC<Props> = ({
  descripcionPeriodo,
  onApply,
}) => {
  const [rut, setRut] = useState("");
  const [montoRange, setMontoRange] = useState<number[]>([0, 100000000]);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const handleMontoChange = (_: Event, newValue: number | number[]) => {
    setMontoRange(newValue as number[]);
  };

  const handleApply = () => {
    onApply({
      rut,
      montoDesde: montoRange[0],
      montoHasta: montoRange[1],
      fechaInicio,
      fechaFin,
    });
  };

  const handleClear = () => {
    setRut("");
    setMontoRange([0, 100000000]);
    setFechaInicio("");
    setFechaFin("");
  };

  return (
    <Stack spacing={{ xs: 0.5, md: 1 }}>
      {/* Línea de periodo */}
      <Box display="flex" justifyContent="flex-end">
        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{ fontSize: { xs: "0.7rem", md: "0.875rem" }, lineHeight: { xs: 1.3, md: 1.57 } }}
        >
          Estás viendo el periodo:{" "}
          <Typography
            component="span"
            fontWeight={600}
            color="text.primary"
            sx={{ fontSize: "inherit" }}
          >
            {descripcionPeriodo}
          </Typography>
        </Typography>
      </Box>

      {/* Título y filtros */}
      <Paper
        elevation={2}
        sx={{
          p: { xs: 1.5, md: 3 },
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: { xs: 1, md: 2 },
        }}
      >
        {/* Título */}
        <Typography
          variant="h6"
          fontWeight={700}
          sx={{ fontSize: { xs: "1.05rem", md: "1.25rem" } }}
        >
          DETALLE CLIENTE
        </Typography>

        {/* Filtros alineados a la derecha */}
        <Box
          display="flex"
          alignItems="center"
          gap={{ xs: 1, md: 2 }}
          flexWrap="wrap"
          sx={{ width: { xs: "100%", md: "auto" } }}
        >
          {/* Buscar por RUT */}
          <TextField
            label="Buscar RUT"
            size="small"
            value={rut}
            onChange={(e) => setRut(e.target.value)}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          />

          {/* Rango monto */}
          <Box textAlign="right">
            <Typography variant="caption" color="text.secondary">
              Desde
            </Typography>
            <Typography variant="body2">
              {formatVentas(montoRange[0])}
            </Typography>
          </Box>
          <Box textAlign="right">
            <Typography variant="caption" color="text.secondary">
              Hasta
            </Typography>
            <Typography variant="body2">
              {formatVentas(montoRange[1])}
            </Typography>
          </Box>
          <Box sx={{ width: { xs: "100%", sm: 180 } }}>
            <Slider
              size="small"
              value={montoRange}
              onChange={handleMontoChange}
              min={0}
              max={100000000}
              step={1000000}
            />
          </Box>

          {/* Fechas */}
          <TextField
            label="Inicio"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            sx={{ width: { xs: "calc(50% - 4px)", sm: "auto" } }}
          />
          <TextField
            label="Fin"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            sx={{ width: { xs: "calc(50% - 4px)", sm: "auto" } }}
          />

          {/* Botones */}
          <Button
            variant="contained"
            size="small"
            onClick={handleApply}
            sx={{ textTransform: "none", fontWeight: 500 }}
          >
            Aplicar
          </Button>
          <Button
            onClick={handleClear}
            size="small"
            color="primary"
            startIcon={<DeleteOutline />}
            sx={{ textTransform: "none", fontWeight: 500 }}
          >
            Limpiar filtros
          </Button>
        </Box>
      </Paper>
    </Stack>
  );
};

export default HeaderLineaCredito;
