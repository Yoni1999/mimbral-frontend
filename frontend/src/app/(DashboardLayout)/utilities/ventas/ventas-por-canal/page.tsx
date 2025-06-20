"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import SeccionTitulo from "../resumen-ventas/components/SeccionTitulo";
import { Grid, Paper, CircularProgress, Box, Typography,} from "@mui/material";
import MetricCard from "./components/MetricCard";
import FechaRotacion from "./components/FechaRotacion";
import NivelNavigation from "../components/NivelNavigation";
import HeaderFilters, { Filters } from "./components/HeaderFilters";
import ClientesFrecuentesTable from "./components/ClientesFrecuentesTable";
import dynamic from "next/dynamic";
import { formatUnidades, formatVentas } from "@/utils/format";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";
import {
  IconCurrencyDollar,
  IconTrendingUp,
  IconStack2,
  IconBox,
  IconShoppingCart
} from "@tabler/icons-react";


const VentasCanalChart = dynamic(() => import("./components/VentasCanalChart"), {
  ssr: false,
});
const TopProductosChart = dynamic(() => import("./components/TopProductosChart"), {
  ssr: false,
});
const VentasPorCategoriaChart = dynamic(() => import("./components/VentasPorCategoriaChart"), {
  ssr: false,
});


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

  const [filters, setFilters] = useState<Filters>({
  canal: canalParam,
  periodo: "1D",
  fechaInicio: "",
  fechaFin: "",
});

