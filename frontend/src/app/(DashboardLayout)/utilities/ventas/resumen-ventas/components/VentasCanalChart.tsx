"use client";
import React, { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { Typography } from "@mui/material";
import DashboardCard from "@/app/(DashboardLayout)/components/shared/DashboardCard";
import { ApexOptions } from "apexcharts";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/config";
import { formatVentas } from "@/utils/format";

interface Props {
  filters: {
    temporada: string;
    periodo: string;
    fechaInicio: string;
    fechaFin: string;
  };
}

interface VentasCanalData {
  [key: string]: number;
}

const VentasCanalChart: React.FC<Props> = ({ filters }) => {
  const [chartData, setChartData] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [rawKeys, setRawKeys] = useState<string[]>([]); // para mantener los keys reales
  const [loading, setLoading] = useState<boolean>(true);

  const router = useRouter();

  // 🔁 Mapeo visual de nombres de canal
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
    if (filters.periodo) {
      const mapPeriodo: any = {
        "Hoy": "1d",
        "Ultimos 7 días": "7d",
        "Ultimos 14 días": "14d",
        "Ultimo mes": "1m",
        "3 meses": "3m",
        "6 meses": "6m",
      };
      params.append("periodo", mapPeriodo[filters.periodo]);
    }
    return params.toString();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const query = buildQuery();
        const response = await fetchWithToken(`${BACKEND_URL}/api/ventas-canal?${query}`);
        if (!response) return;

        const data: VentasCanalData = (await response.json())[0];
        const keys = Object.keys(data);

        const newLabels = keys.map((key) => canalNameMap[key.toLowerCase()] || key);
        const newSeries = Object.values(data);

        setLabels(newLabels);
        setChartData(newSeries);
        setRawKeys(keys); // guardamos los nombres originales
      } catch (error) {
        console.error("❌ Error al obtener datos de ventas por canal:", error);
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
          const canalOriginal = rawKeys[indexClicked];
          router.push(`/utilities/ventas/ventas-por-canal?canal=${encodeURIComponent(canalOriginal)}`);
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
