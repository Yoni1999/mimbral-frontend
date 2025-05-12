"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart"; // Usamos MUI Charts

// 🔹 Datos estáticos de productos
const dataProductos = [
  { producto: "Producto A", margen: 12000 },
  { producto: "Producto B", margen: 9500 },
  { producto: "Producto C", margen: 8000 },
  { producto: "Producto D", margen: 6000 },
  { producto: "Producto E", margen: 5000 },
  { producto: "Producto F", margen: 3500 },
  { producto: "Producto G", margen: 2500 },
  { producto: "Producto H", margen: 2000 },
];

const TopRentableVendedor: React.FC = () => {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 1,
        backgroundColor: "#ffffff",
        boxShadow: 1,
        height: "100%",
      }}
    >
      <Typography
        variant="h6"
        fontWeight={600}
        mb={2}
        sx={{ color: "primary", fontSize: "1.1rem" }}
      >
        Top 10 Productos Más Rentables
      </Typography>

      <BarChart
        yAxis={[ 
            {
            scaleType: "band",
            data: dataProductos.map((item) => item.producto),
            },
        ]}
        xAxis={[ // <-- eje X es automático (continuo)
            {
            label: "Margen ($)", // opcional
            },
        ]}
        series={[
            {
            data: dataProductos.map((item) => item.margen),
            label: "Margen ($)",
            },
        ]}
        height={320}
        layout="horizontal"
        margin={{ top: 40, bottom: 40, left: 120, right: 15 }}
        />

    </Box>
  );
};

export default TopRentableVendedor;
