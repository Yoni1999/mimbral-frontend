"use client";

import { useEffect, useState } from "react";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import {
  Grid,
  Paper,
  CircularProgress,
  Box,
} from "@mui/material";
import VentasChart from "./components/VentasChart";
import MetricCard from "./components/MetricCard";
import CategoriasBarChart from "./components/CategoriasBarChart";
import dynamic from "next/dynamic";
import ProgressGauge from "./components/ProgressGauge";
import SeccionTitulo from "./components/SeccionTitulo";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { IconCurrencyDollar, IconTrendingUp, IconCreditCard, IconShoppingCart, IconStack2, IconBox, } from "@tabler/icons-react";
import TopRentabilidadMinima from "./components/Top10RentabilidadMinima";
import NivelNavigation from "../components/NivelNavigation";
import FotoDelDiaHeader, { Filters } from "./components/FotoDelDiaHeader.tsx";
import { BACKEND_URL } from "@/config";
import { formatVentas, formatUnidades } from "@/utils/format";
import ProductosVendidos from "./components/ProductosVendidos";
import TopVendedoresChart from "./components/Top10Vendedores";

const VentasCanalChart = dynamic(() => import("./components/VentasCanalChart"), {
  ssr: false, 
});
const TopProductosChart = dynamic(() => import("./components/Top10Vendedores"), {
  ssr: false,
});
const RentabilidadChart = dynamic(() => import("./components/Top10RentabilidadChart"), {
  ssr: false,
});

