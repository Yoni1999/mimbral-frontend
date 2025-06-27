'use client';

import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Typography, Box, TextField, TableSortLabel
} from '@mui/material';
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
              <TableCell>Imagen</TableCell>
              <TableCell>Producto (SKU)</TableCell>
              <TableCell>Primer Nivel / Categoría</TableCell>

              <TableCell sortDirection={ordenPorActual === 'cantidadVendida' ? ordenActual : false}>
                <TableSortLabel
                  active={ordenPorActual === 'cantidadVendida'}
                  direction={ordenPorActual === 'cantidadVendida' ? ordenActual : 'asc'}
                  onClick={() => onSortChange('cantidadVendida')}
                >
                  Cant. Vendida
                </TableSortLabel>
              </TableCell>

              <TableCell sortDirection={ordenPorActual === 'facturasUnicas' ? ordenActual : false}>
                <TableSortLabel
                  active={ordenPorActual === 'facturasUnicas'}
                  direction={ordenPorActual === 'facturasUnicas' ? ordenActual : 'asc'}
                  onClick={() => onSortChange('facturasUnicas')}
                >
                  Cant. Transacciones
                </TableSortLabel>
              </TableCell>

              <TableCell sortDirection={ordenPorActual === 'totalVentas' ? ordenActual : false}>
                <TableSortLabel
                  active={ordenPorActual === 'totalVentas'}
                  direction={ordenPorActual === 'totalVentas' ? ordenActual : 'asc'}
                  onClick={() => onSortChange('totalVentas')}
                >
                  Total Ventas
                </TableSortLabel>
              </TableCell>

              <TableCell sortDirection={ordenPorActual === 'margenBruto' ? ordenActual : false}>
                <TableSortLabel
                  active={ordenPorActual === 'margenBruto'}
                  direction={ordenPorActual === 'margenBruto' ? ordenActual : 'asc'}
                  onClick={() => onSortChange('margenBruto')}
                >
                  Margen Bruto / %
                </TableSortLabel>
              </TableCell>

              <TableCell sortDirection={ordenPorActual === 'precioPromedio' ? ordenActual : false}>
                <TableSortLabel
                  active={ordenPorActual === 'precioPromedio'}
                  direction={ordenPorActual === 'precioPromedio' ? ordenActual : 'asc'}
                  onClick={() => onSortChange('precioPromedio')}
                >
                  Precio Prom. Venta
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredData.map((row, idx) => (
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

                <TableCell>
                  <Typography>{row.primerNivel}</Typography>
                  <Typography variant="caption" color="textSecondary">{row.categoria}</Typography>
                </TableCell>

                <TableCell>{formatUnidades(row.cantidadVendida)}</TableCell>
                <TableCell>{row.facturasUnicas}</TableCell>
                <TableCell>{formatVentas(row.totalVentas)}</TableCell>

                <TableCell>
                  <Typography>{formatVentas(row.margenBruto)}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {row.margenPorcentaje?.toFixed(2)}%
                  </Typography>
                </TableCell>

                <TableCell>{formatVentas(row.precioPromedio)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ProductosVendidos;
