'use client';
import React, { useState, useMemo } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Typography, Box, TableSortLabel
} from '@mui/material';
import { CheckCircle, Warning, Cancel } from '@mui/icons-material';

type ProductoEstancado = {
  SKU: string;
  Producto: string;
  PrimerNivel: string;
  UltimaVenta: string | null;
  DiasSinVenta: number;
  Stock: number;
  MargenPorcentaje: number;
  Imagen: string;
};

type SortKey = 'UltimaVenta' | 'DiasSinVenta' | 'Stock' | 'MargenPorcentaje';

const renderAlertaIcon = (dias: number) => {
  if (dias >= 180) return <Cancel sx={{ color: '#e53935' }} />;
  if (dias >= 90) return <Warning sx={{ color: '#ff9800' }} />;
  return <CheckCircle sx={{ color: '#43a047' }} />;
};

const isFechaValida = (fecha: string | null): boolean => {
  return !!fecha && !isNaN(new Date(fecha).getTime());
};

const ProductosEstancadosTable = ({ data = [] }: { data: ProductoEstancado[] }) => {
  const [sortBy, setSortBy] = useState<SortKey>('DiasSinVenta');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const valA = a[sortBy];
      const valB = b[sortBy];
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      if (sortDirection === 'asc') return valA > valB ? 1 : -1;
      else return valA < valB ? 1 : -1;
    });
  }, [data, sortBy, sortDirection]);

  const renderSortLabel = (key: SortKey, label: string) => (
    <TableSortLabel
      active={sortBy === key}
      direction={sortBy === key ? sortDirection : 'asc'}
      onClick={() => handleSort(key)}
    >
      {label}
    </TableSortLabel>
  );

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
              <TableCell>Primer Nivel</TableCell>
              <TableCell>{renderSortLabel('UltimaVenta', 'Última venta')}</TableCell>
              <TableCell>{renderSortLabel('DiasSinVenta', 'Días sin venta')}</TableCell>
              <TableCell>{renderSortLabel('Stock', 'Stock')}</TableCell>
              <TableCell>{renderSortLabel('MargenPorcentaje', '% Margen')}</TableCell>
              <TableCell>Alerta</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell>
                  <img src={row.Imagen} alt="producto" style={{ width: 40, height: 40, borderRadius: 4 }} />
                </TableCell>
                <TableCell>
                  <Typography fontWeight={500}>{row.Producto}</Typography>
                  <Typography variant="caption" color="text.secondary">{row.SKU}</Typography>
                </TableCell>
                <TableCell>{row.PrimerNivel}</TableCell>
                <TableCell>
                  {isFechaValida(row.UltimaVenta) ? (
                    new Date(row.UltimaVenta!).toLocaleDateString('es-CL', { timeZone: 'UTC' })
                  ) : (
                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                      Sin ventas
                    </Typography>
                  )}
                </TableCell>
                <TableCell>{`${row.DiasSinVenta} días`}</TableCell>
                <TableCell>{row.Stock}</TableCell>
                <TableCell>{`${row.MargenPorcentaje}%`}</TableCell>
                <TableCell>{renderAlertaIcon(row.DiasSinVenta)}</TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={8}>
                  <Typography align="center" color="text.secondary" py={2}>
                    No hay productos detenidos con los filtros aplicados.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ProductosEstancadosTable;
