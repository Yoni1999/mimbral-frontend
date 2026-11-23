'use client';

import React, { useState, useMemo } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Typography, Box, TableSortLabel, TextField, Button
} from '@mui/material';
import { CheckCircle, Warning, Cancel } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { BarraListaMovil, TarjetasMovil, useEsCelular } from '@/app/(DashboardLayout)/utilities/ventas/components/movil';
import { formatoPesos, formatoPorcentaje } from '@/app/(DashboardLayout)/utilities/ventas/components/estilo';

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
  // null: sin precio de lista o sin compras, no hay margen que calcular.
  MargenPorcentaje: number | null;
};

type SortKey =
  | 'Producto'
  | 'PrimerNivel'
  | 'Categoria'
  | 'UltimaVenta'
  | 'UltimaFechaCompra'
  | 'DiasSinVenta'
  | 'Stock'
  | 'CostoPromedioUlt3Compras'
  | 'MargenPorcentaje';

const renderAlertaIcon = (dias: number) => {
  if (dias >= 180) return <Cancel sx={{ color: '#e53935' }} />;
  if (dias >= 90) return <Warning sx={{ color: '#ff9800' }} />;
  return <CheckCircle sx={{ color: '#43a047' }} />;
};

const isFechaValida = (fecha: string | null): boolean => {
  return !!fecha && !isNaN(new Date(fecha).getTime());
};

