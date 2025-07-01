"use client";

import * as React from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import { Typography, Box } from "@mui/material";

interface BarDataItem {
  [key: string]: string | number;
}

const GraficoBarraComparativo = () => {
  const titulo = "Comparativa mensual de ventas por ciudad";

  const categorias = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "septiembre",];

  const dataset: BarDataItem[] = [
    { london: 1200000, paris: 1000000 },
    { london: 1350000, paris: 950000},
    { london: 1600000, paris: 1150000},
    { london: 1450000, paris: 1100000},
    { london: 1550000, paris: 1200000},
    { london: 1600000, paris: 1150000},
    { london: 1450000, paris: 1100000},
    { london: 1550000, paris: 1200000},
  ];

  const series = [
    { dataKey: "london", label: "Pago" },
    { dataKey: "paris", label: "Comprado" },
  ];


  const altura = 300;

  const chartSettings = { 
    height: altura,
    xAxis: [{ dataKey: "categoria", scaleType: "band" as const }],
    yAxis: [
      {
        label: "",
        width: 60,
      },
    ],
    margin: { top: 20, right: 30, bottom: 30, left: 80 }, 
  };

  const unidad = "$";
  const valueFormatter = (v: number | null) =>
    v !== null ? `${unidad}${v.toLocaleString("es-CL")}` : "";

  const formattedDataset = dataset.map((item, i) => ({
    ...item,
    categoria: categorias[i] ?? `Mes ${i + 1}`,
  }));

  return (
    <Box p={2}>
      <Typography variant="h6" gutterBottom>
        {titulo}
      </Typography>
      <BarChart
        dataset={formattedDataset}
        series={series.map((s) => ({
          ...s,
          valueFormatter,
        }))}
        {...chartSettings}
      />
    </Box>
  );
};

export default GraficoBarraComparativo;
