"use client";

import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import ReactApexChart from "react-apexcharts";
import { apiJson } from "@/utils/apiClient";
import { useCargaDatos } from "@/utils/useCargaDatos";
import { BACKEND_URL } from "@/config";
import { formatVentas } from "@/utils/format";

interface ProductoMasVendido {
  ItemCode: string;
  Nombre_Producto: string;
  Total_Ventas: number;
  Total_Ventas_Anterior: number;
  PorcentajeCambio: number;
  U_Imagen: string;
}

interface Filters {
  vendedorEmpresa: string;
  fechaInicio: string;
  fechaFin: string;
  modoComparacion: string;
  canal: string;
}

interface Props {
  filtros: Filters;
}

const TopVentasComparadoChart: React.FC<Props> = ({ filtros }) => {
  const getComparacionTexto = () => {
    switch (filtros.modoComparacion) {
      case "PeriodoAnterior":
        return "Comparado con el período anterior";
      case "MismoPeriodoAnoAnterior":
        return "Comparado con el mismo período del año anterior";
      default:
        return "Comparado con el período anterior";
    }
  };

  const buildQuery = () => {
    const params = new URLSearchParams();

    if (filtros.fechaInicio) params.append("fechaInicio", filtros.fechaInicio);
    if (filtros.fechaFin) params.append("fechaFin", filtros.fechaFin);

    if (filtros.modoComparacion) {
      params.append("modoComparacion", filtros.modoComparacion);
    }

    if (filtros.vendedorEmpresa) {
      params.append("vendedorEmpresa", filtros.vendedorEmpresa);
    }

    if (filtros.canal) {
      params.append("canal", filtros.canal);
    }

    return params.toString();
  };

  // Al cambiar un filtro se limpia al instante y solo queda la última respuesta.
  const url = `${BACKEND_URL}/api/pv/topproductosmasvendidos?${buildQuery()}`;
  const { datos: data, cargando: loading } = useCargaDatos<ProductoMasVendido[]>(
    url,
    (signal) => apiJson(url, { signal }),
    []
  );

  const categorias = data.map((item) =>
    item.Nombre_Producto.length > 40
      ? item.Nombre_Producto.slice(0, 37) + "…"
      : item.Nombre_Producto
  );

  const series = [
    {
      name: "Actual",
      data: data.map((item) => item.Total_Ventas),
    },
    {
      name: "Anterior",
      data: data.map((item) => item.Total_Ventas_Anterior),
    },
  ];

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "bar",
      height: 350,
      stacked: false,
      toolbar: {
        show: false,
      }
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: "80%",
      },
    },
    colors: ["#284270", "#d93a3a"],
    dataLabels: { enabled: false },
    stroke: { width: 1, colors: ["#fff"] },
    xaxis: {
      categories: categorias,
      labels: {
        formatter: (val: string) => formatVentas(Number(val)),
      },
    },
    legend: {
      position: "top",
      labels: { colors: "primary" },
    },
    tooltip: {
      y: {
        formatter: (val: number) => formatVentas(val),
      },
    },
  };

  return (
    <Box
      sx={{
        backgroundColor: "#ffffff",
        p: 1,
        borderRadius: 1,
        boxShadow: 1,
        height: "100%",
        border: "1px solid #eee",
      }}
    >
      <Box mb={1}>
        <Typography variant="h6" fontWeight={700} color="primary">
          Top 10 Productos Más Vendidos {getComparacionTexto()}
        </Typography>
      </Box>

      {loading ? (
        <Box display="flex" alignItems="center" justifyContent="center" height={260}>
          <CircularProgress />
        </Box>
      ) : data.length > 0 ? (
        <ReactApexChart options={options} series={series} type="bar" height={360} />
      ) : (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          height={260}
          sx={{ color: "text.secondary", fontStyle: "italic" }}
        >
          No hay datos disponibles para los filtros seleccionados.
        </Box>
      )}
    </Box>
  );
};

export default TopVentasComparadoChart;

