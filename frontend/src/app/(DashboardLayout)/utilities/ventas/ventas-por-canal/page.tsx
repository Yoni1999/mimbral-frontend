"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import Image from 'next/image';
import { Grid, Paper, CircularProgress, Box, Typography } from "@mui/material";
import MetricCard from "./components/MetricCard";
import HeaderFilters, { Filters } from "./components/HeaderFilters";
import TopProductosChart from "./components/TopProductosChart";
import VentasPorCategoriaChart from "./components/VentasPorCategoriaChart";
import dynamic from "next/dynamic";
import TransaccionesChart from "./components/TransaccionesChart";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";

const VentasCanalChart = dynamic(() => import("./components/VentasCanalChart"), {
  ssr: false,
});

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(value);

const VentasPorCanal = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const canalParam = searchParams.get("canal") || "";

  // ✅ Redirigir si no hay token al entrar a la página
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/authentication/login");
    }
  }, [router]);

  const [filters, setFilters] = useState<Filters>(() => {
    if (typeof window !== "undefined") {
      const storedFilters = localStorage.getItem("filtrosVentasCanal");
      if (storedFilters) {
        return JSON.parse(storedFilters);
      }
    }
    return {
      canal: canalParam,
      vendedorEmpresa: "",
      periodo: "1D",
      fechaInicio: "",
      fechaFin: "",
    };
  });

  const [selectedVendedor, setSelectedVendedor] = useState<number | null>(null);
  const [data, setData] = useState({
    ventasHoy: { TotalVentasPeriodo: 0, TotalVentasAnterior: 0, PorcentajeCambio: 0 },
    transaccionesPeriodo: { CantidadTransaccionesPeriodo: 0, CantidadTransaccionesAnterior: 0, PorcentajeCambio: 0 },
    unidadesVendidas: { CantidadVendida: 0, CantidadVendidaAnterior: 0, PorcentajeCambio: 0 },
    productosDistintos: { ProductosPeriodoActual: 0, ProductosPeriodoAnterior: 0, PorcentajeCambio: 0 },
    margenBruto: { TotalVentasPeriodo: 0, MargenBrutoPeriodo: 0, MargenBrutoAnterior: 0, PorcentajeCambio: 0 },
    topProductos: [] as any[],
    ventasCategoria: [] as any[],
  });

  const [loading, setLoading] = useState(true);
  const isMounted = useRef(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const baseUrl = `${BACKEND_URL}/api/`;
      const query = new URLSearchParams(
        Object.fromEntries(
          Object.entries({ ...filters, vendedorEmpresa: selectedVendedor || filters.vendedorEmpresa })
            .filter(([_, value]) => value !== undefined && value !== null)
            .map(([key, value]) => [key, String(value)])
        )
      ).toString();

      const endpoints = [
        "ventas-periodo",
        "transacciones-periodo",
        "unidades-vendidas-periodo",
        "productos-distintos-periodo",
        "margen/bruto-periodo",
        "top-productos",
        "categorias/ventas-categoria",
      ];

      const responses = await Promise.all(
        endpoints.map((endpoint) =>
          fetchWithToken(`${baseUrl}${endpoint}?${query}`).then((res) => res?.json())
        )
      );

      setData({
        ventasHoy: responses[0],
        transaccionesPeriodo: responses[1],
        unidadesVendidas: responses[2],
        productosDistintos: responses[3],
        margenBruto: responses[4],
        topProductos: responses[5],
        ventasCategoria: responses[6],
      });
    } catch (error) {
      console.error("❌ Error al obtener datos:", error);
    } finally {
      setLoading(false);
    }
  }, [filters, selectedVendedor]);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
    setSelectedVendedor(null);
    localStorage.setItem("filtrosVentasCanal", JSON.stringify(newFilters));
  };
  

 if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          width: "100vw",
          position: "fixed",
          top: 0,
          left: 0,
          backgroundColor: "rgba(255, 255, 255, 0.9)",
        }}
      >
        {/* 🔹 Logo girando */}
        <Box
          sx={{
            animation: "spin 1.5s linear infinite",
            borderRadius: "50%", 
            overflow: "hidden",
            width: "60px", 
            height: "60px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
          }}
        >
          <Image src="/images/logos/logoitem.jpg" alt="Logo" width={60} height={60} priority />
        </Box>

        {/* 🔹 Texto de carga */}
        <Typography variant="h6" sx={{ mt: 2, color: "#000", fontWeight: "bold" }}>
          Cargando datos...
        </Typography>

        <style jsx global>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </Box>
    );
  }
  return (
    <PageContainer title="Ventas por Canal" description="Resumen de ventas filtradas por canal, período y rango de fechas">
      <HeaderFilters filters={filters} onFilterChange={handleFilterChange}/>


      <Grid container spacing={2} alignItems="stretch">
        <Grid item xs={12} md={6}>
        <VentasCanalChart
          canal={filters.canal}
          periodo={filters.periodo}
          fechaInicio={filters.fechaInicio}
          fechaFin={filters.fechaFin}
          onVendedorSeleccionado={(vendedor) => setSelectedVendedor(vendedor)}
        />

        </Grid>

        <Grid item xs={12} md={6}>
          <Grid container spacing={1}>
            {[{
              title: filters.fechaInicio && filters.fechaFin ? "Total Ventas (Por Rango)" : `Total Ventas (${filters.periodo})`,
              value: formatCurrency(data.ventasHoy.TotalVentasPeriodo),
              subtitle: `Anterior: ${formatCurrency(data.ventasHoy.TotalVentasAnterior)}`,
              percentageChange: data.ventasHoy.PorcentajeCambio,
            },
            {
              title: "Margen Bruto",
              value: formatCurrency(data.margenBruto.MargenBrutoPeriodo),
              subtitle: `Anterior: ${formatCurrency(data.margenBruto.MargenBrutoAnterior)}`,
              percentageChange: data.margenBruto.PorcentajeCambio,
            }].map((card, index) => (
              <Grid item xs={12} sm={6} key={index}>
                {loading ? (
                  <Paper sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 120 }}>
                    <CircularProgress />
                  </Paper>
                ) : (
                  <MetricCard title={card.title} value={card.value} subtitle={card.subtitle} percentageChange={card.percentageChange} />
                )}
              </Grid>
            ))}

            {/* 🔹 Segunda fila de métricas (2 tarjetas) */}
            {[
              {
                title: `Unidades Vendidas (${filters.periodo})`,
                value: data.unidadesVendidas.CantidadVendida,
                subtitle: `Anterior: ${data.unidadesVendidas.CantidadVendidaAnterior}`,
                percentageChange: data.unidadesVendidas.PorcentajeCambio,
              },
              {
                title: `Total Ítems Vendidos (${filters.periodo})`,
                value: data.productosDistintos.ProductosPeriodoActual,
                subtitle: `Anterior: ${data.productosDistintos.ProductosPeriodoAnterior}`,
                percentageChange: data.productosDistintos.PorcentajeCambio,
              },
            ].map((card, index) => (
              <Grid item xs={12} sm={6} md={6} key={index}>
                {loading ? (
                  <Paper sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 120 }}>
                    <CircularProgress />
                  </Paper>
                ) : (
                  <MetricCard title={card.title} value={card.value} subtitle={card.subtitle} percentageChange={card.percentageChange} />
                )}
              </Grid>
            ))}
            {/* TERCERA fila de métricas (1 tarjetas) */}
            {[
              {
                title: `Transacciones (${filters.periodo})`,
                value: data.transaccionesPeriodo.CantidadTransaccionesPeriodo,
                subtitle: `Anterior: ${data.transaccionesPeriodo.CantidadTransaccionesAnterior}`,
                percentageChange: data.transaccionesPeriodo.PorcentajeCambio,
              },
              {
                title: `EXTRA (${filters.periodo})`,
                value: data.transaccionesPeriodo.CantidadTransaccionesPeriodo,
                subtitle: `Anterior: ${data.transaccionesPeriodo.CantidadTransaccionesAnterior}`,
                percentageChange: data.transaccionesPeriodo.PorcentajeCambio,
              },
            ].map((card, index) => (
              <Grid item xs={12} sm={6} md={6} key={index}>
                {loading ? (
                  <Paper sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 120 }}>
                    <CircularProgress />
                  </Paper>
                ) : (
                  <MetricCard title={card.title} value={card.value} subtitle={card.subtitle} percentageChange={card.percentageChange} />
                )}
              </Grid>
            ))}
           {/* 🔹 Cuarta fila: Tarjeta con gráfico de transacciones */}
           <Grid item xs={12} md={12}>
              <TransaccionesChart />
            </Grid>

          </Grid>
        </Grid>
      </Grid>
      {/* 🔹 Segunda fila: Gráficos */}
      <Grid container spacing={2} mt={2}>
        <Grid item xs={12} md={6}>
          <TopProductosChart data={data.topProductos} />
        </Grid>

        <Grid item xs={12} md={6}>
          <VentasPorCategoriaChart data={data.ventasCategoria} />
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default VentasPorCanal;
