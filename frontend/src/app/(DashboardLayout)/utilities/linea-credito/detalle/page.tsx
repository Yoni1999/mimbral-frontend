"use client";

import React from "react";
import { Box, Grid, Paper, Typography } from "@mui/material";
import HeaderLineaCredito from "./components/Titulodetallecliente";
import DetailCard from "./components/DetailCard";
import RiesgoCreditoGauge from "./components/RiesgoCreditoGauge";

// Íconos para KPI
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import QueryBuilderIcon from '@mui/icons-material/QueryBuilder';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import GraficoLineaCredito from "./components/GraficoLineaCredito";
import GraficoBarraComparativo from "./components/GraficoBarraComparativo";
import TablaFacturas from "./components/TablaFacturas";

export default function LineaCreditoPage() {
  const descripcionPeriodo = "Junio 2025";

  const handleApplyFilters = (filters: any) => {
    console.log("Aplicando filtros", filters);
  };

  const detalleCliente = {
    Rut: "76.004.335-4",
    Empresa: "s",
    Text: "r",
    "Razón Social": "cc",
    Estado: "t",
  };

  const kpis = [
    {
      label: "Límite de Crédito",
      icon: <CreditCardIcon color="primary" />,
      value: "$ 18.0M",
      detail: "Periodo Anterior: 66",
    },
    {
      label: "Crédito utilizado",
      icon: <AccountBalanceIcon color="info" />,
      value: "$ 11.0M",
      detail: "Periodo Anterior: 2294",
    },
    {
      label: "Días promedio pago",
      icon: <QueryBuilderIcon color="success" />,
      value: "32 días",
      detail: "Variación: 6.42%",
    },
    {
      label: "Deuda Actual",
      icon: <AttachMoneyIcon color="warning" />,
      value: "$ 3.80M",
      detail: "Versus -2% / $114.12M",
    },
    {
      label: "Último pago recibido",
      icon: <EventAvailableIcon color="secondary" />,
      value: "10/06/2025",
      detail: "Periodo Anterior: 2294",
    },
  ];

  return (
    <Box p={2}>
      {/* Header de filtros */}
      <HeaderLineaCredito
        descripcionPeriodo={descripcionPeriodo}
        onApply={handleApplyFilters}
      />

      {/* Tarjeta de detalle cliente + KPIs */}
      <Box mt={3}>
        <Grid container spacing={2} alignItems="stretch">
          {/* Columna derecha: tarjeta de detalle */}
          <Grid item xs={12} md={4.4}>
            <DetailCard
              title="Soc. Comercial Mimbral Ltda."
              details={detalleCliente}
              height={210}
              borderColor="#cfcfff"
            />
          </Grid>

          {/* Columna izquierda: KPIs en dos filas */}
          <Grid item xs={12} md={7.6}>
            <Grid container spacing={2}>
              {kpis.map((item, i) => (
                <Grid key={i} item xs={12} sm={6} md={4}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      display: "flex",
                      gap: 2,
                      alignItems: "center",
                      borderRadius: 3,
                      height: 100,
                    }}
                  >
                    {item.icon}
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        {item.label}
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>
                        {item.value}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.detail}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              ))}

              {/* Tarjeta 6: Riesgo de Crédito */}
              <Grid item xs={12} sm={6} md={4}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 3,
                    height: 100,
                  }}
                >
                  <RiesgoCreditoGauge value={80} montoUtilizado={152000} montoLimite={220000} />
                </Paper>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Box>
      {/* Segunda fila: gráfico de crédito */}
      <Grid container spacing={2} mt={4}>
        {/* Gráfico de línea */}
        <Grid item xs={12} sm={6}>
          <Typography variant="h6" mb={2}>
            Evolución del Crédito Utilizado
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <GraficoLineaCredito
              gastos={[1000000, 2000000, 1500000, 2500000, 1200000]}
              etiquetas={["Ene", "Feb", "Mar", "Abr", "May"]}
              lineaCredito={10000000}
            />
          </Paper>
        </Grid>

        {/* Gráfico de barras comparativo */}
        <Grid item xs={12} sm={6}>
          <Typography variant="h6" mb={2}>
            Comparativa de Ventas por Ciudad
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <GraficoBarraComparativo />
          </Paper>
        </Grid>
      </Grid>
      {/* Fila 3: Tabla de Facturas */}
      <Grid container spacing={2} mt={4}>
        <Grid item xs={12}>
          <Typography variant="h6" mb={2}>
            Facturas
          </Typography>

          <TablaFacturas />
        </Grid>
      </Grid>

    </Box>
  );
}
