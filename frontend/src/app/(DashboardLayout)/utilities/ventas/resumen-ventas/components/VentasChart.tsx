"use client";

import React from "react";
import { apiJson } from "@/utils/apiClient";
import { useCargaDatos } from "@/utils/useCargaDatos";
import { BACKEND_URL } from "@/config";
import TendenciaCanales, { Punto, puntosDeTendencia } from "../../components/TendenciaCanales";

export interface Filters {
  fechaInicio: string;
  fechaFin: string;
  temporada: string;
  sku?: string;
  familia?: string;
  subfamilia?: string;
}

interface Props {
  filtros: Filters;
}

const VentasChart: React.FC<Props> = ({ filtros }) => {
  const buildQuery = () => {
    const params = new URLSearchParams();
    if (filtros.fechaInicio) params.append("fechaInicio", filtros.fechaInicio);
    if (filtros.fechaFin) params.append("fechaFin", filtros.fechaFin);
    if (filtros.sku) params.append("sku", filtros.sku);
    if (filtros.familia) params.append("familia", filtros.familia);
    if (filtros.subfamilia) params.append("subfamilia", filtros.subfamilia);
    if (filtros.temporada) params.append("temporada", filtros.temporada);
    return params.toString();
  };

  // Al cambiar un filtro se limpia al instante y solo queda la última respuesta.
  const url = `${BACKEND_URL}/api/primer-nivel/ventas-fecha-primer-nivel?${buildQuery()}`;
  const { datos: data, cargando } = useCargaDatos<Punto[]>(
    url,
    async (signal) => puntosDeTendencia(await apiJson(url, { signal })),
    []
  );

  return <TendenciaCanales datos={data} cargando={cargando} />;
};

export default VentasChart;