const ProductosEstancadosTable = ({
  data = [],
  etiquetaMargen = '% Margen',
}: {
  data: ProductoEstancado[];
  etiquetaMargen?: string;
}) => {
  const [sortBy, setSortBy] = useState<SortKey>('DiasSinVenta');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const esCelular = useEsCelular();

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
      if (typeof valA === 'string' && typeof valB === 'string' && (sortBy === 'Producto' || sortBy === 'PrimerNivel' || sortBy === 'Categoria')) {
        const r = valA.localeCompare(valB, 'es');
        return sortDirection === 'asc' ? r : -r;
      }
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
      'Última Venta': isFechaValida(item.UltimaVenta)
        ? new Date(item.UltimaVenta!).toLocaleDateString('es-CL')
        : 'Sin ventas',
      'Última Compra': isFechaValida(item.UltimaFechaCompra)
        ? new Date(item.UltimaFechaCompra!).toLocaleDateString('es-CL')
        : '—',
      'Días sin venta': item.DiasSinVenta,
      Stock: item.Stock,
      'Costo Prom. Últ. 3 Compras': item.CostoPromedioUlt3Compras,
      [etiquetaMargen]: item.MargenPorcentaje ?? '—',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'productos-estancados.xlsx');
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
        {/* En celular el buscador y la descarga van en la barra de la lista. */}
        {!esCelular && (
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap" sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <TextField
            size="small"
            variant="outlined"
            sx={{ width: { xs: '100%', sm: 'auto' } }}
            label="Buscar SKU o nombre"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button variant="contained" onClick={exportToExcel}>
            Exportar a Excel
          </Button>
        </Box>
        )}
      </Box>

      {esCelular ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <BarraListaMovil
            buscar={{ valor: searchTerm, onCambiar: setSearchTerm, placeholder: 'Buscar SKU o nombre' }}
            onExportar={exportToExcel}
            orden={{
            opciones: [
              { clave: 'DiasSinVenta', titulo: 'Días sin venta' },
              { clave: 'Stock', titulo: 'Stock' },
              { clave: 'UltimaVenta', titulo: 'Última venta' },
              { clave: 'UltimaFechaCompra', titulo: 'Última compra' },
              { clave: 'CostoPromedioUlt3Compras', titulo: 'Costo prom.' },
              { clave: 'MargenPorcentaje', titulo: etiquetaMargen },
              { clave: 'Producto', titulo: 'Producto' },
              { clave: 'PrimerNivel', titulo: 'Primer nivel' },
              { clave: 'Categoria', titulo: 'Categoría' },
            ],
            clave: sortBy,
            direccion: sortDirection,
            onCambiar: (clave, direccion) => {
              setSortBy(clave as SortKey);
              setSortDirection(direccion);
            },
            }}
          />
          <TarjetasMovil
            vacio="No se encontraron productos con ese criterio de búsqueda."
            filas={sortedData.map((row, idx) => ({
              clave: `${row.SKU}-${idx}`,
              titulo: row.Producto,
              meta: [row.SKU, [row.PrimerNivel, row.Categoria].filter(Boolean).join(' › ')].filter(Boolean).join(' · '),
              imagen: row.Imagen || null,
              principales: [
                {
                  titulo: 'Días sin venta',
                  valor: (
                    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, '& svg': { fontSize: 16 } }}>
                      {renderAlertaIcon(row.DiasSinVenta)}
                      {(row.DiasSinVenta ?? 0).toLocaleString('es-CL')}
                    </Box>
                  ),
                  unidad: 'días',
                },
                { titulo: 'Stock', valor: (row.Stock ?? 0).toLocaleString('es-CL'), unidad: 'un.' },
                {
                  titulo: etiquetaMargen,
                  valor: row.MargenPorcentaje === null || row.MargenPorcentaje === undefined ? '—' : formatoPorcentaje(row.MargenPorcentaje),
                  chip: row.MargenPorcentaje ?? null,
                },
              ],
              detalle: [
                {
                  titulo: 'Última venta',
                  valor: isFechaValida(row.UltimaVenta)
                    ? new Date(row.UltimaVenta!).toLocaleDateString('es-CL', { timeZone: 'UTC' })
                    : <em style={{ color: '#888' }}>Sin ventas</em>,
                },
                {
                  titulo: 'Última compra',
                  valor: isFechaValida(row.UltimaFechaCompra)
                    ? new Date(row.UltimaFechaCompra!).toLocaleDateString('es-CL', { timeZone: 'UTC' })
                    : '—',
                },
                { titulo: 'Costo prom.', valor: formatoPesos(row.CostoPromedioUlt3Compras) },
                { titulo: 'Primer nivel', valor: row.PrimerNivel || '—' },
                { titulo: 'Categoría', valor: row.Categoria || '—' },
              ],
            }))}
          />
        </Box>
      ) : (
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell>Imagen</TableCell>
              <TableCell>{renderSortLabel('Producto', 'Producto')}</TableCell>
              <TableCell>{renderSortLabel('PrimerNivel', 'Primer Nivel')}</TableCell>
              <TableCell>{renderSortLabel('Categoria', 'Categoría')}</TableCell>
              <TableCell>{renderSortLabel('UltimaVenta', 'Última venta')}</TableCell>
              <TableCell>{renderSortLabel('UltimaFechaCompra', 'Última compra')}</TableCell>
              <TableCell>{renderSortLabel('DiasSinVenta', 'Días sin venta')}</TableCell>
              <TableCell>{renderSortLabel('Stock', 'Stock')}</TableCell>
              <TableCell>{renderSortLabel('CostoPromedioUlt3Compras', 'Costo Prom.')}</TableCell>
              <TableCell>{renderSortLabel('MargenPorcentaje', etiquetaMargen)}</TableCell>
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
                    <Typography variant="caption" color="text.secondary">Sin imagen</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography fontWeight={500}>{row.Producto}</Typography>
                  <Typography variant="caption" color="text.secondary">{row.SKU}</Typography>
                </TableCell>
                <TableCell>{row.PrimerNivel || '—'}</TableCell>
                <TableCell>{row.Categoria || '—'}</TableCell>
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
                <TableCell>{row.Stock}</TableCell>
                <TableCell>{row.CostoPromedioUlt3Compras}</TableCell>
                <TableCell>{row.MargenPorcentaje === null || row.MargenPorcentaje === undefined ? '—' : `${row.MargenPorcentaje}%`}</TableCell>
                <TableCell>{renderAlertaIcon(row.DiasSinVenta)}</TableCell>
              </TableRow>
            ))}
            {sortedData.length === 0 && (
              <TableRow>
                <TableCell colSpan={11}>
                  <Typography align="center" color="text.secondary" py={2}>
                    No se encontraron productos con ese criterio de búsqueda.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      )}
    </Box>
  );
};

export default ProductosEstancadosTable;
