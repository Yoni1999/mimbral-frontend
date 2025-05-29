"use client";

import React, { useState } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Avatar,
  Paper,
  Button,
  Checkbox,
  TextField,
  IconButton,
  Select,
  MenuItem,
} from "@mui/material";
import * as XLSX from "xlsx";
import DownloadIcon from "@mui/icons-material/Download";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

export interface MetaRow {
  IMAGEN_PRODUCTO: string;
  SKU: string;
  NOMBRE_PRODUCTO: string;
  META_CANTIDAD: number;
  TOTAL_VENDIDO: number;
  TOTAL_VENDIDO_NETO: number;
  CANTIDAD_DEVUELTA: number;
  CUMPLIMIENTO_PORCENTAJE: number;
  PRECIO_PROMEDIO_VENTA: number;
  PRECIO_COMPRA: number;
  MARGEN_PORCENTAJE: number;
  PROMEDIO_DIARIO: number;
  TICKETS_TOTALES: number;
}

export interface MetaMontoRow {
  ID_META: number;
  MONTO_META: number;
  MONTO_VENDIDO: number;
  FECHA_REGISTRO: string;
}

interface TablaMetasProps {
  data: MetaRow[];
  dataMonto?: MetaMontoRow[];
  tipoMeta: "sku" | "monto";
  setTipoMeta: React.Dispatch<React.SetStateAction<"sku" | "monto">>;
}

