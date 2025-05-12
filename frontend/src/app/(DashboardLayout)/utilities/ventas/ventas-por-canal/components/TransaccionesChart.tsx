"use client";
import React from "react";
import Chart from "react-apexcharts";
import { Paper, Box, Typography } from "@mui/material";
import { ApexOptions } from "apexcharts";

const TransaccionesChart = () => {
  const chartOptions: ApexOptions = {
    chart: { type: "line", sparkline: { enabled: true } },
    stroke: { curve: "smooth", width: 2 },
    colors: ["#008FFB"],
    tooltip: { enabled: false },
  };

  const chartData = [{ data: [50, 70, 90, 80, 100, 110, 150, 180] }];

  return (
    <Paper
      sx={{
        borderRadius: 3,
        boxShadow: 2,
        padding: 2,
        height: "80px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* 🔹 Título */}
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
        Crecimiento de Ventas
      </Typography>

      {/* 🔹 Gráfico */}
      <Box sx={{ width: "100%", height: "50px" }}>
        <Chart options={chartOptions} series={chartData} type="line" height={50} />
      </Box>
    </Paper>
  );
};

export default TransaccionesChart;
