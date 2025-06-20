"use client";
import React, { useEffect, useState } from "react";
import { Box, Grid, Paper, CircularProgress } from "@mui/material";
import NivelNavigation from "../components/NivelNavigation";
import HeaderVendedor, { Filters } from "./components/HeaderVendedor";
import MetricCard from "./components/MetricCard";
import ProgressGauge from "./components/ProgressGauge";
import dynamic from "next/dynamic";
import TopProductosChart from "./components/TopProductosChart";
import {IconCurrencyDollar,IconTrendingUp,IconBox,IconStack2,IconShoppingCart,IconCreditCard,IconReceipt,IconCash} from "@tabler/icons-react";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";
import { useSearchParams } from "next/navigation";
import SeccionTitulo from "@/app/(DashboardLayout)/utilities/ventas/resumen-ventas/components/SeccionTitulo";
import { formatVentas, formatUnidades } from "@/utils/format";

// Dynamic imports para componentes de gráficos
const TopVentasComparadoChart = dynamic(
  () => import("./components/TopVentasComparadoChart"),
  { ssr: false }
);
const VentasCanalChart = dynamic(() => import("./components/VentasCanalChart"), {
  ssr: false,
});
const TopRentableVendedor = dynamic(
  () => import("./components/TopRentableVendedor"),
  { ssr: false }
);

