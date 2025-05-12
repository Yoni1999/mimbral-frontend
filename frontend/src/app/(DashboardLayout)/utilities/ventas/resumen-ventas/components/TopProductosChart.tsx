import React, { useState } from "react";
import Chart from "react-apexcharts";
import { Card, CardContent, Typography, Box, IconButton, Menu, MenuItem } from "@mui/material";
import { ApexOptions } from "apexcharts";
import { MoreVert } from "@mui/icons-material";

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

  // 🔥 Estado para el menú desplegable
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const options: ApexOptions = {
    chart: {
      type: "bar" as const, // 🔥 Corregido tipo explícito
    },
    xaxis: {
      categories: safeData.map((item) => item.Nombre_Producto),
    },
    plotOptions: {
      bar: {
        horizontal: true,
        columnWidth: "50%",
      },
    },
    tooltip: {
      enabled: true,
      followCursor: true,
      theme: "dark",
      style: {
        fontSize: "12px",
      },
      y: {
        formatter: (val: number) => `${val} unidades`,
      },
      custom: function ({
        series,
        seriesIndex,
        dataPointIndex,
      }: {
        series: number[][];
        seriesIndex: number;
        dataPointIndex: number;
      }) {
        if (dataPointIndex === undefined || !safeData[dataPointIndex]) return "";

        return `<div style="background: #1e1e1e; padding: 6px; font-size: 10px; font-weight: bold; border-radius: 5px; color: #fff; text-align: center; min-width: 100px; box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.3);">
          ${series[seriesIndex][dataPointIndex]} unidades
        </div>`;
      },
    },
  };

  const series = [
    {
      name: "Cantidad Vendida",
      data: safeData.map((item) => item.Cantidad_Vendida),
      color:"#45914b", // Color personalizado
    },
  ];

  return (
    <Card
      elevation={1}
      sx={{
        borderRadius: 2,
        background: "#ff",
        border: "1px solid #e0e0e0",
        p: 2,
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Top 10 Productos Más Vendidos</Typography>
        </Box>

        <Chart options={options} series={series} type="bar" height={310} />
      </CardContent>
    </Card>
  );
};

export default TopProductosChart;
