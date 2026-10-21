"use client";

import React, { useState } from "react";
import { Box, Grid } from "@mui/material";
import HeaderCategoria, { Filters } from "./components/HeaderCategoria";
import MetricCard from "../components/MetricCard";
import VentasChart from "./components/VentasChart";
import dynamic from "next/dynamic";
import TopProductosChart from "./components/TopProductosChart";
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
import { useRouter } from "next/navigation"; // ✅ Mantener router para abrir nuevas páginas
import { BACKEND_URL } from "@/config";
import { formatVentas, formatUnidades } from "@/utils/format";
const VentasCanalChart = dynamic(() => import("./components/VentasCanalChart"), { ssr: false });



const ResumenCategoriasPage: React.FC = () => {
  const router = useRouter();

  const handleCategoriaSeleccionada = (categoria: string) => {
    const periodo = filtros.fechaInicio && filtros.fechaFin ? "" : getPeriodoParam();
    const queryParams = new URLSearchParams({
      categoria,
      periodo,
      temporada: filtros.temporada || "",
      fechaInicio: filtros.fechaInicio || "",
      fechaFin: filtros.fechaFin || "",
    }).toString();

    if (typeof window !== "undefined") {
      window.open(`/utilities/analisis-categoria/resumen2nivel?${queryParams}`, "_blank");
    }
  };


  const [filtros, setFiltros] = useState<Filters>({
    temporada: "",
    periodo: "Ultimos 7 días",
    fechaInicio: "",
    fechaFin: "",
    comparacion: "",
    primer_nivel: "",
    nombre_primer_nivel: "", 
  });
  

  const getPeriodoParam = () => {
    switch (filtros.periodo) {
      case "Hoy": return "1D";
      case "Ultimos 7 días": return "7D";
      case "Ultimos 14 días": return "14D";
      case "Ultimo mes": return "1M";
      case "3 meses": return "3M";
      case "6 meses": return "6M";
      default: return "1D";
    }
  };

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (filtros.fechaInicio) params.append("fechaInicio", filtros.fechaInicio);
    if (filtros.fechaFin) params.append("fechaFin", filtros.fechaFin);
    if (filtros.periodo) params.append("periodo", getPeriodoParam());
    if (filtros.temporada) params.append("temporada", filtros.temporada);
    if (filtros.primer_nivel && filtros.primer_nivel.trim() !== "") { params.append("primerNivel", filtros.primer_nivel);}
    return params.toString();
  };

  // Cada tarjeta se identifica por su URL con los filtros: al cambiar un
  // filtro se limpia al instante, se cancela lo pendiente y solo se muestra
  // la respuesta del filtro actual (ver useCargaDatos).
  const query = buildQuery();
  const url = (endpoint: string) => `${BACKEND_URL}/api/primer-nivel/${endpoint}?${query}`;
  const { datos: unidadesVendidas, cargando: cargandoUnidades } = useApiDatos<any>(url("unidades-vendidas-primer-nivel"), {});
  const { datos: productosDistintos, cargando: cargandoProductos } = useApiDatos<any>(url("items-vendidos-primer-nivel"), {});
  const { datos: notasCredito, cargando: cargandoNotas } = useApiDatos<any>(url("notas-credito-primer-nivel"), {});
  const { datos: transaccionesPeriodo, cargando: cargandoTransacciones } = useApiDatos<any>(url("cantidad-ventas-primer-nivel"), {});
  const { datos: margenVentas, cargando: cargandoMargen } = useApiDatos<any>(url("margen-primer-nivel"), {});
  const { datos: ventasPeriodo, cargando: cargandoVentas } = useApiDatos<any>(url("ventas-primer-nivel"), {});

  return (
    <Box sx={{ p: 1}}>
      <HeaderCategoria onFilterChange={setFiltros} />

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
                value: formatUnidades(transaccionesPeriodo.CantidadTransaccionesPeriodo ?? 0),
                subtitle: `Anterior: ${formatUnidades(transaccionesPeriodo.CantidadTransaccionesAnterior ?? 0)}`,
                percentageChange: transaccionesPeriodo.PorcentajeCambio ?? 0,
                cargando: cargandoTransacciones,
                icon: <IconShoppingCart />,
              },
              {
                title: "Notas de Crédito",
                value: notasCredito.CantidadNotasCreditoPeriodo ?? 0,
                subtitle: `Anterior: ${formatUnidades(notasCredito.CantidadNotasCreditoAnterior ?? 0)}`,
                percentageChange: notasCredito.PorcentajeCambioNotasCredito ?? 0,
                cargando: cargandoNotas,
                icon: <IconCreditCard />,
              },
              {
                title: "Ítems Vendidos",
                value: formatUnidades(productosDistintos.ProductosPeriodoActual ?? 0),
                subtitle: `Anterior: ${formatUnidades(productosDistintos.ProductosPeriodoAnterior ?? 0)}`,
                percentageChange: productosDistintos.PorcentajeCambio ?? 0,
                cargando: cargandoProductos,
                icon: <IconStack2 />,
              },
              {
                title: "Unidades Vendidas",
                value: formatUnidades(unidadesVendidas.CantidadVendida ?? 0),
                subtitle: `Anterior: ${formatUnidades(unidadesVendidas.CantidadVendidaAnterior ?? 0)}`,
                percentageChange: unidadesVendidas.PorcentajeCambio ?? 0,
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
          <TopProductosChart 
          filters={filtros} 
          onCategorySelect={handleCategoriaSeleccionada} 
          nombrePrimerNivel={filtros.nombre_primer_nivel} />
        </Grid>
      </Grid>

      <Grid container spacing={2} mt={2}>
        <Grid item xs={12}>
          <TopRentableCategoria filters={filtros} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ResumenCategoriasPage;