const ResumenVentas = () => {
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState<Omit<Filters, "vendedor">>({
    canal: "", 
    temporada: "",
    periodo: "",
    fechaInicio: "",
    fechaFin: "",
  });


  const [ventasHoy, setVentasHoy] = useState({
    TotalVentasPeriodo: 0,
    PromedioVentasPeriodo: 0,
    PorcentajeCambio: 0,
  });
  const [margenBrutoHoy, setMargenBrutoHoy] = useState({
    MargenPorcentajePeriodo: 0,
    VariacionMargen: 0,
  });
  const [transaccionHoy, settransaccionHoy] = useState({
    CantidadTransaccionesHoy: 0,
    CantidadTransaccionesAyer: 0,
    PorcentajeCambio: 0,
  });
  const [productosDistintos, setProductosDistintos] = useState({
    ProductosPeriodoActual: 0,
    ProductosPeriodoAnterior: 0,
    PorcentajeCambio: 0,
  });
  const [Notascredito, setNotascredito] = useState({
    CantidadNotasCreditoPeriodo: 0,
    CantidadNotasCreditoAnterior: 0,
    PorcentajeCambioNotasCredito: 0,
    CantidadProductosDevueltosPeriodo: 0,
    CantidadProductosDevueltosAnterior: 0,
    PorcentajeCambioProductosDevueltos: 0,
  });
  const [unidadesVendidas, setUnidadesVendidas] = useState({
    CantidadVendida: 0,
    CantidadVendidaAnterior: 0,
    PorcentajeCambio: 0,
  });
  
  const [Ventascanal, setVentascanal] = useState({
    Canal_Venta: 0,
    Total_Ventas: 0,
  });
  const [topVendedores, setTopVendedores] = useState<any[]>([]);
  const [productosRentabilidad, setProductosRentabilidad] = useState<any[]>([]);
  const [categoriasData, setCategoriasData] = useState<any[]>([]);
  const [detalleVentas, setDetalleVentas] = useState<any[]>([]);
  const [productosEstancados, setProductosEstancados] = useState<any[]>([]);
  const [productosRentabilidadMinima, setProductosRentabilidadMinima] = useState<any[]>([]);

  const detalleTransformado = detalleVentas.map((item) => ({
    imagen: item.Imagen,
    sku: item.Codigo_Producto,
    nombre: item.Nombre_Producto,
    primerNivel: item.PrimerNivel,
    categoria: item.Categoria,
    cantidadVendida: item.Cantidad_Vendida,
    margenPorcentaje: item.Margen_Porcentaje,
    stock: item.Stock_Disponible,
    margenBruto: item.Margen_Absoluto,
    precioPromedio: item.Precio_Promedio_Venta,
    totalVentas: item.Total_Ventas,
  }));

  const fetchData = async (
    endpoint: string,
    setState: React.Dispatch<React.SetStateAction<any>>,
    postProcessor?: (data: any) => any
  ) => {
    try {
      const response = await fetchWithToken(
        `${BACKEND_URL}/api/${endpoint}`
      );
      if (response) {
        const data = await response.json();
        setState(postProcessor ? postProcessor(data) : data);
      }
    } catch (error) {
      console.error(`Error al obtener datos de ${endpoint}:`, error);
    }
  };
  useEffect(() => {
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
      if (filtros.canal) params.append("canal", filtros.canal);
      if (filtros.fechaInicio) params.append("fechaInicio", filtros.fechaInicio);
      if (filtros.fechaFin) params.append("fechaFin", filtros.fechaFin);
      if (filtros.periodo) params.append("periodo", getPeriodoParam());
      if (filtros.temporada) params.append("temporada", filtros.temporada);
      return params.toString();
    };
    const query = buildQuery();
    setLoading(true);

    const fetchPrimaryData = async () => {
      await Promise.all([
        fetchData(`ventas-periodo?${query}`, setVentasHoy, (data) => ({
          TotalVentasPeriodo: data.TotalVentasPeriodo || 0,
          PromedioVentasPeriodo: data.TotalVentasAnterior || 0,
          PorcentajeCambio: data.PorcentajeCambio || 0,
        })),
        fetchData(`transacciones-periodo?${query}`, settransaccionHoy, (data) => ({
          CantidadTransaccionesHoy: data.CantidadTransaccionesPeriodo || 0,
          CantidadTransaccionesAyer: data.CantidadTransaccionesAnterior || 0,
          PorcentajeCambio: data.PorcentajeCambio || 0,
        })),
        fetchData(`productos-distintos-periodo?${query}`, setProductosDistintos),
        fetchData(`notascredito?${query}`, setNotascredito),
        fetchData(`unidades-vendidas-periodo?${query}`, setUnidadesVendidas),
        fetchData(`margen-ventas?${query}`, setMargenBrutoHoy),
      ]);
    };
    const fetchSecondaryData = async () => {
      await Promise.all([
        fetchData(`ventas-canal?${query}`, setVentascanal),
        fetchData(`top-vendedores?${query}`, setTopVendedores),
        fetchData(`productos-rentabilidad?${query}`, setProductosRentabilidad),
        fetchData(`margen/bruto-periodo?${query}`, () => {}),
        fetchData(`margen-categorias-comparado?${query}`, (data) => {
          console.log("📦 Data bruta desde API (categorías):", data); // 👈
          setCategoriasData(data);
        }),

        fetchData(`unidades-vendidas-periodo?${query}`, setUnidadesVendidas),
        fetchData(`obtener-detalle-ventas?${query}`, setDetalleVentas),
        fetchData(`top-productos-estancados?${query}`, setProductosEstancados),
        fetchData(`productos-rentabilidad-minima?${query}`, setProductosRentabilidadMinima),
      ]);
      setLoading(false);
    };

    fetchPrimaryData().then(fetchSecondaryData);
  }, [filtros]);

  return (
    <>
    <NivelNavigation/>
    <PageContainer title="Resumen Ventas" description="Resumen de las ventas">
      <Box sx={{ p: 0}}>
        <FotoDelDiaHeader onFilterChange={(f) => setFiltros(f)} />
        <Grid container spacing={2}>
      <Grid item xs={12}>
        <Grid container spacing={2}>
          {[
            {
              title: "Ventas",
              value: formatVentas(ventasHoy.TotalVentasPeriodo),
              subtitle: `Periodo Anterior: ${formatVentas(
                ventasHoy.PromedioVentasPeriodo
              )}`,
              percentageChange: ventasHoy.PorcentajeCambio,
              isLoading: !ventasHoy.TotalVentasPeriodo === undefined,
              icon: <IconCurrencyDollar />,
            },
            {
              title: "Margen Ventas",
              value: `${margenBrutoHoy.MargenPorcentajePeriodo}%`,
              subtitle: `Variación: ${margenBrutoHoy.VariacionMargen}%`,
              percentageChange: margenBrutoHoy.VariacionMargen,
              isLoading: !margenBrutoHoy.MargenPorcentajePeriodo === undefined,
              icon: <IconTrendingUp />,
            },
            {
              title: "Cantidad de Ventas",
              value: formatUnidades(transaccionHoy.CantidadTransaccionesHoy),
              subtitle: `Periodo Anterior: ${formatUnidades(transaccionHoy.CantidadTransaccionesAyer)}`,
              percentageChange: transaccionHoy.PorcentajeCambio,
              isLoading: !transaccionHoy.CantidadTransaccionesHoy === undefined,
              icon: <IconShoppingCart />,
            },
            {
              title: "Notas de Crédito",
              value: formatUnidades(Notascredito.CantidadNotasCreditoPeriodo),
              subtitle: `Periodo Anterior: ${formatUnidades(Notascredito.CantidadNotasCreditoAnterior)}`,
              percentageChange: Notascredito.PorcentajeCambioNotasCredito,
              isLoading: Notascredito.CantidadNotasCreditoPeriodo === undefined,
              icon: <IconCreditCard />,
            },
            {
              title: "Ítems Vendidos",
              value: formatUnidades(productosDistintos.ProductosPeriodoActual),
              subtitle: `Periodo Anterior: ${formatUnidades(productosDistintos.ProductosPeriodoAnterior)}`,
              percentageChange: productosDistintos.PorcentajeCambio,
              isLoading: !productosDistintos.ProductosPeriodoActual === undefined,
              icon: <IconStack2 />,
            },
            {
              title: "Unidades Vendidas",
              value: formatUnidades(unidadesVendidas.CantidadVendida),
              subtitle: `Periodo Anterior: ${formatUnidades(unidadesVendidas.CantidadVendidaAnterior)}`,
              percentageChange: unidadesVendidas.PorcentajeCambio,
              isLoading: !unidadesVendidas.CantidadVendida === undefined,
              icon: <IconBox />,
            },
          ].map((card, index) => (
            <Grid item xs={12} sm={6} md={4} lg={2} key={index}> 
              {card.isLoading ? (
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
                <MetricCard
                  title={card.title}
                  value={card.value}
                  subtitle={card.subtitle}
                  percentageChange={card.percentageChange}
                  icon={card.icon}
                  elevation={1}
                />
              )}
            </Grid>
          ))}
        </Grid>
      </Grid>

      <Grid item xs={12}>
        <SeccionTitulo
          title="Análisis de Ventas"
          infoRight="Visualización de tendencias y distribución de ventas."
        />
      </Grid>
        <Grid item xs={12} md={5}> {/* Side-by-side with main chart for channel insights */}
          <VentasCanalChart filters={filtros} />
        </Grid>
        <Grid item xs={12} md={7}> {/* Main sales chart takes more space */}
          <VentasChart filtros={filtros} />
        </Grid>
        <Grid item xs={12}>
          <SeccionTitulo
            title="Rendimiento por Categoría y Vendedores"
            infoRight="Análisis del desempeño de las categorías de productos."
          />
        </Grid>
        <Grid item xs={12} md={5.5}> {/* Full width for category bar chart */}
          <CategoriasBarChart data={categoriasData} />
        </Grid>
        <Grid item xs={12} md={6.5}> {/* Top sellers chart next to category performance */}
          <TopVendedoresChart data={topVendedores} />
        </Grid>
        <Grid item xs={12}>
          <SeccionTitulo
            title="Rendimiento de Productos"
            infoRight="Desglose por productos más vendidos y rentables."
          />
        </Grid>
        <Grid item xs={12} md={7}> {/* Top selling products chart */}
          <TopRentabilidadMinima data={productosRentabilidadMinima} />
        </Grid>
        <Grid item xs={12} md={5}> {/* Rentability chart next to top sellers */}
          <RentabilidadChart data={productosRentabilidad} />
        </Grid>
        <Grid item xs={12}> {/* Full width for detailed product table */}
          <ProductosVendidos data={detalleTransformado} />
        </Grid>
        <Grid item xs={12}>
          <SeccionTitulo
            title="Metas por Canal"
            infoRight="Se está mostrando el período actual de las metas."
          />
        </Grid>
        <Grid item xs={12}> {/* Full width grid for the gauges */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}> {/* Responsive grid for gauges */}
              <ProgressGauge value={720} total={1000} title="Empresas" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <ProgressGauge value={550} total={1000} title="Chorrillo" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <ProgressGauge value={300} total={1000} title="Meli" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <ProgressGauge value={820} total={1000} title="Balmaceda" />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
  </Box>
</PageContainer>
    </>
  );
};
export default ResumenVentas;




