'use client';

import React, { useState } from 'react';
import {
  Box, Button, InputAdornment, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TableSortLabel, TextField, Typography,
} from '@mui/material';
import { IconArrowRight, IconDownload, IconSearch } from '@tabler/icons-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useRouter } from 'next/navigation';
import { BarraParticipacion, ChipMargen, EncabezadoPanel, formatoMonto, formatoPesos, tablaSx, tarjetaSx, tinta, Columnas, TextoCelda } from '../../components/estilo';
import { BarraListaMovil, TarjetasMovil, useEsCelular } from '../../components/movil';

type ProductoVendido = {
  imagen: string;
  sku: string;
  nombre: string;
  primerNivel: string;
  categoria: string;
  cantidadVendida: number;
  margenPorcentaje: number;
  stock: number;
  margenBruto: number;
  precioPromedio: number;
  totalVentas: number;
};

type Props = {
  data: ProductoVendido[];
};

type Order = 'asc' | 'desc';
type OrderBy =
  | 'nombre'
  | 'primerNivel'
  | 'cantidadVendida'
  | 'margenPorcentaje'
  | 'stock'
  | 'margenBruto'
  | 'precioPromedio'
  | 'totalVentas';

const SIN_IMAGEN = 'https://res.cloudinary.com/dhzahos7u/image/upload/v1748960388/producto_sin_imagen_vqaps4.jpg';

