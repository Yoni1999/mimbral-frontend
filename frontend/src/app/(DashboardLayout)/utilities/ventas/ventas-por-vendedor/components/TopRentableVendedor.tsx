"use client";

import React, { useEffect, useState } from "react";
import { Box, Typography, Avatar } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
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

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 1,
        backgroundColor: "#ffffff",
        boxShadow: 1,
        height: "100%",
      }}
    >
      <Typography variant="h6" fontWeight={600} mb={2} color="primary">
        Top 10 Productos Más Rentables
      </Typography>

      {data.length > 0 ? (
        <BarChart
          yAxis={[
            {
              scaleType: "band",
              data: data.map((item) =>
                item.nombre.length > 50 ? item.nombre.slice(0, 50) + "…" : item.nombre
              ),
            },
          ]}
          xAxis={[
            {
              label: "Margen ($)",
              valueFormatter: (value) => formatVentas(value),
            },
          ]}
          series={[
            {
              data: data.map((item) => item.margen),
              label: "Margen Absoluto",
              valueFormatter: (value) => (value != null ? formatVentas(value) : "-"),
            },
          ]}
          height={360}
          layout="horizontal"
          margin={{ top: 60, bottom: 30, left: 350, right: 30 }}
        />
      ) : (
        <Typography variant="body2" color="text.secondary">
          No hay datos disponibles para los filtros seleccionados.
        </Typography>
      )}
    </Box>
  );
};

export default TopRentableVendedor;
