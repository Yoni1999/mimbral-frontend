"use client";
import React, { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { fetchWithToken } from "@/utils/fetchWithToken";
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
  const [chartData, setChartData] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [rawLabels, setRawLabels] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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

  useEffect(() => {
    const fetchData = async () => {
      if (!filters.itemCode) return;

      try {
        setLoading(true);
        const query = buildQuery();
        const response = await fetchWithToken(`${BACKEND_URL}/api/ventas-canal?${query}`);
        if (!response) return;

        const data: VentasCanalData = (await response.json())[0];
        const keys = Object.keys(data);
        const mappedLabels = keys.map((key) => canalNameMap[key.toLowerCase()] || key);

        setRawLabels(keys);
        setLabels(mappedLabels);
        setChartData(Object.values(data));
      } catch (error) {
        console.error("❌ Error al obtener datos de ventas por canal:", error);
        setLabels([]);
        setRawLabels([]);
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

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
