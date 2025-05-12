"use client";

import React from "react";
import {
  Box,
  Grid,
  Typography,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

export interface Filters {
  vendedorEmpresa: string;
  temporada: string;
  periodo: string;
  fechaInicio: string;
  fechaFin: string;
  modoComparacion: string;
  canal: string;
}

interface HeaderVendedorProps {
  filtros: Filters;
  setFiltros: React.Dispatch<React.SetStateAction<Filters>>;
  onAplicar: () => void;
}

const HeaderVendedor: React.FC<HeaderVendedorProps> = ({
  filtros,
  setFiltros,
  onAplicar,
}) => {
  const handleChange = (key: keyof Filters, value: string) => {
    setFiltros((prev) => {
      let nuevoEstado = { ...prev, [key]: value };

      if (key === "periodo") {
        // Si se elige un período, limpiar fechas
        nuevoEstado.fechaInicio = "";
        nuevoEstado.fechaFin = "";
      }

      if (key === "fechaInicio" || key === "fechaFin") {
        // Si se cambia alguna fecha, limpiar período
        nuevoEstado.periodo = "";
      }

      return nuevoEstado;
    });
  };


  const handleClear = () => {
    setFiltros({
      vendedorEmpresa: "",
      temporada: "",
      periodo: "",
      fechaInicio: "",
      fechaFin: "",
      modoComparacion: "", 
      canal: "", // puedes dejar un valor por defecto si lo deseas
    });
  };

  return (
    <Box
      sx={{
        mb: 2,
        px: 2,
        py: 2,
        backgroundColor: "rgba(255, 255, 255, 0.5)",
        borderRadius: 1,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
        backdropFilter: "blur(6px)",
        border: "1px solid rgba(255, 255, 255, 0.3)",
      }}
    >
      <Grid container alignItems="center" spacing={2}>
        {/* Avatar y nombre */}
        <Grid item xs={12} md={3}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar
              src="https://randomuser.me/api/portraits/men/32.jpg"
              sx={{ width: 56, height: 56 }}
            />
            <Box>
              <Typography variant="h6" fontWeight={700} color="text.primary">
                Fernando Cancino
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Vendedor Terreno
              </Typography>
            </Box>
          </Box>
        </Grid>

        {/* Filtros */}
        <Grid item xs={12} md={9}>
          <Grid container spacing={1.5} justifyContent="flex-end">
            {/* Canal */}
            <Grid item xs={6} sm={3} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Canal</InputLabel>
                <Select
                  value={filtros.canal || ""}
                  onChange={(e) => handleChange("canal", e.target.value)}
                  label="Canal"
                  sx={{ fontSize: "0.75rem", height: 36 }}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="chorrillo">Sucursal Chorrillo</MenuItem>
                  <MenuItem value="empresas">Ventas Empresas</MenuItem>
                  <MenuItem value="balmaceda">Sucursal Balmaceda</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Vendedor */}
            <Grid item xs={6} sm={3} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Vendedor</InputLabel>
                <Select
                  value={filtros.vendedorEmpresa}
                  onChange={(e) =>
                    handleChange("vendedorEmpresa", e.target.value)
                  }
                  label="Vendedor"
                  sx={{ fontSize: "0.75rem", height: 36 }}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="fernando">Fernando Cancino</MenuItem>
                  <MenuItem value="pedro">Pedro García</MenuItem>
                  <MenuItem value="maria">María López</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {/* Temporada */}
            <Grid item xs={6} sm={3} md={2.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Temporada</InputLabel>
                <Select
                  value={filtros.temporada}
                  onChange={(e) =>
                    handleChange("temporada", e.target.value)
                  }
                  label="Temporada"
                  sx={{ fontSize: "0.75rem", height: 36 }}
                >
                  <MenuItem value="">Todas</MenuItem>
                  <MenuItem value="verano">Verano</MenuItem>
                  <MenuItem value="invierno">Invierno</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Periodo */}
            <Grid item xs={6} sm={3} md={2.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Período</InputLabel>
                <Select
                  value={filtros.periodo}
                  onChange={(e) =>
                    handleChange("periodo", e.target.value)
                  }
                  label="Período"
                  sx={{ fontSize: "0.75rem", height: 36 }}
                >
                  <MenuItem value="1D">Hoy</MenuItem>
                  <MenuItem value="7D">Últimos 7 días</MenuItem>
                  <MenuItem value="14D">Últimos 14 días</MenuItem>
                  <MenuItem value="1M">Mes actual</MenuItem>
                  <MenuItem value='3M'>3 meses</MenuItem>
                  <MenuItem value='6M'>6 meses</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Fecha Inicio */}
            <Grid item xs={6} sm={3} md={2}>
              <TextField
                label="Inicio"
                type="date"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={filtros.fechaInicio}
                onChange={(e) =>
                  handleChange("fechaInicio", e.target.value)
                }
                inputProps={{ style: { fontSize: "0.75rem", height: 16 } }}
              />
            </Grid>

            {/* Fecha Fin */}
            <Grid item xs={6} sm={3} md={2}>
              <TextField
                label="Fin"
                type="date"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={filtros.fechaFin}
                onChange={(e) =>
                  handleChange("fechaFin", e.target.value)
                }
                inputProps={{ style: { fontSize: "0.75rem", height: 16 } }}
              />
            </Grid>

            {/* Botones */}
            <Grid item xs={6} sm={3} md={1.5}>
              <Button
                variant="contained"
                size="small"
                fullWidth
                onClick={onAplicar}
              >
                Aplicar
              </Button>
            </Grid>
            <Grid item xs={6} sm={3} md={1.5}>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                fullWidth
                onClick={handleClear}
                startIcon={<DeleteOutlineIcon />}
              >
                Limpiar
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HeaderVendedor;
