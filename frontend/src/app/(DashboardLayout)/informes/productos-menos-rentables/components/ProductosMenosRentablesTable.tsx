// informes/productos-menos-rentables/components/ProductosMenosRentablesTable.tsx
'use client';

import React, { useState } from 'react';
import {
  Box, Typography, TextField, TableContainer, Paper, Table, TableHead, TableRow,
  TableBody, Avatar, TableSortLabel
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { notifySuccess, notifyError } from '@/components/ui/toast/notify';
import { OrdenMovil, TarjetasMovil, useEsCelular } from '@/app/(DashboardLayout)/utilities/ventas/components/movil';

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

const ProductosMenosRentablesTable: React.FC<Props> = ({ data, onSortChange, ordenActual, ordenPorActual }) => {
  const [busqueda, setBusqueda] = useState('');
  const esCelular = useEsCelular();

  const filteredData = data.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.sku.toLowerCase().includes(busqueda.toLowerCase())
  );

  ///////////// para copiar sku
  const handleCopySku = async (sku: string) => {
    const ok = await copyToClipboard(sku);
    if (ok) {
      notifySuccess(`SKU ${sku} copiado`);
    } else {
      notifyError('No se pudo copiar el SKU. Prueba manualmente con Ctrl/Cmd + C.');
    }
  };
  /////////////

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
          sx={{ width: { xs: '100%', sm: 280 } }}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </Box>

      {esCelular ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          <OrdenMovil
            opciones={[
              { clave: 'margenBruto', titulo: 'Margen bruto' },
              { clave: 'totalVentas', titulo: 'Total ventas' },
              { clave: 'cantidadVendida', titulo: 'Cant. vendida' },
              { clave: 'facturasUnicas', titulo: 'Transacciones' },
              { clave: 'precioPromedio', titulo: 'Precio prom. venta' },
            ]}
            clave={ordenPorActual}
            direccion={ordenActual}
            // Igual que el encabezado: otra columna parte ascendente y la misma invierte.
            onCambiar={(clave) => onSortChange(clave as OrderBy)}
          />
          <TarjetasMovil
            vacio={busqueda ? 'No se encontraron productos con ese filtro.' : 'Cargando datos...'}
            filas={filteredData.map((row, idx) => ({
              clave: row.sku + idx,
              titulo: row.nombre,
              // Tocar el título copia el SKU, igual que en la tabla.
              meta: [row.sku, [row.primerNivel, row.categoria].filter(Boolean).join(' › ')].filter(Boolean).join(' · '),
              onAbrir: () => handleCopySku(row.sku),
              principales: [
                { titulo: 'Unid.', valor: row.cantidadVendida.toLocaleString('es-CL') },
                { titulo: 'Ventas', valor: row.totalVentas.toLocaleString('es-CL') },
                { titulo: 'Margen', valor: `${row.margenPorcentaje.toFixed(2)}%` },
              ],
              detalle: [
                { titulo: 'Margen bruto', valor: row.margenBruto.toLocaleString('es-CL') },
                { titulo: 'Transacciones', valor: row.facturasUnicas },
                { titulo: 'Precio prom. venta', valor: row.precioPromedio.toLocaleString('es-CL') },
                { titulo: 'Stock actual', valor: row.stockCanal.toLocaleString('es-CL') },
                { titulo: 'Stock Chorrillos', valor: row.stockChorrillo ?? 'N/A' },
                { titulo: 'OC (On Order)', valor: row.stockOnOrder ?? 'N/A' },
              ],
            }))}
          />
        </Box>
      ) : (
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
              <StyledHeadCell>Stock Chorrillos</StyledHeadCell>
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
      )}
    </Box>
  );
};

export default ProductosMenosRentablesTable;
