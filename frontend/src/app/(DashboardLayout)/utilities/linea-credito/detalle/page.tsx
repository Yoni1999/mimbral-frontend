"use client";

import React from "react";
import { Box, Typography, Avatar, Grid, Card, CardContent, Divider } from "@mui/material";

const ClienteDetallePage = () => {
  const cliente = {
    nombre: "Juan Pérez",
    rut: "12.345.678-9",
    telefono: "+56 9 1234 5678",
    direccion: "Av. Siempre Viva 742",
    ciudad: "Santiago",
    razonSocial: "Pérez y Compañía Ltda.",
    categoria: "Cliente Preferencial",
    fechaApertura: "2020-05-15",
    limiteCredito: 100000000,
    creditoDisponible: 23500000,
    estado: "Activo",
    ultimaModificacion: "2025-06-25",
  };

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Detalle del Cliente
      </Typography>

      <Card elevation={3}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Avatar sx={{ bgcolor: "primary.main", width: 56, height: 56 }}>
                {cliente.nombre.charAt(0)}
              </Avatar>
            </Grid>
            <Grid item>
              <Typography variant="h6">{cliente.nombre}</Typography>
              <Typography variant="subtitle2" color="text.secondary">
                {cliente.categoria}
              </Typography>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2">RUT:</Typography>
              <Typography variant="subtitle1">{cliente.rut}</Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2">Teléfono:</Typography>
              <Typography variant="subtitle1">{cliente.telefono}</Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2">Dirección:</Typography>
              <Typography variant="subtitle1">{cliente.direccion}</Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2">Ciudad:</Typography>
              <Typography variant="subtitle1">{cliente.ciudad}</Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2">Razón Social:</Typography>
              <Typography variant="subtitle1">{cliente.razonSocial}</Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2">Fecha Apertura:</Typography>
              <Typography variant="subtitle1">{cliente.fechaApertura}</Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2">Límite Crédito:</Typography>
              <Typography variant="subtitle1">${cliente.limiteCredito.toLocaleString()}</Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2">Crédito Disponible:</Typography>
              <Typography variant="subtitle1">${cliente.creditoDisponible.toLocaleString()}</Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2">Estado:</Typography>
              <Typography variant="subtitle1">{cliente.estado}</Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Typography variant="body2">Última Modificación:</Typography>
              <Typography variant="subtitle1">{cliente.ultimaModificacion}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ClienteDetallePage;