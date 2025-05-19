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

// Datos estáticos de ejemplo con nuevas columnas
const datosMetas = [
  {
    imagen: "/images/categorias/electrodomesticos_cocina.png",
    sku: "SKU-001",
    descripcion: "Parrilla Eléctrica Portátil 1500W",
    meta: 100,
    vendidas: 78,
    cumplimiento: "78%",
    tickets: 65,
    rotacion: "Alta",
    precioVenta: 39990,
    diasSinStock: 3,
    precioCompra: 28990,
  },
  {
    imagen: "/images/categorias/cocina.png",
    sku: "SKU-002",
    descripcion: "Olla Acero Inoxidable 24cm",
    meta: 150,
    vendidas: 72,
    cumplimiento: "48%",
    tickets: 50,
    rotacion: "Media",
    precioVenta: 18990,
    diasSinStock: 0,
    precioCompra: 12500,
  },
  {
    imagen: "/images/categorias/cajas_de_seguridad.png",
    sku: "SKU-003",
    descripcion: "Cámara Seguridad Wi-Fi 1080p",
    meta: 80,
    vendidas: 76,
    cumplimiento: "95%",
    tickets: 70,
    rotacion: "Alta",
    precioVenta: 49990,
    diasSinStock: 1,
    precioCompra: 34990,
  },
  // ... Agrega más productos según necesites
];

const TablaMetas = () => {
  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        METAS POR PRODUCTO
      </Typography>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 2 }}>
        <Table>
          <TableHead sx={{ backgroundColor: "#f8f9fa" }}>
            <TableRow>
              <TableCell><strong>Imagen</strong></TableCell>
              <TableCell><strong>SKU</strong></TableCell>
              <TableCell><strong>Descripción</strong></TableCell>
              <TableCell align="center"><strong>Meta</strong></TableCell>
              <TableCell align="center"><strong>Vendidas</strong></TableCell>
              <TableCell align="center"><strong>Cumplimiento</strong></TableCell>
              <TableCell align="center"><strong>Tickets</strong></TableCell>
              <TableCell align="center"><strong>Rotación</strong></TableCell>
              <TableCell align="center"><strong>Precio Venta</strong></TableCell>
              <TableCell align="center"><strong>Días sin stock</strong></TableCell>
              <TableCell align="center"><strong>Precio Compra</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {datosMetas.map((fila, index) => (
              <TableRow key={index} hover>
                <TableCell>
                  <Avatar
                    src={fila.imagen}
                    variant="rounded"
                    sx={{ width: 48, height: 48 }}
                  />
                </TableCell>
                <TableCell>{fila.sku}</TableCell>
                <TableCell>{fila.descripcion}</TableCell>
                <TableCell align="center">{fila.meta}</TableCell>
                <TableCell align="center">{fila.vendidas}</TableCell>
                <TableCell align="center">{fila.cumplimiento}</TableCell>
                <TableCell align="center">{fila.tickets}</TableCell>
                <TableCell align="center">{fila.rotacion}</TableCell>
                <TableCell align="center">
                  ${fila.precioVenta.toLocaleString()}
                </TableCell>
                <TableCell align="center">{fila.diasSinStock}</TableCell>
                <TableCell align="center">
                  ${fila.precioCompra.toLocaleString()}
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