const TablaMetas: React.FC<TablaMetasProps> = ({ data, dataMonto = [], tipoMeta, setTipoMeta }) => {
  const [seleccionados, setSeleccionados] = useState<number[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");


  const toggleSeleccion = (index: number) => {
    setSeleccionados((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const toggleTodos = () => {
    if (seleccionados.length === data.length) {
      setSeleccionados([]);
    } else {
      setSeleccionados(data.map((_, index) => index));
    }
  };

  const exportarSeleccionados = () => {
    const datosFiltrados = seleccionados.map((i) => {
      const { IMAGEN_PRODUCTO, ...rest } = data[i];
      return rest;
    });
    const ws = XLSX.utils.json_to_sheet(datosFiltrados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Metas");
    XLSX.writeFile(wb, "metas_seleccionadas.xlsx");
  };
  const exportarMonto = () => {
    const datos = dataMonto.map(({ ID_META, ...rest }) => rest);
    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Metas_Monto");
    XLSX.writeFile(wb, "metas_monto.xlsx");
  };



  const dataFiltrada = data.filter(
    (row) =>
      row.NOMBRE_PRODUCTO.toLowerCase().includes(busqueda.toLowerCase()) ||
      row.SKU.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleSort = (field: keyof MetaRow) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedData = [...dataFiltrada].sort((a, b) => {
    if (!sortField) return 0;
    const valA = a[sortField as keyof MetaRow];
    const valB = b[sortField as keyof MetaRow];
    if (typeof valA === "number" && typeof valB === "number") {
      return sortOrder === "asc" ? valA - valB : valB - valA;
    }
    return 0;
  });

  const renderSortableHeader = (label: string, field: keyof MetaRow) => (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{ cursor: "pointer", whiteSpace: "nowrap" }}
      onClick={() => handleSort(field)}
    >
      {sortField === field ? (
        sortOrder === "asc" ? <ArrowDropUpIcon fontSize="small" /> : <ArrowDropDownIcon fontSize="small" />
      ) : null}
      <strong>{label}</strong>
    </Box>
  );

  return (
    <Box sx={{ mt: 2, width: "100%" }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={2}>
        <TextField
          size="small"
          label="Buscar producto o SKU"
          variant="outlined"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <Select
          size="small"
          value={tipoMeta}
          onChange={(e) => setTipoMeta(e.target.value as "sku" | "monto")}
        >
          <MenuItem value="sku">Ver metas por SKU</MenuItem>
          <MenuItem value="monto">Ver metas por Monto</MenuItem>
        </Select>
        <IconButton
          onClick={tipoMeta === "sku" ? exportarSeleccionados : exportarMonto}
          disabled={tipoMeta === "sku" ? seleccionados.length === 0 : dataMonto.length === 0}
          title="Exportar a Excel"
        >
          <DownloadIcon />
        </IconButton>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 2, border: "1px solid #e0e0e0", boxShadow: "none" }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: "#f9f9f9" }}>
            <TableRow>
              {tipoMeta === "sku" ? (
                <>
                  <TableCell padding="checkbox">
                    <Checkbox
                      size="small"
                      checked={seleccionados.length === data.length}
                      indeterminate={seleccionados.length > 0 && seleccionados.length < data.length}
                      onChange={toggleTodos}
                    />
                  </TableCell>
                  <TableCell><strong>Producto</strong></TableCell>
                  <TableCell align="center"><strong>SKU</strong></TableCell>
                  <TableCell align="center">{renderSortableHeader("Meta", "META_CANTIDAD")}</TableCell>
                  <TableCell align="center">{renderSortableHeader("Vendidas", "TOTAL_VENDIDO_NETO")}</TableCell>
                  <TableCell align="center">{renderSortableHeader("% Cumplimiento", "CUMPLIMIENTO_PORCENTAJE")}</TableCell>
                  <TableCell align="center">{renderSortableHeader("Precio Venta", "PRECIO_PROMEDIO_VENTA")}</TableCell>
                  <TableCell align="center">{renderSortableHeader("Precio Compra", "PRECIO_COMPRA")}</TableCell>
                  <TableCell align="center">{renderSortableHeader("Margen %", "MARGEN_PORCENTAJE")}</TableCell>
                  <TableCell align="center">{renderSortableHeader("Prom. Diario", "PROMEDIO_DIARIO")}</TableCell>
                  <TableCell align="center">{renderSortableHeader("Tickets", "TICKETS_TOTALES")}</TableCell>
                  <TableCell align="center"><strong>Acción</strong></TableCell>
                </>
              ) : (
                <>
                  <TableCell align="center"><strong>Meta $</strong></TableCell>
                  <TableCell align="center"><strong>Vendidas $</strong></TableCell>
                  <TableCell align="center"><strong>Fecha Registro</strong></TableCell>
                </>
              )}
            </TableRow>
          </TableHead>

          <TableBody>
            {tipoMeta === "sku" ? (
              sortedData.map((row, index) => (
                <TableRow key={index} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      size="small"
                      checked={seleccionados.includes(index)}
                      onChange={() => toggleSeleccion(index)}
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1.2}>
                      <Avatar
                        src={row.IMAGEN_PRODUCTO}
                        alt={row.NOMBRE_PRODUCTO}
                        variant="rounded"
                        sx={{ width: 48, height: 48 }}
                      />
                      <Typography fontSize="0.875rem" fontWeight={500}>
                        {row.NOMBRE_PRODUCTO}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">{row.SKU}</TableCell>
                  <TableCell align="center">{row.META_CANTIDAD}</TableCell>
                  <TableCell align="center">{row.TOTAL_VENDIDO_NETO}</TableCell>
                  <TableCell align="center">{row.CUMPLIMIENTO_PORCENTAJE.toFixed(1)}%</TableCell>
                  <TableCell align="center">${row.PRECIO_PROMEDIO_VENTA.toLocaleString()}</TableCell>
                  <TableCell align="center">${row.PRECIO_COMPRA.toLocaleString()}</TableCell>
                  <TableCell align="center">{row.MARGEN_PORCENTAJE.toFixed(1)}%</TableCell>
                  <TableCell align="center">{row.PROMEDIO_DIARIO.toFixed(1)}</TableCell>
                  <TableCell align="center">{row.TICKETS_TOTALES}</TableCell>
                  <TableCell align="center">
                    <Button
                      variant="contained"
                      size="small"
                      sx={{
                        backgroundColor: "#6c63ff",
                        textTransform: "none",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        px: 2,
                        "&:hover": { backgroundColor: "#5a52d4" },
                      }}
                    >
                      SEGUIR
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              dataMonto.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell align="center">${row.MONTO_META.toLocaleString()}</TableCell>
                  <TableCell align="center">${row.MONTO_VENDIDO.toLocaleString()}</TableCell>
                  <TableCell align="center">{new Date(row.FECHA_REGISTRO).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TablaMetas;
