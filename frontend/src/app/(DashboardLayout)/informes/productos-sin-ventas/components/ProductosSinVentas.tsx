'use client';

import React, { useMemo, useState } from 'react';
import {
  Box, Typography, TextField, TableContainer, Paper, Table, TableHead, TableRow,
  TableBody, Avatar, TableSortLabel, IconButton, Popover, List, ListItem, ListItemText, Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { ProductoSinVentas } from '../page';
import { Snackbar, Alert } from '@mui/material';

// Mantener estilos y estructura de tabla como en ProductosMenosRentablesTable
const PlaceholderImg = 'https://res.cloudinary.com/dhzahos7u/image/upload/v1748960388/producto_sin_imagen_vqaps4.jpg';

type Order = 'asc' | 'desc';
type OrderBy = 'stockTotal' | 'createDate';

interface Props {
  data: ProductoSinVentas[];
  onSortChange: (campo: OrderBy) => void;
  ordenActual: Order;
  ordenPorActual: OrderBy;
}

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

const ProductosSinVentasTable: React.FC<Props> = ({ data, onSortChange, ordenActual, ordenPorActual }) => {
  const [busqueda, setBusqueda] = useState('');
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [skuOpen, setSkuOpen] = useState<string>('');

  const filteredData = useMemo(() =>
    data.filter((p) =>
      (p.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.itemCode || '').toLowerCase().includes(busqueda.toLowerCase())
    ), [data, busqueda]);

  const handleSort = (campo: OrderBy) => () => onSortChange(campo);

  const handleOpenWH = (e: React.MouseEvent<HTMLElement>, sku: string) => {
    setAnchorEl(e.currentTarget);
    setSkuOpen(sku);
  };
  const handleCloseWH = () => {
    setAnchorEl(null);
    setSkuOpen('');
  };
  const open = Boolean(anchorEl);
  const whList = filteredData.find(r => r.itemCode === skuOpen)?.warehouses || {};

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

  ///////////// --- Popover para "Última OC" ---
  const [ocAnchorEl, setOcAnchorEl] = useState<HTMLElement | null>(null);
  const [ocSkuOpen, setOcSkuOpen] = useState<string>('');
  const handleOpenOC = (e: React.MouseEvent<HTMLElement>, sku: string) => {
    setOcAnchorEl(e.currentTarget);
    setOcSkuOpen(sku);
  };
  const handleCloseOC = () => {
    setOcAnchorEl(null);
    setOcSkuOpen('');
  };
  /////////////

  return (
    <Box mt={3}>
      <Typography variant="h6" fontWeight={600} mb={1}>
        Productos sin ventas
      </Typography>

      {/* <Box mb={2}>
        <TextField
          label="Buscar por nombre o SKU"
          variant="outlined"
          size="small"
          sx={{ width: 280 }}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </Box> */}

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <StyledHeadCell>Imagen</StyledHeadCell>
              <StyledHeadCell>Producto (SKU)</StyledHeadCell>
              <StyledHeadCell>Primer Nivel / Categoría</StyledHeadCell>

              <StyledHeadCell>
                <TableSortLabel
                  active={ordenPorActual === 'createDate'}
                  direction={ordenPorActual === 'createDate' ? ordenActual : 'asc'}
                  onClick={handleSort('createDate')}
                >
                  Fecha creación
                </TableSortLabel>
              </StyledHeadCell>

              <StyledHeadCell>
                <TableSortLabel
                  active={ordenPorActual === 'stockTotal'}
                  direction={ordenPorActual === 'stockTotal' ? ordenActual : 'asc'}
                  onClick={handleSort('stockTotal')}
                >
                  Stock Total
                </TableSortLabel>
              </StyledHeadCell>

              <StyledHeadCell>Almacenes</StyledHeadCell>
              <StyledHeadCell>Última OC</StyledHeadCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredData.map((row, idx) => (
              <StyledTableRow key={`${row.itemCode}-${idx}`}>
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
                    onClick={() => handleCopySku(row.itemCode)}
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
                      {row.itemCode}
                    </Typography>
                  </Box>
                </StyledTableCell>

                <StyledTableCell>
                  <Typography>{row.primerNivel || ''}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {row.categoria || ''}{row.subcategoria ? ` / ${row.subcategoria}` : ''}
                  </Typography>
                </StyledTableCell>

                <StyledTableCell>
                  {row.createDate ? new Date(row.createDate).toLocaleDateString() : '-'}
                </StyledTableCell>

                <StyledTableCell>
                  <Chip label={row.stockTotal} color={row.stockTotal > 0 ? 'primary' : 'default'} size="small" />
                </StyledTableCell>

                <StyledTableCell>
                  <IconButton size="small" onClick={(e) => handleOpenWH(e, row.itemCode)} aria-label="Ver almacenes">
                    <InfoOutlinedIcon fontSize="small" />
                  </IconButton>
                </StyledTableCell>

                <StyledTableCell>
                  {row.ocDocNum ? (
                    <>
                      <Typography variant="body2">#{row.ocDocNum}</Typography>

                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          {row.ocFecha ? new Date(row.ocFecha).toLocaleDateString() : ''}
                        </Typography>

                        <IconButton
                          size="small"
                          onClick={(e) => handleOpenOC(e, row.itemCode)}
                          aria-label="Ver detalle de la OC"
                        >
                          <InfoOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </>
                  ) : (
                    '—'
                  )}
                </StyledTableCell>

              </StyledTableRow>
            ))}

            {filteredData.length === 0 && (
              <StyledTableRow>
                <StyledTableCell colSpan={12} style={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {busqueda ? 'No se encontraron productos con ese filtro.' : 'Sin datos disponibles...'}
                  </Typography>
                </StyledTableCell>
              </StyledTableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Popover con desglose por almacén (consistente y minimalista) */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleCloseWH}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box p={1.5} minWidth={260}>
          <List dense>
            {Object.keys(whList).length === 0 ? (
              <ListItem><ListItemText primary="Sin datos de almacenes" /></ListItem>
            ) : (
              Object.entries(whList).map(([wh, qty]) => (
                <ListItem key={wh}>
                  <ListItemText primary={wh} secondary={`Stock: ${qty}`} />
                </ListItem>
              ))
            )}
          </List>
        </Box>
      </Popover>
      {/* Popover con detalle de Última OC */}
      <Popover
        open={Boolean(ocAnchorEl)}
        anchorEl={ocAnchorEl}
        onClose={handleCloseOC}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box p={1.5} minWidth={280}>
          {(() => {
            const oc = filteredData.find(r => r.itemCode === ocSkuOpen);
            return (
              <List dense>
                <ListItem>
                  <ListItemText primary="Proveedor" secondary={oc?.ocProveedor ?? 'N/A'} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Cantidad" secondary={oc?.ocCantidad ?? 'N/A'} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Creado por" secondary={oc?.ocCreadoPor ?? 'N/A'} />
                </ListItem>
              </List>
            );
          })()}
        </Box>
      </Popover>
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

export default ProductosSinVentasTable;
