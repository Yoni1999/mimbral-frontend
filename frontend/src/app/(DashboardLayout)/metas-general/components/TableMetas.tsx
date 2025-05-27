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
} from "@mui/material";

// Interfaz para tipar cada fila
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

// Props esperadas
interface TablaMetasProps {
  data: MetaRow[];
}

const TablaMetas: React.FC<TablaMetasProps> = ({ data }) => {
  const [seleccionados, setSeleccionados] = useState<number[]>([]);

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

  return (
    <Box sx={{ mt: 2, width: "100%" }}>
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 2,
          border: "1px solid #e0e0e0",
          boxShadow: "none",
        }}
      >
        <Table size="small">
          <TableHead sx={{ backgroundColor: "#f9f9f9" }}>
            <TableRow>
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
              <TableCell align="center"><strong>Meta</strong></TableCell>
              <TableCell align="center"><strong>Vendidas</strong></TableCell>
              <TableCell align="center"><strong>% Cumplimiento</strong></TableCell>
              <TableCell align="center"><strong>Precio Venta</strong></TableCell>
              <TableCell align="center"><strong>Precio Compra</strong></TableCell>
              <TableCell align="center"><strong>Margen %</strong></TableCell>
              <TableCell align="center"><strong>Prom. Diario</strong></TableCell>
              <TableCell align="center"><strong>Tickets</strong></TableCell>
              <TableCell align="center"><strong>Acción</strong></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {data.map((row, index) => (
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
                      "&:hover": {
                        backgroundColor: "#5a52d4",
                      },
                    }}
                  >
                    SEGUIR
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TablaMetas;
