"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import SeccionTitulo from "../resumen-ventas/components/SeccionTitulo";
import { Grid, Paper, CircularProgress, Box, Typography, FormControlLabel, Checkbox, } from "@mui/material";
import MetricCard from "./components/Cards";
import FechaRotacion from "./components/MonthlySalesRotation";
import HeaderFilters, { Filters } from "./components/Header";
import ClientesFrecuentesTable from "./components/FrequentCustomers";
import dynamic from "next/dynamic";
import { formatUnidades, formatVentas } from "@/utils/format";
import { useApiDatos } from "@/utils/useCargaDatos";
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
    const canalParam = searchParams?.get("canal") || "";
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("filtrosVentasCanal");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Prioriza el canal de la URL si existe, de lo contrario usa el de localStorage, luego el por defecto.
          return {
            ...parsed,
            canal: canalParam || parsed.canal || "",
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
  // Cada bloque se identifica por su URL con los filtros: al cambiar un
  // filtro (o el vendedor) se limpia al instante, se cancela lo pendiente y
  // solo se muestra la respuesta del filtro actual (ver useCargaDatos).
  const query = new URLSearchParams(
    Object.fromEntries(
      Object.entries({ ...filters, vendedorEmpresa: selectedVendedor })
        .filter(([_, value]) => value !== undefined && value !== null && value !== "") // Filtra valores nulos, indefinidos y cadenas vacías
        .map(([key, value]) => [key, String(value)])
    )
  ).toString();
  const url = (endpoint: string) => `${BACKEND_URL}/api/${endpoint}?${query}`;

  const ventasHoyRes = useApiDatos<any>(url("ventas-periodo"), null);
  const transaccionesRes = useApiDatos<any>(url("transacciones-periodo"), null);
  const unidadesRes = useApiDatos<any>(url("unidades-vendidas-periodo"), null);
  const productosRes = useApiDatos<any>(url("productos-distintos-periodo"), null);
  const margenRes = useApiDatos<any>(url("margen/bruto-periodo"), null);
  const topProductosRes = useApiDatos<any>(url("top-productos"), null);
  const ventasCategoriaRes = useApiDatos<any>(url("categorias/ventas-categoria"), null);

  // Si la respuesta viene vacía (o falló) se usa la estructura por defecto.
  const data = {
    ventasHoy: ventasHoyRes.datos || { TotalVentasPeriodo: 0, TotalVentasAnterior: 0, PorcentajeCambio: 0 },
    transaccionesPeriodo: transaccionesRes.datos || { CantidadTransaccionesPeriodo: 0, CantidadTransaccionesAnterior: 0, PorcentajeCambio: 0 },
    unidadesVendidas: unidadesRes.datos || { CantidadVendida: 0, CantidadVendidaAnterior: 0, PorcentajeCambio: 0 },
    productosDistintos: productosRes.datos || { ProductosPeriodoActual: 0, ProductosPeriodoAnterior: 0, PorcentajeCambio: 0 },
    margenBruto: margenRes.datos || { TotalVentasPeriodo: 0, MargenBrutoPeriodo: 0, MargenBrutoAnterior: 0, PorcentajeCambio: 0 },
    topProductos: (topProductosRes.datos || []) as any[],
    ventasCategoria: (ventasCategoriaRes.datos || []) as any[],
  };

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
    setSelectedVendedor(null); // Reinicia el vendedor al cambiar los filtros principales
    // Guarda siempre los filtros actualizados en localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("filtrosVentasCanal", JSON.stringify(newFilters));
    }
  };
  const [mostrarProductos, setMostrarProductos] = useState(false);

  return (
      <PageContainer
        title="Ventas por Canal"
        description="Resumen de ventas filtradas por canal, período y rango de fechas"
      >
        <Box sx={{ p: 0 }}>
          <Box sx={{ mb: 1, display: "flex", justifyContent: "flex-end", px: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {filters.fechaInicio && filters.fechaFin ? `Filtrando por rango: ${filters.fechaInicio} al ${filters.fechaFin}` : "Viendo datos de hoy"}
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
                  {/* ProductosVendidos pide sus datos y maneja su propia carga. */}
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
                        cargando: ventasHoyRes.cargando,
                        icon: <IconCurrencyDollar />,
                      },
                      {
                        title: "Margen Bruto",
                        value: formatVentas(data.margenBruto.MargenBrutoPeriodo),
                        subtitle: `Anterior: ${formatVentas(
                          data.margenBruto.MargenBrutoAnterior
                        )}`,
                        percentageChange: data.margenBruto.PorcentajeCambio,
                        cargando: margenRes.cargando,
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
                        cargando: unidadesRes.cargando,
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
                        cargando: productosRes.cargando,
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
                        cargando: transaccionesRes.cargando,
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
                        cargando: ventasHoyRes.cargando || transaccionesRes.cargando,
                        icon: <IconShoppingCart />,
                      },
                    ].map((card, index) => (
                      <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
                        <MetricCard {...card} />
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
                  {/* VentasCanalChart pide sus datos y maneja su propia carga. */}
                  <VentasCanalChart
                    canal={filters.canal}
                    fechaInicio={filters.fechaInicio}
                    fechaFin={filters.fechaFin}
                    onVendedorSeleccionado={(vendedor) =>
                      setSelectedVendedor(vendedor)
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6} lg={7}>
                  {/* FechaRotacion pide sus datos y maneja su propia carga. */}
                  <FechaRotacion filters={{ ...filters }} />
                </Grid>
                <Grid item xs={12}>
                  {/* ClientesFrecuentesTable pide sus datos y maneja su propia carga. */}
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
                  {/* TopProductosChart recibe los datos de la página; mientras cargan, indicador. */}
                  {topProductosRes.cargando ? (
                    <Paper sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, borderRadius: 2 }}>
                      <CircularProgress />
                    </Paper>
                  ) : (
                    <TopProductosChart data={data.topProductos} />
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  {/* VentasPorCategoriaChart similar a TopProductosChart. */}
                  {ventasCategoriaRes.cargando ? (
                    <Paper sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, borderRadius: 2 }}>
                      <CircularProgress />
                    </Paper>
                  ) : (
                    <VentasPorCategoriaChart data={data.ventasCategoria} />
                  )}
                </Grid>
              </Grid>
            </>
          )}
        </Box>
      </PageContainer>
  );
};

export default VentasPorCanal;

