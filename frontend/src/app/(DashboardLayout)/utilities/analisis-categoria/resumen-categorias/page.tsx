"use client";

import React, { useEffect, useState } from "react";
import { Box, Grid } from "@mui/material";
import HeaderCategoria, { Filters } from "./components/HeaderCategoria";
import MetricCard from "./components/MetricCard";
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
import { fetchWithToken } from "@/utils/fetchWithToken";
import { useRouter } from "next/navigation"; // ✅ Mantener router para abrir nuevas páginas
import { BACKEND_URL } from "@/config";
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
    periodo: "",
    fechaInicio: "",
    fechaFin: "",
    comparacion: "",
    primer_nivel: "",
    nombre_primer_nivel: "", 
  });
  

  const [unidadesVendidas, setUnidadesVendidas] = useState({
    CantidadVendida: 0,
    CantidadVendidaAnterior: 0,
    PorcentajeCambio: 0,
  });

  const [productosDistintos, setProductosDistintos] = useState({
    ProductosPeriodoActual: 0,
    ProductosPeriodoAnterior: 0,
    PorcentajeCambio: 0,
  });

  const [notasCredito, setNotasCredito] = useState({
    CantidadNotasCreditoPeriodo: 0,
    CantidadNotasCreditoAnterior: 0,
    PorcentajeCambioNotasCredito: 0,
  });

  const [transaccionesPeriodo, setTransaccionesPeriodo] = useState({
    CantidadTransaccionesPeriodo: 0,
    CantidadTransaccionesAnterior: 0,
    PorcentajeCambio: 0,
  });

  const [margenVentas, setMargenVentas] = useState({
    MargenPorcentajePeriodo: 0,
    VariacionMargen: 0,
  });

  const [ventasPeriodo, setVentasPeriodo] = useState({
    TotalVentasPeriodo: 0,
    TotalVentasAnterior: 0,
    PorcentajeCambio: 0,
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
    if (filtros.primer_nivel) params.append("primerNivel", filtros.primer_nivel);
    return params.toString();
  };

  const fetchUnidadesVendidas = async () => {
    const query = buildQuery();
    try {
      const response = await fetchWithToken(`${BACKEND_URL}/api/primer-nivel/unidades-vendidas-primer-nivel?${query}`);
      if (response) {
        const data = await response.json();
        setUnidadesVendidas({
          CantidadVendida: data.CantidadVendida || 0,
          CantidadVendidaAnterior: data.CantidadVendidaAnterior || 0,
          PorcentajeCambio: data.PorcentajeCambio || 0,
        });
      }
    } catch (err) {
      console.error("Error al obtener unidades vendidas:", err);
    }
  };

  const fetchProductosDistintos = async () => {
    const query = buildQuery();
    try {
      const response = await fetchWithToken(`${BACKEND_URL}/api/primer-nivel/items-vendidos-primer-nivel?${query}`);
      if (response) {
        const data = await response.json();
        setProductosDistintos({
          ProductosPeriodoActual: data.ProductosPeriodoActual || 0,
          ProductosPeriodoAnterior: data.ProductosPeriodoAnterior || 0,
          PorcentajeCambio: data.PorcentajeCambio || 0,
        });
      }
    } catch (err) {
      console.error("Error al obtener productos distintos:", err);
    }
  };

  const fetchNotasCredito = async () => {
    const query = buildQuery();
    try {
      const response = await fetchWithToken(`${BACKEND_URL}/api/primer-nivel/notas-credito-primer-nivel?${query}`);
      if (response) {
        const data = await response.json();
        setNotasCredito({
          CantidadNotasCreditoPeriodo: data.CantidadNotasCreditoPeriodo || 0,
          CantidadNotasCreditoAnterior: data.CantidadNotasCreditoAnterior || 0,
          PorcentajeCambioNotasCredito: data.PorcentajeCambioNotasCredito || 0,
        });
      }
    } catch (err) {
      console.error("Error al obtener notas de crédito:", err);
    }
  };

  const fetchTransaccionesPeriodo = async () => {
    const query = buildQuery();
    try {
      const response = await fetchWithToken(`${BACKEND_URL}/api/primer-nivel/cantidad-ventas-primer-nivel?${query}`);
      if (response) {
        const data = await response.json();
        setTransaccionesPeriodo({
          CantidadTransaccionesPeriodo: data.CantidadTransaccionesPeriodo || 0,
          CantidadTransaccionesAnterior: data.CantidadTransaccionesAnterior || 0,
          PorcentajeCambio: data.PorcentajeCambio || 0,
        });
      }
    } catch (err) {
      console.error("Error al obtener transacciones por período:", err);
    }
  };

  const fetchMargenVentasPeriodo = async () => {
    const query = buildQuery();
    try {
      const response = await fetchWithToken(`${BACKEND_URL}/api/primer-nivel/margen-primer-nivel?${query}`);
      if (response) {
        const data = await response.json();
        setMargenVentas({
          MargenPorcentajePeriodo: data.MargenPorcentajePeriodo ?? 0,
          VariacionMargen: data.VariacionMargen ?? 0,
        });
      }
    } catch (err) {
      console.error("Error al obtener margen de ventas:", err);
    }
  };

  const fetchVentasPeriodo = async () => {
    const query = buildQuery();
    try {
      const response = await fetchWithToken(`${BACKEND_URL}/api/primer-nivel/ventas-primer-nivel?${query}`);
      if (response) {
        const data = await response.json();
        setVentasPeriodo({
          TotalVentasPeriodo: data.TotalVentasPeriodo ?? 0,
          TotalVentasAnterior: data.TotalVentasAnterior ?? 0,
          PorcentajeCambio: data.PorcentajeCambio ?? 0,
        });
      }
    } catch (err) {
      console.error("Error al obtener ventas por período:", err);
    }
  };

  useEffect(() => {
    fetchUnidadesVendidas();
    fetchProductosDistintos();
    fetchNotasCredito();
    fetchTransaccionesPeriodo();
    fetchMargenVentasPeriodo();
    fetchVentasPeriodo();
  }, [filtros]);

  return (
    <Box sx={{ p: 3 }}>
      <HeaderCategoria onFilterChange={setFiltros} />

      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <Grid container spacing={2}>
            {[
              {
                title: "Ventas",
                value: `$${(ventasPeriodo.TotalVentasPeriodo / 1000000).toFixed(2)}M`,
                subtitle: `Anterior: $${(ventasPeriodo.TotalVentasAnterior / 1000000).toFixed(2)}M`,
                percentageChange: ventasPeriodo.PorcentajeCambio,
                icon: <IconCurrencyDollar />,
              },
              {
                title: "Margen Ventas",
                value: `${margenVentas.MargenPorcentajePeriodo}%`,
                subtitle: `Variación: ${margenVentas.VariacionMargen}%`,
                percentageChange: margenVentas.VariacionMargen,
                icon: <IconTrendingUp />,
              },
              {
                title: "Cantidad de Ventas",
                value: transaccionesPeriodo.CantidadTransaccionesPeriodo,
                subtitle: `Anterior: ${transaccionesPeriodo.CantidadTransaccionesAnterior}`,
                percentageChange: transaccionesPeriodo.PorcentajeCambio,
                icon: <IconShoppingCart />,
              },
              {
                title: "Notas de Crédito",
                value: notasCredito.CantidadNotasCreditoPeriodo,
                subtitle: `Anterior: ${notasCredito.CantidadNotasCreditoAnterior}`,
                percentageChange: notasCredito.PorcentajeCambioNotasCredito,
                icon: <IconCreditCard />,
              },
              {
                title: "Ítems Vendidos",
                value: productosDistintos.ProductosPeriodoActual,
                subtitle: `Anterior: ${productosDistintos.ProductosPeriodoAnterior}`,
                percentageChange: productosDistintos.PorcentajeCambio,
                icon: <IconStack2 />,
              },
              {
                title: "Unidades Vendidas",
                value: unidadesVendidas.CantidadVendida,
                subtitle: `Anterior: ${unidadesVendidas.CantidadVendidaAnterior}`,
                percentageChange: unidadesVendidas.PorcentajeCambio,
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
