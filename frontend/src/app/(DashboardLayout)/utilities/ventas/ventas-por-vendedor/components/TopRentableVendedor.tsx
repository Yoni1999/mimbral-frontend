"use client";

import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import ReactApexChart from "react-apexcharts";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";
import { formatVentas } from "@/utils/format";

interface ProductoRentable {
  nombre: string;
  margen: number;
  imagen: string;
}

interface Filters {
  vendedorEmpresa: string;
  temporada: string;
  periodo: string;
  fechaInicio: string;
  fechaFin: string;
  modoComparacion: string;
  canal: string;
}

interface Props {
  filtros: Filters;
}

const TopRentableVendedor: React.FC<Props> = ({ filtros }) => {
  const [data, setData] = useState<ProductoRentable[]>([]);

  const getPeriodoParam = (periodo: string) => {
    switch (periodo) {
      case "1D": return "1d";
      case "7D": return "7d";
      case "14D": return "14d";
      case "1M": return "1m";
      case "3M": return "3m";
      case "6M": return "6m";
      default: return "1d";
    }
  };

  useEffect(() => {
    const buildQuery = () => {
      const params = new URLSearchParams();

      if (filtros.periodo) {
        params.append("periodo", getPeriodoParam(filtros.periodo));
      } else {
        if (filtros.fechaInicio) params.append("fechaInicio", filtros.fechaInicio);
        if (filtros.fechaFin) params.append("fechaFin", filtros.fechaFin);
      }

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

    const fetchData = async () => {
      try {
        const url = `${BACKEND_URL}/api/pv/toprentables?${buildQuery()}`;
        const res = await fetchWithToken(url);
        const json = await res!.json();

        const mapped: ProductoRentable[] = json.map((item: any) => ({
          nombre: item.Nombre_Producto,
          margen: item.Margen_Absoluto,
          imagen: item.Imagen,
        }));

        setData(mapped);
      } catch (error) {
        console.error("❌ Error al obtener productos rentables:", error);
        setData([]);
      }
    };

    fetchData();
  }, [filtros]);

  const categorias = data.map((item) =>
    item.nombre.length > 40 ? item.nombre.slice(0, 37) + "…" : item.nombre
  );

  const series = [
    {
      name: "Margen Absoluto",
      data: data.map((item) => item.margen),
    },
  ];

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "bar",
      height: 350,
      stacked: false,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: "80%",
      },
    },
    colors: ["#2e7d32"],
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
          Top 10 Productos Más Rentables
        </Typography>
      </Box>

      {data.length > 0 ? (
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

export default TopRentableVendedor;
