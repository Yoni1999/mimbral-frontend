'use client';
import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Typography, Box, TextField, TableSortLabel
} from '@mui/material';

type ProductosVendidos = {
  imagen: string;
  sku: string;
  nombre: string;
  primerNivel: string;
  categoria: string;
  cantidadVendida: number;
  margenPorcentaje: number;
  stock: number;
  margenBruto: number;
  precioPromedio: number;
};

const data: ProductosVendidos[] = [
  {
    imagen: '🪚',
    sku: 'SKU-prueba',
    nombre: 'Sierra Circular',
    primerNivel: 'Herramientas',
    categoria: 'Corte',
    cantidadVendida: 120,
    margenPorcentaje: 28.5,
    stock: 15,
    margenBruto: 420000,
    precioPromedio: 58000,
  },
  {
    imagen: '🔩',
    sku: 'SKU-prueba',
    nombre: 'Tornillo Acero 5mm',
    primerNivel: 'Fijaciones',
    categoria: 'Tornillos',
    cantidadVendida: 2500,
    margenPorcentaje: 18.2,
    stock: 1200,
    margenBruto: 320000,
    precioPromedio: 210,
  },
  {
    imagen: '🧰',
    sku: 'SKU-prueba',
    nombre: 'Caja de Herramientas Pro',
    primerNivel: 'Herramientas',
    categoria: 'Almacenamiento',
    cantidadVendida: 40,
    margenPorcentaje: 35.0,
    stock: 8,
    margenBruto: 280000,
    precioPromedio: 48000,
  },
  {
    imagen: '🧱',
    sku: 'SKU-prueba',
    nombre: 'Adhesivo Cerámico',
    primerNivel: 'Construcción',
    categoria: 'Adhesivos',
    cantidadVendida: 600,
    margenPorcentaje: 22.0,
    stock: 200,
    margenBruto: 190000,
    precioPromedio: 1400,
  },
  {
    imagen: '🔧',
    sku: 'SKU-prueba',
    nombre: 'Llave Ajustable 10"',
    primerNivel: 'Herramientas',
    categoria: 'Manuales',
    cantidadVendida: 90,
    margenPorcentaje: 26.5,
    stock: 25,
    margenBruto: 135000,
    precioPromedio: 12000,
  },
    {
    imagen: '🔧',
    sku: 'SKU-prueba',
    nombre: 'Llave Ajustable 10"',
    primerNivel: 'Herramientas',
    categoria: 'Manuales',
    cantidadVendida: 90,
    margenPorcentaje: 26.5,
    stock: 25,
    margenBruto: 135000,
    precioPromedio: 12000,
  },
    {
    imagen: '🔧',
    sku: 'SKU-prueba',
    nombre: 'Llave Ajustable 10"',
    primerNivel: 'Herramientas',
    categoria: 'Manuales',
    cantidadVendida: 90,
    margenPorcentaje: 26.5,
    stock: 25,
    margenBruto: 135000,
    precioPromedio: 12000,
  },
    {
    imagen: '🔧',
    sku: 'SKU-prueba',
    nombre: 'Llave Ajustable 10"',
    primerNivel: 'Herramientas',
    categoria: 'Manuales',
    cantidadVendida: 90,
    margenPorcentaje: 26.5,
    stock: 25,
    margenBruto: 135000,
    precioPromedio: 12000,
  },
    {
    imagen: '🔧',
    sku: 'SKU-prueba',
    nombre: 'Llave Ajustable 10"',
    primerNivel: 'Herramientas',
    categoria: 'Manuales',
    cantidadVendida: 90,
    margenPorcentaje: 26.5,
    stock: 25,
    margenBruto: 135000,
    precioPromedio: 12000,
  },
    {
    imagen: '🔧',
    sku: 'SKU-prueba',
    nombre: 'Llave Ajustable 10"',
    primerNivel: 'Herramientas',
    categoria: 'Manuales',
    cantidadVendida: 90,
    margenPorcentaje: 26.5,
    stock: 25,
    margenBruto: 135000,
    precioPromedio: 12000,
  },
    {
    imagen: '🔧',
    sku: 'SKU-prueba',
    nombre: 'Llave Ajustable 10"',
    primerNivel: 'Herramientas',
    categoria: 'Manuales',
    cantidadVendida: 90,
    margenPorcentaje: 26.5,
    stock: 25,
    margenBruto: 135000,
    precioPromedio: 12000,
  },
    {
    imagen: '🔧',
    sku: 'SKU-prueba',
    nombre: 'Llave Ajustable 10"',
    primerNivel: 'Herramientas',
    categoria: 'Manuales',
    cantidadVendida: 90,
    margenPorcentaje: 26.5,
    stock: 25,
    margenBruto: 135000,
    precioPromedio: 12000,
  },
    {
    imagen: '🔧',
    sku: 'SKU-prueba',
    nombre: 'Llave Ajustable 10"',
    primerNivel: 'Herramientas',
    categoria: 'Manuales',
    cantidadVendida: 90,
    margenPorcentaje: 26.5,
    stock: 25,
    margenBruto: 135000,
    precioPromedio: 12000,
  },
    {
    imagen: '🔧',
    sku: 'SKU-prueba',
    nombre: 'Llave Ajustable 10"',
    primerNivel: 'Herramientas',
    categoria: 'Manuales',
    cantidadVendida: 90,
    margenPorcentaje: 26.5,
    stock: 25,
    margenBruto: 135000,
    precioPromedio: 12000,
  },
];

