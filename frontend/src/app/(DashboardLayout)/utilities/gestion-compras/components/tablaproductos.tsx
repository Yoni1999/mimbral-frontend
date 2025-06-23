'use client';
import * as React from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, Typography, Stack, Button, TextField } from '@mui/material';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const rows = [
  {
    id: 1,
    sku: '001001016',
    descripcion: 'Cemento 25 kg Polpaico',
    rot2021: 150000,
    rot2022: 180000,
    rot2023: 200000,
    rot2024: 900000,
    rot2025: 1000000,
    pronostico: 1000000,
    fechaOC: '07-07-2025',
    stockFisico: 150000,
    stockReservado: 150000,
    stockDisponible: 150000,
    stockSeguridad: 150000,
    leadTime: '20 días',
    sugeridoCompra: 1000000,
  },
  {
    id: 2,
    sku: '001001017',
    descripcion: 'Cemento 42.5 kg Melón',
    rot2021: 120000,
    rot2022: 140000,
    rot2023: 170000,
    rot2024: 850000,
    rot2025: 960000,
    pronostico: 950000,
    fechaOC: '10-07-2025',
    stockFisico: 130000,
    stockReservado: 140000,
    stockDisponible: 120000,
    stockSeguridad: 140000,
    leadTime: '18 días',
    sugeridoCompra: 980000,
  },
  {
    id: 3,
    sku: '001001018',
    descripcion: 'Pegamento Cerámico AC',
    rot2021: 80000,
    rot2022: 90000,
    rot2023: 100000,
    rot2024: 450000,
    rot2025: 550000,
    pronostico: 560000,
    fechaOC: '11-07-2025',
    stockFisico: 70000,
    stockReservado: 80000,
    stockDisponible: 60000,
    stockSeguridad: 85000,
    leadTime: '14 días',
    sugeridoCompra: 480000,
  },
  {
    id: 4,
    sku: '001001019',
    descripcion: 'Yeso en Polvo 25 kg',
    rot2021: 50000,
    rot2022: 65000,
    rot2023: 70000,
    rot2024: 200000,
    rot2025: 300000,
    pronostico: 320000,
    fechaOC: '12-07-2025',
    stockFisico: 60000,
    stockReservado: 60000,
    stockDisponible: 58000,
    stockSeguridad: 70000,
    leadTime: '10 días',
    sugeridoCompra: 270000,
  },
  {
    id: 5,
    sku: '001001020',
    descripcion: 'Cal Hidratada 20 kg',
    rot2021: 60000,
    rot2022: 70000,
    rot2023: 80000,
    rot2024: 210000,
    rot2025: 280000,
    pronostico: 290000,
    fechaOC: '13-07-2025',
    stockFisico: 55000,
    stockReservado: 60000,
    stockDisponible: 52000,
    stockSeguridad: 60000,
    leadTime: '12 días',
    sugeridoCompra: 250000,
  },
    {
    id: 6,
    sku: '001001020',
    descripcion: 'Cal Hidratada 20 kg',
    rot2021: 60000,
    rot2022: 70000,
    rot2023: 80000,
    rot2024: 210000,
    rot2025: 280000,
    pronostico: 290000,
    fechaOC: '13-07-2025',
    stockFisico: 55000,
    stockReservado: 60000,
    stockDisponible: 52000,
    stockSeguridad: 60000,
    leadTime: '12 días',
    sugeridoCompra: 250000,
  },
];

const columns: GridColDef[] = [
  { field: 'sku', headerName: 'SKU', minWidth: 130, flex: 1 },
  { field: 'descripcion', headerName: 'Descripción', minWidth: 200, flex: 2 },
  { field: 'rot2021', headerName: 'Rotación 2021', type: 'number', flex: 1, align: 'right', headerAlign: 'right' },
  { field: 'rot2022', headerName: 'Rotación 2022', type: 'number', flex: 1, align: 'right', headerAlign: 'right' },
  { field: 'rot2023', headerName: 'Rotación 2023', type: 'number', flex: 1, align: 'right', headerAlign: 'right' },
  { field: 'rot2024', headerName: 'Rotación 2024', type: 'number', flex: 1, align: 'right', headerAlign: 'right' },
  { field: 'rot2025', headerName: 'Rotación 2025', type: 'number', flex: 1, align: 'right', headerAlign: 'right' },
  { field: 'pronostico', headerName: 'Pronóstico', type: 'number', flex: 1, align: 'right', headerAlign: 'right' },
  { field: 'fechaOC', headerName: 'Fecha OC', minWidth: 120 },
  { field: 'stockFisico', headerName: 'Stock Físico', type: 'number', flex: 1, align: 'right', headerAlign: 'right' },
  { field: 'stockReservado', headerName: 'Reservado', type: 'number', flex: 1, align: 'right', headerAlign: 'right' },
  { field: 'stockDisponible', headerName: 'Disponible', type: 'number', flex: 1, align: 'right', headerAlign: 'right' },
  { field: 'stockSeguridad', headerName: 'Seguridad', type: 'number', flex: 1, align: 'right', headerAlign: 'right' },
  { field: 'leadTime', headerName: 'Lead Time', minWidth: 100 },
  { field: 'sugeridoCompra', headerName: 'Sugerido Compra', type: 'number', flex: 1, align: 'right', headerAlign: 'right' },
];

export default function RotacionStockDataGrid() {
  const [search, setSearch] = React.useState('');

  const filteredRows = rows.filter(
    (row) =>
      row.descripcion.toLowerCase().includes(search.toLowerCase()) ||
      row.sku.toLowerCase().includes(search.toLowerCase())
  );

  const exportToExcel = () => {
    const exportData = filteredRows.map((row) => ({
      SKU: row.sku,
      Descripción: row.descripcion,
      'Rotación 2021': row.rot2021,
      'Rotación 2022': row.rot2022,
      'Rotación 2023': row.rot2023,
      'Rotación 2024': row.rot2024,
      'Rotación 2025': row.rot2025,
      Pronóstico: row.pronostico,
      'Fecha OC': row.fechaOC,
      'Stock Físico': row.stockFisico,
      Reservado: row.stockReservado,
      Disponible: row.stockDisponible,
      Seguridad: row.stockSeguridad,
      'Lead Time': row.leadTime,
      'Sugerido Compra': row.sugeridoCompra,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'RotacionStock');
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'rotacion_stock.xlsx');
  };

  return (
    <Box sx={{ width: '100%', height: 600 }}>
    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
    <TextField
        label="Buscar por descripción o SKU"
        variant="outlined"
        size="small"
        sx={{ width: 300 }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
    />
    <Button variant="outlined" onClick={exportToExcel}>
        Exportar a Excel
    </Button>
    </Stack>


      <DataGrid
        rows={filteredRows}
        columns={columns}
        pageSizeOptions={[5, 10, 20]}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 5 },
          },
        }}
        sx={{
          borderRadius: 2,
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#f5f5f5',
            fontWeight: 'bold',
          },
          '& .MuiDataGrid-cell': {
            whiteSpace: 'nowrap',
          },
        }}
        checkboxSelection
        disableRowSelectionOnClick
      />
    </Box>
  );
}
