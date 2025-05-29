'use client';
import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Typography, Box, Button
} from '@mui/material';
import { CheckCircle, Error, Warning, Cancel } from '@mui/icons-material';
import { useRouter } from 'next/navigation';

type ProductoEstancado = {
  imagen: string;
  producto: string;
  categoria: string;
  ultimaVenta: string;
  diasSinVenta: number;
  stock: number;
  margen: number;
  alerta: 'rojo' | 'naranja' | 'verde';
  accion: string;
};

const data: ProductoEstancado[] = [
  // Los 5 productos principales que se mostrarán aquí...
  {
    imagen: '🔧',
    producto: 'Producto F',
    categoria: 'Herramientas',
    ultimaVenta: '01/01/2024',
    diasSinVenta: 145,
    stock: 80,
    margen: 12.5,
    alerta: 'naranja',
    accion: 'Revisión precio',
  },
  {
    imagen: '🧱',
    producto: 'Producto G',
    categoria: 'Adhesivos',
    ultimaVenta: '15/01/2024',
    diasSinVenta: 131,
    stock: 150,
    margen: 8.1,
    alerta: 'rojo',
    accion: 'Posible liquidación',
  },
  {
    imagen: '🪜',
    producto: 'Producto H',
    categoria: 'Escaleras',
    ultimaVenta: '03/02/2024',
    diasSinVenta: 112,
    stock: 30,
    margen: 25.0,
    alerta: 'naranja',
    accion: 'Producto nicho, evaluar',
  },
  {
    imagen: '🛠️',
    producto: 'Producto I',
    categoria: 'Fijaciones',
    ultimaVenta: '20/02/2024',
    diasSinVenta: 95,
    stock: 0,
    margen: 14.2,
    alerta: 'verde',
    accion: 'Sin stock',
  },
  {
    imagen: '🧯',
    producto: 'Producto J',
    categoria: 'Seguridad',
    ultimaVenta: '28/02/2024',
    diasSinVenta: 87,
    stock: 200,
    margen: 2.3,
    alerta: 'rojo',
    accion: 'Desactivar por baja rotación',
  },
];

const renderAlertaIcon = (nivel: string) => {
  switch (nivel) {
    case 'rojo': return <Cancel sx={{ color: '#e53935' }} />;
    case 'naranja': return <Warning sx={{ color: '#ff9800' }} />;
    case 'verde': return <CheckCircle sx={{ color: '#43a047' }} />;
    default: return <Error sx={{ color: '#757575' }} />;
  }
};

const ProductosEstancadosTable = () => {
  const router = useRouter();

  return (
    <Box mt={3}>
      <Typography variant="h6" gutterBottom fontWeight={600}>
        Productos Estancados
      </Typography>
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell>Imagen</TableCell>
              <TableCell>Producto</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell>Última venta</TableCell>
              <TableCell>Días sin venta</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>% Margen</TableCell>
              <TableCell>Alerta</TableCell>
              <TableCell>Acción Sugerida</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell>{row.imagen}</TableCell>
                <TableCell>{row.producto}</TableCell>
                <TableCell>{row.categoria}</TableCell>
                <TableCell>{row.ultimaVenta}</TableCell>
                <TableCell>{`${row.diasSinVenta} días`}</TableCell>
                <TableCell>{row.stock}</TableCell>
                <TableCell>{`${row.margen}%`}</TableCell>
                <TableCell>{renderAlertaIcon(row.alerta)}</TableCell>
                <TableCell>{row.accion}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box textAlign="center">
        <Button
          onClick={() => router.push('/informes/productos-detenidos')}
          sx={{ mt: 2, textTransform: "none", fontWeight: 500 }}
        >
          Ver más productos
        </Button>
      </Box>
    </Box>
  );
};

export default ProductosEstancadosTable;
