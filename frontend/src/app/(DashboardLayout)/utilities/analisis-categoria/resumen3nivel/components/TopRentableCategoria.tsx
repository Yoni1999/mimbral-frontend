"use client";
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
  CircularProgress,
  Paper,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";
import { useRouter } from "next/navigation";

// 🧠 Funciones auxiliares para mapear períodos
const normalizePeriodo = (str: string) =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\+/g, " ")
    .trim();

const mapPeriodo: Record<string, string> = {
  "hoy": "1d",
  "ultimos 7 dias": "7d",
  "ultimos 14 dias": "14d",
  "ultimo mes": "1m",
  "3 meses": "3m",
  "6 meses": "6m",
  "1d": "1d",
  "7d": "7d",
  "14d": "14d",
  "1m": "1m",
  "3m": "3m",
  "6m": "6m",
};

interface Producto {
  Codigo_Producto: string;
  Nombre_Producto: string;
  Imagen: string;
  Cantidad_Vendida: number;
  Precio_Promedio: number;
  Costo_Promedio: number;
  Margen_Absoluto: number;
  Margen_Porcentaje: number;
  Margen_Unitario: number;
}

interface Subcategoria {
  codigo: string;
  nombre: string;
}

interface Filters {
  temporada: string;
  periodo: string;
  fechaInicio: string;
  fechaFin: string;
  subcategoria?: string;
  canal?: string;
  vendedorEmpresa?: string;
}

interface Props {
  filters: Filters;
}

