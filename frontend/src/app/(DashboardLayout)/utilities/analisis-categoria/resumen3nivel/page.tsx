"use client";

import React, { useState } from "react";
import {
  Box,
  Grid,
} from "@mui/material";
import HeaderCategoria, { Filters } from "./components/HeaderSubcategoria";
import MetricCard from "../components/MetricCard";
import VentasChart from "./components/VentasChart";
import dynamic from "next/dynamic";
import TopProductosChart from "./components/TopProductosChart";
import { BACKEND_URL } from "@/config";
import TopRentableCategoria from "./components/TopRentableCategoria";
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

  const mapPeriodoToLabel = (code: string): string => {
    const map: Record<string, string> = {
      "1D": "Hoy",
      "1d": "Hoy",
      "7D": "Ultimos 7 días",
      "7d": "Ultimos 7 días",
      "14D": "Ultimos 14 días",
      "14d": "Ultimos 14 días",
      "1M": "Ultimo mes",
      "1m": "Ultimo mes",
      "3M": "3 meses",
      "3m": "3 meses",
      "6M": "6 meses",
      "6m": "6 meses",
    };
    return map[code] || "";
  };

  // Los filtros arrancan directo desde la URL: antes partían vacíos y un
  // efecto los volvía a fijar, lo que disparaba dos cargas completas.
  const [filtros, setFiltros] = useState<Filters>(() => ({
    subcategoria: searchParams?.get("subcategoria") || "",
    periodo: mapPeriodoToLabel(searchParams?.get("periodo") || ""),
    temporada: searchParams?.get("temporada") || "",
    fechaInicio: searchParams?.get("fechaInicio") || "",
    fechaFin: searchParams?.get("fechaFin") || "",
    comparacion: "",
  }));

  const getPeriodoParam = (periodo: string) => {
    const normalizedPeriodo = periodo.trim();
    switch (normalizedPeriodo) {
      case "Hoy":
      case "1d":
      case "1D":
        return "1D";
      case "Ultimos 7 días":
      case "7d":
      case "7D":
        return "7D";
      case "Ultimos 14 días":
      case "14d":
      case "14D":
        return "14D";
      case "Ultimo mes":
      case "1m":
      case "1M":
        return "1M";
      case "3 meses":
      case "3m":
      case "3M":
        return "3M";
      case "6 meses":
      case "6m":
      case "6M":
        return "6M";
      default:
        return normalizedPeriodo || "1D";
    }
  };

  const buildQuery = (currentFiltros: Filters) => {
    const params = new URLSearchParams();
    if (currentFiltros.fechaInicio) params.append("fechaInicio", currentFiltros.fechaInicio);
    if (currentFiltros.fechaFin) params.append("fechaFin", currentFiltros.fechaFin);
    if (currentFiltros.periodo) params.append("periodo", getPeriodoParam(currentFiltros.periodo));
    if (currentFiltros.temporada) params.append("temporada", currentFiltros.temporada);
    if (currentFiltros.subcategoria) params.append("subcategoria", currentFiltros.subcategoria);

    return params.toString();
  };

  // Cada tarjeta se identifica por su URL con los filtros: al cambiar un
  // filtro se limpia al instante, se cancela lo pendiente y solo se muestra
  // la respuesta del filtro actual (ver useCargaDatos).
  const query = buildQuery(filtros);
  const url = (endpoint: string) => `${BACKEND_URL}/api/tercer-nivel/${endpoint}?${query}`;
  const { datos: unidadesVendidas, cargando: cargandoUnidades } = useApiDatos<any>(url("unidades-vendidas-subcategoria"), {});
  const { datos: productosDistintos, cargando: cargandoProductos } = useApiDatos<any>(url("items-vendidos-subcategoria"), {});
  const { datos: notasCredito, cargando: cargandoNotas } = useApiDatos<any>(url("notas-credito-subcategoria"), {});
  const { datos: transaccionesPeriodo, cargando: cargandoTransacciones } = useApiDatos<any>(url("cantidad-ventas-subcategoria"), {});
  const { datos: margenVentas, cargando: cargandoMargen } = useApiDatos<any>(url("margen-subcategoria"), {});
  const { datos: ventasPeriodo, cargando: cargandoVentas } = useApiDatos<any>(url("ventas-subcategoria"), {});

  return (
    <Box sx={{ p: 1 }}>
      <HeaderCategoria
        onFilterChange={setFiltros}
        initialFilters={filtros}
      />

      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <Grid container spacing={2}>
            {[
              {
                title: "Ventas",
                value: formatVentas(ventasPeriodo.TotalVentasPeriodo ?? 0),
                subtitle: `Anterior: ${formatVentas(ventasPeriodo.TotalVentasAnterior ?? 0)}`,
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
