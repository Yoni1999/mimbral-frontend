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
      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Factura</TableCell>
              <TableCell>Emisión</TableCell>
              <TableCell>Vencimiento</TableCell>
              <TableCell>Monto</TableCell>
              <TableCell>Pagado</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Mora ($)</TableCell>
              <TableCell>Días atraso</TableCell>
              <TableCell>% Uso crédito</TableCell>
              <TableCell>Puntaje</TableCell>
              <TableCell>Nivel Riesgo</TableCell>
              <TableCell>Última Acción</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dataFacturas.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell>{row.factura}</TableCell>
                <TableCell>{row.emision}</TableCell>
                <TableCell>{row.vencimiento}</TableCell>
                <TableCell>
                  {typeof row.monto === "number"
                    ? `$${row.monto.toLocaleString("es-CL")}`
                    : row.monto}
                </TableCell>
                <TableCell>
                  {typeof row.pagado === "number"
                    ? `$${row.pagado.toLocaleString("es-CL")}`
                    : row.pagado}
                </TableCell>
                <TableCell>{row.estado}</TableCell>
                <TableCell>{row.mora}</TableCell>
                <TableCell>{row.diasAtraso}</TableCell>
                <TableCell>{row.usoCredito}</TableCell>
                <TableCell>{row.puntaje}</TableCell>
                <TableCell>{row.riesgo}</TableCell>
                <TableCell>{row.ultimaAccion}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TablaFacturas;
