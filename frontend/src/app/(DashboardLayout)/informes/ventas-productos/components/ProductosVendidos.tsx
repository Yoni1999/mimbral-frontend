'use client';

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  TextField,
  TableSortLabel,
  Avatar,
  Stack
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { formatUnidades, formatVentas } from '@/utils/format';

type ProductoVendido = {
  imagen: string;
  sku: string;
  nombre: string;
  primerNivel: string;
  categoria: string;
  cantidadVendida: number;
  margenPorcentaje: number;
  margenBruto: number;
  precioPromedio: number;
  totalVentas: number;
  facturasUnicas: number;
};

type Order = 'asc' | 'desc';
type OrderBy =
  | 'cantidadVendida'
  | 'margenPorcentaje'
  | 'margenBruto'
  | 'precioPromedio'
  | 'totalVentas'
  | 'facturasUnicas';

interface Props {
  data: ProductoVendido[];
  onSortChange: (campo: OrderBy) => void;
  ordenActual: Order;
  ordenPorActual: OrderBy;
}

// Estilos consistentes con el componente anterior
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  '&.MuiTableCell-head': {
    backgroundColor: theme.palette.primary.dark,
    color: theme.palette.common.white,
    fontWeight: 'bold',
  },
  '&.MuiTableCell-body': {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const ProductosVendidos = ({
  data,
  onSortChange,
  ordenActual,
  ordenPorActual,
}: Props) => {
  const [busqueda, setBusqueda] = useState('');

  const filteredData = data.filter((producto) =>
    producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    producto.sku.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <Box mt={3}>
      <Typography variant="h6" fontWeight={600} mb={1}>
        Productos Vendidos
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

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <StyledTableCell>Imagen</StyledTableCell>
              <StyledTableCell>Producto (SKU)</StyledTableCell>
              <StyledTableCell>Primer Nivel / Categoría</StyledTableCell>

              <StyledTableCell sortDirection={ordenPorActual === 'cantidadVendida' ? ordenActual : false}>
                <TableSortLabel
                  active={ordenPorActual === 'cantidadVendida'}
                  direction={ordenPorActual === 'cantidadVendida' ? ordenActual : 'asc'}
                  onClick={() => onSortChange('cantidadVendida')}
                >
                  Cant. Vendida
                </TableSortLabel>
              </StyledTableCell>

              <StyledTableCell sortDirection={ordenPorActual === 'facturasUnicas' ? ordenActual : false}>
                <TableSortLabel
                  active={ordenPorActual === 'facturasUnicas'}
                  direction={ordenPorActual === 'facturasUnicas' ? ordenActual : 'asc'}
                  onClick={() => onSortChange('facturasUnicas')}
                >
                  Transacciones
                </TableSortLabel>
              </StyledTableCell>

              <StyledTableCell sortDirection={ordenPorActual === 'totalVentas' ? ordenActual : false}>
                <TableSortLabel
                  active={ordenPorActual === 'totalVentas'}
                  direction={ordenPorActual === 'totalVentas' ? ordenActual : 'asc'}
                  onClick={() => onSortChange('totalVentas')}
                >
                  Total Ventas
                </TableSortLabel>
              </StyledTableCell>

              <StyledTableCell sortDirection={ordenPorActual === 'margenBruto' ? ordenActual : false}>
                <TableSortLabel
                  active={ordenPorActual === 'margenBruto'}
                  direction={ordenPorActual === 'margenBruto' ? ordenActual : 'asc'}
                  onClick={() => onSortChange('margenBruto')}
                >
                  Margen Bruto / %
                </TableSortLabel>
              </StyledTableCell>

              <StyledTableCell sortDirection={ordenPorActual === 'precioPromedio' ? ordenActual : false}>
                <TableSortLabel
                  active={ordenPorActual === 'precioPromedio'}
                  direction={ordenPorActual === 'precioPromedio' ? ordenActual : 'asc'}
                  onClick={() => onSortChange('precioPromedio')}
                >
                  Precio Prom. Venta
                </TableSortLabel>
              </StyledTableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredData.map((row, idx) => (
              <StyledTableRow key={idx}>
                <StyledTableCell>
                  <Avatar
                    src={
                      row.imagen && row.imagen.startsWith('http')
                        ? row.imagen
                        : 'https://res.cloudinary.com/dhzahos7u/image/upload/v1748960388/producto_sin_imagen_vqaps4.jpg'
                    }
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
                  <Typography>{row.primerNivel}</Typography>
                  <Typography variant="caption" color="text.secondary">{row.categoria}</Typography>
                </StyledTableCell>

                <StyledTableCell>{formatUnidades(row.cantidadVendida)}</StyledTableCell>
                <StyledTableCell>{row.facturasUnicas}</StyledTableCell>
                <StyledTableCell>{formatVentas(row.totalVentas)}</StyledTableCell>

                <StyledTableCell>
                  <Typography>{formatVentas(row.margenBruto)}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {row.margenPorcentaje?.toFixed(2)}%
                  </Typography>
                </StyledTableCell>

                <StyledTableCell>{formatVentas(row.precioPromedio)}</StyledTableCell>
              </StyledTableRow>
            ))}
          </TableBody>
          {filteredData.length === 0 && (
  <StyledTableRow>
    <StyledTableCell colSpan={8} align="center">
      <Typography variant="body2" color="text.secondary">
        {busqueda ? 'No se encontraron productos con ese filtro.' : 'Cargando datos...'}
      </Typography>
    </StyledTableCell>
  </StyledTableRow>
)}

        </Table>
      </TableContainer>
    </Box>
  );
};

export default ProductosVendidos;
