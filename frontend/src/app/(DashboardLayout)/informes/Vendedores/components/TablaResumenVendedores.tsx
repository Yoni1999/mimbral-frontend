'use client';
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  Paper,
  TextField,
  TableSortLabel,
  Button,
  Avatar,
  Stack,
  Menu,
  MenuItem,
  IconButton,
  Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

export type Order = 'asc' | 'desc';
export type OrderBy =
  | 'cantidadNeta'
  | 'margen'
  | 'itemsVendidos'
  | 'unidadesVendidas'
  | 'rentabilidad'
  | 'notasCredito';

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

const TablaResumenVendedores: React.FC = () => {
  const [orden, setOrden] = useState<Order>('desc');
  const [ordenPor, setOrdenPor] = useState<OrderBy>('cantidadNeta');
  const [busqueda, setBusqueda] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const data = [
    {
      nombre: 'Marcelo Cancino',
      rut: '12.345.678-9',
      imagen: '',
      cantidadNeta: 1200000,
      margen: 18.5,
      itemsVendidos: 320,
      unidadesVendidas: 540,
      rentabilidad: 220000,
      notasCredito: 15000
    },
    {
      nombre: 'Catalina Saavedra',
      rut: '13.987.654-3',
      imagen: '',
      cantidadNeta: 980000,
      margen: 22.1,
      itemsVendidos: 290,
      unidadesVendidas: 460,
      rentabilidad: 200000,
      notasCredito: 12000
    },
    {
      nombre: 'Camilo Gutierrez',
      rut: '16.456.123-2',
      imagen: '',
      cantidadNeta: 870000,
      margen: 15.2,
      itemsVendidos: 250,
      unidadesVendidas: 410,
      rentabilidad: 132000,
      notasCredito: 18000
    },
    {
      nombre: 'Williams Mejias',
      rut: '14.789.321-0',
      imagen: '',
      cantidadNeta: 1100000,
      margen: 24.6,
      itemsVendidos: 310,
      unidadesVendidas: 490,
      rentabilidad: 240000,
      notasCredito: 9000
    }
  ];

  const filteredData = data.filter((v) =>
    v.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const sortedData = [...filteredData].sort((a, b) => {
    const aValue = a[ordenPor];
    const bValue = b[ordenPor];
    if (aValue < bValue) return orden === 'asc' ? -1 : 1;
    if (aValue > bValue) return orden === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSortChange = (campo: OrderBy) => {
    const nuevoOrden = ordenPor === campo && orden === 'asc' ? 'desc' : 'asc';
    setOrden(nuevoOrden);
    setOrdenPor(campo);
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ResumenVendedores');
    XLSX.writeFile(workbook, 'ResumenVendedores.xlsx');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Resumen de Vendedores', 14, 20);

    const tableData = data.map((v) => [
      v.nombre,
      `$${v.cantidadNeta.toLocaleString()}`,
      `${v.margen.toFixed(2)}%`,
      v.itemsVendidos,
      v.unidadesVendidas,
      `$${v.rentabilidad.toLocaleString()}`,
      `$${v.notasCredito.toLocaleString()}`
    ]);

    autoTable(doc, {
      head: [[
        'Vendedor', 'Cantidad Neta', 'Margen (%)', 'Items Vendidos',
        'Unidades Vendidas', 'Rentabilidad', 'Notas de Crédito'
      ]],
      body: tableData,
      startY: 30,
      theme: 'striped'
    });

    doc.save('ResumenVendedores.pdf');
  };

  const handleDescargarComision = (vendedor: string) => {
    console.log(`Descargar informe de comisión para: ${vendedor}`);
  };

  return (
    <Box mt={3}>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <TextField
          label="Buscar por nombre"
          variant="outlined"
          size="small"
          sx={{ width: 250 }}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <Box>
          <Button variant="outlined" color="primary" onClick={handleMenuClick}>
            Exportar
          </Button>
          <Menu anchorEl={anchorEl} open={menuOpen} onClose={handleMenuClose}>
            <MenuItem onClick={() => { exportToExcel(); handleMenuClose(); }}>
              Exportar a Excel
            </MenuItem>
            <MenuItem onClick={() => { exportToPDF(); handleMenuClose(); }}>
              Exportar a PDF
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <StyledTableCell>Vendedor</StyledTableCell>
              {[{ key: 'cantidadNeta', label: 'Venta Neta' },
                { key: 'margen', label: '% de Comisión' },
                { key: 'itemsVendidos', label: 'Comisión' },
                { key: 'unidadesVendidas', label: 'S.Corrida' },
                { key: 'rentabilidad', label: 'T.Comisión' },
                { key: 'notasCredito', label: 'Rentabilidad' }].map(({ key, label }) => (
                  <StyledTableCell key={key} align="right" sortDirection={ordenPor === key ? orden : false}>
                    <TableSortLabel
                      active={ordenPor === key}
                      direction={ordenPor === key ? orden : 'asc'}
                      onClick={() => handleSortChange(key as OrderBy)}
                    >
                      {label}
                    </TableSortLabel>
                  </StyledTableCell>
              ))}
              <StyledTableCell align="right">Acciones</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData.map((v, index) => (
              <StyledTableRow key={index}>
                <StyledTableCell component="th" scope="row">
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar src={v.imagen || undefined}>{!v.imagen && v.nombre.charAt(0)}</Avatar>
                    <Box>
                      <Typography fontWeight={600}>{v.nombre}</Typography>
                      <Typography variant="body2" color="text.secondary">{v.rut}</Typography>
                    </Box>
                  </Stack>
                </StyledTableCell>
                <StyledTableCell align="right">${v.cantidadNeta.toLocaleString()}</StyledTableCell>
                <StyledTableCell align="right">{v.margen.toFixed(2)}%</StyledTableCell>
                <StyledTableCell align="right">{v.itemsVendidos}</StyledTableCell>
                <StyledTableCell align="right">{v.unidadesVendidas}</StyledTableCell>
                <StyledTableCell align="right">${v.rentabilidad.toLocaleString()}</StyledTableCell>
                <StyledTableCell align="right">${v.notasCredito.toLocaleString()}</StyledTableCell>
                <StyledTableCell align="right">
                  <Tooltip title="Descargar informe de comisiones detallado en Excel">
                    <IconButton color="primary" onClick={() => handleDescargarComision(v.nombre)}>
                      <FileDownloadIcon />
                    </IconButton>
                  </Tooltip>
                </StyledTableCell>
              </StyledTableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TablaResumenVendedores;