const ProductosVendidos = ({ data }: Props) => {
  const [busqueda, setBusqueda] = useState('');
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<OrderBy>('cantidadVendida');
  const router = useRouter();
  const esCelular = useEsCelular();

  const handleSort = (campo: OrderBy) => {
    const isDesc = orderBy === campo && order === 'desc';
    setOrder(isDesc ? 'asc' : 'desc');
    setOrderBy(campo);
  };

  const filteredData = data.filter((producto) =>
    producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    producto.sku.toLowerCase().includes(busqueda.toLowerCase())
  );

  const sortedData = [...filteredData].sort((a, b) => {
    const valA = a[orderBy];
    const valB = b[orderBy];
    if (typeof valA === 'string' || typeof valB === 'string') {
      const r = String(valA ?? '').localeCompare(String(valB ?? ''), 'es');
      return order === 'asc' ? r : -r;
    }
    if (valA < valB) return order === 'asc' ? -1 : 1;
    if (valA > valB) return order === 'asc' ? 1 : -1;
    return 0;
  });

  const maxVenta = Math.max(0, ...sortedData.map((p) => p.totalVentas || 0));

  const exportToExcel = () => {
    const excelData = sortedData.map((row) => ({
      SKU: row.sku,
      Nombre: row.nombre,
      'Primer Nivel': row.primerNivel,
      Categoría: row.categoria,
      'Cantidad Vendida': row.cantidadVendida,
      'Total Ventas': row.totalVentas,
      '% Margen': row.margenPorcentaje,
      Stock: row.stock,
      'Margen Bruto': row.margenBruto,
      'Precio Prom. Venta': row.precioPromedio,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ProductosVendidos');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'productos_vendidos.xlsx');
  };

  const columna = (campo: OrderBy, label: string, sx?: object, align: 'left' | 'right' = 'right') => (
    <TableCell align={align} sx={sx} sortDirection={orderBy === campo ? order : false}>
      <TableSortLabel active={orderBy === campo} direction={orderBy === campo ? order : 'desc'} onClick={() => handleSort(campo)}>
        {label}
      </TableSortLabel>
    </TableCell>
  );

  return (
    <Box sx={{ ...tarjetaSx, p: { xs: 1.5, sm: 2.5 } }}>
      <EncabezadoPanel
        titulo="Top 50 productos más vendidos"
        descripcion={`${filteredData.length} productos${busqueda ? ' con ese criterio' : ''}`}
        // En celular el buscador y el Excel van en la barra de la lista (BarraListaMovil).
        accion={esCelular ? undefined : (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <TextField
              size="small"
              placeholder="Buscar por nombre o SKU"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconSearch size={16} color={tinta.tenue} />
                  </InputAdornment>
                ),
              }}
              sx={{ width: { xs: '100%', sm: 260 }, '& .MuiOutlinedInput-root': { borderRadius: '10px', height: 36, fontSize: 13.5 } }}
            />
            <Button
              variant="outlined"
              startIcon={<IconDownload size={16} />}
              onClick={exportToExcel}
              sx={{ textTransform: 'none', borderRadius: '10px', height: 36, borderColor: tinta.borde, color: tinta.primaria, fontWeight: 600 }}
            >
              Exportar a Excel
            </Button>
          </Box>
        )}
      />

      {esCelular ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          <BarraListaMovil
            buscar={{ valor: busqueda, onCambiar: setBusqueda, placeholder: 'Buscar por nombre o SKU' }}
            onExportar={exportToExcel}
            orden={{
            opciones: [
              { clave: 'cantidadVendida', titulo: 'Cant. vendida' },
              { clave: 'totalVentas', titulo: 'Total ventas' },
              { clave: 'margenPorcentaje', titulo: '% Margen' },
              { clave: 'margenBruto', titulo: 'Margen bruto' },
              { clave: 'precioPromedio', titulo: 'Precio prom.' },
              { clave: 'stock', titulo: 'Stock' },
              { clave: 'nombre', titulo: 'Producto' },
            ],
            clave: orderBy,
            direccion: order,
            onCambiar: (clave, direccion) => {
              setOrderBy(clave as OrderBy);
              setOrder(direccion);
            },
            }}
          />
          <TarjetasMovil
            vacio="Ningún producto coincide con la búsqueda."
            filas={sortedData.map((row, i) => ({
              clave: row.sku,
              titulo: row.nombre,
              imagen: row.imagen || null,
              // Posición en el ranking solo al ordenar de mayor a menor por una cifra y sin búsqueda.
              rango: order === 'desc' && orderBy !== 'nombre' && orderBy !== 'primerNivel' && !busqueda ? i + 1 : undefined,
              meta: [row.sku, [row.primerNivel, row.categoria].filter(Boolean).join(' › ')].filter(Boolean).join(' · '),
              onAbrir: () => router.push(`/utilities/analisis-producto1.1?itemCode=${encodeURIComponent(row.sku)}`),
              principales: [
                { titulo: 'Unidades', valor: (row.cantidadVendida ?? 0).toLocaleString('es-CL'), unidad: 'un.' },
                { titulo: 'Venta', valor: formatoMonto(row.totalVentas) },
                { titulo: 'Margen', valor: '', chip: row.margenPorcentaje ?? null },
              ],
              detalle: [
                { titulo: 'Margen bruto', valor: formatoMonto(row.margenBruto) },
                { titulo: 'Precio prom.', valor: formatoPesos(row.precioPromedio) },
                { titulo: 'Stock', valor: (row.stock ?? 0).toLocaleString('es-CL') },
              ],
            }))}
          />
        </Box>
      ) : (
      <TableContainer sx={{ maxHeight: 560, mx: -2.5, width: 'auto', overflowX: 'hidden' }}>
        <Table size="small" stickyHeader sx={tablaSx}>
          <Columnas anchos={[26, 16, 9, 13, 9, 11, 9, 7]} />
          <TableHead>
            <TableRow>
              {columna('nombre', 'Producto', { pl: 2.5 }, 'left')}
              {columna('primerNivel', 'Primer nivel / Categoría', undefined, 'left')}
              {columna('cantidadVendida', 'Cant. vendida')}
              {columna('totalVentas', 'Total ventas')}
              {columna('margenPorcentaje', '% Margen')}
              {columna('margenBruto', 'Margen bruto')}
              {columna('precioPromedio', 'Precio prom.')}
              <TableCell align="right" sx={{ pr: 2.5 }} sortDirection={orderBy === 'stock' ? order : false}>
                <TableSortLabel active={orderBy === 'stock'} direction={orderBy === 'stock' ? order : 'desc'} onClick={() => handleSort('stock')}>
                  Stock
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData.map((row) => (
              <TableRow key={row.sku}>
                <TableCell sx={{ pl: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                    <Box
                      component="img"
                      src={row.imagen || SIN_IMAGEN}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = SIN_IMAGEN;
                      }}
                      alt=""
                      sx={{ width: 30, height: 30, objectFit: 'contain', borderRadius: '8px', border: `1px solid ${tinta.borde}`, bgcolor: '#fff', flexShrink: 0 }}
                    />
                    <TextoCelda texto={row.nombre} secundario={row.sku} />
                  </Box>
                </TableCell>
                <TableCell>
                  <TextoCelda texto={row.primerNivel || '—'} secundario={row.categoria || '—'} fuerte={false} />
                </TableCell>
                <TableCell align="right">{(row.cantidadVendida ?? 0).toLocaleString('es-CL')}</TableCell>
                <TableCell align="right">
                  {formatoPesos(row.totalVentas)}
                  <Box sx={{ mt: 0.5 }}>
                    <BarraParticipacion valor={row.totalVentas || 0} maximo={maxVenta} />
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <ChipMargen valor={row.margenPorcentaje} />
                </TableCell>
                <TableCell align="right">{formatoPesos(row.margenBruto)}</TableCell>
                <TableCell align="right">{formatoPesos(row.precioPromedio)}</TableCell>
                <TableCell align="right" sx={{ pr: 2.5 }}>{(row.stock ?? 0).toLocaleString('es-CL')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      )}

      <Box sx={{ display: 'flex', justifyContent: { xs: 'center', sm: 'flex-end' }, mt: 1.5 }}>
        <Button
          endIcon={<IconArrowRight size={16} />}
          onClick={() => router.push('/informes/ventas-productos')}
          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '10px' }}
        >
          Ver más productos
        </Button>
      </Box>
    </Box>
  );
};

export default ProductosVendidos;
