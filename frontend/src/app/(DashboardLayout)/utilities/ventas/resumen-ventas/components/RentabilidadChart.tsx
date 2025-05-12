import React, { useState } from "react";
import Chart from "react-apexcharts";
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem
} from "@mui/material";
import { ApexOptions } from "apexcharts";
import { InsertChartOutlined, MoreVert } from "@mui/icons-material";

interface Producto {
  Nombre_Producto: string;
  Rentabilidad_Total: number;
  Cantidad_Vendida: number;
  Margen_Porcentaje: number;
  Precio_Venta_Promedio: number;
  Costo_Promedio: number;
}

interface Props {
  data: Producto[];
}

const RentabilidadChart: React.FC<Props> = ({ data }) => {
  const safeData = Array.isArray(data) ? data : [];

  const options: ApexOptions = {
    chart: {
      type: "bar",
    },
    plotOptions: {
      bar: {
        horizontal: true,
        columnWidth: "50%",
      },
    },
    xaxis: {
      categories: safeData.map((item) => item.Nombre_Producto),
      title: {
        text: "Rentabilidad Total (en miles de CLP)",
        style: {
          fontSize: "12px",
          fontWeight: 400,
        },
      },
    },
    tooltip: {
      enabled: true,
      followCursor: true,
      theme: "dark",
      style: {
        fontSize: "9px",
      },
      custom: function ({ series, seriesIndex, dataPointIndex }) {
        if (dataPointIndex === undefined || !safeData[dataPointIndex]) return "";

        const producto = safeData[dataPointIndex];
        return `
          <div style="
            background: #1e1e1e;
            padding: 6px;
            font-size: 9px;
            border-radius: 2px;
            color: #fff;
            text-align: left;
            box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.3);
          ">
            <strong>Detalles</strong><br/>
            Rentabilidad: $${Math.round(series[seriesIndex][dataPointIndex] * 1000).toLocaleString()} CLP<br/>
            Cantidad Vendida: ${producto.Cantidad_Vendida}<br/>
            Margen: ${producto.Margen_Porcentaje.toFixed(2)}%<br/>
            Precio Venta Promedio: $${producto.Precio_Venta_Promedio.toLocaleString()} CLP<br/>
            Costo Promedio: $${producto.Costo_Promedio.toLocaleString()} CLP
          </div>
        `;
      },
    },
    dataLabels: {
      enabled: true,
      formatter: function (val: number) {
        return `$${val.toFixed(1)}K CLP`;
      },
      style: {
        fontSize: "12px",
        colors: ["#000"],
      },
    },
  };

  const series = [
    {
      name: "Rentabilidad Total (K CLP)",
      data: safeData.map((item) => item.Rentabilidad_Total / 1_000),
      color: "#ff914a",
    },
  ];

  return (
    <Card elevation={1}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <Typography variant="h6">
              Top 10 Productos con Mejor Rentabilidad
            </Typography>
          </Box>
        </Box>
        <Chart options={options} series={series} type="bar" height={430} />
      </CardContent>
    </Card>
  );
};

export default RentabilidadChart;
