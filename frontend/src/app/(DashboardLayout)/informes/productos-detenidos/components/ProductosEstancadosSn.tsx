'use client';

import React, { useState, useMemo } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Typography, Box, TableSortLabel, TextField,
  Button, Menu, MenuItem, Avatar
} from '@mui/material';
import { CheckCircle, Warning, Cancel } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { formatVentas, formatUnidades } from '@/utils/format';

// Tipos

type ProductoEstancado = {
  SKU: string;
  Producto: string;
  PrimerNivel: string | null;
  Categoria: string | null;
  Subcategoria: string | null;
  UltimaVenta: string | null;
  UltimaFechaCompra: string | null;
  DiasSinVenta: number;
  Stock: number;
  Imagen: string | null;
  CostoPromedioUlt3Compras: number;
  MargenPorcentaje: number;
};

type SortKey =
  | 'UltimaVenta'
  | 'UltimaFechaCompra'
  | 'DiasSinVenta'
  | 'Stock'
  | 'CostoPromedioUlt3Compras'
  | 'MargenPorcentaje';

// Helpers

const renderAlertaIcon = (dias: number) => {
  if (dias >= 180) return <Cancel sx={{ color: '#e53935' }} />;
  if (dias >= 90) return <Warning sx={{ color: '#ff9800' }} />;
  return <CheckCircle sx={{ color: '#43a047' }} />;
};

const isFechaValida = (fecha: string | null): boolean => {
  return !!fecha && !isNaN(new Date(fecha).getTime());
};

// Componente principal

const ProductosEstancadosTable = ({ data = [] }: { data: ProductoEstancado[] }) => {
  const [sortBy, setSortBy] = useState<SortKey>('DiasSinVenta');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDirection('asc');
    }
  };

  const filteredData = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    return data.filter(item =>
      item.SKU.toLowerCase().includes(lowerSearch) ||
      item.Producto.toLowerCase().includes(lowerSearch)
    );
  }, [data, searchTerm]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const valA = a[sortBy];
      const valB = b[sortBy];
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      if (sortDirection === 'asc') return valA > valB ? 1 : -1;
      else return valA < valB ? 1 : -1;
    });
  }, [filteredData, sortBy, sortDirection]);

  const exportToExcel = () => {
    const exportData = sortedData.map(item => ({
      SKU: item.SKU,
      Producto: item.Producto,
      'Primer Nivel': item.PrimerNivel || '—',
      Categoría: item.Categoria || '—',
      Subcategoría: item.Subcategoria || '—',
      'Ultima Venta': isFechaValida(item.UltimaVenta)
        ? new Date(item.UltimaVenta!).toLocaleDateString('es-CL')
        : 'Sin ventas',
      'Ultima Compra': isFechaValida(item.UltimaFechaCompra)
        ? new Date(item.UltimaFechaCompra!).toLocaleDateString('es-CL')
        : '—',
      'Dias sin venta': item.DiasSinVenta,
      Stock: item.Stock,
      'Costo Prom. Ult. 3 Compras': formatVentas(item.CostoPromedioUlt3Compras),
      '% Margen': `${item.MargenPorcentaje.toFixed(1)}%`,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'productos-estancados.xlsx');
  };

  const handleMenuClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

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
      <Box mb={2} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Typography variant="h6" fontWeight={600}>
          Productos Estancados
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            size="small"
            variant="outlined"
            label="Buscar SKU o nombre"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button variant="outlined" onClick={handleMenuClick}>
            Exportar
          </Button>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={() => { exportToExcel(); handleMenuClose(); }}>
              Exportar a Excel
            </MenuItem>
            {/* <MenuItem onClick={...}>Exportar a PDF</MenuItem> opcional */}
          </Menu>
        </Box>
      </Box>

      <Box sx={{ overflowX: 'auto' }}>
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table size="small" sx={{ minWidth: 900 }}>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell>Imagen</TableCell>
                <TableCell>Producto</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Primer Nivel</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Categoría</TableCell>
                <TableCell>{renderSortLabel('UltimaVenta', 'Última venta')}</TableCell>
                <TableCell>{renderSortLabel('UltimaFechaCompra', 'Última compra')}</TableCell>
                <TableCell>{renderSortLabel('DiasSinVenta', 'Días sin venta')}</TableCell>
                <TableCell>{renderSortLabel('Stock', 'Stock')}</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{renderSortLabel('CostoPromedioUlt3Compras', 'Costo Prom.')}</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{renderSortLabel('MargenPorcentaje', '% Margen')}</TableCell>
                <TableCell>Alerta</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedData.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    {row.Imagen ? (
                      <img src={row.Imagen} alt="producto" style={{ width: 40, height: 40, borderRadius: 4 }} />
                    ) : (
                      <Avatar variant="rounded" sx={{ width: 40, height: 40 }}>
                        {row.Producto.charAt(0)}
                      </Avatar>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={500}>{row.Producto}</Typography>
                    <Typography variant="caption" color="text.secondary">{row.SKU}</Typography>
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{row.PrimerNivel || '—'}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{row.Categoria || '—'}</TableCell>
                  <TableCell>
                    {isFechaValida(row.UltimaVenta)
                      ? new Date(row.UltimaVenta!).toLocaleDateString('es-CL', { timeZone: 'UTC' })
                      : <em style={{ color: '#888' }}>Sin ventas</em>}
                  </TableCell>
                  <TableCell>
                    {isFechaValida(row.UltimaFechaCompra)
                      ? new Date(row.UltimaFechaCompra!).toLocaleDateString('es-CL', { timeZone: 'UTC' })
                      : '—'}
                  </TableCell>
                  <TableCell>{`${row.DiasSinVenta} días`}</TableCell>
                  <TableCell>{formatUnidades(row.Stock)}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{formatVentas(row.CostoPromedioUlt3Compras)}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{`${row.MargenPorcentaje.toFixed(1)}%`}</TableCell>
                  <TableCell>{renderAlertaIcon(row.DiasSinVenta)}</TableCell>
                </TableRow>
              ))}
              {sortedData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    <Typography variant="body2" color="text.secondary" py={2}>
                      {searchTerm ? 'No se encontraron productos con ese criterio de búsqueda.' : 'Cargando...'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
};

export default ProductosEstancadosTable;