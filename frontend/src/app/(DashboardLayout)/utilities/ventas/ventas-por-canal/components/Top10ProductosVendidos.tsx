"use client";
import React from "react";
import Chart from "react-apexcharts";
import { Card, CardContent, Typography, Box } from "@mui/material";
import { ApexOptions } from "apexcharts";

// Definir los tipos de datos esperados
interface Producto {
  Nombre_Producto: string;
  Cantidad_Vendida: number;
}

interface Props {
  data: Producto[];
}

const TopProductosChart: React.FC<Props> = ({ data }) => {
  const safeData = Array.isArray(data) ? data : [];

  // 🔹 Determinar el valor máximo de ventas para normalizar el color
  const maxVentas = Math.max(...safeData.map((item) => item.Cantidad_Vendida), 1);

  // 🔥 Función para generar degradado de color según el nivel de ventas
  const getColor = (valor: number) => {
    const intensidad = Math.round((valor / maxVentas) * 100); // Normaliza entre 0 y 100
    return `rgba(255, 111, 145, ${0.3 + 0.7 * (intensidad / 100)})`; // 🔥 Más intensidad en productos más vendidos
  };

  // 🔹 Configuración del gráfico
  const options: ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      background: "transparent",
    },
    colors: safeData.map((item) => getColor(item.Cantidad_Vendida)), // 🔥 Asigna colores dinámicos
    xaxis: {
      categories: safeData.map((item) => item.Nombre_Producto),
      labels: { style: { fontSize: "12px", colors: "#333" } },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        columnWidth: "60%",
        borderRadius: 6,
      },
    },
    grid: {
      borderColor: "#e0e0e0",
      strokeDashArray: 5,
    },
    tooltip: {
      theme: "dark",
      y: { formatter: (val: number) => `${val.toLocaleString()} unidades` },
      marker: {
        show: true,
      },
      fixed: {
        enabled: false, // permite que se sobreponga naturalmente
      },
    },
    dataLabels: {
      enabled: true,
      style: { fontSize: "12px", colors: ["#fff"] },
      offsetX: 10,
      formatter: (val) => `${val} u.`,
    },
  };

  const series = [
    {
      name: "Cantidad Vendida",
      data: safeData.map((item) => item.Cantidad_Vendida),
    },
  ];

  return (
    <Card
      sx={{
        borderRadius: 4,
        boxShadow: "0px 4px 20px rgba(0,0,0,0.1)",
        background: "#fff",
        p: 2,
        position: "relative",   // 💡 permite que el tooltip se renderice sobre el card
        overflow: "visible",    // 💡 importante para que el tooltip no se recorte
      }}
    >
      <CardContent>
        <Typography variant="h6" fontWeight="bold" color="text.primary" mb={2}>
          Top 10 Productos Más Vendidos
        </Typography>

        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Chart options={options} series={series} type="bar" height={400} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default TopProductosChart;
