"use client";

import React from "react";
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
} from "@mui/material";

// Datos estáticos de ejemplo
const datosMetas = [
  {
    imagen: "/images/categorias/aire-libre.png",
    categoria: "Aire Libre Y Mascotas",
    meta: 100,
    vendidos: 30000,
    faltantes: 3000,
    cumplimiento: "78%",
  },
  {
    imagen: "/images/categorias/automovil.png",
    categoria: "Automóvil",
    meta: 150,
    vendidos: 45000,
    faltantes: 2500,
    cumplimiento: "48%",
  },
  {
    imagen: "/images/categorias/bano.png",
    categoria: "Baño",
    meta: 30,
    vendidos: 42000,
    faltantes: 3600,
    cumplimiento: "76%",
  },
  {
    imagen: "/images/categorias/cocina.png",
    categoria: "Cocina Y Menaje",
    meta: 80,
    vendidos: 15000,
    faltantes: 2800,
    cumplimiento: "95%",
  },
  {
    imagen: "/images/categorias/decoracion.png",
    categoria: "Decoración E Iluminación",
    meta: 100,
    vendidos: 18000,
    faltantes: 3200,
    cumplimiento: "65%",
  },
  {
    imagen: "/images/categorias/dormitorio.png",
    categoria: "Dormitorio",
    meta: 50,
    vendidos: 20000,
    faltantes: 6500,
    cumplimiento: "73%",
  },
  {
    imagen: "/images/categorias/clima.png",
    categoria: "Electrohogar Y Climatización",
    meta: 600,
    vendidos: 25000,
    faltantes: 12000,
    cumplimiento: "63%",
  },
  {
    imagen: "/images/categorias/seguridad.png",
    categoria: "Ferretería Y Seguridad",
    meta: 200,
    vendidos: 28000,
    faltantes: 13000,
    cumplimiento: "60%",
  },
  {
    imagen: "/images/categorias/gasfiteria.png",
    categoria: "Gasfitería Y Electricidad",
    meta: 100,
    vendidos: 32000,
    faltantes: 16000,
    cumplimiento: "40%",
  },
  {
    imagen: "/images/categorias/herramientas.png",
    categoria: "Herramientas Y Maquinarias",
    meta: 600,
    vendidos: 15000,
    faltantes: 18000,
    cumplimiento: "37%",
  },
  {
    imagen: "/images/categorias/jardin.png",
    categoria: "Jardín Y Terraza",
    meta: 50,
    vendidos: 1600,
    faltantes: 1600,
    cumplimiento: "49%",
  },
];

const TablaMetas = () => {
  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        METAS
      </Typography>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 2 }}>
        <Table>
          <TableHead sx={{ backgroundColor: "#f8f9fa" }}>
            <TableRow>
              <TableCell><strong>Image</strong></TableCell>
              <TableCell><strong>Categoría</strong></TableCell>
              <TableCell align="center"><strong>Metas del periodo</strong></TableCell>
              <TableCell align="center"><strong>SKU vendidos</strong></TableCell>
              <TableCell align="center"><strong>SKU faltantes</strong></TableCell>
              <TableCell align="center"><strong>Cumplimiento</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {datosMetas.map((fila, index) => (
              <TableRow key={index} hover>
                <TableCell>
                  <Avatar src={fila.imagen} variant="rounded" sx={{ width: 48, height: 48 }} />
                </TableCell>
                <TableCell>{fila.categoria}</TableCell>
                <TableCell align="center">{fila.meta}</TableCell>
                <TableCell align="center">{fila.vendidos.toLocaleString()}</TableCell>
                <TableCell align="center">{fila.faltantes.toLocaleString()}</TableCell>
                <TableCell align="center">{fila.cumplimiento}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TablaMetas;
