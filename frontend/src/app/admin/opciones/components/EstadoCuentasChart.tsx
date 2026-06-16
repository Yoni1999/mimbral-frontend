'use client';
import React, { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { apiJson } from "@/utils/apiClient";
import DashboardCard from "@/app/(DashboardLayout)/components/shared/DashboardCard";
import { Typography } from "@mui/material";
import { ApexOptions } from "apexcharts";

interface EstadoCuentasChartProps {
  sx?: Record<string, any>; 
  width?: string | number;
  height?: string | number;
}

const EstadoCuentasChart: React.FC<EstadoCuentasChartProps> = ({
  sx,
  width = "100%",
  height = 380,
}) => {
  const [chartData, setChartData] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usuarios = await apiJson<any[]>("/api/admin/usuarios");
        const activos = usuarios.filter((u: any) => u.ESTADO === true).length;
        const inactivos = usuarios.filter((u: any) => u.ESTADO === false).length;

        setLabels(["Activos", "Inactivos"]);
        setChartData([activos, inactivos]);
      } catch (error) {
        console.error("❌ Error al obtener datos de estados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const options: ApexOptions = {
    chart: {
      type: "donut",
      toolbar: { show: false },
    },
    labels: labels,
    colors: ["#213663", "#606060"],
    responsive: [
      {
        breakpoint: 380,
        options: {
          chart: { width: 200 },
          legend: { position: "bottom" },
        },
      },
    ],
    tooltip: {
      y: {
        formatter: (val: number) => val.toLocaleString(),
      },
    },
    legend: {
      position: "bottom",
    },
  };

  return (
    <DashboardCard
      title="Estado de Cuentas"
      sx={{ maxWidth: 500, mt: 4, ...sx }}    >
      {loading ? (
        <Typography variant="body1">Cargando gráfico...</Typography>
      ) : (
        <Chart
          options={options}
          series={chartData}
          type="donut"
          width={width}
          height={height}
        />
      )}
    </DashboardCard>
  );
};

export default EstadoCuentasChart;
