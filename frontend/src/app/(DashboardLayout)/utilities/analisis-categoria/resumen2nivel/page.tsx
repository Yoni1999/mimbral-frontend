"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Paper,
  CircularProgress,
} from "@mui/material";
import HeaderCategoria, { Filters } from "./components/HeaderCategoria";
import MetricCard from "./components/MetricCard";
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
import { fetchWithToken } from "@/utils/fetchWithToken";
import { useSearchParams } from "next/navigation";
const VentasCanalChart = dynamic(() => import("./components/VentasCanalChart"), {
  ssr: false,
});

const ResumenCategoriasPage: React.FC = () => {
  const searchParams = useSearchParams();
  const categoriaFromUrl = searchParams.get("categoria") || "";
  const mapPeriodoToLabel = (codigo: string): string => {
    const reverseMap: Record<string, string> = {
      "1D": "Hoy",
      "7D": "Ultimos 7 días",
      "14D": "Ultimos 14 días",
      "1M": "Ultimo mes",
      "3M": "3 meses",
      "6M": "6 meses",
    };
    return reverseMap[codigo] || codigo;
  };
  const periodoFromUrl = mapPeriodoToLabel(searchParams.get("periodo") || "");
  const temporadaFromUrl = searchParams.get("temporada") || "";
  const fechaInicioFromUrl = searchParams.get("fechaInicio") || "";
  const fechaFinFromUrl = searchParams.get("fechaFin") || "";
  const comparacionFromUrl = searchParams.get("comparacion") || "";

  

  const [filtros, setFiltros] = useState<Filters>({
    temporada: temporadaFromUrl,
    periodo: periodoFromUrl,
    fechaInicio: fechaInicioFromUrl,
    fechaFin: fechaFinFromUrl,
    categoria: categoriaFromUrl,
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
  
    const queryString = params.toString();
    console.log("🔍 Query enviada al backend:", queryString); // ← ESTE ES EL LOG
    console.log("🧪 Filtros actuales:", filtros); // ← OPCIONAL, para ver los filtros completos
  
    return queryString;
  };
  

  const fetchUnidadesVendidas = async () => {
    const query = buildQuery();
    try {
      const response = await fetchWithToken(`${BACKEND_URL}/api/resumen-categoria/unidades-vendidas-categoria?${query}`);
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
      const response = await fetchWithToken(`${BACKEND_URL}/api/resumen-categoria/productos-distintos-categoria?${query}`);
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
      const response = await fetchWithToken(`${BACKEND_URL}/api/resumen-categoria/notas-credito-categoria?${query}`);
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
    const query = buildQuery(); // ⚠️ este query debe incluir categoría
    try {
      const response = await fetchWithToken(`${BACKEND_URL}/api/resumen-categoria/transacciones-categoria?${query}`);
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
  const fetchMargenVentasPeriodo = async () => {
    const query = buildQuery();
    try {
      const response = await fetchWithToken(`${BACKEND_URL}/api/resumen-categoria/margen-categoria?${query}`);
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
  const fetchVentasPeriodo = async () => {
    const query = buildQuery();
    try {
      const response = await fetchWithToken(`${BACKEND_URL}/api/resumen-categoria/ventas-categoria?${query}`);
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
      <HeaderCategoria onFilterChange={setFiltros} initialFilters={filtros} />

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