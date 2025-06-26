"use client";

import React, { useEffect, useState } from "react";
import {
  Box, Collapse, IconButton, Typography,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Avatar, Stack, Paper,
  CircularProgress, Pagination
} from "@mui/material";

import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

import { fetchWithToken } from "@/utils/fetchWithToken";
import { formatVentas } from "@/utils/format";
import { BACKEND_URL } from "@/config";

// Interfaces
interface Filtros {
  canal: string;
  periodo: string;
  fechaInicio: string;
  fechaFin: string;
  vendedor?: number | null;
}

interface ProductoDetallado {
  sku: string;
  nombre: string;
  imagen: string;
  primerNivel: string;
  categoria: string;
  cantidadVendida: number;
  totalVentas: number;
  precioPromedio: number;
  costoTotal: number;
  margenBruto: number;
  margenPorcentaje: number;
  stock: number;
}

interface Props {
  filters: Filtros;
}

// Fila colapsable
function Row({ row }: { row: ProductoDetallado }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar src={row.imagen} alt={row.nombre} />
            <Box>
              <Typography fontWeight={600} variant="body2">{row.nombre}</Typography>
              <Typography variant="caption" color="text.secondary">SKU: {row.sku}</Typography>
            </Box>
          </Stack>
        </TableCell>
        <TableCell align="right">
          <Typography variant="body2">{row.primerNivel}</Typography>
          <Typography variant="caption" color="text.secondary">{row.categoria}</Typography>
        </TableCell>
        <TableCell align="right">{row.cantidadVendida}</TableCell>
        <TableCell align="right">{formatVentas(row.totalVentas)}</TableCell>
        <TableCell align="right">{formatVentas(row.precioPromedio)}</TableCell>
        <TableCell align="right">
          <Typography variant="body2">{formatVentas(row.margenBruto)}</Typography>
          <Typography variant="caption" color="text.secondary">
            ({row.margenPorcentaje.toFixed(1)}%)
          </Typography>
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell colSpan={7} style={{ paddingBottom: 0, paddingTop: 0 }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
              {/* Historial de ventas */}
              <Box mt={3}>
                <Typography variant="subtitle2" gutterBottom>
                  Historial de ventas
                </Typography>

                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Cliente</TableCell>
                      <TableCell align="right">Cantidad comprada</TableCell>
                      <TableCell align="right">Total venta</TableCell>
                      <TableCell align="right">N° veces que compró</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* Aquí puedes reemplazar con un .map si conectas una API */}
                    <TableRow>
                      <TableCell>Juan Pérez</TableCell>
                      <TableCell align="right">12</TableCell>
                      <TableCell align="right">{formatVentas(54000)}</TableCell>
                      <TableCell align="right">3</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>María López</TableCell>
                      <TableCell align="right">5</TableCell>
                      <TableCell align="right">{formatVentas(22500)}</TableCell>
                      <TableCell align="right">1</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

// Componente principal
const ProductosVendidos: React.FC<Props> = ({ filters }) => {
  const [productos, setProductos] = useState<ProductoDetallado[]>([]);
  const [totalProductos, setTotalProductos] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const rowsPerPage = 100;

  useEffect(() => {
    setPage(1);
  }, [filters]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const offset = (page - 1) * rowsPerPage;
        const params = {
          ...filters,
          vendedor: filters.vendedor != null ? String(filters.vendedor) : undefined,
          limit: String(rowsPerPage),
          offset: String(offset),
        };

        const query = new URLSearchParams(
          Object.entries(params)
            .filter(([_, v]) => v != null && v !== "")
            .map(([k, v]) => [k, String(v)])
        ).toString();

        const res = await fetchWithToken(`${BACKEND_URL}/api/obtener-productos-detallado?${query}`);
        const result = await res!.json();
        setProductos(result.data || []);
        setTotalProductos(result.total || 0);
      } catch (error) {
        console.error("Error al obtener productos:", error);
        setProductos([]);
        setTotalProductos(0);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters, page]);

  return (
    <Box mt={2}>
      <Typography variant="h6" fontWeight="bold" mb={1}>
        Productos más vendidos
      </Typography>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
          <CircularProgress />
        </Box>
      ) : productos.length === 0 ? (
        <Typography align="center">No se encontraron productos</Typography>
      ) : (
        <>
          <Typography variant="subtitle2" mb={1}>
            Mostrando {productos.length} de {totalProductos} productos
          </Typography>

          <TableContainer component={Paper}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>Producto</TableCell>
                  <TableCell align="right">Primer Nivel / Categoría</TableCell>
                  <TableCell align="right">Cantidad</TableCell>
                  <TableCell align="right">Total Ventas</TableCell>
                  <TableCell align="right">Precio Promedio</TableCell>
                  <TableCell align="right">Margen Bruto</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {productos.map((row) => (
                  <Row key={row.sku} row={row} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box mt={2} mb={4} display="flex" justifyContent="center">
            <Pagination
              count={Math.ceil(totalProductos / rowsPerPage)}
              page={page}
              onChange={(_, newPage) => setPage(newPage)}
              color="primary"
            />
          </Box>
        </>
      )}
    </Box>
  );
};

export default ProductosVendidos;
