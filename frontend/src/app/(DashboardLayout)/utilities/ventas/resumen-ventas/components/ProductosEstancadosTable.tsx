'use client';
import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Typography, Box, Button, TableSortLabel, Avatar, Stack
} from '@mui/material';
import { CheckCircle, Error, Warning, Cancel } from '@mui/icons-material';
import { useRouter } from 'next/navigation';

type ProductoEstancado = {
  SKU: string;
  Producto: string;
  Categoria: string;
  UltimaVenta: string | null;
  DiasSinVenta: number;
  Stock: number;
  Imagen: string | null;
  MargenPorcentaje: number;
};

type Props = {
  data: ProductoEstancado[];
};

type Order = 'asc' | 'desc';
type OrderBy = 'DiasSinVenta' | 'Stock' | 'MargenPorcentaje';

const renderAlertaIcon = (diasSinVenta: number, margen: number): JSX.Element => {
  if (margen < 5 || diasSinVenta > 180) return <Cancel sx={{ color: '#e53935' }} />;
  if (diasSinVenta > 90 || margen < 15) return <Warning sx={{ color: '#ff9800' }} />;
  return <CheckCircle sx={{ color: '#43a047' }} />;
};

const ProductosEstancadosTable: React.FC<Props> = ({ data }) => {
  const router = useRouter();
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<OrderBy>('DiasSinVenta');

  const handleSort = (campo: OrderBy) => {
    const isAsc = orderBy === campo && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(campo);
  };

  const sortedData = [...data].sort((a, b) => {
    const valA = a[orderBy] ?? 0;
    const valB = b[orderBy] ?? 0;
    if (valA < valB) return order === 'asc' ? -1 : 1;
    if (valA > valB) return order === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <Box mt={3}>
      <Typography variant="h6" gutterBottom fontWeight={600}>
        Resumen Productos Estancados
      </Typography>
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell>Imagen</TableCell>
              <TableCell>Producto</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell>Última venta</TableCell>

              <TableCell sortDirection={orderBy === 'DiasSinVenta' ? order : false}>
                <TableSortLabel
                  active={orderBy === 'DiasSinVenta'}
                  direction={orderBy === 'DiasSinVenta' ? order : 'asc'}
                  onClick={() => handleSort('DiasSinVenta')}
                >
                  Días sin venta
                </TableSortLabel>
              </TableCell>

              <TableCell sortDirection={orderBy === 'Stock' ? order : false}>
                <TableSortLabel
                  active={orderBy === 'Stock'}
                  direction={orderBy === 'Stock' ? order : 'asc'}
                  onClick={() => handleSort('Stock')}
                >
                  Stock
                </TableSortLabel>
              </TableCell>

              <TableCell sortDirection={orderBy === 'MargenPorcentaje' ? order : false}>
                <TableSortLabel
                  active={orderBy === 'MargenPorcentaje'}
                  direction={orderBy === 'MargenPorcentaje' ? order : 'asc'}
                  onClick={() => handleSort('MargenPorcentaje')}
                >
                  % Margen
                </TableSortLabel>
              </TableCell>

              <TableCell>Alerta</TableCell>
              <TableCell>Acción Sugerida</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {sortedData.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell>
                  <Avatar
                    src={row.Imagen || undefined}
                    alt={row.Producto}
                    sx={{ width: 32, height: 32 }}
                  />
                </TableCell>
                <TableCell>{row.Producto}</TableCell>
                <TableCell>{row.Categoria || '-'}</TableCell>
                <TableCell>{row.UltimaVenta ? new Date(row.UltimaVenta).toLocaleDateString() : '-'}</TableCell>
                <TableCell>{row.DiasSinVenta} días</TableCell>
                <TableCell>{row.Stock}</TableCell>
                <TableCell>{row.MargenPorcentaje?.toFixed(1).replace('.', ',')}%</TableCell>
                <TableCell>{renderAlertaIcon(row.DiasSinVenta, row.MargenPorcentaje)}</TableCell>
                <TableCell>
                  {
                    row.Stock === 0 ? 'Sin stock'
                    : row.MargenPorcentaje < 5 ? 'Posible liquidación'
                    : row.MargenPorcentaje < 15 ? 'Revisar precio'
                    : 'Producto nicho'
                  }
                </TableCell>
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
