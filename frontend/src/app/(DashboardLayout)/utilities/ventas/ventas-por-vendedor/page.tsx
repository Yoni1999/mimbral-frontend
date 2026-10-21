"use client";
import React, { useState } from "react";
import { Box, Grid, Paper, CircularProgress, Typography } from "@mui/material";
import HeaderVendedor, { Filters } from "./components/Header";
import MetricCard from "./components/Cards";
import ProgressGauge from "./components/Goals";
import dynamic from "next/dynamic";
import TopProductosChart from "./components/SoldCategories";
import VentasCanalChart from "./components/FormaPago";
import {IconCurrencyDollar,IconTrendingUp,IconBox,IconStack2,IconShoppingCart,IconCreditCard} from "@tabler/icons-react";
import { apiJson } from "@/utils/apiClient";
import { useCargaDatos } from "@/utils/useCargaDatos";
import { BACKEND_URL } from "@/config";
import { useSearchParams } from "next/navigation";
import SeccionTitulo from "@/app/(DashboardLayout)/utilities/ventas/resumen-ventas/components/SeccionTitulo";
import { formatVentas, formatUnidades } from "@/utils/format";

// Dynamic imports para componentes de gráficos
const TopVentasComparadoChart = dynamic(
  () => import("./components/TopSalesComparison"),
  { ssr: false }
);
const TopRentableVendedor = dynamic(
  () => import("./components/Top10MostProfitable"),
  { ssr: false }
);

// --- Helpers para extraer el primer elemento de un array o un objeto vacío ---
const primeroOVacio = async (url: string, signal: AbortSignal) => {
  const data = await apiJson(url, { signal });
  return Array.isArray(data) && data.length > 0 ? data[0] : {};
};

