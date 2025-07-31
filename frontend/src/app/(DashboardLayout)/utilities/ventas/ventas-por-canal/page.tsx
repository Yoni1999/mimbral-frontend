"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import SeccionTitulo from "../resumen-ventas/components/SeccionTitulo";
import { Grid, Paper, CircularProgress, Box, Typography, FormControlLabel, Checkbox, } from "@mui/material";
import MetricCard from "./components/Cards";
import FechaRotacion from "./components/MonthlySalesRotation";
import NivelNavigation from "../components/NivelNavigation";
import HeaderFilters, { Filters } from "./components/Header";
import ClientesFrecuentesTable from "./components/FrequentCustomers";
import dynamic from "next/dynamic";
import { formatUnidades, formatVentas } from "@/utils/format";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";
import { IconCurrencyDollar, IconTrendingUp, IconStack2, IconBox, IconShoppingCart, } from "@tabler/icons-react";
import ProductosVendidos from "./components/SoldProducts";

const VentasCanalChart = dynamic(() => import("./components/Sellers"), {
  ssr: false,
});
const TopProductosChart = dynamic(
  () => import("./components/Top10SoldProducts"),
  {
    ssr: false,
  }
);
const VentasPorCategoriaChart = dynamic(
  () => import("./components/SalesByCategory"),
  {
    ssr: false,
  }
);

