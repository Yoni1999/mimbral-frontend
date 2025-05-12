"use client";

import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Typography, Box, TableSortLabel, TablePagination, Button, TextField, IconButton
} from "@mui/material";
import { FileDownload, Search, ArrowDropUp, ArrowDropDown } from "@mui/icons-material";
import { useState } from "react";
import * as XLSX from "xlsx";

// 🔹 Definimos la interfaz de los productos
interface Producto {
  sku: string;
  nombre: string;
  ventasTotales: number;
  crecimiento: number;
  ticketPromedio: number;
  cantidadVendida: number;
  rentabilidad: number;
}

interface VentasProductosTableProps {
  data: Producto[];
}

export default function VentasProductosTable({ data }: VentasProductosTableProps) {
  const [orderBy, setOrderBy] = useState<keyof Producto>("ventasTotales");
  const [orderDirection, setOrderDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [busqueda, setBusqueda] = useState("");

  // 🔹 Manejo de ordenamiento
  const handleSort = (property: keyof Producto) => {
    const isAsc = orderBy === property && orderDirection === "asc";
    setOrderBy(property);
    setOrderDirection(isAsc ? "desc" : "asc");
  };

  // 🔹 Filtrado por SKU múltiple o nombre de producto
  const filteredData = data.filter((producto) => 
    busqueda.split(",").map((sku) => sku.trim()).some((sku) => 
      producto.sku.includes(sku) || producto.nombre.toLowerCase().includes(sku.toLowerCase())
    )
  );
  const sortedData = [...filteredData].sort((a, b) => {
    const aValue = a[orderBy];
    const bValue = b[orderBy];
  
    if (typeof aValue === "number" && typeof bValue === "number") {
      return orderDirection === "asc" ? aValue - bValue : bValue - aValue;
    }
  
    return orderDirection === "asc"
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue));
  });
  

  // 🔹 Manejo de paginación
  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 🔹 Exportar datos a Excel
  const exportarExcel = () => {
    const datosExportar = filteredData.map(({ sku, nombre, ventasTotales, crecimiento, ticketPromedio, cantidadVendida, rentabilidad }) => ({
      SKU: sku,
      Nombre: nombre,
      "Ventas Totales ($)": ventasTotales,
      "Crecimiento (%)": `${crecimiento}%`,
      "Ticket Promedio ($)": ticketPromedio,
      "Cantidad Vendida": cantidadVendida,
      "Rentabilidad (%)": `${rentabilidad}%`
    }));

    const ws = XLSX.utils.json_to_sheet(datosExportar);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "VentasProductos");
    XLSX.writeFile(wb, "Ventas_Productos.xlsx");
  };

  return (
    <TableContainer component={Paper} sx={{ mt: 3, p: 2, borderRadius: 2, boxShadow: 3 }}>
      {/* 🔹 Encabezado con búsqueda por SKUs y botón de exportación */}
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">Detalle de Ventas por Producto</Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Buscar SKU o Producto... (Ej: 1001, 1002)"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            InputProps={{ startAdornment: <Search /> }}
          />
          <Button variant="contained" color="primary" startIcon={<FileDownload />} onClick={exportarExcel}>
            Exportar
          </Button>
        </Box>
      </Box>

      <Table>
        {/* 🔹 Encabezado */}
        <TableHead sx={{ bgcolor: "#f4f4f4" }}>
          <TableRow>
            {[
              { id: "sku", label: "SKU" },
              { id: "nombre", label: "Nombre" },
              { id: "ventasTotales", label: "Ventas Totales" },
              { id: "crecimiento", label: "Crecimiento (%)" },
              { id: "ticketPromedio", label: "Ticket Promedio" },
              { id: "cantidadVendida", label: "Cantidad Vendida" },
              { id: "rentabilidad", label: "Rentabilidad (%)" },
            ].map((column) => (
              <TableCell key={column.id} align="right">
                <Box display="flex" alignItems="center" justifyContent="flex-end">
                  <Typography fontWeight={600}>{column.label}</Typography>
                  <IconButton onClick={() => handleSort(column.id as keyof Producto)} size="small">
                    {orderBy === column.id && orderDirection === "asc" ? <ArrowDropUp /> : <ArrowDropDown />}
                  </IconButton>
                </Box>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        {/* 🔹 Cuerpo */}
        <TableBody>
        {sortedData
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((producto) => (

              <TableRow key={producto.sku} hover>
                <TableCell>{producto.sku}</TableCell>
                <TableCell>{producto.nombre}</TableCell>
                <TableCell align="right">${producto.ventasTotales.toLocaleString()}</TableCell>
                <TableCell align="right" style={{ color: producto.crecimiento < 0 ? "red" : "green" }}>
                  {producto.crecimiento}%
                </TableCell>
                <TableCell align="right">${producto.ticketPromedio.toFixed(2)}</TableCell>
                <TableCell align="right">{producto.cantidadVendida}</TableCell>
                <TableCell align="right">{producto.rentabilidad}%</TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>

      <TablePagination
        rowsPerPageOptions={[5, 10]} 
        component="div"
        count={filteredData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Filas por página:" 
        labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
        }
      />
    </TableContainer>
  );
}
