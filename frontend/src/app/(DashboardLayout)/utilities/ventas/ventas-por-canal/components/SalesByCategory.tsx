"use client";

import React, { useState } from "react";
import Chart from "react-apexcharts";
import { Card, CardContent, Typography, Box, IconButton } from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { ApexOptions } from "apexcharts";
import { formatVentas } from "@/utils/format"; // 📦 Asegúrate de que esta ruta sea correcta según tu estructura

interface CategoriaVentas {
  Categoria: string;
  Ventas_Actual: number;
}

interface Props {
  data: CategoriaVentas[];
}

const ITEMS_PER_PAGE = 10;

const VentasPorCategoriaChart: React.FC<Props> = ({ data }) => {
  const safeData = Array.isArray(data)
    ? data
        .map((item) => ({
          Categoria: item.Categoria,
          Ventas_Actual:
            typeof item.Ventas_Actual === "number" ? item.Ventas_Actual : Number(item.Ventas_Actual) || 0,
        }))
        .filter((item) => item.Ventas_Actual > 0)
    : [];

  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(safeData.length / ITEMS_PER_PAGE);

  const paginatedData = safeData.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  const maxVentas = Math.max(1, ...safeData.map((item) => item.Ventas_Actual));
  const colors = paginatedData.map((item) => {
    const intensity = (item.Ventas_Actual / maxVentas) * 100;
    return `rgba(255, 111, 97, ${0.3 + 0.7 * (intensity / 100)})`;
  });

  const options: ApexOptions = {
    chart: { type: "bar", toolbar: { show: false }, background: "transparent" },
    colors,
    xaxis: {
      categories: paginatedData.map((item) => item.Categoria),
      tickAmount: 8,
      labels: {
        style: { fontSize: "12px", colors: "#333" },
        formatter: (value: string | number) => {
          const numericValue = typeof value === "number" ? value : Number(value);
          return formatVentas(numericValue);
        },
      },
      tooltip: { enabled: true },
    },
    plotOptions: {
      bar: { horizontal: true, borderRadius: 6, columnWidth: "50%" },
    },
    grid: { borderColor: "#e0e0e0", strokeDashArray: 5 },
    tooltip: {
      theme: "dark",
      y: {
        formatter: (val: number) => formatVentas(val),
        title: { formatter: () => "Ventas" },
      },
      fixed: { enabled: false },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => formatVentas(Number(val)),
      style: { fontSize: "10px", colors: ["#fff"] },
    },
  };

  const series = [
    {
      name: "Ventas",
      data: paginatedData.map((item) => item.Ventas_Actual),
    },
  ];

  return (
    <Card
      sx={{
        borderRadius: 4,
        boxShadow: '0px 4px 20px rgba(0,0,0,0.1)',
        background: '#fff',
        p: 2,
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" fontWeight="bold" color="text.primary">
            Ventas por Categoría
          </Typography>

          <Typography variant="body2" fontWeight="bold">
            Página {page + 1} de {totalPages}
          </Typography>

          <Box>
            <IconButton disabled={page === 0} onClick={() => setPage((prev) => prev - 1)}>
              <ChevronLeft />
            </IconButton>
            <IconButton disabled={page === totalPages - 1} onClick={() => setPage((prev) => prev + 1)}>
              <ChevronRight />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Chart options={options} series={series} type="bar" height={390} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default VentasPorCategoriaChart;
