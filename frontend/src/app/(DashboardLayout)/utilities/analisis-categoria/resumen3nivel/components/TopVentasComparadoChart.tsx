"use client";
import React from "react";
import { Box, Typography } from "@mui/material";
import ReactApexChart from "react-apexcharts";

interface Props {
  filters: any;
}

const sampleData = [
  {
    name: "City A, State",
    actual: 1200000,
    anterior: 700000,
  },
  {
    name: "City B, State",
    actual: 600000,
    anterior: 400000,
  },
  {
    name: "City C, State",
    actual: 950000,
    anterior: 450000,
  },
  {
    name: "City D, State",
    actual: 850000,
    anterior: 800000,
  },
  {
    name: "City E, State",
    actual: 300000,
    anterior: 500000,
  },
];

const TopVentasComparadoChart: React.FC<Props> = ({ filters }) => {
  const categorias = sampleData.map((item) => item.name);

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "bar",
      height: 350,
      stacked: false,
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: "60%",
      },
    },
    colors: ["#3f51b5", "#f06292"],
    dataLabels: {
      enabled: false,
    },
    stroke: {
      width: 1,
      colors: ["#fff"],
    },
    xaxis: {
      categories: categorias,
      labels: {
        formatter: (val: any) => `$${(val / 1_000_000).toFixed(1)}M`,
      },
    },
    legend: {
      position: "top",
      labels: {
        colors: "#333",
      },
    },
    tooltip: {
      y: {
        formatter: (val: any) =>
          new Intl.NumberFormat("es-CL", {
            style: "currency",
            currency: "CLP",
          }).format(val),
      },
    },
  };

  const series = [
    {
      name: "Actual",
      data: sampleData.map((item) => item.actual),
    },
    {
      name: "Anterior",
      data: sampleData.map((item) => item.anterior),
    },
  ];

  return (
    <Box
      sx={{
        backgroundColor: "#fff",
        p: 2,
        borderRadius: 2,
        boxShadow: 1,
        height: "100%",
      }}
    >
      <Typography variant="subtitle1" fontWeight={600} mb={1}>
        Top 10 Ventas actuales respecto al periodo anterior
      </Typography>
      <ReactApexChart options={options} series={series} type="bar" height={320} />
    </Box>
  );
};

export default TopVentasComparadoChart;
