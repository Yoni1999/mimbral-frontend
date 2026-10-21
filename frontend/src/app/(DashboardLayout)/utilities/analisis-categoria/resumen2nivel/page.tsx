"use client";

import React, { useState } from "react";
import {
  Box,
  Grid,
  Paper,
  CircularProgress,
} from "@mui/material";
import HeaderCategoria, { Filters } from "./components/HeaderCategoria";
import MetricCard from "../components/MetricCard";
import VentasChart from "./components/VentasChart";
import dynamic from "next/dynamic";
import TopProductosChart from "./components/TopProductosChart";
import TopRentableCategoria from "./components/TopRentableCategoria";
import { BACKEND_URL } from "@/config";
import {
  IconCurrencyDollar,
  IconTrendingUp,
  IconShoppingCart,
  IconCreditCard,
  IconStack2,
  IconBox,
} from "@tabler/icons-react";
import { useApiDatos } from "@/utils/useCargaDatos";
import { formatVentas, formatUnidades } from "@/utils/format";
import { useSearchParams } from "next/navigation";
const VentasCanalChart = dynamic(() => import("./components/VentasCanalChart"), {
  ssr: false,
});

const ResumenCategoriasPage: React.FC = () => {
  const searchParams = useSearchParams();
  const categoriaFromUrl = searchParams?.get("categoria") || "";
  const mapPeriodoToLabel = (codigo: string): string => {
    const reverseMap: Record<string, string> = {
      "1d": "Hoy",
      "7d": "Ultimos 7 días",
      "14d": "Ultimos 14 días",
      "1m": "Ultimo mes",
      "3m": "3 meses",
      "6m": "6 meses",
      "1D": "Hoy",
      "7D": "Ultimos 7 días",
      "14D": "Ultimos 14 días",
      "1M": "Ultimo mes",
      "3M": "3 meses",
      "6M": "6 meses",
    };
    return reverseMap[codigo] || codigo;
  };
  const periodoFromUrl = mapPeriodoToLabel(searchParams?.get("periodo") || "");
  const temporadaFromUrl = searchParams?.get("temporada") || "";
  const fechaInicioFromUrl = searchParams?.get("fechaInicio") || "";
  const fechaFinFromUrl = searchParams?.get("fechaFin") || "";
  const comparacionFromUrl = searchParams?.get("comparacion") || "";

  

  const [filtros, setFiltros] = useState<Filters>({
    temporada: temporadaFromUrl,
    periodo: periodoFromUrl,
    fechaInicio: fechaInicioFromUrl,
    fechaFin: fechaFinFromUrl,
    categoria: categoriaFromUrl,
  });

  const getPeriodoParam = () => {
    const periodo = filtros.periodo;
    const mapa: Record<string, string> = {
      "Hoy": "1D",
      "Ultimos 7 días": "7D",
      "Ultimos 14 días": "14D",
      "Ultimo mes": "1M",
      "3 meses": "3M",
      "6 meses": "6M",
      "1D": "1D",
      "7D": "7D",
      "14D": "14D",
      "1M": "1M",
      "3M": "3M",
      "6M": "6M",
    };
    return mapa[periodo] || "1D";
  };
  

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (filtros.fechaInicio) params.append("fechaInicio", filtros.fechaInicio);
    if (filtros.fechaFin) params.append("fechaFin", filtros.fechaFin);
    if (filtros.periodo) params.append("periodo", getPeriodoParam());
    if (filtros.temporada) params.append("temporada", filtros.temporada);
    if (filtros.categoria) params.append("categoria", filtros.categoria);

    return params.toString();
  };
  

  // Cada tarjeta se identifica por su URL con los filtros: al cambiar un
  // filtro se limpia al instante, se cancela lo pendiente y solo se muestra
  // la respuesta del filtro actual (ver useCargaDatos).
  const query = buildQuery();
  const url = (endpoint: string) => `${BACKEND_URL}/api/resumen-categoria/${endpoint}?${query}`;
  const { datos: unidadesVendidas, cargando: cargandoUnidades } = useApiDatos<any>(url("unidades-vendidas-categoria"), {});
  const { datos: productosDistintos, cargando: cargandoProductos } = useApiDatos<any>(url("productos-distintos-categoria"), {});
  const { datos: notasCredito, cargando: cargandoNotas } = useApiDatos<any>(url("notas-credito-categoria"), {});
  const { datos: transaccionesPeriodo, cargando: cargandoTransacciones } = useApiDatos<any>(url("transacciones-categoria"), {});
  const { datos: margenVentas, cargando: cargandoMargen } = useApiDatos<any>(url("margen-categoria"), {});
  const { datos: ventasPeriodo, cargando: cargandoVentas } = useApiDatos<any>(url("ventas-categoria"), {});

  return (
    <Box sx={{ p: 1 }}>
      <HeaderCategoria onFilterChange={setFiltros} initialFilters={filtros} />

      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <Grid container spacing={2}>
            {[
              {
                title: "Ventas",
                value: formatVentas(ventasPeriodo.TotalVentasPeriodo ?? 0),
                subtitle: `Anterior: $${formatVentas(ventasPeriodo.TotalVentasAnterior ?? 0)}`,
                percentageChange: ventasPeriodo.PorcentajeCambio ?? 0,
                cargando: cargandoVentas,
                icon: <IconCurrencyDollar />,
              },
              {
                title: "Margen Ventas",
                value: `${margenVentas.MargenPorcentajePeriodo ?? 0}%`,
                subtitle: `Variación: ${margenVentas.VariacionMargen ?? 0}%`,
                percentageChange: margenVentas.VariacionMargen ?? 0,
                cargando: cargandoMargen,
                icon: <IconTrendingUp />,
              },
              {
                title: "Cantidad de Ventas",
                value: formatUnidades(transaccionesPeriodo.CantidadTransaccionesPeriodo || 0),
                subtitle: `Anterior: ${formatUnidades(transaccionesPeriodo.CantidadTransaccionesAnterior || 0)}`,
                percentageChange: transaccionesPeriodo.PorcentajeCambio || 0,
                cargando: cargandoTransacciones,
                icon: <IconShoppingCart />,
              },
              {
                title: "Notas de Crédito",
                value: formatUnidades(notasCredito.CantidadNotasCreditoPeriodo || 0),
                subtitle: `Anterior: ${formatUnidades(notasCredito.CantidadNotasCreditoAnterior || 0)}`,
                percentageChange: notasCredito.PorcentajeCambioNotasCredito || 0,
                cargando: cargandoNotas,
                icon: <IconCreditCard />,
              },
              {
                title: "Ítems Vendidos",
                value: formatUnidades(productosDistintos.ProductosPeriodoActual || 0),
                subtitle: `Anterior: ${formatUnidades(productosDistintos.ProductosPeriodoAnterior || 0)}`,
                percentageChange: productosDistintos.PorcentajeCambio || 0,
                cargando: cargandoProductos,
                icon: <IconStack2 />,
              },
              {
                title: "Unidades Vendidas",
                value: formatUnidades(unidadesVendidas.CantidadVendida || 0),
                subtitle: `Anterior: ${formatUnidades(unidadesVendidas.CantidadVendidaAnterior || 0)}`,
                percentageChange: unidadesVendidas.PorcentajeCambio || 0,
                cargando: cargandoUnidades,
                icon: <IconBox />,
              },
            ].map((card, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <MetricCard
                  title={card.title}
                  value={card.value}
                  subtitle={card.subtitle}
                  percentageChange={card.percentageChange}
                  icon={card.icon}
                  cargando={card.cargando}
                />
              </Grid>
            ))}
          </Grid>
        </Grid>

        <Grid item xs={12} md={7}>
          <VentasChart filters={filtros} />
        </Grid>
      </Grid>

      <Grid container spacing={2} mt={2}>
        <Grid item xs={12} md={5}>
          <VentasCanalChart filters={filtros} />
        </Grid>
        <Grid item xs={12} md={7}>
          <TopProductosChart filters={filtros} />
        </Grid>
      </Grid>

      <Grid container spacing={2} mt={2}>
        <Grid item xs={12} md={12}>
          <TopRentableCategoria filters={filtros} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ResumenCategoriasPage;