const VentasPorCanal = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [filters, setFilters] = useState<Filters>(() => {
    const canalParam = searchParams.get("canal") || "";
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("filtrosVentasCanal");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Prioriza el canal de la URL si existe, de lo contrario usa el de localStorage, luego el por defecto.
          return {
            ...parsed,
            canal: canalParam || parsed.canal || "",
            periodo: parsed.periodo || "1D", // Asegura que siempre haya un periodo por defecto si no está en storage
            fechaInicio: parsed.fechaInicio || "",
            fechaFin: parsed.fechaFin || "",
          };
        } catch (e) {
          console.error("❌ Error al parsear filtros almacenados:", e);
        }
      }
    }
    // Si no hay filtros guardados o hubo un error, retorna el estado inicial por defecto
    return {
      canal: canalParam, // Canal de la URL o vacío
      periodo: "1D", // Por defecto si no hay nada
      fechaInicio: "",
      fechaFin: "",
    };
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/authentication/login");
    }
  }, [router]);

  const [selectedVendedor, setSelectedVendedor] = useState<number | null>(
    null
  );
  // Estado para los datos que se muestran en las MetricCard y otros gráficos
  const [data, setData] = useState({
    ventasHoy: { TotalVentasPeriodo: 0, TotalVentasAnterior: 0, PorcentajeCambio: 0 },
    transaccionesPeriodo: { CantidadTransaccionesPeriodo: 0, CantidadTransaccionesAnterior: 0, PorcentajeCambio: 0 },
    unidadesVendidas: { CantidadVendida: 0, CantidadVendidaAnterior: 0, PorcentajeCambio: 0 },
    productosDistintos: { ProductosPeriodoActual: 0, ProductosPeriodoAnterior: 0, PorcentajeCambio: 0 },
    margenBruto: { TotalVentasPeriodo: 0, MargenBrutoPeriodo: 0, MargenBrutoAnterior: 0, PorcentajeCambio: 0 },
    topProductos: [] as any[],
    ventasCategoria: [] as any[],
  });

  const [loading, setLoading] = useState(true); // Se inicializa en true para la primera carga

  // fetchData ahora solo tiene 'filters' y 'selectedVendedor' como dependencias.
  // La lógica de 'loading' se maneja internamente.
  const fetchData = useCallback(async () => {
    setLoading(true); // Siempre ponlo en true al iniciar una nueva carga
    try {
      const baseUrl = `${BACKEND_URL}/api/`;
      const query = new URLSearchParams(
        Object.fromEntries(
          Object.entries({ ...filters, vendedorEmpresa: selectedVendedor })
            .filter(([_, value]) => value !== undefined && value !== null && value !== "") // Filtra valores nulos, indefinidos y cadenas vacías
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

      // Asegúrate de que los datos tengan la estructura esperada, incluso si la respuesta es nula
      setData({
        ventasHoy: responses[0] || { TotalVentasPeriodo: 0, TotalVentasAnterior: 0, PorcentajeCambio: 0 },
        transaccionesPeriodo: responses[1] || { CantidadTransaccionesPeriodo: 0, CantidadTransaccionesAnterior: 0, PorcentajeCambio: 0 },
        unidadesVendidas: responses[2] || { CantidadVendida: 0, CantidadVendidaAnterior: 0, PorcentajeCambio: 0 },
        productosDistintos: responses[3] || { ProductosPeriodoActual: 0, ProductosPeriodoAnterior: 0, PorcentajeCambio: 0 },
        margenBruto: responses[4] || { TotalVentasPeriodo: 0, MargenBrutoPeriodo: 0, MargenBrutoAnterior: 0, PorcentajeCambio: 0 },
        topProductos: responses[5] || [],
        ventasCategoria: responses[6] || [],
      });
    } catch (error) {
      console.error("❌ Error al obtener datos:", error);
      // Opcional: podrías restablecer el estado de 'data' a sus valores iniciales si falla la carga
      setData({
        ventasHoy: { TotalVentasPeriodo: 0, TotalVentasAnterior: 0, PorcentajeCambio: 0 },
        transaccionesPeriodo: { CantidadTransaccionesPeriodo: 0, CantidadTransaccionesAnterior: 0, PorcentajeCambio: 0 },
        unidadesVendidas: { CantidadVendida: 0, CantidadVendidaAnterior: 0, PorcentajeCambio: 0 },
        productosDistintos: { ProductosPeriodoActual: 0, ProductosPeriodoAnterior: 0, PorcentajeCambio: 0 },
        margenBruto: { TotalVentasPeriodo: 0, MargenBrutoPeriodo: 0, MargenBrutoAnterior: 0, PorcentajeCambio: 0 },
        topProductos: [],
        ventasCategoria: [],
      });
    } finally {
      setLoading(false);
    }
  }, [filters, selectedVendedor]); 

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
    setSelectedVendedor(null); // Reinicia el vendedor al cambiar los filtros principales
    // Guarda siempre los filtros actualizados en localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("filtrosVentasCanal", JSON.stringify(newFilters));
    }
  };

  const periodoLabels: { [key: string]: string } = {
    "1D": "Hoy",
    "7D": "Últimos 7 días",
    "14D": "Últimos 14 días",
    "1M": "Último mes",
    "3M": "Últimos 3 meses",
    "6M": "Últimos 6 meses",
  };
  const [mostrarProductos, setMostrarProductos] = useState(false);

  return (
    <>
      <NivelNavigation />
      <PageContainer
        title="Ventas por Canal"
        description="Resumen de ventas filtradas por canal, período y rango de fechas"
      >
        <Box sx={{ p: 0 }}>
          <Box sx={{ mb: 1, display: "flex", justifyContent: "flex-end", px: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {filters.periodo && periodoLabels[filters.periodo]
                ? `Filtrando por período de: ${periodoLabels[filters.periodo]}`
                : filters.fechaInicio && filters.fechaFin
                ? `Filtrando por rango: ${filters.fechaInicio} al ${filters.fechaFin}`
                : "Sin período seleccionado"}
            </Typography>
          </Box>

          <HeaderFilters filters={filters} onFilterChange={handleFilterChange} />

          <Box sx={{ mt: 2, px: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={mostrarProductos}
                  onChange={(e) => setMostrarProductos(e.target.checked)}
                  name="verProductos"
                  color="primary"
                />
              }
              label={
                <Typography variant="body1" sx={{ cursor: "pointer" }}>
                  Ver ventas productos detallados
                </Typography>
              }
            />
          </Box>

          {mostrarProductos ? (
            <Box mt={4}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  {/* Asegúrate de que ProductosVendidos también maneje su estado de carga internamente
                      o que 'loading' se le pase si es necesario para mostrar un spinner. */}
                  <ProductosVendidos
                    filters={{
                      ...filters,
                      vendedor: selectedVendedor,
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          ) : (
            <>
              <Grid container spacing={2} mt={2}>
                <Grid item xs={12}>
                  <SeccionTitulo
                    title="Métricas Clave del Canal"
                    infoRight="Información detallada del desempeño de ventas del canal seleccionado."
                  />
                </Grid>
                <Grid item xs={12}>
                  <Grid container spacing={2}>
                    {[
                      {
                        title: "Ventas",
                        value: formatVentas(data.ventasHoy.TotalVentasPeriodo),
                        subtitle: `Anterior: ${formatVentas(
                          data.ventasHoy.TotalVentasAnterior
                        )}`,
                        percentageChange: data.ventasHoy.PorcentajeCambio,
                        icon: <IconCurrencyDollar />,
                      },
                      {
                        title: "Margen Bruto",
                        value: formatVentas(data.margenBruto.MargenBrutoPeriodo),
                        subtitle: `Anterior: ${formatVentas(
                          data.margenBruto.MargenBrutoAnterior
                        )}`,
                        percentageChange: data.margenBruto.PorcentajeCambio,
                        icon: <IconTrendingUp />,
                      },
                      {
                        title: `Unidades Vendidas `,
                        value: formatUnidades(
                          data.unidadesVendidas.CantidadVendida
                        ),
                        subtitle: `Anterior: ${formatUnidades(
                          data.unidadesVendidas.CantidadVendidaAnterior
                        )}`,
                        percentageChange:
                          data.unidadesVendidas.PorcentajeCambio,
                        icon: <IconStack2 />,
                      },
                      {
                        title: `Ítems Vendidos `,
                        value: formatUnidades(
                          data.productosDistintos.ProductosPeriodoActual
                        ),
                        subtitle: `Anterior: ${formatUnidades(
                          data.productosDistintos.ProductosPeriodoAnterior
                        )}`,
                        percentageChange:
                          data.productosDistintos.PorcentajeCambio,
                        icon: <IconBox />,
                      },
                      {
                        title: `Cantidad de Ventas`,
                        value: formatUnidades(
                          data.transaccionesPeriodo.CantidadTransaccionesPeriodo
                        ),
                        subtitle: `Anterior: ${formatUnidades(
                          data.transaccionesPeriodo.CantidadTransaccionesAnterior
                        )}`,
                        percentageChange:
                          data.transaccionesPeriodo.PorcentajeCambio,
                        icon: <IconShoppingCart />,
                      },
                      {
                        title: `Tickets Promedio `,
                        value: formatVentas(
                          (data.ventasHoy.TotalVentasPeriodo /
                            data.transaccionesPeriodo.CantidadTransaccionesPeriodo) ||
                            0
                        ), // Calcula el ticket promedio
                        subtitle: `Anterior: ${formatVentas(
                          (data.ventasHoy.TotalVentasAnterior /
                            data.transaccionesPeriodo.CantidadTransaccionesAnterior) ||
                            0
                        )}`,
                        percentageChange:
                          data.transaccionesPeriodo.PorcentajeCambio, // Puedes ajustar si tienes una métrica específica
                        icon: <IconShoppingCart />,
                      },
                    ].map((card, index) => (
                      <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
                        {loading ? (
                          <Paper
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              height: 120,
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
                <Grid item xs={12} md={6} lg={5}>
                  {/* Este componente (VentasCanalChart) también debe manejar su estado de carga internamente */}
                  <VentasCanalChart
                    canal={filters.canal}
                    periodo={filters.periodo}
                    fechaInicio={filters.fechaInicio}
                    fechaFin={filters.fechaFin}
                    onVendedorSeleccionado={(vendedor) =>
                      setSelectedVendedor(vendedor)
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6} lg={7}>
                  {/* Si FechaRotacion tiene problemas, la solución es la misma:
                      asegúrate de que tenga un `loading` interno y un `useEffect` que reaccione
                      a los cambios en `filters` */}
                  <FechaRotacion filters={{ ...filters }} />
                </Grid>
                <Grid item xs={12}>
                  {/* ClientesFrecuentesTable también debería manejar su estado de carga */}
                  <ClientesFrecuentesTable
                    filters={{
                      ...filters,
                      vendedor: selectedVendedor,
                    }}
                  />
                </Grid>
              </Grid>

              {/* --- Segunda Fila de Gráficos (siempre visible con las métricas clave) --- */}
              <Grid container spacing={2} mt={2}>
                <Grid item xs={12} md={6}>
                  {/* TopProductosChart no depende de 'loading' directamente aquí,
                      pero internamente debe manejar si 'data.topProductos' está vacío/nulo al inicio. */}
                  <TopProductosChart data={data.topProductos} />
                </Grid>
                <Grid item xs={12} md={6}>
                  {/* VentasPorCategoriaChart similar a TopProductosChart. */}
                  <VentasPorCategoriaChart data={data.ventasCategoria} />
                </Grid>
              </Grid>
            </>
          )}
        </Box>
      </PageContainer>
    </>
  );
};

export default VentasPorCanal;