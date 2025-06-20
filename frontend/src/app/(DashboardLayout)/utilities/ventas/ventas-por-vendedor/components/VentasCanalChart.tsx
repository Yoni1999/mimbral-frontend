"use client";

import React from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import DashboardCard from "@/app/(DashboardLayout)/components/shared/DashboardCard";
import { useTheme, useMediaQuery } from "@mui/material";

interface FormasPagoItem {
  PayDueMonth: string;
  CantidadFacturas: number;
}

interface VentasCanalChartProps {
  data: FormasPagoItem[];
}

const VentasCanalChart: React.FC<VentasCanalChartProps> = ({ data }) => {
  const theme = useTheme();

  // 📱 Breakpoints de MUI
  const isXs = useMediaQuery(theme.breakpoints.down("sm")); // <600px
  const isSm = useMediaQuery(theme.breakpoints.between("sm", "md")); // 600px - 900px
  const isMd = useMediaQuery(theme.breakpoints.between("md", "lg")); // 900px - 1200px
  const isLg = useMediaQuery(theme.breakpoints.up("lg")); // >=1200px

  const labels = data.map((item) => item.PayDueMonth);
  const chartData = data.map((item) => item.CantidadFacturas);

  // 📊 Ajuste del tamaño del gráfico según tamaño de pantalla
  const chartWidth = isXs ? 250 : isSm ? 300 : isMd ? 400 : 500;

  const options: ApexOptions = {
    chart: {
      type: "donut",
      toolbar: { show: false },
      width: chartWidth, // opcional, Apex puede autoescalar
    },
    labels: labels,
    colors: ["#1E88E5", "#43A047", "#FDD835", "#E53935", "#8E24AA", "#FB8C00", "#546E7A"],
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
        breakpoint: 1200,
        options: {
          chart: { width: 400 },
        },
      },
      {
        breakpoint: 900,
        options: {
          chart: { width: 300 },
        },
      },
      {
        breakpoint: 600,
        options: {
          chart: { width: 250 },
        },
      },
    ],
  };

  return (
    <DashboardCard
      title="Formas de Pago"
      elevation={0}
      sx={{
        backgroundColor: "#fff",
        color: "primary.main",
        borderRadius: 2,
        border: "1px solid #e0e0e0",
        p: 0,
        height: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Chart options={options} series={chartData} type="donut" width={chartWidth} />
    </DashboardCard>
  );
};

export default VentasCanalChart;