const VentasVendedorPage: React.FC = () => {
  // --- Estados de Filtros y Carga ---
  const [filtros, setFiltros] = useState<Filters>({
    vendedorEmpresa: "",
    temporada: "",
    periodo: "",
    fechaInicio: "",
    fechaFin: "",
    modoComparacion: "",
    canal: "",
  });

  const [cargandoFiltros, setCargandoFiltros] = useState(true);

  // --- Estados de Datos de KPIs ---
  const [ventasTotal, setVentasTotal] = useState({
    TotalVentasPeriodo: 0,
    TotalVentasAnterior: 0,
    PorcentajeCambio: 0,
  });

  const [margenTotal, setMargenTotal] = useState({
    MargenBrutoPeriodo: 0,
    TotalVentasAnterior: 0, 
    MargenBrutoAnterior: 0,
    PorcentajeCambio: 0,
  });

  const [productosDistintos, setProductosDistintos] = useState({
    ProductosPeriodoActual: 0,
    ProductosPeriodoAnterior: 0,
    PorcentajeCambio: 0,
  });

  const [unidadesTotal, setUnidadesTotal] = useState({
    CantidadVendida: 0,
    CantidadVendidaAnterior: 0,
    PorcentajeCambio: 0,
  });

  const [nTransacciones, setNTransacciones] = useState({
    CantidadTransaccionesPeriodo: 0,
    CantidadTransaccionesAnterior: 0,
    PorcentajeCambio: 0,
  });

  const [notasCreditoTotal, setNotasCreditoTotal] = useState({
    CantidadNotasCreditoPeriodo: 0,
    CantidadNotasCreditoAnterior: 0,
    PorcentajeCambioNotasCredito: 0,
  });

  const [formasPagoData, setFormasPagoData] = useState<
    {
      PayDueMonth: string;
      CantidadFacturas: number;
      TotalVentas: number;
    }[]
  >([]);

  // --- Función para mapear periodos de label a código de API ---
  const getPeriodoParam = (periodo: string) => {
    switch (periodo) {
      case "1D":
        return "1d";
      case "7D":
        return "7d";
      case "14D":
        return "14d";
      case "1M":
        return "1m";
      case "3M":
        return "3m";
      case "6M":
        return "6m";
      default:
        return "1d"; // Fallback por defecto
    }
  };

  // --- Función para construir la query string de la API ---
  const buildQuery = (currentFiltros: Filters) => {
    const params = new URLSearchParams();

    if (currentFiltros.periodo) {
      params.append("periodo", getPeriodoParam(currentFiltros.periodo));
    } else {
      if (currentFiltros.fechaInicio)
        params.append("fechaInicio", currentFiltros.fechaInicio);
      if (currentFiltros.fechaFin)
        params.append("fechaFin", currentFiltros.fechaFin);
    }

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

  // --- Helper para extraer el primer elemento de un array o un objeto vacío ---
  const extractFirstOrEmpty = async (response: Response) => {
    const data = await response.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : {};
  };

  // --- Funciones para fetching de datos de APIs ---
  const fetchVentasTotal = async (currentFiltros: Filters) => {
    const query = buildQuery(currentFiltros);
    const fullUrl = `${BACKEND_URL}/api/pv/ventastotal?${query}`;
    console.log("🌐 URL Ventas Totales:", fullUrl);
    try {
      const response = await fetchWithToken(fullUrl);
      if (response) {
        const datos = await extractFirstOrEmpty(response);
        setVentasTotal({
          TotalVentasPeriodo: datos.TotalVentasPeriodo || 0,
          TotalVentasAnterior: datos.TotalVentasAnterior || 0,
          PorcentajeCambio: datos.PorcentajeCambio || 0,
        });
      }
    } catch (err) {
      console.error("❌ Error de red al obtener ventas totales:", err);
    }
  };

  const fetchMargenTotal = async (currentFiltros: Filters) => {
    const query = buildQuery(currentFiltros);
    const fullUrl = `${BACKEND_URL}/api/pv/margentotal?${query}`;
    console.log("🌐 URL Margen Total:", fullUrl);
    try {
      const response = await fetchWithToken(fullUrl);
      if (response) {
        const datos = await extractFirstOrEmpty(response);
        setMargenTotal({
          MargenBrutoPeriodo: datos.MargenBrutoPeriodo || 0,
          MargenBrutoAnterior: datos.MargenBrutoAnterior || 0,
          TotalVentasAnterior: datos.TotalVentasAnterior || 0, // Asegúrate que esta propiedad exista si la necesitas
          PorcentajeCambio: datos.PorcentajeCambio || 0,
        });
      }
    } catch (err) {
      console.error("❌ Error al obtener el margen total:", err);
    }
  };

  const fetchProductosDistintos = async (currentFiltros: Filters) => {
    const query = buildQuery(currentFiltros);
    const fullUrl = `${BACKEND_URL}/api/pv/productosdistintos?${query}`;
    console.log("🌐 URL Productos Distintos:", fullUrl);
    try {
      const response = await fetchWithToken(fullUrl);
      if (response) {
        const data = await extractFirstOrEmpty(response);
        setProductosDistintos({
          ProductosPeriodoActual: data.ProductosPeriodoActual || 0,
          ProductosPeriodoAnterior: data.ProductosPeriodoAnterior || 0,
          PorcentajeCambio: data.PorcentajeCambio || 0,
        });
      }
    } catch (err) {
      console.error("❌ Error al obtener productos distintos:", err);
    }
  };

  const fetchUnidadesTotal = async (currentFiltros: Filters) => {
    const query = buildQuery(currentFiltros);
    const fullUrl = `${BACKEND_URL}/api/pv/unidadesvendidas?${query}`;
    console.log("🌐 URL Unidades Vendidas:", fullUrl);
    try {
      const response = await fetchWithToken(fullUrl);
      if (response) {
        const data = await extractFirstOrEmpty(response);
        setUnidadesTotal({
          CantidadVendida: data.CantidadVendida || 0,
          CantidadVendidaAnterior: data.CantidadVendidaAnterior || 0,
          PorcentajeCambio: data.PorcentajeCambio || 0,
        });
      }
    } catch (err) {
      console.error("❌ Error al obtener unidades vendidas:", err);
    }
  };

  const fetchNTransacciones = async (currentFiltros: Filters) => {
    const query = buildQuery(currentFiltros);
    const fullUrl = `${BACKEND_URL}/api/pv/transacciones?${query}`;
    console.log("🌐 URL Transacciones:", fullUrl);
    try {
      const response = await fetchWithToken(fullUrl);
      if (response) {
        const datos = await extractFirstOrEmpty(response);
        setNTransacciones({
          CantidadTransaccionesPeriodo: datos.CantidadTransaccionesPeriodo || 0,
          CantidadTransaccionesAnterior: datos.CantidadTransaccionesAnterior || 0,
          PorcentajeCambio: datos.PorcentajeCambio || 0,
        });
      }
    } catch (err) {
      console.error("❌ Error al obtener numero de transacciones:", err);
    }
  };

  const fetchNotasCreditoTotal = async (currentFiltros: Filters) => {
    const query = buildQuery(currentFiltros);
    const fullUrl = `${BACKEND_URL}/api/pv/notascreditopv?${query}`;
    console.log("🌐 URL Notas de Crédito:", fullUrl);
    try {
      const response = await fetchWithToken(fullUrl);
      if (response) {
        const data = await response.json(); // asumo que esta API podría devolver un array o un objeto
        // Si Notas de Crédito devuelve un objeto directamente, no un array de 1 elemento,
        // entonces data.CantidadNotasCreditoPeriodo es directo.
        // Si devuelve un array, necesitarías: const datos = Array.isArray(data) && data.length > 0 ? data[0] : {};
        // Para consistencia con extractFirstOrEmpty:
        const datos = Array.isArray(data) && data.length > 0 ? data[0] : (typeof data === 'object' && data !== null ? data : {});

        setNotasCreditoTotal({
          CantidadNotasCreditoPeriodo: datos.CantidadNotasCreditoPeriodo || 0,
          CantidadNotasCreditoAnterior: datos.CantidadNotasCreditoAnterior || 0,
          PorcentajeCambioNotasCredito: datos.PorcentajeCambioNotasCredito || 0,
        });
      }
    } catch (err) {
      console.error("❌ Error al obtener notas de credito:", err);
    }
  };

  // --- NUEVA FUNCIÓN DE FETCHING para Formas de Pago ---
  const fetchFormasPago = async (currentFiltros: Filters) => {
    const query = buildQuery(currentFiltros);
    const fullUrl = `${BACKEND_URL}/api/oc/formas-pago?${query}`;
    console.log("🌐 URL Formas de Pago:", fullUrl);
    try {
      const response = await fetchWithToken(fullUrl);
      if (response) {
        const data = await response.json();
        // Esperamos un array de objetos
        if (Array.isArray(data)) {
          setFormasPagoData(data);
          console.log("✅ Datos de Formas de Pago recibidos:", data);
        } else {
          console.warn(
            "⚠️ Formato inesperado para datos de Formas de Pago:",
            data
          );
          setFormasPagoData([]); // Asegura que el estado sea un array vacío
        }
      }
    } catch (err) {
      console.error("❌ Error al obtener Formas de Pago:", err);
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

  // --- Efecto para inicializar filtros desde URL y cargar datos iniciales ---
  useEffect(() => {
    setCargandoFiltros(true);
    const filtrosIniciales: Filters = {
      periodo: mapPeriodoToLabel(searchParams.get("periodo") || ""),
      temporada: searchParams.get("temporada") || "",
      fechaInicio: searchParams.get("fechaInicio") || "",
      fechaFin: searchParams.get("fechaFin") || "",
      vendedorEmpresa: searchParams.get("vendedor") || "",
      modoComparacion: searchParams.get("modoComparacion") as
        | Filters["modoComparacion"]
        | "",
      canal: searchParams.get("canal") || "",
    };

    setFiltros(filtrosIniciales);
    setCargandoFiltros(false);

    // Llamadas a las APIs iniciales
    fetchVentasTotal(filtrosIniciales);
    fetchMargenTotal(filtrosIniciales);
    fetchNTransacciones(filtrosIniciales);
    fetchProductosDistintos(filtrosIniciales);
    fetchUnidadesTotal(filtrosIniciales);
    fetchNotasCreditoTotal(filtrosIniciales);
    fetchFormasPago(filtrosIniciales); // Llamada a la nueva API
  }, [searchParams, setFiltros, setCargandoFiltros]);

  // --- Efecto para recargar datos cuando los filtros cambian (después de la carga inicial) ---
  useEffect(() => {
    if (!cargandoFiltros) {
      fetchVentasTotal(filtros);
      fetchMargenTotal(filtros);
      fetchNTransacciones(filtros);
      fetchProductosDistintos(filtros);
      fetchUnidadesTotal(filtros);
      fetchNotasCreditoTotal(filtros);
      fetchFormasPago(filtros); // Llamada a la nueva API (se refrescará con los demás, aunque no dependa de filtros)
    }
  }, [filtros, cargandoFiltros]); // Dependencias para re-ejecutar

  // --- Función para llamar a todas las APIs (usada por el botón "Aplicar") ---
  const fetchAllData = (currentFiltros: Filters) => {
    fetchVentasTotal(currentFiltros);
    fetchMargenTotal(currentFiltros);
    fetchProductosDistintos(currentFiltros);
    fetchUnidadesTotal(currentFiltros);
    fetchNTransacciones(currentFiltros);
    fetchNotasCreditoTotal(currentFiltros);
    fetchFormasPago(currentFiltros);
// Incluida para refresco manual también
  };

  // --- Cálculos para las nuevas MetricCards de Formas de Pago ---
  const totalFacturasFormasPago = formasPagoData.reduce(
    (sum, item) => sum + item.CantidadFacturas,
    0
  );
  const totalVentasFormasPago = formasPagoData.reduce(
    (sum, item) => sum + item.TotalVentas,
    0
  );

  // --- Loading states for MetricCards (set to false if not implemented) ---
  const loadingVentasTotal = false;
  const loadingMargenTotal = false;
  const loadingProductosDistintos = false;
  const loadingUnidadesTotal = false;
  const loadingNTransacciones = false;
  const loadingNotasCreditoTotal = false;
  const loadingFormasPagoData = false;

return (
    <>
      <NivelNavigation />
      <Box sx={{ p: 3 }}>
        <HeaderVendedor
          filtros={filtros}
          setFiltros={setFiltros}
          onAplicar={() => fetchAllData(filtros)}
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
                  isLoading: loadingVentasTotal,
                  icon: <IconCurrencyDollar />,
                },
                {
                  title: "Margen Bruto",
                  value: formatVentas(margenTotal.MargenBrutoPeriodo),
                  subtitle: `Periodo Ant: ${formatVentas(margenTotal.MargenBrutoAnterior)}`,
                  percentageChange: margenTotal.PorcentajeCambio,
                  isLoading: loadingMargenTotal,
                  icon: <IconTrendingUp />,
                },
                {
                  title: "Items Vendidos",
                  value: formatUnidades(productosDistintos.ProductosPeriodoActual),
                  subtitle: `Periodo Ant: ${formatUnidades(productosDistintos.ProductosPeriodoAnterior)}`,
                  percentageChange: productosDistintos.PorcentajeCambio,
                  isLoading: loadingProductosDistintos,
                  icon: <IconBox />,
                },
                {
                  title: "Unidades Vendidas",
                  value: formatUnidades(unidadesTotal.CantidadVendida),
                  subtitle: `Periodo Ant: ${formatUnidades(unidadesTotal.CantidadVendidaAnterior)}`,
                  percentageChange: unidadesTotal.PorcentajeCambio,
                  isLoading: loadingUnidadesTotal,
                  icon: <IconStack2 />,
                },
                {
                  title: "N° Transacciones",
                  value: formatUnidades(nTransacciones.CantidadTransaccionesPeriodo),
                  subtitle: `Periodo Ant: ${formatUnidades(nTransacciones.CantidadTransaccionesAnterior)}`,
                  percentageChange: nTransacciones.PorcentajeCambio,
                  isLoading: loadingNTransacciones,
                  icon: <IconShoppingCart />,
                },
                {
                  title: "N° Notas de Crédito",
                  value: formatUnidades(notasCreditoTotal.CantidadNotasCreditoPeriodo),
                  subtitle: `Periodo Ant: ${formatUnidades(notasCreditoTotal.CantidadNotasCreditoAnterior)}`,
                  percentageChange: notasCreditoTotal.PorcentajeCambioNotasCredito,
                  isLoading: loadingNotasCreditoTotal,
                  icon: <IconCreditCard />,
                },
              ].map((card, index) => (
                <Grid item xs={12} sm={6} md={2} lg={2} key={index}> {/* Ajuste de tamaño para 4 cards por fila en md/lg */}
                  {card.isLoading ? (
                    <Paper
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: 120, // Altura consistente con MetricCard
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

        {/* --- Sección de Gráficos de Análisis de Ventas --- */}
        <Grid container spacing={2} mt={2}>
          <Grid item xs={12}>
            <SeccionTitulo
              title="Análisis de Ventas"
              infoRight="Visualización de tendencias y distribución de ventas."
            />
          </Grid>
          <Grid item xs={12} md={5}>
            <VentasCanalChart data={formasPagoData} /> {/* Pasando solo data */}
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

        {/* --- Sección de Metas --- */}
        <Grid container spacing={2} mt={2}>
          <Grid item xs={12}>
            <SeccionTitulo
              title="Metas por Vendedor"
              infoRight="Se está mostrando el período actual de las metas."
            />
          </Grid>
          <Grid item xs={12}> {/* Full width grid for the gauges */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={2}> {/* Responsive grid for gauges */}
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
      </Box>
    </>
  );
};


export default VentasVendedorPage;
