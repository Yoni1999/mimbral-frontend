"use client";
import React from "react";
import Chart from "react-apexcharts";
import { apiJson } from "@/utils/apiClient";
import { useCargaDatos } from "@/utils/useCargaDatos";
import { Box, Typography, Paper } from "@mui/material";
import { ApexOptions } from "apexcharts";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/config";
import { formatVentas } from "@/utils/format";

// ✅ Mapeo de nombres legibles por canal
const canalNameMap: Record<string, string> = {
  empresas: "Empresas",
  chorrillo: "Chorrillo",
  balmaceda: "Balmaceda",
  vitex: "Vtex",
  meli: "Mercado Libre",
  falabella: "Falabella",
};

interface Props {
  filters: {
    temporada: string;
    periodo: string;
    fechaInicio: string;
    fechaFin: string;
    canal?: string;
    itemCode?: string;
  };
  onSelectCanal?: (canal: string) => void;
}

interface VentasCanalData {
  [key: string]: number;
}

const VentasCanalChart: React.FC<Props> = ({ filters, onSelectCanal }) => {
  const router = useRouter();

  const buildQuery = () => {
    const params = new URLSearchParams();

    if (filters.itemCode) params.append("itemCode", filters.itemCode);
    if (filters.fechaInicio) params.append("fechaInicio", filters.fechaInicio);
    if (filters.fechaFin) params.append("fechaFin", filters.fechaFin);
    if (filters.periodo) params.append("periodo", filters.periodo);
    if (filters.canal) params.append("canal", filters.canal);

    return params.toString();
  };

  // Al cambiar un filtro se limpia al instante y solo queda la última respuesta.
  const url = filters.itemCode ? `${BACKEND_URL}/api/ventas-canal?${buildQuery()}` : null;
  const { datos, cargando } = useCargaDatos<{ chartData: number[]; labels: string[]; rawLabels: string[] }>(
    url,
    async (signal) => {
      const data: VentasCanalData = (await apiJson(url as string, { signal }))[0];
      const keys = Object.keys(data);
      return {
        rawLabels: keys,
        labels: keys.map((key) => canalNameMap[key.toLowerCase()] || key),
        chartData: Object.values(data),
      };
    },
    { chartData: [], labels: [], rawLabels: [] }
  );
  const { chartData, labels, rawLabels } = datos;
  // Sin producto se mantiene el "Cargando gráfico..." que mostraba antes.
  const loading = cargando || !filters.itemCode;

  const options: ApexOptions = {
    chart: {
      type: "donut",
      toolbar: { show: false },
      events: {
        dataPointSelection: (event, chartContext, config) => {
          const indexClicked = config.dataPointIndex;
          const canalOriginal = rawLabels[indexClicked];
          if (onSelectCanal) {
            onSelectCanal(canalOriginal);
          } else {
            router.push(`/utilities/ventas/ventas-por-canal?canal=${encodeURIComponent(canalOriginal)}`);
          }
        },
      },
    },
    labels: labels,
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
    <Box
      bgcolor="transparent"
      display="flex"
      flexDirection="column"
      alignItems="flex-start"
      justifyContent="center"
      width="100%"
    >
      <Typography variant="h6" fontWeight={700} mb={2}>
        Ventas por Canal
      </Typography>

      <Paper
        elevation={0}
        square
        sx={{
          p: 0,
          border: "none",
          backgroundColor: "transparent",
          boxShadow: "none",
          width: "100%",
          maxWidth: 480,
        }}
      >
        {loading ? (
          <Typography variant="body1" textAlign="center">
            Cargando gráfico...
          </Typography>
        ) : chartData.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center">
            No hay datos disponibles para los filtros aplicados.
          </Typography>
        ) : (
          <Chart
            options={options}
            series={chartData}
            type="donut"
            width="100%"
            height={320}
          />
        )}
      </Paper>
    </Box>
  );
};

export default VentasCanalChart;