type Order = 'asc' | 'desc';
type OrderBy =
  | 'cantidadVendida'
  | 'margenPorcentaje'
  | 'stock'
  | 'margenBruto'
  | 'precioPromedio';

const ProductosVendidos = () => {
  const [busqueda, setBusqueda] = useState('');
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<OrderBy>('cantidadVendida');

  const handleSort = (campo: OrderBy) => {
    const isAsc = orderBy === campo && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(campo);
  };

  const sortedData = [...data]
    .filter((producto) =>
      producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      producto.sku.toLowerCase().includes(busqueda.toLowerCase())
    )
    .sort((a, b) => {
      const valA = a[orderBy];
      const valB = b[orderBy];
      if (valA < valB) return order === 'asc' ? -1 : 1;
      if (valA > valB) return order === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <Box mt={3}>
      <Typography variant="h6" gutterBottom fontWeight={600}>
        Todos los productos vendidos
      </Typography>

      <Box mb={2}>
        <TextField
          label="Buscar por nombre o SKU"
          variant="outlined"
          size="small"
          sx={{ width: 250 }}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 2,
          maxHeight: 530, // Aprox. 10 filas + header
          overflowY: 'auto',
        }}
      >
        <Table stickyHeader>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell>Imagen</TableCell>
              <TableCell>Producto (SKU)</TableCell>
              <TableCell>Primer Nivel</TableCell>
              <TableCell>Categoría</TableCell>

              <TableCell sortDirection={orderBy === 'cantidadVendida' ? order : false}>
                <TableSortLabel
                  active={orderBy === 'cantidadVendida'}
                  direction={orderBy === 'cantidadVendida' ? order : 'asc'}
                  onClick={() => handleSort('cantidadVendida')}
                >
                  Cant. Vendida
                </TableSortLabel>
              </TableCell>

              <TableCell sortDirection={orderBy === 'margenPorcentaje' ? order : false}>
                <TableSortLabel
                  active={orderBy === 'margenPorcentaje'}
                  direction={orderBy === 'margenPorcentaje' ? order : 'asc'}
                  onClick={() => handleSort('margenPorcentaje')}
                >
                  % Margen
                </TableSortLabel>
              </TableCell>

              <TableCell sortDirection={orderBy === 'stock' ? order : false}>
                <TableSortLabel
                  active={orderBy === 'stock'}
                  direction={orderBy === 'stock' ? order : 'asc'}
                  onClick={() => handleSort('stock')}
                >
                  Stock
                </TableSortLabel>
              </TableCell>

              <TableCell sortDirection={orderBy === 'margenBruto' ? order : false}>
                <TableSortLabel
                  active={orderBy === 'margenBruto'}
                  direction={orderBy === 'margenBruto' ? order : 'asc'}
                  onClick={() => handleSort('margenBruto')}
                >
                  Margen Bruto
                </TableSortLabel>
              </TableCell>

              <TableCell sortDirection={orderBy === 'precioPromedio' ? order : false}>
                <TableSortLabel
                  active={orderBy === 'precioPromedio'}
                  direction={orderBy === 'precioPromedio' ? order : 'asc'}
                  onClick={() => handleSort('precioPromedio')}
                >
                  Precio Prom. Venta
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {sortedData.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell>{row.imagen}</TableCell>
                <TableCell>
                  <Typography fontWeight={600}>{row.nombre}</Typography>
                  <Typography variant="caption" color="textSecondary">{row.sku}</Typography>
                </TableCell>
                <TableCell>{row.primerNivel}</TableCell>
                <TableCell>{row.categoria}</TableCell>
                <TableCell>{row.cantidadVendida}</TableCell>
                <TableCell>{`${row.margenPorcentaje}%`}</TableCell>
                <TableCell>{row.stock}</TableCell>
                <TableCell>${row.margenBruto.toLocaleString('es-CL')}</TableCell>
                <TableCell>${row.precioPromedio.toLocaleString('es-CL')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ProductosVendidos;