useEffect(() => {
  const stored = localStorage.getItem("filtrosVentasCanal");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      setFilters((prev) => ({
        ...prev,
        ...parsed,
        canal: canalParam || parsed.canal || "",
      }));
    } catch (e) {
      console.error("❌ Error al parsear filtros almacenados:", e);
    }
  }
}, [canalParam]);

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
          Object.entries({ ...filters, vendedorEmpresa: selectedVendedor })
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
  const periodoLabels: { [key: string]: string } = {
  "1D": "Hoy",
  "7D": "Últimos 7 días",
  "14D": "Últimos 14 días",
  "1M": "Último mes",
  "3M": "Últimos 3 meses",
  "6M": "Últimos 6 meses",
};

  return (
    <>
      <NivelNavigation />
      <PageContainer title="Ventas por Canal" description="Resumen de ventas filtradas por canal, período y rango de fechas">
        <Box sx={{ p: 0 }}>
          {/* Texto alineado a la derecha con el resumen del filtro */}
          <Box sx={{ mb: 1, display: "flex", justifyContent: "flex-end", px: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {filters.periodo && periodoLabels[filters.periodo]
                ? `Filtrando por périodo de: ${periodoLabels[filters.periodo]}`
                : filters.fechaInicio && filters.fechaFin
                ? `Filtrando por rango: ${filters.fechaInicio} al ${filters.fechaFin}`
                : "Sin período seleccionado"}
            </Typography>
          </Box>
          <HeaderFilters filters={filters} onFilterChange={handleFilterChange} />

          {/* --- Sección de Métricas Principales --- */}
          <Grid container spacing={2} mt={2}>
            <Grid item xs={12}>
              <SeccionTitulo
                title="Métricas Clave del Canal"
                infoRight="Información detallada del desempeño de ventas del canal seleccionado."
              />
            </Grid>
            <Grid item xs={12}> {/* Este Grid item envuelve todas las MetricCards */}
              <Grid container spacing={2}>
                {[
                  {
                    title: filters.fechaInicio && filters.fechaFin ? "Total Ventas (Por Rango)" : `Total Ventas`,
                    value: formatVentas(data.ventasHoy.TotalVentasPeriodo),
                    subtitle: `Anterior: ${formatVentas(data.ventasHoy.TotalVentasAnterior)}`,
                    percentageChange: data.ventasHoy.PorcentajeCambio,
                    icon: <IconCurrencyDollar />,
                  },
                  {
                    title: "Margen Bruto",
                    value: formatVentas(data.margenBruto.MargenBrutoPeriodo),
                    subtitle: `Anterior: ${formatVentas(data.margenBruto.MargenBrutoAnterior)}`,
                    percentageChange: data.margenBruto.PorcentajeCambio,
                    icon: <IconTrendingUp />,
                  },
                  {
                    title: `Unidades Vendidas `,
                    value: formatUnidades(data.unidadesVendidas.CantidadVendida),
                    subtitle: `Anterior: ${formatUnidades(data.unidadesVendidas.CantidadVendidaAnterior)}`,
                    percentageChange: data.unidadesVendidas.PorcentajeCambio,
                    icon: <IconStack2 />,
                  },
                  {
                    title: `Total Ítems Vendidos `,
                    value: formatUnidades(data.productosDistintos.ProductosPeriodoActual),
                    subtitle: `Anterior: ${formatUnidades(data.productosDistintos.ProductosPeriodoAnterior)}`,
                    percentageChange: data.productosDistintos.PorcentajeCambio,
                    icon: <IconBox />,
                  },
                  {
                    title: `Transacciones `,
                    value: formatUnidades(data.transaccionesPeriodo.CantidadTransaccionesPeriodo),
                    subtitle: `Anterior: ${formatUnidades(data.transaccionesPeriodo.CantidadTransaccionesAnterior)}`,
                    percentageChange: data.transaccionesPeriodo.PorcentajeCambio,
                    icon: <IconShoppingCart />,
                  },
                  // Si tienes una sexta métrica, agrégala aquí
                  {
                     title: `Tickets Promedio `,
                     value: formatUnidades(data.transaccionesPeriodo.CantidadTransaccionesPeriodo), // Usando los mismos datos como ejemplo
                     subtitle: `Anterior: ${formatUnidades(data.transaccionesPeriodo.CantidadTransaccionesAnterior)}`,
                     percentageChange: data.transaccionesPeriodo.PorcentajeCambio,
                     icon: <IconShoppingCart />, // Puedes cambiar el icono
                   },
                ].map((card, index) => (
                  <Grid item xs={12} sm={6} md={4} lg={2} key={index}> {/* md={4} para 3 por fila, lg={2} para 6 por fila */}
                    {loading ? (
                      <Paper
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          height: 120, // Altura consistente
                          borderRadius: 2,
                          boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
                          backgroundColor: "#f5f5f5",
                        }}
                      >
                        <CircularProgress />
                      </Paper>
                    ) : (
                      <MetricCard {...card} />
                    )}
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>

          {/* --- Sección de Gráficos de Análisis por Canal --- */}
          <Grid container spacing={2} mt={2}>
            <Grid item xs={12}>
              <SeccionTitulo
                title="Análisis Detallado por Canal"
                infoRight="Visualización de ventas por canal, productos y categorías."
              />
            </Grid>
            <Grid item xs={12} md={6}> {/* Un gráfico grande */}
              <VentasCanalChart
                canal={filters.canal}
                periodo={filters.periodo}
                fechaInicio={filters.fechaInicio}
                fechaFin={filters.fechaFin}
                onVendedorSeleccionado={(vendedor) => setSelectedVendedor(vendedor)}
                // Puedes pasar 'data.transaccionesPeriodo' si TransaccionesChart espera esos datos
              />
            </Grid>
            <Grid item xs={12} md={6}> {/* Un gráfico grande */}
              <ClientesFrecuentesTable/>
            </Grid>
          {/* --- Segunda Fila de Gráficos --- */}
          <Grid container spacing={2} mt={2}>
            <Grid item xs={12} md={4}>
              <TopProductosChart data={data.topProductos} /> {/* Pasa los datos de topProductos */}
            </Grid>
            <Grid item xs={12} md={4}>
              <FechaRotacion /> 
            </Grid>
            <Grid item xs={12} md={4}>
              <VentasPorCategoriaChart data={data.ventasCategoria} /> {/* Pasa los datos de ventasCategoria */}
            </Grid>
          </Grid>
        </Grid>
        </Box>
      </PageContainer>
    </>
  );
};

export default VentasPorCanal;