const VentasVendedorPage: React.FC = () => {
  const searchParams = useSearchParams();

  // --- Estado de Filtros ---
  // Se inicializa desde la URL en el primer render: antes un efecto los volvía
  // a fijar después de montar y eso disparaba una segunda carga completa.
  const [filtros, setFiltros] = useState<Filters>(() => ({
    fechaInicio: searchParams?.get("fechaInicio") || "",
    fechaFin: searchParams?.get("fechaFin") || "",
    vendedorEmpresa: searchParams?.get("vendedor") || "",
    modoComparacion: searchParams?.get("modoComparacion") || "",
    canal: searchParams?.get("canal") || "",
  }));

  // --- Función para construir la query string de la API ---
  const buildQuery = (currentFiltros: Filters) => {
    const params = new URLSearchParams();
    if (currentFiltros.fechaInicio)
      params.append("fechaInicio", currentFiltros.fechaInicio);
    if (currentFiltros.fechaFin)
      params.append("fechaFin", currentFiltros.fechaFin);

    if (currentFiltros.modoComparacion) {
      params.append("modoComparacion", currentFiltros.modoComparacion);
    }

    if (currentFiltros.vendedorEmpresa) {
      params.append("vendedorEmpresa", currentFiltros.vendedorEmpresa);
    }

    if (currentFiltros.canal) {
      params.append("canal", currentFiltros.canal);
    }

    return params.toString();
  };

  // --- Datos de KPIs ---
  // Cada bloque se identifica por su URL con los filtros: al cambiar un
  // filtro se limpia al instante, se cancela lo pendiente y solo se muestra
  // la respuesta del filtro actual (ver useCargaDatos). El vendedor es
  // opcional: sin él se muestran los totales del canal.
  const query = buildQuery(filtros);
  const urlVentas = `${BACKEND_URL}/api/pv/ventastotal?${query}`;
  const { datos: ventasTotal, cargando: loadingVentasTotal } = useCargaDatos(
    urlVentas,
    async (signal) => {
      const datos = await primeroOVacio(urlVentas, signal);
      return {
        TotalVentasPeriodo: datos.TotalVentasPeriodo || 0,
        TotalVentasAnterior: datos.TotalVentasAnterior || 0,
        PorcentajeCambio: datos.PorcentajeCambio || 0,
      };
    },
    { TotalVentasPeriodo: 0, TotalVentasAnterior: 0, PorcentajeCambio: 0 }
  );

  const urlMargen = `${BACKEND_URL}/api/pv/margentotal?${query}`;
  const { datos: margenTotal, cargando: loadingMargenTotal } = useCargaDatos(
    urlMargen,
    async (signal) => {
      const datos = await primeroOVacio(urlMargen, signal);
      return {
        MargenBrutoPeriodo: datos.MargenBrutoPeriodo || 0,
        MargenBrutoAnterior: datos.MargenBrutoAnterior || 0,
        TotalVentasAnterior: datos.TotalVentasAnterior || 0,
        PorcentajeCambio: datos.PorcentajeCambio || 0,
      };
    },
    { MargenBrutoPeriodo: 0, TotalVentasAnterior: 0, MargenBrutoAnterior: 0, PorcentajeCambio: 0 }
  );

  const urlProductos = `${BACKEND_URL}/api/pv/productosdistintos?${query}`;
  const { datos: productosDistintos, cargando: loadingProductosDistintos } = useCargaDatos(
    urlProductos,
    async (signal) => {
      const data = await primeroOVacio(urlProductos, signal);
      return {
        ProductosPeriodoActual: data.ProductosPeriodoActual || 0,
        ProductosPeriodoAnterior: data.ProductosPeriodoAnterior || 0,
        PorcentajeCambio: data.PorcentajeCambio || 0,
      };
    },
    { ProductosPeriodoActual: 0, ProductosPeriodoAnterior: 0, PorcentajeCambio: 0 }
  );

  const urlUnidades = `${BACKEND_URL}/api/pv/unidadesvendidas?${query}`;
  const { datos: unidadesTotal, cargando: loadingUnidadesTotal } = useCargaDatos(
    urlUnidades,
    async (signal) => {
      const data = await primeroOVacio(urlUnidades, signal);
      return {
        CantidadVendida: data.CantidadVendida || 0,
        CantidadVendidaAnterior: data.CantidadVendidaAnterior || 0,
        PorcentajeCambio: data.PorcentajeCambio || 0,
      };
    },
    { CantidadVendida: 0, CantidadVendidaAnterior: 0, PorcentajeCambio: 0 }
  );

  const urlTransacciones = `${BACKEND_URL}/api/pv/transacciones?${query}`;
  const { datos: nTransacciones, cargando: loadingNTransacciones } = useCargaDatos(
    urlTransacciones,
    async (signal) => {
      const datos = await primeroOVacio(urlTransacciones, signal);
      return {
        CantidadTransaccionesPeriodo: datos.CantidadTransaccionesPeriodo || 0,
        CantidadTransaccionesAnterior: datos.CantidadTransaccionesAnterior || 0,
        PorcentajeCambio: datos.PorcentajeCambio || 0,
      };
    },
    { CantidadTransaccionesPeriodo: 0, CantidadTransaccionesAnterior: 0, PorcentajeCambio: 0 }
  );

  const urlNotas = `${BACKEND_URL}/api/pv/notascreditopv?${query}`;
  const { datos: notasCreditoTotal, cargando: loadingNotasCreditoTotal } = useCargaDatos(
    urlNotas,
    async (signal) => {
      // Puede venir como array de un elemento o como objeto directo.
      const data = await apiJson(urlNotas, { signal });
      const datos = Array.isArray(data) && data.length > 0 ? data[0] : (typeof data === 'object' && data !== null ? data : {});
      return {
        CantidadNotasCreditoPeriodo: datos.CantidadNotasCreditoPeriodo || 0,
        CantidadNotasCreditoAnterior: datos.CantidadNotasCreditoAnterior || 0,
        PorcentajeCambioNotasCredito: datos.PorcentajeCambioNotasCredito || 0,
      };
    },
    { CantidadNotasCreditoPeriodo: 0, CantidadNotasCreditoAnterior: 0, PorcentajeCambioNotasCredito: 0 }
  );

  // --- Formas de Pago ---
  const urlFormasPago = `${BACKEND_URL}/api/oc/formas-pago?${query}`;
  const { datos: formasPagoData, cargando: loadingFormasPagoData } = useCargaDatos<
    {
      PayDueMonth: string;
      CantidadFacturas: number;
      TotalVentas: number;
    }[]
  >(
    urlFormasPago,
    async (signal) => {
      const data = await apiJson(urlFormasPago, { signal });
      // Esperamos un array de objetos
      if (Array.isArray(data)) return data;
      console.warn("⚠️ Formato inesperado para datos de Formas de Pago:", data);
      return [];
    },
    []
  );

return (
      <Box sx={{ p: 3 }}>
        <HeaderVendedor
          filtros={filtros}
          setFiltros={setFiltros}
          // Los datos se recargan solos al cambiar los filtros.
          onAplicar={() => {}}
        />

        {/* --- Sección de Métricas Principales (MetricCards) --- */}
        <Grid container spacing={2}>
          <Grid item xs={12}> {/* Contenedor principal para todas las metric cards */}
            <SeccionTitulo
              title="Métricas Clave de Ventas"
              infoRight="Información consolidada del desempeño de ventas."
            />
            <Grid container spacing={2}>
              {[
                {
                  title: "Ventas Totales",
                  value: formatVentas(ventasTotal.TotalVentasPeriodo),
                  subtitle: `Periodo Ant: ${formatVentas(ventasTotal.TotalVentasAnterior)}`,
                  percentageChange: ventasTotal.PorcentajeCambio,
                  cargando: loadingVentasTotal,
                  icon: <IconCurrencyDollar />,
                },
                {
                  title: "Margen Bruto",
                  value: formatVentas(margenTotal.MargenBrutoPeriodo),
                  subtitle: `Periodo Ant: ${formatVentas(margenTotal.MargenBrutoAnterior)}`,
                  percentageChange: margenTotal.PorcentajeCambio,
                  cargando: loadingMargenTotal,
                  icon: <IconTrendingUp />,
                },
                {
                  title: "Items Vendidos",
                  value: formatUnidades(productosDistintos.ProductosPeriodoActual),
                  subtitle: `Periodo Ant: ${formatUnidades(productosDistintos.ProductosPeriodoAnterior)}`,
                  percentageChange: productosDistintos.PorcentajeCambio,
                  cargando: loadingProductosDistintos,
                  icon: <IconBox />,
                },
                {
                  title: "Unidades Vendidas",
                  value: formatUnidades(unidadesTotal.CantidadVendida),
                  subtitle: `Periodo Ant: ${formatUnidades(unidadesTotal.CantidadVendidaAnterior)}`,
                  percentageChange: unidadesTotal.PorcentajeCambio,
                  cargando: loadingUnidadesTotal,
                  icon: <IconStack2 />,
                },
                {
                  title: "N° Transacciones",
                  value: formatUnidades(nTransacciones.CantidadTransaccionesPeriodo),
                  subtitle: `Periodo Ant: ${formatUnidades(nTransacciones.CantidadTransaccionesAnterior)}`,
                  percentageChange: nTransacciones.PorcentajeCambio,
                  cargando: loadingNTransacciones,
                  icon: <IconShoppingCart />,
                },
                {
                  title: "N° Notas de Crédito",
                  value: formatUnidades(notasCreditoTotal.CantidadNotasCreditoPeriodo),
                  subtitle: `Periodo Ant: ${formatUnidades(notasCreditoTotal.CantidadNotasCreditoAnterior)}`,
                  percentageChange: notasCreditoTotal.PorcentajeCambioNotasCredito,
                  cargando: loadingNotasCreditoTotal,
                  icon: <IconCreditCard />,
                },
              ].map((card, index) => (
                <Grid item xs={12} sm={6} md={2} lg={2} key={index}> {/* Ajuste de tamaño para 4 cards por fila en md/lg */}
                  <MetricCard {...card} />
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>

        {/* --- Sección de Gráficos de Análisis de Ventas --- */}
        <Grid container spacing={2} mt={2}>
          <Grid item xs={12}>
            <SeccionTitulo
              title="Análisis de Ventas"
              infoRight="Visualización de tendencias y distribución de ventas."
            />
          </Grid>
          <Grid item xs={12} md={5}>
            {loadingFormasPagoData ? (
              <Paper sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, borderRadius: 2 }}>
                <CircularProgress />
              </Paper>
            ) : (
              <VentasCanalChart data={formasPagoData} />
            )}
          </Grid>
          <Grid item xs={12} md={7}>
            <TopProductosChart filtros={filtros} />
          </Grid>
        </Grid>

        {/* --- Sección de Rendimiento y Comparación --- */}
        <Grid container spacing={2} mt={2}>
          <Grid item xs={12}>
            <SeccionTitulo
              title="Rendimiento y Comparación"
              infoRight="Análisis detallado de rentabilidad y comparación histórica."
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TopRentableVendedor filtros={filtros} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TopVentasComparadoChart filtros={filtros} />
          </Grid>
        </Grid>

        {false && (
        <>
        {/* --- Sección de Metas --- */}
        <Grid container spacing={2} mt={2}>
          <Grid item xs={12}>
            <SeccionTitulo
              title="Metas por Vendedor"
              infoRight="Se está mostrando el período actual de las metas."
            />
          </Grid>
          
            {/* Contenedor de aviso temporal de desarrollo */}
            <Grid item xs={12}>
              <Box
                sx={{
                  backgroundColor: "#fff3cd",
                  border: "1px solid #ffeeba",
                  borderRadius: 2,
                  padding: 2,
                  mb: 2,
                  textAlign: "center",
                }}
              >
                <Typography variant="subtitle1" sx={{ color: "#856404" }}>
                  Este apartado para ver metas por vendedor aún está en desarrollo. Los datos mostrados son falsos.
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12}> {/* Full width grid for the gauges */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={2}>
                  <ProgressGauge value={720} total={1000} title="Cemento Polpaico 25kg" detalleRuta="/ventas-vendedor/metas" height={220} />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <ProgressGauge value={550} total={1000} title="Zinc Acanalado 2.5 mts " detalleRuta="/ventas-vendedor/metas" height={220} />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <ProgressGauge value={300} total={1000} title="Plancha Yeso Cartón 9mm" detalleRuta="/ventas-vendedor/metas" height={220} />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <ProgressGauge value={820} total={1000} title="Urea Granulada 25kg" detalleRuta="/ventas-vendedor/metas" height={220} />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <ProgressGauge value={820} total={1000} title="Adhesivo Ceramico" detalleRuta="/ventas-vendedor/metas" height={220} />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <ProgressGauge value={820} total={1000} title="Malla Acma Construcción" detalleRuta="/ventas-vendedor/metas" height={220} />
                </Grid>
              </Grid>
            </Grid>

        </Grid>
        </>
        )}
      </Box>
  );
};


export default VentasVendedorPage;


