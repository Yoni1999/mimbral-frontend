import { useEffect, useState, MouseEvent } from "react";
import { useSearchParams } from "next/navigation"; 
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";

import {
  Box,
  TextField,
  InputAdornment,
  Paper,
  Grid,
  Button,
  Popover,
  Autocomplete,
  MenuItem
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearAllIcon from "@mui/icons-material/ClearAll";

interface HeaderProps {
  onSearch: (term: string) => void;
  onFilterChange?: (filters: { 
    fechaInicio: string; 
    fechaFin: string; 
    providerCode: string; 
    providerName: string;
    filterType: string;
    skuList: string;
  }) => void;
}

const Header: React.FC<HeaderProps> = ({ onSearch, onFilterChange }) => {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [providerCode, setProviderCode] = useState("");
  const [providerName, setProviderName] = useState("");
  const [skuList, setSkuList] = useState(""); 
  const [providers, setProviders] = useState<{ CodigoProveedor: string; NombreProveedor: string }[]>([]);
  const [filterType, setFilterType] = useState<"categoria" | "producto">("producto");
  const [error, setError] = useState("");
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await fetchWithToken(`${BACKEND_URL}/api/proveedores`);
        if (!response) return; // Redirigido si el token es inválido
  
        const data = await response.json();
        setProviders(data);
      } catch (error) {
        console.error("❌ Error al obtener proveedores:", error);
      }
    };
    fetchProviders();
  }, []);
  

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    onSearch(term);
  };

  const handleApplyFilters = (event: MouseEvent<HTMLButtonElement>) => {
    if (!onFilterChange) return;
    if (filterType === "producto" && !fechaInicio && !fechaFin && !providerCode && !providerName && !skuList) {
      setError("Debes seleccionar al menos un filtro.");
      setAnchorEl(event.currentTarget);
      return;
    }
    setError("");
    setAnchorEl(null);
    onFilterChange({ fechaInicio, fechaFin, providerCode, providerName, filterType, skuList });
  };

  const handleClearFilters = () => {
    if (!onFilterChange) return;
    setFechaInicio("");
    setFechaFin("");
    setProviderCode("");
    setProviderName("");
    setSkuList("");
    setError("");
    setAnchorEl(null);
    onFilterChange({ fechaInicio: "", fechaFin: "", providerCode: "", providerName: "", filterType, skuList: "" });
  };

  return (
    <Paper
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        backgroundColor: "white",
        boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
        padding: 1,
        mb: 2,
        borderRadius: "16px",
      }}
    >
      {/* 🔹 Ahora todos los filtros están en un solo `Box` junto con la búsqueda */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
        
        {/* 🔹 Buscador de categorías */}
        <TextField
          label="Buscar"
          variant="outlined"
          fullWidth
          sx={{
            maxWidth: 140,
            borderRadius: "8px",
            backgroundColor: "#f9f9f9",
            boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.1)",
            "& .MuiOutlinedInput-root": { borderRadius: "8px" },
            "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#3f51b5" },
            "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#3f51b5",
              boxShadow: "0px 2px 10px rgba(63, 81, 181, 0.2)",
            },
          }}
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "#3f51b5", transition: "all 0.2s", "&:hover": { transform: "scale(1.2)", cursor: "pointer" } }} />
              </InputAdornment>
            ),
          }}
        />

        {/* 🔹 Tipo de Filtro */}
        <TextField
          select
          label="Tipo de Filtro"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as "categoria" | "producto")}
          size="small"
          sx={{ width: 180 }}
        >
          <MenuItem value="categoria">Categoría</MenuItem>
          <MenuItem value="producto">Producto</MenuItem>
        </TextField>

        {/* 🔹 Filtrar por SKU */}
        <TextField
          label="Filtrar por SKU"
          placeholder="Ej: 111111111"
          size="small"
          value={skuList}
          onChange={(e) => setSkuList(e.target.value)}
          disabled={filterType === "categoria"}
          sx={{ width: 120 }}
        />

        {/* 🔹 Fecha Inicio */}
        <TextField
          label="Fecha Inicio"
          type="date"
          size="small"
          InputLabelProps={{ shrink: true }}
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
          disabled={filterType === "categoria"}
          sx={{ width: 120 }}
        />

        {/* 🔹 Fecha Fin */}
        <TextField
          label="Fecha Fin"
          type="date"
          size="small"
          InputLabelProps={{ shrink: true }}
          value={fechaFin}
          onChange={(e) => setFechaFin(e.target.value)}
          disabled={filterType === "categoria"}
          sx={{ width: 120 }}
        />

        {/* 🔹 Filtrar por Proveedor */}
        <Autocomplete
          options={providers}
          getOptionLabel={(option) => `${option.CodigoProveedor} - ${option.NombreProveedor}`}
          value={providers.find(p => p.CodigoProveedor === providerCode) || null}
          onChange={(event, newValue) => {
            setProviderName(newValue ? newValue.NombreProveedor : "");
            setProviderCode(newValue ? newValue.CodigoProveedor : "");
          }}
          sx={{ width: 120 }}
          renderInput={(params) => <TextField {...params} label="Filtrar proveedor" size="small" />}
        />

        {/* 🔹 Botones */}
        <Button variant="contained" color="primary" onClick={handleApplyFilters} size="small">
          Aplicar
        </Button>
        <Button variant="outlined" color="primary" onClick={handleClearFilters} size="small" startIcon={<ClearAllIcon />}>
          Limpiar
        </Button>

      </Box>
    </Paper>
  );
};

export default Header;
