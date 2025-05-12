"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TextField,
  MenuItem,
  Button,
  Divider,
  Tooltip,
} from "@mui/material";
import { TrendingDown, InfoOutlined } from "@mui/icons-material";

interface ProductoDetenido {
  sku: string;
  nombre: string;
  categoria: string;
  proveedor: string;
  diasSinVenta: number;
  stockActual: number;
  ultimaVenta: string;
  precioPromedio: number;
  margen: number;
}

const datosMock: ProductoDetenido[] = [
  {
    sku: "SKU001",
    nombre: "Martillo Pro 16oz",
    categoria: "Herramientas",
    proveedor: "ACME Tools",
    diasSinVenta: 45,
    stockActual: 10,
    ultimaVenta: "2024-12-01",
    precioPromedio: 3490,
    margen: 25.5,
  },
  {
    sku: "SKU002",
    nombre: "Serrucho Japonés",
    categoria: "Herramientas",
    proveedor: "Samurai Co",
    diasSinVenta: 120,
    stockActual: 4,
    ultimaVenta: "2024-11-10",
    precioPromedio: 8990,
    margen: 31.2,
  },
  {
    sku: "SKU003",
    nombre: "Manguera Trenzada 15m",
    categoria: "Jardinería",
    proveedor: "GreenWorks",
    diasSinVenta: 95,
    stockActual: 0,
    ultimaVenta: "2024-10-25",
    precioPromedio: 12490,
    margen: 40.0,
  },
];

const ProductosDetenidosPage = () => {
  const [productos, setProductos] = useState<ProductoDetenido[]>([]);
  const [minDiasSinVenta, setMinDiasSinVenta] = useState(30);
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<string[]>([]);

  useEffect(() => {
    const filtrados = datosMock.filter((p) => {
      const cumpleDias = p.diasSinVenta >= minDiasSinVenta;
      const cumpleCategoria = categoriaFiltro ? p.categoria === categoriaFiltro : true;
      return cumpleDias && cumpleCategoria;
    });
    setProductos(filtrados);
    setCategoriasDisponibles(Array.from(new Set(datosMock.map((p) => p.categoria))));
  }, [minDiasSinVenta, categoriaFiltro]);

  return (
    <Box p={4}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        <TrendingDown sx={{ mr: 1 }} /> Informe de Productos Detenidos
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Este reporte muestra los productos que no han tenido ventas desde hace varios días, con información detallada sobre inventario, margen y proveedor.
      </Typography>

      <Divider sx={{ my: 3 }} />

      <Box display="flex" gap={2} flexWrap="wrap" mb={3}>
        <TextField
          label="Mínimo días sin venta"
          type="number"
          value={minDiasSinVenta}
          onChange={(e) => setMinDiasSinVenta(Number(e.target.value))}
        />
        <TextField
          label="Categoría"
          select
          value={categoriaFiltro}
          onChange={(e) => setCategoriaFiltro(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">Todas</MenuItem>
          {categoriasDisponibles.map((cat) => (
            <MenuItem key={cat} value={cat}>
              {cat}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <Paper elevation={3}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>SKU</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell>Proveedor</TableCell>
              <TableCell>Días sin Venta</TableCell>
              <TableCell>Última Venta</TableCell>
              <TableCell>Stock Actual</TableCell>
              <TableCell>Precio Prom.</TableCell>
              <TableCell>Margen %</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {productos.map((prod) => (
              <TableRow key={prod.sku}>
                <TableCell>{prod.sku}</TableCell>
                <TableCell>
                  {prod.nombre}
                  {prod.diasSinVenta > 90 && (
                    <Tooltip title="Este producto está detenido hace más de 90 días">
                      <InfoOutlined color="warning" fontSize="small" sx={{ ml: 1 }} />
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell>{prod.categoria}</TableCell>
                <TableCell>{prod.proveedor}</TableCell>
                <TableCell>{prod.diasSinVenta}</TableCell>
                <TableCell>{prod.ultimaVenta}</TableCell>
                <TableCell>{prod.stockActual}</TableCell>
                <TableCell>${prod.precioPromedio.toFixed(0)}</TableCell>
                <TableCell>{prod.margen.toFixed(1)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default ProductosDetenidosPage;
