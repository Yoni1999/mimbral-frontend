"use client";

import React from "react";
import {
  Box,
  Avatar,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper
} from "@mui/material";

export interface ClienteCredito {
  cliente: string;
  rut: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  razonSocial: string;
  categoria: string;
  fechaApertura: string;
  limiteCredito: number;
  creditoDisponible: number;
  estado: string;
  ultimaModificacion: string;
}

const TablaLineaCredito: React.FC = () => {
  const data: ClienteCredito[] = [
    {
      cliente: "Juan Pérez",
      rut: "12.345.678-9",
      telefono: "+56912345678",
      direccion: "Av. Siempre Viva 123",
      ciudad: "Santiago",
      razonSocial: "JP Inversiones",
      categoria: "A",
      fechaApertura: "2022-01-10",
      limiteCredito: 5000000,
      creditoDisponible: 1200000,
      estado: "Activo",
      ultimaModificacion: "2024-06-10"
    },
    {
      cliente: "María González",
      rut: "98.765.432-1",
      telefono: "+56998765432",
      direccion: "Calle Falsa 456",
      ciudad: "Valparaíso",
      razonSocial: "MG Servicios Ltda.",
      categoria: "B",
      fechaApertura: "2021-08-15",
      limiteCredito: 3500000,
      creditoDisponible: 2000000,
      estado: "Inactivo",
      ultimaModificacion: "2024-05-20"
    }
  ];

  return (
    <TableContainer component={Paper} sx={{ mt: 3 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Avatar</TableCell>
            <TableCell>Cliente</TableCell>
            <TableCell>RUT</TableCell>
            <TableCell>Teléfono</TableCell>
            <TableCell>Dirección</TableCell>
            <TableCell>Ciudad</TableCell>
            <TableCell>Razón Social</TableCell>
            <TableCell>Categoría</TableCell>
            <TableCell>Fecha Apertura</TableCell>
            <TableCell>Límite Crédito</TableCell>
            <TableCell>Crédito Disponible</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell>Última Modificación</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={index}>
              <TableCell>
                <Avatar>{row.cliente.charAt(0)}</Avatar>
              </TableCell>
              <TableCell>{row.cliente}</TableCell>
              <TableCell>{row.rut}</TableCell>
              <TableCell>{row.telefono}</TableCell>
              <TableCell>{row.direccion}</TableCell>
              <TableCell>{row.ciudad}</TableCell>
              <TableCell>{row.razonSocial}</TableCell>
              <TableCell>{row.categoria}</TableCell>
              <TableCell>{row.fechaApertura}</TableCell>
              <TableCell>${row.limiteCredito.toLocaleString("es-CL")}</TableCell>
              <TableCell>${row.creditoDisponible.toLocaleString("es-CL")}</TableCell>
              <TableCell>{row.estado}</TableCell>
              <TableCell>{row.ultimaModificacion}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TablaLineaCredito;
