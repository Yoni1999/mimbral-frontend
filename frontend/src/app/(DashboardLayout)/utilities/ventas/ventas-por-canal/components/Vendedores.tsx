"use client";

import React, { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { Box } from "@mui/material";
import DashboardCard from "@/app/(DashboardLayout)/components/shared/DashboardCard";
import { ApexOptions } from "apexcharts";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";

interface VentasCanalChartProps {
  canal: string;
  periodo: string;
  fechaInicio?: string;
  fechaFin?: string;
  onVendedorSeleccionado: (vendedor: number | null) => void;
}

const VentasCanalChart: React.FC<VentasCanalChartProps> = ({
  canal,
  periodo,
  fechaInicio,
  fechaFin,
  onVendedorSeleccionado,
}) => {
  const [labels, setLabels] = useState<string[]>([]);
  const [chartData, setChartData] = useState<number[]>([]);
  const [vendedorCodigos, setVendedorCodigos] = useState<number[]>([]);
  const [noData, setNoData] = useState(false);

  useEffect(() => {
    if (!canal) {
      setLabels([]);
      setChartData([]);
      setVendedorCodigos([]);
      setNoData(true);
      return;
    }

    const fetchData = async () => {
      try {
        const params = new URLSearchParams();

        if (canal) params.append("canal", canal);
        if (periodo) params.append("periodo", periodo);
        if (fechaInicio && fechaFin) {
          params.append("fechaInicio", fechaInicio);
          params.append("fechaFin", fechaFin);
        }

        const url = `${BACKEND_URL}/api/canal-vendedor?${params.toString()}`;
        const response = await fetchWithToken(url);
        const data = await response?.json();

        if (!Array.isArray(data) || data.length === 0) {
          setLabels(["Sin datos"]);
          setChartData([0.001]);
          setVendedorCodigos([0]);
          setNoData(true);
          return;
        }

        const vendedores = data.map((item: { Nombre_Vendedor: string }) => item.Nombre_Vendedor);
        const codigos = data.map((item: { Codigo_Vendedor: number }) => item.Codigo_Vendedor);
        const porcentajes = data.map((item: { Porcentaje: number }) => item.Porcentaje);

        setLabels(vendedores);
        setChartData(porcentajes);
        setVendedorCodigos(codigos);
        setNoData(false);
      } catch (error) {
        console.error("❌ Error al obtener datos de ventas por canal:", error);
        setLabels(["Error"]);
        setChartData([0.001]);
        setVendedorCodigos([0]);
        setNoData(true);
      }
    };

    fetchData();
  }, [canal, periodo, fechaInicio, fechaFin]);

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
    legend: {
      show: false, // 👈 Elimina la leyenda
    },
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
        height: "100%",
        boxShadow: "0px 4px 20px rgba(0,0,0,0.1)",
        background: "#fff",
        p: 2,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 500, mx: "auto" }}>
        <Chart options={options} series={chartData} type="donut" width="100%" height="350px" />
      </Box>
    </DashboardCard>
  );
};

export default VentasCanalChart;
