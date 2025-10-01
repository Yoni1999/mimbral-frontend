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
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { formatUnidades, formatVentas } from '@/utils/format';
import { Snackbar, Alert } from '@mui/material';

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
  stockCanal: number;
  stockChorrillo?: number;
  stockOnOrder?: number;
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

///////////// Copiado robusto: usa Clipboard API si existe; si no, fallback con textarea + execCommand
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (typeof navigator !== 'undefined' && (navigator as any).clipboard && window.isSecureContext) {
      await (navigator as any).clipboard.writeText(text);
      return true;
    }
  } catch (_e) {
    // seguimos al fallback
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, ta.value.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch (_e) {
    return false;
  }
};
/////////////

const ProductosVendidos = ({
  data,
  onSortChange,
  ordenActual,
  ordenPorActual,
}: Props) => {
  const [busqueda, setBusqueda] = useState('');

  // safeData evita errores si data viene undefined/null en el primer render
  const safeData = Array.isArray(data) ? data : [];
  const filteredData = safeData.filter((producto) =>
    producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    producto.sku.toLowerCase().includes(busqueda.toLowerCase())
  );

  ///////////// para copiar sku
  const [copiedSku, setCopiedSku] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);

  const handleCopySku = async (sku: string) => {
    const ok = await copyToClipboard(sku);
    if (ok) {
      setCopyError(null);
      setCopiedSku(sku);
    } else {
      setCopiedSku(null);
      setCopyError('No se pudo copiar el SKU. Prueba manualmente con Ctrl/Cmd + C.');
    }
  };
  /////////////

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

              <StyledTableCell>
                Stock Actual
              </StyledTableCell>

              <StyledTableCell>Stock Chorrillo</StyledTableCell>
              <StyledTableCell>OC (On Order)</StyledTableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredData.map((row) => (
              <StyledTableRow key={`${row.sku}-${row.nombre}`}>
                <StyledTableCell>
                  <Avatar
                    src={
                      row.imagen?.startsWith('http')
                        ? row.imagen
                        : 'https://res.cloudinary.com/dhzahos7u/image/upload/v1748960388/producto_sin_imagen_vqaps4.jpg'
                    }
                    alt={row.nombre}
                    sx={{ width: 48, height: 48 }}
                    variant="rounded"
                  />
                </StyledTableCell>

                <StyledTableCell>
                  <Box
                    onClick={() => handleCopySku(row.sku)}
                    sx={{
                      cursor: 'pointer',
                      userSelect: 'none',
                      '&:hover .skuCopy': { textDecoration: 'underline' },
                    }}
                    title="Copiar SKU"
                    role="button"
                  >
                    <Typography fontWeight={600}>{row.nombre}</Typography>
                    <Typography className="skuCopy" variant="caption" color="text.secondary">
                      {row.sku}
                    </Typography>
                  </Box>
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
                <StyledTableCell>{formatUnidades(row.stockCanal)}</StyledTableCell>
                <StyledTableCell>{row.stockChorrillo !== undefined ? formatUnidades(row.stockChorrillo) : 'N/A'}</StyledTableCell>
                <StyledTableCell>{row.stockOnOrder !== undefined ? formatUnidades(row.stockOnOrder) : 'N/A'}</StyledTableCell>
              </StyledTableRow>
            ))}
            {filteredData.length === 0 && (
              <StyledTableRow>
                <StyledTableCell colSpan={12} align="center">
                  <Typography variant="body2" color="text.secondary">
                    {busqueda ? 'No se encontraron productos con ese filtro.' : 'Cargando datos...'}
                  </Typography>
                </StyledTableCell>
              </StyledTableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {/* sku copiado */}
      <Snackbar
        open={Boolean(copiedSku)}
        autoHideDuration={1500}
        onClose={() => setCopiedSku(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setCopiedSku(null)} severity="success" variant="filled">
          SKU {copiedSku} copiado
        </Alert>
      </Snackbar>

      <Snackbar
        open={Boolean(copyError)}
        autoHideDuration={2500}
        onClose={() => setCopyError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setCopyError(null)} severity="error" variant="filled">
          {copyError}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProductosVendidos;
