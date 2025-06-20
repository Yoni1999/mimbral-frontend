"use client";

import { useState, MouseEvent, useEffect } from "react";
import {
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Typography,
  Popover,
  styled,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearAllIcon from "@mui/icons-material/ClearAll";

export interface Filters {
  canal: string;
  periodo: string;
  fechaInicio: string;
  fechaFin: string;
}

interface HeaderFiltersProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
}

const ArrowPopover = styled(Popover)(({ theme }) => ({
  "& .MuiPaper-root": {
    position: "relative",
    padding: theme.spacing(1),
    maxWidth: 240,
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: "30%",
      transform: "translateY(-100%)",
      borderLeft: "6px solid transparent",
      borderRight: "6px solid transparent",
      borderBottom: `6px solid ${theme.palette.background.paper}`,
    },
  },
}));

const HeaderFilters = ({ filters, onFilterChange }: HeaderFiltersProps) => {
  const [canal, setCanal] = useState(filters.canal || "");
  const [periodo, setPeriodo] = useState(filters.periodo || "");
  const [fechaInicio, setFechaInicio] = useState(filters.fechaInicio || "");
  const [fechaFin, setFechaFin] = useState(filters.fechaFin || "");

  useEffect(() => {
    setCanal(filters.canal || "");
    setPeriodo(filters.periodo || "");
    setFechaInicio(filters.fechaInicio || "");
    setFechaFin(filters.fechaFin || "");
  }, [filters]);

  const [error, setError] = useState("");
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const dateRangeSelected = Boolean(fechaInicio || fechaFin);
  const periodSelected = Boolean(periodo);

  const handlePeriodoChange = (value: string) => {
    setPeriodo(value);
    setFechaInicio("");
    setFechaFin("");
  };

  const handleFechaInicioChange = (value: string) => {
    setFechaInicio(value);
    if (value || fechaFin) {
      setPeriodo("");
    }
  };

  const handleFechaFinChange = (value: string) => {
    setFechaFin(value);
    if (value || fechaInicio) {
      setPeriodo("");
    }
  };

  const handleApplyFilters = (event: MouseEvent<HTMLButtonElement>) => {
    if (canal && !periodSelected && !dateRangeSelected) {
      setError("Debes seleccionar un período o fecha.");
      setAnchorEl(event.currentTarget);
      return;
    }
    setError("");
    setAnchorEl(null);
    onFilterChange({ canal, periodo, fechaInicio, fechaFin });
  };

  const handleClearFilters = () => {
    setCanal("");
    setPeriodo("1D");
    setFechaInicio("");
    setFechaFin("");
    setError("");
    setAnchorEl(null);

    localStorage.removeItem("filtrosVentasCanal");

    onFilterChange({
      canal: "",
      periodo: "1D",
      fechaInicio: "",
      fechaFin: "",
    });
  };

  const handleClosePopover = () => {
    setError("");
    setAnchorEl(null);
  };

  return (
    <Box
      sx={{
        mb: 3,
        p: 2,
        bgcolor: "background.paper",
        borderRadius: 2,
        boxShadow: 2,
      }}
    >
      <Grid container spacing={2} alignItems="center">
        <Grid item sx={{ display: "flex", alignItems: "center" }}>
          <FilterListIcon sx={{ mr: 1, fontSize: 24, color: "primary.main" }} />
          <Typography variant="h6" color="primary" sx={{ mr: 2 }}>
            Filtros
          </Typography>
        </Grid>



         <Grid item xs={12} sm={2} md={2}>
          <FormControl
            fullWidth
            size="small"
            sx={{
              backgroundColor: "#ffffff",
              borderRadius: 2,
              ".MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          >
            <InputLabel id="canal-label">Canal</InputLabel>
            <Select
              labelId="canal-label"
              value={canal}
              label="Canal"
              onChange={(e) => setCanal(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="Meli">Meli</MenuItem>
              <MenuItem value="Falabella">Falabella</MenuItem>
              <MenuItem value="Balmaceda">Balmaceda</MenuItem>
              <MenuItem value="Vtex">Vitex</MenuItem>
              <MenuItem value="Chorrillo">Chorrillo</MenuItem>
              <MenuItem value="Empresas">Empresas</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Select Período */}
        <Grid item xs={12} sm={2} md={2}>
          <FormControl
            fullWidth
            size="small"
            disabled={dateRangeSelected}
            sx={{
              backgroundColor: "#ffffff",
              borderRadius: 2,
              ".MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          >
            <InputLabel id="periodo-label">Período</InputLabel>
            <Select
              labelId="periodo-label"
              value={periodo}
              label="Período"
              onChange={(e) => handlePeriodoChange(e.target.value)}
            >
              <MenuItem value="">Sin período</MenuItem>
              <MenuItem value="1D">Hoy</MenuItem>
              <MenuItem value="7D">Últimos 7 días</MenuItem>
              <MenuItem value="14D">Últimos 14 días</MenuItem>
              <MenuItem value="1M">Mes Actual</MenuItem>
              <MenuItem value="3M">Últimos 3 meses</MenuItem>
              <MenuItem value="6M">Últimos 6 meses</MenuItem>
              <MenuItem value="1A">Último año</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Fecha Inicio */}
        <Grid item xs={12} sm={2} md={1.2}>
          <TextField
            label="Fecha Inicio"
            type="date"
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
            value={fechaInicio}
            onChange={(e) => handleFechaInicioChange(e.target.value)}
            disabled={false}
            sx={{
              backgroundColor: "#ffffff",
              borderRadius: 2,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />
        </Grid>

        {/* Fecha Fin */}
        <Grid item xs={12} sm={2} md={1.2}>
          <TextField
            label="Fecha Fin"
            type="date"
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
            value={fechaFin}
            onChange={(e) => handleFechaFinChange(e.target.value)}
            disabled={false}
            sx={{
              backgroundColor: "#ffffff",
              borderRadius: 2,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />
        </Grid>

        {/* Botones */}
        <Grid
          item
          xs={12}
          sm={4}
          md={2.6}
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 1,
            ml: "auto", // empuja el item hacia la derecha
          }}
        >
          <Button
            variant="contained"
            color="primary"
            onClick={handleApplyFilters}
            size="small"
            sx={{ borderRadius: 2, textTransform: "none" }}
          >
            Aplicar
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleClearFilters}
            size="small"
            startIcon={<ClearAllIcon />}
            sx={{ borderRadius: 2, textTransform: "none" }}
          >
            Limpiar
          </Button>
        </Grid>
      </Grid>

      <ArrowPopover
        open={Boolean(error) && Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        {error && (
          <Typography variant="caption" color="error">
            {error}
          </Typography>
        )}
      </ArrowPopover>
    </Box>
  );
};

export default HeaderFilters;




/*"use client";

import { useState, MouseEvent, useEffect } from "react";
import {
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Typography,
  Popover,
  styled,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearAllIcon from "@mui/icons-material/ClearAll";

export interface Filters {
  canal: string;
  vendedorEmpresa: string;
  periodo: string;
  fechaInicio: string;
  fechaFin: string;
}

interface HeaderFiltersProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
}
const ArrowPopover = styled(Popover)(({ theme }) => ({
  "& .MuiPaper-root": {
    position: "relative",
    padding: theme.spacing(1),
    maxWidth: 240,
    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: "30%",
      transform: "translateY(-100%)",
      borderLeft: "6px solid transparent",
      borderRight: "6px solid transparent",
      borderBottom: `6px solid ${theme.palette.background.paper}`,
    },
  },
}));
const vendedores = [
  { codigo: "227", nombre: "Sonia Herrera" },
  { codigo: "250", nombre: "Maria Ines Miño" },
  { codigo: "209", nombre: "Jose Armando" },
  { codigo: "205", nombre: "Guisela Sepulveda" },
  { codigo: "138", nombre: "Laura Lara" },
  { codigo: "228", nombre: "Victor Miño" },
  { codigo: "226", nombre: "Renan Retamal" },
  { codigo: "137", nombre: "Jorge Nuñez" },
  { codigo: "212", nombre: "Fernando Cancino" },
];
const HeaderFilters = ({ filters, onFilterChange }: HeaderFiltersProps) => {
  const [canal, setCanal] = useState(filters.canal || "");
  const [vendedorEmpresa, setVendedorEmpresa] = useState(filters.vendedorEmpresa || "");
  const [periodo, setPeriodo] = useState(filters.periodo || "");
  const [fechaInicio, setFechaInicio] = useState(filters.fechaInicio || "");
  const [fechaFin, setFechaFin] = useState(filters.fechaFin || "");

  useEffect(() => {
    setCanal(filters.canal || "");
    setVendedorEmpresa(filters.vendedorEmpresa || "");
    setPeriodo(filters.periodo || "");
    setFechaInicio(filters.fechaInicio || "");
    setFechaFin(filters.fechaFin || "");
  }, [filters]);

  const [error, setError] = useState("");
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const dateRangeSelected = Boolean(fechaInicio || fechaFin);
  const periodSelected = Boolean(periodo);

  const handleCanalChange = (value: string) => {
    setCanal(value);
    if (value !== "Empresas") {
      setVendedorEmpresa("");
    }
  };


  const handlePeriodoChange = (value: string) => {
    setPeriodo(value);
    setFechaInicio("");
    setFechaFin("");
  };

  const handleFechaInicioChange = (value: string) => {
    setFechaInicio(value);
    if (value || fechaFin) {
      setPeriodo("");
    }
  };

  const handleFechaFinChange = (value: string) => {
    setFechaFin(value);
    if (value || fechaInicio) {
      setPeriodo("");
    }
  };

  const handleApplyFilters = (event: MouseEvent<HTMLButtonElement>) => {
    if (canal && !periodSelected && !dateRangeSelected) {
      setError("Debes seleccionar un período o fecha.");
      setAnchorEl(event.currentTarget); 
      return;
    }
    setError("");
    setAnchorEl(null);
    onFilterChange({ canal, vendedorEmpresa, periodo, fechaInicio, fechaFin });
  };

  const handleClearFilters = () => {
    setCanal("");
    setVendedorEmpresa("");
    setPeriodo("1D");
    setFechaInicio("");
    setFechaFin("");
    setError("");
    setAnchorEl(null);
  

    localStorage.removeItem("filtrosVentasCanal");
  
    onFilterChange({
      canal: "",
      vendedorEmpresa: "",
      periodo: "1D",
      fechaInicio: "",
      fechaFin: "",
    });
  };
  

  const handleClosePopover = () => {
    setError("");
    setAnchorEl(null);
  };

  return (
    <Box
      sx={{
        mb: 3,
        p: 2,
        bgcolor: "background.paper",
        borderRadius: 2,
        boxShadow: 2,
      }}
    >
      <Grid container spacing={2} alignItems="center">
        <Grid item sx={{ display: "flex", alignItems: "center" }}>
          <FilterListIcon sx={{ mr: 1, fontSize: 24, color: "primary.main" }} />
          <Typography variant="h6" color="primary" sx={{ mr: 2 }}>
            Filtros
          </Typography>
        </Grid>

        <Grid item xs={12} sm={2} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel id="canal-label">Canal</InputLabel>
            <Select
              labelId="canal-label"
              value={canal}
              label="Canal"
              onChange={(e) => handleCanalChange(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="Meli">Meli</MenuItem>
              <MenuItem value="Falabella">Falabella</MenuItem>
              <MenuItem value="Balmaceda">Balmaceda</MenuItem>
              <MenuItem value="Vitex">Vitex</MenuItem>
              <MenuItem value="Chorrillo">Chorrillo</MenuItem>
              <MenuItem value="Empresas">Empresas</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={2} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel id="vendedor-label">Vendedor Empresa</InputLabel>
            <Select
              labelId="vendedor-label"
              value={vendedorEmpresa}
              onChange={(e) => setVendedorEmpresa(e.target.value)}
              disabled={canal !== "Empresas"}
            >
              <MenuItem value="">Todos</MenuItem>
              {vendedores.map((vendedor) => (
                <MenuItem key= {vendedor.codigo} value={vendedor.codigo}>
                  {vendedor.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={2} md={2}>
          <FormControl fullWidth size="small" disabled={dateRangeSelected}>
            <InputLabel id="periodo-label">Período</InputLabel>
            <Select
              labelId="periodo-label"
              value={periodo}
              label="Período"
              onChange={(e) => handlePeriodoChange(e.target.value)}
            >
              <MenuItem value="">Sin período</MenuItem>
              <MenuItem value="1D">Hoy</MenuItem>
              <MenuItem value="7D">Últimos 7 días</MenuItem>
              <MenuItem value="14D">Últimos 14 días</MenuItem>
              <MenuItem value="1M">Mes Actual</MenuItem>
              <MenuItem value="3M">Últimos 3 meses</MenuItem>
              <MenuItem value="6M">Últimos 6 meses</MenuItem>
              <MenuItem value="1A">Último año</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={2} md={1.2}>
          <TextField
            label="Fecha Inicio"
            type="date"
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
            value={fechaInicio}
            onChange={(e) => handleFechaInicioChange(e.target.value)}
            disabled={periodSelected}
          />
        </Grid>

        <Grid item xs={12} sm={2} md={1.2}>
          <TextField
            label="Fecha Fin"
            type="date"
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
            value={fechaFin}
            onChange={(e) => handleFechaFinChange(e.target.value)}
            disabled={periodSelected}
          />
        </Grid>

        <Grid
          item
          xs={12}
          sm={4}
          md={2}
          sx={{
            display: "flex",
            justifyContent: { xs: "flex-start", md: "flex-end" },
            gap: 1,
          }}
        >
          <Button
            variant="contained"
            color="primary"
            onClick={handleApplyFilters}
            size="small"
          >
            Aplicar
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleClearFilters}
            size="small"
            startIcon={<ClearAllIcon />}
          >
            Limpiar
          </Button>
        </Grid>
      </Grid>

      <ArrowPopover
        open={Boolean(error) && Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
      >
        {error && (
          <Typography variant="caption" color="error">
            {error}
          </Typography>
        )}
      </ArrowPopover>
    </Box>
  );
};

export default HeaderFilters;
*/
