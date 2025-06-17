'use client';
import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Typography, Box, TextField, TableSortLabel, Button, Stack
} from '@mui/material';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useRouter } from 'next/navigation';

type ProductoVendido = {
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
  totalVentas: number;
};

type Props = {
  data: ProductoVendido[];
};

type Order = 'asc' | 'desc';
type OrderBy =
  | 'cantidadVendida'
  | 'margenPorcentaje'
  | 'stock'
  | 'margenBruto'
  | 'precioPromedio'
  | 'totalVentas';

const ProductosVendidos = ({ data }: Props) => {
  const [busqueda, setBusqueda] = useState('');
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<OrderBy>('cantidadVendida');
  const router = useRouter();

  const handleSort = (campo: OrderBy) => {
    const isAsc = orderBy === campo && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(campo);
  };

  const filteredData = data.filter((producto) =>
    producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    producto.sku.toLowerCase().includes(busqueda.toLowerCase())
  );

  const sortedData = [...filteredData].sort((a, b) => {
    const valA = a[orderBy];
    const valB = b[orderBy];
    if (valA < valB) return order === 'asc' ? -1 : 1;
    if (valA > valB) return order === 'asc' ? 1 : -1;
    return 0;
  });

  const exportToExcel = () => {
    const excelData = sortedData.map((row) => ({
      SKU: row.sku,
      Nombre: row.nombre,
      'Primer Nivel': row.primerNivel,
      Categoría: row.categoria,
      'Cantidad Vendida': row.cantidadVendida,
      'Total Ventas': row.totalVentas,
      '% Margen': row.margenPorcentaje,
      Stock: row.stock,
      'Margen Bruto': row.margenBruto,
      'Precio Prom. Venta': row.precioPromedio,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ProductosVendidos');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'productos_vendidos.xlsx');
  };

  const TablaContenido = () => (
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
          <TableCell sortDirection={orderBy === 'totalVentas' ? order : false}>
            <TableSortLabel
              active={orderBy === 'totalVentas'}
              direction={orderBy === 'totalVentas' ? order : 'asc'}
              onClick={() => handleSort('totalVentas')}
            >
              Total Ventas
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
              Stock Total
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
            <TableCell>
              <img
                src={
                  typeof row.imagen === 'string' && row.imagen.startsWith('http')
                    ? row.imagen
                    : 'https://res.cloudinary.com/dhzahos7u/image/upload/v1748960388/producto_sin_imagen_vqaps4.jpg'
                }
                alt={row.nombre}
                width={50}
                height={50}
                style={{ objectFit: 'cover', borderRadius: 4 }}
              />
            </TableCell>
            <TableCell>
              <Typography fontWeight={600}>{row.nombre}</Typography>
              <Typography variant="caption" color="textSecondary">{row.sku}</Typography>
            </TableCell>
            <TableCell>{row.primerNivel}</TableCell>
            <TableCell>{row.categoria}</TableCell>
            <TableCell>{row.cantidadVendida}</TableCell>
            <TableCell>${row.totalVentas.toLocaleString('es-CL')}</TableCell>
            <TableCell>{`${row.margenPorcentaje}%`}</TableCell>
            <TableCell>{row.stock}</TableCell>
            <TableCell>${row.margenBruto.toLocaleString('es-CL')}</TableCell>
            <TableCell>${row.precioPromedio.toLocaleString('es-CL')}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <Box mt={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="h6" fontWeight={600}>
          Top 50 Productos más Vendidos ({filteredData.length})
        </Typography>
        <Button variant="outlined" onClick={exportToExcel}>
          Exportar a Excel
        </Button>
      </Stack>

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
          maxHeight: 530,
          overflowY: 'auto',
        }}
      >
        {TablaContenido()}
      </TableContainer>

      <Box mt={3} display="flex" justifyContent="center">
        <Button
          onClick={() => router.push('/informes/ventas-productos')}
          sx={{ mt: 2, textTransform: "none", fontWeight: 500 }}
        >
          Ver más productos
        </Button>
      </Box>
    </Box>
  );
};

export default ProductosVendidos;
