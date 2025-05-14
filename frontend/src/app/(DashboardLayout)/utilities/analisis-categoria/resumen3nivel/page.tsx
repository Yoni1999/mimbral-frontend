"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  CircularProgress,
} from "@mui/material";
import HeaderCategoria, { Filters } from "./components/HeaderSubcategoria";
import MetricCard from "./components/MetricCard";
import VentasChart from "./components/VentasChart";
import dynamic from "next/dynamic";
const VentasCanalChart = dynamic(() => import("./components/VentasCanalChart"), {
  ssr: false,
});
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
import { fetchWithToken } from "@/utils/fetchWithToken";
import { useSearchParams } from "next/navigation";

const ResumenCategoriasPage: React.FC = () => {
  const [filtros, setFiltros] = useState<Filters>({
    temporada: "",
    periodo: "",
    fechaInicio: "",
    fechaFin: "",
    comparacion: "",
    subcategoria: "",
  });
  const [cargandoFiltros, setCargandoFiltros] = useState(true);

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

  const getPeriodoParam = (periodo: string) => {
    switch (periodo) {
      case "Hoy": return "1d";
      case "Ultimos 7 días": return "7d";
      case "Ultimos 14 días": return "14d";
      case "Ultimo mes": return "1m";
      case "3 meses": return "3m";
      case "6 meses": return "6m";
      default: return "1d";
    }
  };

  const buildQuery = (currentFiltros: Filters) => {
    const params = new URLSearchParams();
    if (currentFiltros.fechaInicio) params.append("fechaInicio", currentFiltros.fechaInicio);
    if (currentFiltros.fechaFin) params.append("fechaFin", currentFiltros.fechaFin);
    if (currentFiltros.periodo) params.append("periodo", getPeriodoParam(currentFiltros.periodo));
    if (currentFiltros.temporada) params.append("temporada", currentFiltros.temporada);
    if (currentFiltros.subcategoria) params.append("subcategoria", currentFiltros.subcategoria);

    console.log("🔍 Query generada:", params.toString());
    console.log("📦 Filtros usados para la query:", currentFiltros);

    return params.toString();
  };

  const fetchUnidadesVendidas = async (currentFiltros: Filters) => {
    const query = buildQuery(currentFiltros);
    try {
      const response = await fetchWithToken(`${BACKEND_URL}/api/tercer-nivel/unidades-vendidas-subcategoria?${query}`);
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

  const fetchProductosDistintos = async (currentFiltros: Filters) => {
    const query = buildQuery(currentFiltros);
    try {
      const response = await fetchWithToken(`${BACKEND_URL}/api/tercer-nivel/items-vendidos-subcategoria?${query}`);
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
  const fetchNotasCredito = async (currentFiltros: Filters) => {
    const query = buildQuery(currentFiltros);
    try {
      const response = await fetchWithToken(`${BACKEND_URL}/api/tercer-nivel/notas-credito-subcategoria?${query}`);
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
  const fetchTransaccionesPeriodo = async (currentFiltros: Filters) => {
    const query = buildQuery(currentFiltros);
    try {
      const response = await fetchWithToken(`${BACKEND_URL}/api/tercer-nivel/cantidad-ventas-subcategoria?${query}`);
      if (response) {
        const data = await response.json();
        console.log("🟢 Datos de transacciones:", data);
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
  const fetchMargenVentasPeriodo = async (currentFiltros: Filters) => {
    const query = buildQuery(currentFiltros);
    try {
      const response = await fetchWithToken(`${BACKEND_URL}/api/tercer-nivel/margen-subcategoria?${query}`);
      if (response) {
        const data = await response.json();
        console.log("🟢 Margen ventas:", data);
        setMargenVentas({
          MargenPorcentajePeriodo: data.MargenPorcentajePeriodo ?? 0,
          VariacionMargen: data.VariacionMargen ?? 0,
        });
      }
    } catch (err) {
      console.error("Error al obtener margen de ventas:", err);
    }
  };
  const fetchVentasPeriodo = async (currentFiltros: Filters) => {
    const query = buildQuery(currentFiltros);
    try {
      const response = await fetchWithToken(`${BACKEND_URL}/api/tercer-nivel/ventas-subcategoria?${query}`);
      if (response) {
        const data = await response.json();
        console.log("🟢 Datos de ventas:", data);
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
  const searchParams = useSearchParams();

  const mapPeriodoToLabel = (code: string): string => {
    const map: Record<string, string> = {
      "1d": "Hoy",
      "7d": "Ultimos 7 días",
      "14d": "Ultimos 14 días",
      "1m": "Ultimo mes",
      "3m": "3 meses",
      "6m": "6 meses",
    };
    return map[code] || "";
  };
  

  useEffect(() => {
    setCargandoFiltros(true);
    const filtrosIniciales: Filters = {
      subcategoria: searchParams.get("subcategoria") || "",
      periodo: mapPeriodoToLabel(searchParams.get("periodo") || ""),
      temporada: searchParams.get("temporada") || "",
      fechaInicio: searchParams.get("fechaInicio") || "",
      fechaFin: searchParams.get("fechaFin") || "",
      comparacion: "",
    };

    setFiltros(filtrosIniciales);
    setCargandoFiltros(false);

    fetchUnidadesVendidas(filtrosIniciales);
    fetchProductosDistintos(filtrosIniciales);
    fetchNotasCredito(filtrosIniciales);
    fetchTransaccionesPeriodo(filtrosIniciales);
    fetchMargenVentasPeriodo(filtrosIniciales);
    fetchVentasPeriodo(filtrosIniciales);

  }, [searchParams, setFiltros, setCargandoFiltros]);

  useEffect(() => {
    if (!cargandoFiltros) {
      // Este useEffect se ejecuta cuando los filtros cambian desde el Header
      fetchUnidadesVendidas(filtros);
      fetchProductosDistintos(filtros);
      fetchNotasCredito(filtros);
      fetchTransaccionesPeriodo(filtros);
      fetchMargenVentasPeriodo(filtros);
      fetchVentasPeriodo(filtros);
    }
  }, [filtros, cargandoFiltros]);

  if (cargandoFiltros) {
    return (
      <Box sx={{ p: 5, textAlign: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
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