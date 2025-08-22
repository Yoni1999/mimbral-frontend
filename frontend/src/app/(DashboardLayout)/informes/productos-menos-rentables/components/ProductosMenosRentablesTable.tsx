// informes/productos-menos-rentables/components/ProductosMenosRentablesTable.tsx
'use client';

import React, { useState } from 'react';
import {
  Box, Typography, TextField, TableContainer, Paper, Table, TableHead, TableRow,
  TableBody, Avatar, TableSortLabel
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Si ya existen estos helpers, impórtalos como en ventas:
// import { formatVentas, formatUnidades } from '@/utils/format';
// Si NO existen, avísame y uso el mismo import/path que tú usas.

interface ProductoRow {
  sku: string;
  nombre: string;
  imagen?: string;
  primerNivel?: string | null;
  categoria?: string | null;
  cantidadVendida: number;
  facturasUnicas: number;
  totalVentas: number;
  margenBruto: number;
  margenPorcentaje: number;
  precioPromedio: number;
  stockCanal: number;
  stockChorrillo?: number;
  stockOnOrder?: number;
}

type Order = 'asc' | 'desc';
type OrderBy = 'cantidadVendida' | 'facturasUnicas' | 'totalVentas' | 'margenBruto' | 'precioPromedio';

interface Props {
  data: ProductoRow[];
  onSortChange: (campo: OrderBy) => void;
  ordenActual: Order;
  ordenPorActual: OrderBy;
}

const PlaceholderImg = 'https://res.cloudinary.com/dhzahos7u/image/upload/v1748960388/producto_sin_imagen_vqaps4.jpg';

const StyledTableCell = styled('td')(({ theme }) => ({
  padding: theme.spacing(1.5),
  borderBottom: `1px solid ${theme.palette.divider}`,
  '&:first-of-type': { width: 64 }
})) as any;

const StyledHeadCell = styled('th')(({ theme }) => ({
  padding: theme.spacing(1.5),
  borderBottom: `1px solid ${theme.palette.divider}`,
  background: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  fontWeight: 600,
})) as any;

const StyledTableRow = styled('tr')(({ theme }) => ({
  '&:nth-of-type(odd)': { backgroundColor: theme.palette.action.hover },
})) as any;

const ProductosMenosRentablesTable: React.FC<Props> = ({ data, onSortChange, ordenActual, ordenPorActual }) => {
  const [busqueda, setBusqueda] = useState('');

  const filteredData = data.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.sku.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <Box mt={3}>
      <Typography variant="h6" fontWeight={600} mb={1}>
        Productos menos rentables
      </Typography>

      <Box mb={2}>
        <TextField
          label="Buscar por nombre o SKU"
          variant="outlined"
          size="small"
          sx={{ width: 280 }}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <StyledHeadCell>Imagen</StyledHeadCell>
              <StyledHeadCell>Producto (SKU)</StyledHeadCell>
              <StyledHeadCell>Primer Nivel / Categoría</StyledHeadCell>

              <StyledHeadCell>
                <TableSortLabel
                  active={ordenPorActual === 'cantidadVendida'}
                  direction={ordenPorActual === 'cantidadVendida' ? ordenActual : 'asc'}
                  onClick={() => onSortChange('cantidadVendida')}
                >
                  Cant. Vendida
                </TableSortLabel>
              </StyledHeadCell>

              <StyledHeadCell>
                <TableSortLabel
                  active={ordenPorActual === 'facturasUnicas'}
                  direction={ordenPorActual === 'facturasUnicas' ? ordenActual : 'asc'}
                  onClick={() => onSortChange('facturasUnicas')}
                >
                  Transacciones
                </TableSortLabel>
              </StyledHeadCell>

              <StyledHeadCell>
                <TableSortLabel
                  active={ordenPorActual === 'totalVentas'}
                  direction={ordenPorActual === 'totalVentas' ? ordenActual : 'asc'}
                  onClick={() => onSortChange('totalVentas')}
                >
                  Total Ventas
                </TableSortLabel>
              </StyledHeadCell>

              <StyledHeadCell>
                <TableSortLabel
                  active={ordenPorActual === 'margenBruto'}
                  direction={ordenPorActual === 'margenBruto' ? ordenActual : 'asc'}
                  onClick={() => onSortChange('margenBruto')}
                >
                  Margen Bruto / %
                </TableSortLabel>
              </StyledHeadCell>

              <StyledHeadCell>
                <TableSortLabel
                  active={ordenPorActual === 'precioPromedio'}
                  direction={ordenPorActual === 'precioPromedio' ? ordenActual : 'asc'}
                  onClick={() => onSortChange('precioPromedio')}
                >
                  Precio Prom. Venta
                </TableSortLabel>
              </StyledHeadCell>

              <StyledHeadCell>Stock Actual</StyledHeadCell>
              <StyledHeadCell>Stock Chorrillo</StyledHeadCell>
              <StyledHeadCell>OC (On Order)</StyledHeadCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredData.map((row, idx) => (
              <StyledTableRow key={row.sku + idx}>
                <StyledTableCell>
                  <Avatar
                    src={row.imagen || PlaceholderImg}
                    alt={row.nombre}
                    sx={{ width: 48, height: 48 }}
                    variant="rounded"
                  />
                </StyledTableCell>

                <StyledTableCell>
                  <Typography fontWeight={600}>{row.nombre}</Typography>
                  <Typography variant="caption" color="text.secondary">{row.sku}</Typography>
                </StyledTableCell>

                <StyledTableCell>
                  <Typography>{row.primerNivel || ''}</Typography>
                  <Typography variant="caption" color="text.secondary">{row.categoria || ''}</Typography>
                </StyledTableCell>

                <StyledTableCell>{row.cantidadVendida.toLocaleString()}</StyledTableCell>
                <StyledTableCell>{row.facturasUnicas}</StyledTableCell>
                <StyledTableCell>{row.totalVentas.toLocaleString('es-CL')}</StyledTableCell>

                <StyledTableCell>
                  <Typography>{row.margenBruto.toLocaleString('es-CL')}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {row.margenPorcentaje.toFixed(2)}%
                  </Typography>
                </StyledTableCell>

                <StyledTableCell>{row.precioPromedio.toLocaleString('es-CL')}</StyledTableCell>
                <StyledTableCell>{row.stockCanal.toLocaleString()}</StyledTableCell>
                <StyledTableCell>{row.stockChorrillo ?? 'N/A'}</StyledTableCell>
                <StyledTableCell>{row.stockOnOrder ?? 'N/A'}</StyledTableCell>
              </StyledTableRow>
            ))}

            {filteredData.length === 0 && (
              <StyledTableRow>
                <StyledTableCell colSpan={12} style={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {busqueda ? 'No se encontraron productos con ese filtro.' : 'Cargando datos...'}
                  </Typography>
                </StyledTableCell>
              </StyledTableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ProductosMenosRentablesTable;
