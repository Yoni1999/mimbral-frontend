"use client";

import React from "react";
import Chart from "react-apexcharts";
import { Typography } from "@mui/material";
import DashboardCard from "@/app/(DashboardLayout)/components/shared/DashboardCard";
import { ApexOptions } from "apexcharts";

const VentasCanalChart: React.FC = () => {
  // 🔹 Datos estáticos para el gráfico de dona
  const labels = ["Efectivo", "Debido/Crédito", "Crédito 30 días", "Crédito 60 días"];
  const chartData = [5000000, 3000000, 2000000, 1500000];

  const options: ApexOptions = {
    chart: {
      type: "donut",
      toolbar: { show: false },
    },
    labels: labels,
    colors: [
      "#1E88E5", "#43A047", "#FDD835", "#E53935", "#8E24AA", "#FB8C00", "#546E7A",
    ],
    tooltip: {
      y: {
        formatter: (val: number) => val.toLocaleString("es-CL"),
      },
    },
    legend: {
      position: "bottom",
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: { width: 250 },
          legend: { position: "bottom" },
        },
      },
    ],
  };

  return (
    <DashboardCard
      title="Formas de pago"
      elevation={0} 
      sx={{
        backgroundColor: "#fff",
        borderRadius: 2,
        border: "1px solid #e0e0e0",
        p: 0,
        height: 460,
      }}
    >
      <Chart options={options} series={chartData} type="donut" width="90%" />
    </DashboardCard>

  );
};

export default VentasCanalChart;
