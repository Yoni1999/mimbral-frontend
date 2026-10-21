"use client";

import React from "react";
import Chart from "react-apexcharts";
import { apiJson } from "@/utils/apiClient";
import { useCargaDatos } from "@/utils/useCargaDatos";
import { Typography } from "@mui/material";
import DashboardCard from "@/app/(DashboardLayout)/components/shared/DashboardCard";
import { ApexOptions } from "apexcharts";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/config";
import { formatVentas } from "@/utils/format";

interface Props {
  filters: {
    temporada: string;
    fechaInicio: string;
    fechaFin: string;
    sku?: string;
    familia?: string;
    subfamilia?: string;
  };
}

interface VentasCanalData {
  [key: string]: number;
}

const VentasCanalChart: React.FC<Props> = ({ filters }) => {
  const router = useRouter();

  const canalNameMap: Record<string, string> = {
    empresas: "Empresas",
    chorrillo: "Chorrillo",
    balmaceda: "Balmaceda",
    vitex: "Vtex",
    meli: "Mercado Libre",
    falabella: "Falabella",
  };

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (filters.fechaInicio) params.append("fechaInicio", filters.fechaInicio);
    if (filters.fechaFin) params.append("fechaFin", filters.fechaFin);
    if (filters.sku) params.append("sku", filters.sku);
    if (filters.familia) params.append("familia", filters.familia);
    if (filters.subfamilia) params.append("subfamilia", filters.subfamilia);
    if (filters.temporada) params.append("temporada", filters.temporada);
    return params.toString();
  };

  // Al cambiar un filtro se limpia al instante y solo queda la última respuesta.
  const url = `${BACKEND_URL}/api/ventas-canal?${buildQuery()}`;
  const {
    datos: { labels, chartData, rawKeys },
    cargando: loading,
  } = useCargaDatos(
    url,
    async (signal) => {
      const data: VentasCanalData = (await apiJson(url, { signal }))[0];
      const keys = Object.keys(data);
      return {
        labels: keys.map((key) => canalNameMap[key.toLowerCase()] || key),
        chartData: Object.values(data),
        rawKeys: keys,
      };
    },
    { labels: [] as string[], chartData: [] as number[], rawKeys: [] as string[] }
  );

  const options: ApexOptions = {
    chart: {
      type: "donut",
      toolbar: { show: false },
      events: {
        dataPointSelection: (event, chartContext, config) => {
          const indexClicked = config.dataPointIndex;
          const canalOriginal = rawKeys[indexClicked];
          router.push(`/utilities/ventas/ventas-por-canal?canal=${encodeURIComponent(canalOriginal)}`);
        },
      },
    },
    labels,
    colors: ["#9583ff", "#ff914a", "#f0d45f", "#45914b", "#284270", "#d93a3a"],
    tooltip: {
      y: {
        formatter: (val: number) => formatVentas(val),
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: { width: 200 },
          legend: { position: "bottom" },
        },
      },
    ],
  };

  return (
    <DashboardCard
      title="Ventas por Canal"
      sx={{ backgroundColor: "#ffffff", height: 420 }}
      elevation={1}
    >
      {loading ? (
        <Typography variant="body1">Cargando gráfico...</Typography>
      ) : (
        <Chart options={options} series={chartData} type="donut" width="100%" height={300} />
      )}
    </DashboardCard>
  );
};

export default VentasCanalChart;