const TopRentableCategoria: React.FC<Props> = ({ filters }) => {
  const [data, setData] = useState<Producto[]>([]);
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([]);
  const [sortField, setSortField] = useState<"Margen_Absoluto" | "Cantidad_Vendida" | "Margen_Unitario" | "">("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const router = useRouter();

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (filters.periodo) {
      const periodoKey = normalizePeriodo(filters.periodo);
      params.append("periodo", mapPeriodo[periodoKey] || filters.periodo);
    }
    if (filters.fechaInicio) params.append("fechaInicio", filters.fechaInicio);
    if (filters.fechaFin) params.append("fechaFin", filters.fechaFin);
    if (filters.subcategoria) params.append("subcategoria", filters.subcategoria);
    if (filters.canal) params.append("canal", filters.canal);
    if (filters.vendedorEmpresa) params.append("vendedor", filters.vendedorEmpresa);
    return params.toString();
  };

  const handleRowClick = (producto: Producto) => {
    const params = new URLSearchParams();
    if (filters.periodo) {
      const periodoKey = normalizePeriodo(filters.periodo);
      params.append("periodo", mapPeriodo[periodoKey] || filters.periodo);
    }
    if (filters.temporada) params.append("temporada", filters.temporada);
    if (filters.fechaInicio) params.append("fechaInicio", filters.fechaInicio);
    if (filters.fechaFin) params.append("fechaFin", filters.fechaFin);
    const url = `/utilities/analisis-producto?itemCode=${producto.Codigo_Producto}&${params.toString()}`;
    window.open(url, "_blank");
  };

  useEffect(() => {
    const fetchSubcategorias = async () => {
      try {
        const res = await fetchWithToken(`${BACKEND_URL}/api/resumen-categoria/tercer-nivel`);
        if (res?.ok) {
          const json = await res.json();
          setSubcategorias(json);
        }
      } catch (err) {
        console.error("❌ Error al cargar subcategorías:", err);
      }
    };
    fetchSubcategorias();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const query = buildQuery();
        const res = await fetchWithToken(`${BACKEND_URL}/api/tercer-nivel/top-rentables-subcategoria?${query}`);
        if (res?.ok) {
          const json = await res.json();
          setData(json);
        } else {
          setData([]);
        }
      } catch (err) {
        console.error("❌ Error al obtener rentables:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  const nombreSubcategoria = subcategorias.find(s => s.codigo === filters.subcategoria)?.nombre || "";

  useEffect(() => {
    setVisibleCount(10);
  }, [search]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const productosFiltrados = data.filter(p =>
    p.Nombre_Producto.toLowerCase().includes(search.toLowerCase())
  );

  const sortedProductos = [...productosFiltrados].sort((a, b) => {
    if (!sortField) return 0;
    return sortDirection === "asc"
      ? a[sortField] - b[sortField]
      : b[sortField] - a[sortField];
  });

  const productosVisibles = sortedProductos.slice(0, visibleCount);

  return (
    <Card sx={{ borderRadius: 2, boxShadow: 0, p: 1, border: "1px solid #e0e0e0" }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 500,
            fontSize: "1rem",
            p: 2,
            pl: 3,
            py: 1,
            borderLeft: "5px solid #d93a3a",
            backgroundColor: "#ffffff",
            borderRadius: 1,
            color: "primary.main",
            width: "fit-content",
          }}
        >
          Productos más rentables
        </Typography>
        {nombreSubcategoria && (
          <Typography
            component="span"
            sx={{
              px: 1.2,
              py: 0.5,
              backgroundColor: "#e3f2fd",
              borderRadius: "8px",
              color: "#1976d2",
              fontWeight: 500,
              fontSize: "0.75rem",
              mr: 2,
            }}
          >
            {nombreSubcategoria}
          </Typography>
        )}
      </Box>

      <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
        <TextField
          size="small"
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: 300 }}
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

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ minHeight: 600, overflowY: "auto" }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Foto</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell
                  align="right"
                  onClick={() => handleSort("Cantidad_Vendida")}
                  sx={{ cursor: "pointer", fontWeight: sortField === "Cantidad_Vendida" ? 700 : 500 }}
                >
                  Cant. Vendida{" "}
                  {sortField === "Cantidad_Vendida" &&
                    (sortDirection === "asc" ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />)}
                </TableCell>
                <TableCell
                  align="right"
                  onClick={() => handleSort("Margen_Absoluto")}
                  sx={{ cursor: "pointer", fontWeight: sortField === "Margen_Absoluto" ? 700 : 500 }}
                >
                  Margen Total{" "}
                  {sortField === "Margen_Absoluto" &&
                    (sortDirection === "asc" ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />)}
                </TableCell>
                <TableCell align="right">Margen %</TableCell>
                <TableCell
                  align="right"
                  onClick={() => handleSort("Margen_Unitario")}
                  sx={{ cursor: "pointer", fontWeight: sortField === "Margen_Unitario" ? 700 : 500 }}
                >
                  Margen Unitario{" "}
                  {sortField === "Margen_Unitario" &&
                    (sortDirection === "asc" ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />)}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {productosVisibles.map((producto, index) => (
                <TableRow
                  key={producto.Codigo_Producto}
                  hover
                  onClick={() => handleRowClick(producto)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <Avatar
                      src={producto.Imagen}
                      alt={producto.Nombre_Producto}
                      variant="rounded"
                      sx={{ width: 56, height: 56 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={600} fontSize="0.95rem">
                      {producto.Nombre_Producto}
                    </Typography>
                    <Typography fontSize="0.75rem" color="text.secondary" fontWeight={600}>
                      SKU: {producto.Codigo_Producto}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{producto.Cantidad_Vendida.toLocaleString("es-CL")}</TableCell>
                  <TableCell align="right">${(producto.Margen_Absoluto ?? 0).toLocaleString("es-CL")}</TableCell>
                  <TableCell align="right">{(producto.Margen_Porcentaje ?? 0).toFixed(2)}%</TableCell>
                  <TableCell align="right">${(producto.Margen_Unitario ?? 0).toLocaleString("es-CL")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {visibleCount < productosFiltrados.length && (
        <Box mt={3} textAlign="center">
          <Button
            variant="outlined"
            onClick={() => setVisibleCount((prev) => prev + 10)}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              fontWeight: 600,
              textTransform: "none",
              borderColor: "#1976d2",
              color: "#1976d2",
              "&:hover": {
                backgroundColor: "#1976d2",
                color: "#fff",
              },
            }}
          >
            Ver Más
          </Button>
        </Box>
      )}
    </Card>
  );
};

export default TopRentableCategoria;
