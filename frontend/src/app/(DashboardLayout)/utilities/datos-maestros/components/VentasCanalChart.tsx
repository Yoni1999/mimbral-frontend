"use client";

import React, { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { Box } from "@mui/material";
import DashboardCard from "@/app/(DashboardLayout)/components/shared/DashboardCard";
import { ApexOptions } from "apexcharts";

interface VentasCanalChartProps {
  canal: string;
  periodo: string;
  fechaInicio?: string;
  fechaFin?: string;
  onVendedorSeleccionado: (vendedor: number | null) => void;
  labelsData?: string[];    // 🔹 etiquetas personalizadas (opcional)
  seriesData?: number[];    // 🔹 datos del gráfico personalizados (opcional)
  title?: string;           // 🔹 título del gráfico
}

const VentasCanalChart: React.FC<VentasCanalChartProps> = ({
  canal,
  periodo,
  fechaInicio,
  fechaFin,
  onVendedorSeleccionado,
  labelsData,
  seriesData,
  title = "Ventas por Canal",
}) => {
  const [labels, setLabels] = useState<string[]>([]);
  const [chartData, setChartData] = useState<number[]>([]);
  const [vendedorCodigos, setVendedorCodigos] = useState<number[]>([]);
  const [noData, setNoData] = useState(false);

  useEffect(() => {
    // 🔹 Si se pasan datos personalizados, usarlos
    if (labelsData && seriesData) {
      setLabels(labelsData);
      setChartData(seriesData);
      setVendedorCodigos(seriesData.map((_, i) => 100 + i)); // códigos dummy
      setNoData(false);
      return;
    }

    // 🔹 Datos por defecto
    setLabels(["Chorrillo", "Empresas", "Balmaceda", "Meli", "Falabella"]);
    setChartData([30, 35, 15, 15, 5]);
    setVendedorCodigos([101, 102, 103, 104, 105]);
    setNoData(false);
  }, [labelsData, seriesData]);

  const options: ApexOptions = {
    chart: {
      type: "donut",
      toolbar: { show: false },
      events: {
        dataPointSelection: (event, chartContext, config) => {
          const indexClicked = config.dataPointIndex;
          const vendedorSeleccionado = vendedorCodigos[indexClicked] || null;
          onVendedorSeleccionado(vendedorSeleccionado);
        },
      },
    },
    labels,
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: { width: 200 },
          legend: { position: "bottom" },
        },
      },
    ],
    tooltip: {
      y: {
        formatter: (val: number) => (noData ? "Sin datos" : `${val.toFixed(2)}%`),
      },
    },
    fill: {
      opacity: noData ? 0.3 : 1,
    },
    colors: noData ? ["#D1D5DB"] : undefined,
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            name: { show: true },
            value: { show: !noData },
          },
          size: "60%",
        },
      },
    },
  };

  return (
    <DashboardCard
      title={title}
      sx={{ minHeight: "480px", display: "flex", flexDirection: "column", justifyContent: "center" }}
    >
      <Box sx={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "350px" }}>
        <Chart options={options} series={chartData} type="donut" width="150%" height="350px" />
      </Box>
    </DashboardCard>
  );
};

export default VentasCanalChart;
