"use client";

import * as React from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Paper,
  TableContainer,
  Box,
} from "@mui/material";

// Datos simulados
const dataFacturas = [
  {
    factura: "FAC-255",
    emision: "10/06/2025 17:36:22",
    vencimiento: "15/06/2025",
    monto: 100000,
    pagado: 800000000,
    estado: "Pagada",
    mora: 0,
    diasAtraso: 0,
    usoCredito: "50%",
    puntaje: 80,
    riesgo: "Bajo",
    ultimaAccion: "10/06/2025",
  },
  {
    factura: "PERDIDOS",
    emision: "Content",
    vencimiento: "Content",
    monto: "Content",
    pagado: "Content",
    estado: "Content",
    mora: "Content",
    diasAtraso: "Content",
    usoCredito: "Content",
    puntaje: "Content",
    riesgo: "Content",
    ultimaAccion: "Content",
  },
  {
    factura: "Content",
    emision: "Content",
    vencimiento: "Content",
    monto: "Content",
    pagado: "Content",
    estado: "Content",
    mora: "Content",
    diasAtraso: "Content",
    usoCredito: "Content",
    puntaje: "Content",
    riesgo: "Content",
    ultimaAccion: "Content",
  },
];

const TablaFacturas = () => {
  return (
    <Box mt={5}>
      <TableContainer component={Paper} sx={{ borderRadius: 3, overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: { xs: 0, md: 1100 } }}>
          <TableHead>
            <TableRow>
              <TableCell>Factura</TableCell>
              <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Emisión</TableCell>
              <TableCell>Vencimiento</TableCell>
              <TableCell>Monto</TableCell>
              <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Pagado</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Mora ($)</TableCell>
              <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Días atraso</TableCell>
              <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>% Uso crédito</TableCell>
              <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Puntaje</TableCell>
              <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Nivel Riesgo</TableCell>
              <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Última Acción</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dataFacturas.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell>{row.factura}</TableCell>
                <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>{row.emision}</TableCell>
                <TableCell>{row.vencimiento}</TableCell>
                <TableCell>
                  {typeof row.monto === "number"
                    ? `$${row.monto.toLocaleString("es-CL")}`
                    : row.monto}
                </TableCell>
                <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                  {typeof row.pagado === "number"
                    ? `$${row.pagado.toLocaleString("es-CL")}`
                    : row.pagado}
                </TableCell>
                <TableCell>{row.estado}</TableCell>
                <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>{row.mora}</TableCell>
                <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>{row.diasAtraso}</TableCell>
                <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>{row.usoCredito}</TableCell>
                <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>{row.puntaje}</TableCell>
                <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>{row.riesgo}</TableCell>
                <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>{row.ultimaAccion}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TablaFacturas;
