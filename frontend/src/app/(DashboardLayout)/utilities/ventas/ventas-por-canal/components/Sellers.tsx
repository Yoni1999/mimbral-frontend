"use client";

import React from "react";
import Chart from "react-apexcharts";
import { Box, CircularProgress } from "@mui/material";
import DashboardCard from "@/app/(DashboardLayout)/components/shared/DashboardCard";
import { ApexOptions } from "apexcharts";
import { apiJson } from "@/utils/apiClient";
import { useCargaDatos } from "@/utils/useCargaDatos";
import { BACKEND_URL } from "@/config";

interface VentasCanalChartProps {
  canal: string;
  fechaInicio?: string;
  fechaFin?: string;
  onVendedorSeleccionado: (vendedor: number | null) => void;
}

const VentasCanalChart: React.FC<VentasCanalChartProps> = ({
  canal,
  fechaInicio,
  fechaFin,
  onVendedorSeleccionado,
}) => {
  // Sin canal no se pide nada (clave null). Al cambiar canal o fechas se
  // limpia al instante y solo queda la última respuesta.
  const params = new URLSearchParams();
  if (canal) params.append("canal", canal);
  if (fechaInicio && fechaFin) {
    params.append("fechaInicio", fechaInicio);
    params.append("fechaFin", fechaFin);
  }
  const url = canal ? `${BACKEND_URL}/api/canal-vendedor?${params.toString()}` : null;

  const {
    datos: { labels, chartData, vendedorCodigos, noData },
    cargando: isLoading,
  } = useCargaDatos(
    url,
    async (signal) => {
      try {
        const data = await apiJson(url as string, { signal });

        if (!Array.isArray(data) || data.length === 0) {
          return { labels: ["Sin datos"], chartData: [0.001], vendedorCodigos: [0], noData: true };
        }

        return {
          labels: data.map((item: { Nombre_Vendedor: string }) => item.Nombre_Vendedor),
          chartData: data.map((item: { Porcentaje: number }) => item.Porcentaje),
          vendedorCodigos: data.map((item: { Codigo_Vendedor: number }) => item.Codigo_Vendedor),
          noData: false,
        };
      } catch (error) {
        // Si fue cancelada, el hook descarta este resultado.
        if (!signal.aborted) console.error("❌ Error al obtener datos de ventas por canal:", error);
        return { labels: ["Error"], chartData: [0.001], vendedorCodigos: [0], noData: true };
      }
    },
    { labels: [] as string[], chartData: [] as number[], vendedorCodigos: [] as number[], noData: true }
  );

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
    legend: { show: false },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: { width: 200 },
          legend: { show: false },
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
          size: "70%",
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: "16px",
              fontWeight: 600,
              color: "#000",
              offsetY: -10,
            },
            value: {
              show: !noData,
              fontSize: "18px",
              fontWeight: 700,
              color: "#000",
              offsetY: 10,
              formatter: (val: string) => `${parseFloat(val).toFixed(1)}%`,
            },
            total: {
              show: false,
            },
          },
        },
      },
    },
  };

  return (
    <DashboardCard
      title="Vendedores"
      sx={{
        borderRadius: 4,
        minHeight: 400, // ✅ Altura consistente
        boxShadow: "0px 4px 20px rgba(0,0,0,0.1)",
        background: "#fff",
        p: 2,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      {isLoading ? (
        <Box
          sx={{
            flex: 1,
            minHeight: 300, // Asegura espacio visual al loader
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ width: "100%", maxWidth: 500, mx: "auto" }}>
          <Chart options={options} series={chartData} type="donut" width="100%" height="350px" />
        </Box>
      )}
    </DashboardCard>
  );
};

export default VentasCanalChart;

