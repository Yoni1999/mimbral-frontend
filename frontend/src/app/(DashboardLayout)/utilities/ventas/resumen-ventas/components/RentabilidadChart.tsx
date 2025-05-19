"use client";

import React from "react";
import Chart from "react-apexcharts";
import {
  Card,
  CardContent,
  Typography,
  Box,
} from "@mui/material";
import { ApexOptions } from "apexcharts";
import { formatVentas } from "@/utils/format"; // ✅ Importado

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
        text: "Rentabilidad Total",
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
      style: { fontSize: "9px" },
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
            Rentabilidad: ${formatVentas(producto.Rentabilidad_Total)}<br/>
            Cantidad Vendida: ${producto.Cantidad_Vendida}<br/>
            Margen: ${producto.Margen_Porcentaje.toFixed(2)}%<br/>
            Precio Venta Promedio: ${formatVentas(producto.Precio_Venta_Promedio)}<br/>
            Costo Promedio: ${formatVentas(producto.Costo_Promedio)}
          </div>
        `;
      },
    },
    dataLabels: {
      enabled: true,
      formatter: function (val: number) {
        return formatVentas(val * 1_000); // Convertimos de miles a valor real
      },
      style: {
        fontSize: "12px",
        colors: ["#000"],
      },
    },
  };

  const series = [
    {
      name: "Rentabilidad Total",
      data: safeData.map((item) => item.Rentabilidad_Total / 1_000), // en miles
      color: "#ff914a",
    },
  ];

  return (
    <Card elevation={1}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            Top 10 Productos con Mejor Rentabilidad
          </Typography>
        </Box>
        <Chart options={options} series={series} type="bar" height={445} />
      </CardContent>
    </Card>
  );
};

export default RentabilidadChart;
