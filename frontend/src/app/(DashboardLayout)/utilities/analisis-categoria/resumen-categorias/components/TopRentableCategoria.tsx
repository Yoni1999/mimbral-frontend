import React, { useEffect, useState } from "react";
import {
  Card,
  Typography,
  Box,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  TextField,
  InputAdornment,
  Button,
  Paper,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";

interface Producto {
  Codigo_Producto: string;
  Nombre_Producto: string;
  Imagen_Producto: string;
  Cantidad_Vendida: number;
  Precio_Promedio: number;
  Costo_Promedio: number;
  Margen_Absoluto: number;
  Margen_Porcentaje: number;
  Margen_Unitario: number;
}

interface Filters {
  canal?: string;
  periodo?: string;
  fechaInicio?: string;
  fechaFin?: string;
  primer_nivel?: string;
  vendedorEmpresa?: string;
}

interface Props {
  filters: Filters;
}

const TopRentableCategoria: React.FC<Props> = ({ filters }) => {
  const [data, setData] = useState<Producto[]>([]);
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(10);
  const [sortField, setSortField] = useState<"Margen_Absoluto" | "Cantidad_Vendida" | "Margen_Unitario" | "">("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const buildQuery = () => {
    const params = new URLSearchParams();
    const mapPeriodo: Record<string, string> = {
      "Hoy": "1d",
      "Ultimos 7 días": "7d",
      "Ultimos 14 días": "14d",
      "Ultimo mes": "1m",
      "3 meses": "3m",
      "6 meses": "6m",
      "1D": "1d",
      "7D": "7d",
      "14D": "14d",
      "1M": "1m",
      "3M": "3m",
      "6M": "6m",
    };
    if (filters.periodo) {
      const mapped = mapPeriodo[filters.periodo] || filters.periodo;
      params.append("periodo", mapped);
    }
    if (filters.fechaInicio) params.append("fechaInicio", filters.fechaInicio);
    if (filters.fechaFin) params.append("fechaFin", filters.fechaFin);
    if (filters.canal) params.append("canal", filters.canal);
    if (filters.primer_nivel) params.append("primerNivel", filters.primer_nivel);
    if (filters.vendedorEmpresa) params.append("vendedorEmpresa", filters.vendedorEmpresa);
    return params.toString();
  };
  const handleRowClick = (producto: Producto) => {
  const params = new URLSearchParams();
  const mapPeriodo: Record<string, string> = {
    "Hoy": "1d",
    "Ultimos 7 días": "7d",
    "Ultimos 14 días": "14d",
    "Ultimo mes": "1m",
    "3 meses": "3m",
    "6 meses": "6m",
    "1D": "1d",
    "7D": "7d",
    "14D": "14d",
    "1M": "1m",
    "3M": "3m",
    "6M": "6m",
  };

  const periodo = filters.periodo ? mapPeriodo[filters.periodo] || filters.periodo : "";

  if (periodo) params.append("periodo", periodo);
  if (filters.fechaInicio) params.append("fechaInicio", filters.fechaInicio);
  if (filters.fechaFin) params.append("fechaFin", filters.fechaFin);
  if (filters.canal) params.append("canal", filters.canal);
 
  const url = `/utilities/analisis-producto?itemCode=${producto.Codigo_Producto}&${params.toString()}`;
  window.open(url, "_blank");
};


  useEffect(() => {
    const fetchData = async () => {
      try {
        const query = buildQuery();
        const response = await fetchWithToken(`${BACKEND_URL}/api/primer-nivel/top-rentables-primer-nivel?${query}`);
        if (!response) throw new Error("Error al obtener datos");
        const result = await response.json();
        const filtrados = Array.isArray(result)
          ? result.filter(
              (item: Producto) =>
                item &&
                item.Nombre_Producto &&
                item.Margen_Absoluto != null &&
                item.Cantidad_Vendida != null
            )
          : [];
        setData(filtrados);
      } catch (error) {
        console.error(" Error al obtener productos:", error);
        setData([]);
      }
    };
    if (
      filters.periodo ||
      (filters.fechaInicio && filters.fechaFin) ||
      filters.primer_nivel
    ) {
      fetchData();
    }
  }, [filters]);

  useEffect(() => {
    setVisibleCount(10);
  }, [search]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const productosFiltrados = data.filter((producto) =>
    producto.Nombre_Producto.toLowerCase().includes(search.toLowerCase())
  );

  const sortedProductos = [...productosFiltrados].sort((a, b) => {
    if (!sortField) return 0;
    const valA = a[sortField];
    const valB = b[sortField];
    return sortDirection === "asc" ? valA - valB : valB - valA;
  });

  const productosVisibles = sortedProductos.slice(0, visibleCount);

  return (
    <Card sx={{ borderRadius: 2, boxShadow: 1, p: 1, border: "1px solid #e0e0e0", }}>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 500,
          fontSize: "1rem",
          mb: 2.5,
          p: 2.5,
          pl: 3,
          py: 1,
          borderLeft: "5px solid #d93a3a",
          backgroundColor: "#ffffff",
          borderRadius: 1,
          color: "primary.main",
          width: "fit-content",
        }}
      >
        Productos Vendidos del primer nivel
      </Typography>

      <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
        <TextField
          size="small"
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{color: "primary.main", width: 300 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Typography variant="body2" sx={{ color: "#666", mr: 2 }}>
          Mostrando {productosVisibles.length} de {productosFiltrados.length} productos
        </Typography>
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          minHeight: 500,  // Fija una altura mínima
          overflowY: "auto",
        }}
      >
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Imagen</TableCell>
              <TableCell>Nombre Producto</TableCell>

              <TableCell
                align="right"
                onClick={() => handleSort("Margen_Absoluto")}
                sx={{ cursor: "pointer", fontWeight: sortField === "Margen_Absoluto" ? 700 : 500 }}
              >
                Margen Total{" "}
                {sortField === "Margen_Absoluto" &&
                  (sortDirection === "asc" ? (
                    <ArrowDropUpIcon fontSize="small" />
                  ) : (
                    <ArrowDropDownIcon fontSize="small" />
                  ))}
              </TableCell>

              <TableCell
                align="right"
                onClick={() => handleSort("Cantidad_Vendida")}
                sx={{ cursor: "pointer", fontWeight: sortField === "Cantidad_Vendida" ? 700 : 500 }}
              >
                Unidades Vendidas{" "}
                {sortField === "Cantidad_Vendida" &&
                  (sortDirection === "asc" ? (
                    <ArrowDropUpIcon fontSize="small" />
                  ) : (
                    <ArrowDropDownIcon fontSize="small" />
                  ))}
              </TableCell>

              <TableCell
                align="right"
                onClick={() => handleSort("Margen_Unitario")}
                sx={{ cursor: "pointer", fontWeight: sortField === "Margen_Unitario" ? 700 : 500 }}
              >
                Margen Unitario{" "}
                {sortField === "Margen_Unitario" &&
                  (sortDirection === "asc" ? (
                    <ArrowDropUpIcon fontSize="small" />
                  ) : (
                    <ArrowDropDownIcon fontSize="small" />
                  ))}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {productosVisibles.map((producto, index) => (
              <TableRow key={producto.Codigo_Producto}hover onClick={() => handleRowClick(producto)} sx={{ cursor: "pointer" }}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <Avatar
                    src={producto.Imagen_Producto}
                    alt={producto.Nombre_Producto}
                    variant="rounded"
                    sx={{ width: 56, height: 56 }}
                  />
                </TableCell>
                <TableCell>
                  <Typography fontWeight={600} variant="body2">
                    {producto.Nombre_Producto}
                  </Typography>
                  <Typography fontSize="0.75rem" color="text.secondary" fontWeight={600}>
                    SKU: {producto.Codigo_Producto}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  ${(producto.Margen_Absoluto ?? 0).toLocaleString()} CLP
                </TableCell>
                <TableCell align="right">
                  {(producto.Cantidad_Vendida ?? 0).toLocaleString()}
                </TableCell>
                <TableCell align="right">
                  ${(producto.Margen_Unitario ?? 0).toLocaleString()} CLP
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {visibleCount < productosFiltrados.length && (
        <Box mt={2} textAlign="center">
          <Button variant="outlined" onClick={() => setVisibleCount((prev) => prev + 10)}>
            Ver más
          </Button>
        </Box>
      )}
    </Card>
  );
};

export default TopRentableCategoria;
