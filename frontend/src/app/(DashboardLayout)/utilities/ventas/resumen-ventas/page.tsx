"use client";

import { useState } from "react";
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
import SeccionTitulo from "./components/SeccionTitulo";
import { apiJson } from "@/utils/apiClient";
import { useApiDatos, useCargaDatos } from "@/utils/useCargaDatos";
import { IconCurrencyDollar, IconTrendingUp, IconCreditCard, IconShoppingCart, IconStack2, IconBox, } from "@tabler/icons-react";
import TopRentabilidadMinima from "./components/Top10RentabilidadMinima";
import FotoDelDiaHeader, { Filters } from "./components/FotoDelDiaHeader";
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
  const [filtros, setFiltros] = useState<Filters>({
    canal: "", 
    temporada: "",
    fechaInicio: "",
    fechaFin: "",
    sku: "",
    familia: "",
    subfamilia: "",
    comparacion: "",
  });

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (filtros.canal) params.append("canal", filtros.canal);
    if (filtros.fechaInicio) params.append("fechaInicio", filtros.fechaInicio);
    if (filtros.fechaFin) params.append("fechaFin", filtros.fechaFin);
    if (filtros.temporada) params.append("temporada", filtros.temporada);
    if (filtros.sku) params.append("sku", filtros.sku);
    if (filtros.familia) params.append("familia", filtros.familia);
    if (filtros.subfamilia) params.append("subfamilia", filtros.subfamilia);
    if (filtros.comparacion) params.append("comparacion", filtros.comparacion);
    return params.toString();
  };

  // Cada bloque se identifica por su URL con los filtros: al cambiar un
  // filtro se limpia al instante, se cancela lo pendiente y solo se muestra
  // la respuesta del filtro actual (ver useCargaDatos). El gráfico de
  // canales y el de ventas por fecha piden sus propios datos.
  const query = buildQuery();
  const url = (endpoint: string) => `${BACKEND_URL}/api/${endpoint}?${query}`;

  const urlVentas = url("ventas-periodo");
  const { datos: ventasHoy, cargando: cargandoVentas } = useCargaDatos(
    urlVentas,
    async (signal) => {
      const data: any = await apiJson(urlVentas, { signal });
      return {
        TotalVentasPeriodo: data.TotalVentasPeriodo || 0,
        PromedioVentasPeriodo: data.TotalVentasAnterior || 0,
        PorcentajeCambio: data.PorcentajeCambio || 0,
      };
    },
    { TotalVentasPeriodo: 0, PromedioVentasPeriodo: 0, PorcentajeCambio: 0 }
  );
  const urlTransacciones = url("transacciones-periodo");
  const { datos: transaccionHoy, cargando: cargandoTransacciones } = useCargaDatos(
    urlTransacciones,
    async (signal) => {
      const data: any = await apiJson(urlTransacciones, { signal });
      return {
        CantidadTransaccionesHoy: data.CantidadTransaccionesPeriodo || 0,
        CantidadTransaccionesAyer: data.CantidadTransaccionesAnterior || 0,
        PorcentajeCambio: data.PorcentajeCambio || 0,
      };
    },
    { CantidadTransaccionesHoy: 0, CantidadTransaccionesAyer: 0, PorcentajeCambio: 0 }
  );
  const { datos: productosDistintos, cargando: cargandoProductos } = useApiDatos<any>(
    url("productos-distintos-periodo"),
    { ProductosPeriodoActual: 0, ProductosPeriodoAnterior: 0, PorcentajeCambio: 0 }
  );
  const { datos: Notascredito, cargando: cargandoNotas } = useApiDatos<any>(url("notascredito"), {
    CantidadNotasCreditoPeriodo: 0,
    CantidadNotasCreditoAnterior: 0,
    PorcentajeCambioNotasCredito: 0,
    CantidadProductosDevueltosPeriodo: 0,
    CantidadProductosDevueltosAnterior: 0,
    PorcentajeCambioProductosDevueltos: 0,
  });
  const { datos: unidadesVendidas, cargando: cargandoUnidades } = useApiDatos<any>(
    url("unidades-vendidas-periodo"),
    { CantidadVendida: 0, CantidadVendidaAnterior: 0, PorcentajeCambio: 0 }
  );
  const { datos: margenBrutoHoy, cargando: cargandoMargen } = useApiDatos<any>(url("margen-ventas"), {
    MargenPorcentajePeriodo: 0,
    VariacionMargen: 0,
  });

  // Las tarjetas primero; los gráficos y tablas se piden cuando terminan
  // (clave null mientras tanto, y se muestran cargando).
  const tarjetasListas =
    !cargandoVentas && !cargandoTransacciones && !cargandoProductos &&
    !cargandoNotas && !cargandoUnidades && !cargandoMargen;
  const urlSecundaria = (endpoint: string) => (tarjetasListas ? url(endpoint) : null);
  const vendedores = useApiDatos<any[]>(urlSecundaria("top-vendedores"), []);
  const rentabilidad = useApiDatos<any[]>(urlSecundaria("productos-rentabilidad"), []);
  const categorias = useApiDatos<any[]>(urlSecundaria("margen-categorias-comparado"), []);
  const detalle = useApiDatos<any[]>(urlSecundaria("obtener-detalle-ventas"), []);
  const rentabilidadMinima = useApiDatos<any[]>(urlSecundaria("productos-rentabilidad-minima"), []);

  const detalleTransformado = detalle.datos.map((item) => ({
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

  // Mientras un bloque carga se muestra el indicador en lugar del dato viejo.
  const conCarga = (bloque: { cargando: boolean }, contenido: React.ReactNode, alto = 300) =>
    !tarjetasListas || bloque.cargando ? (
      <Paper
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: alto,
          borderRadius: 2,
          boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
        }}
      >
        <CircularProgress />
      </Paper>
    ) : (
      contenido
    );

  return (
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
              cargando: cargandoVentas,
              icon: <IconCurrencyDollar />,
            },
            {
              title: "Margen Ventas",
              value: `${margenBrutoHoy.MargenPorcentajePeriodo}%`,
              subtitle: `Variación: ${margenBrutoHoy.VariacionMargen}%`,
              percentageChange: margenBrutoHoy.VariacionMargen,
              cargando: cargandoMargen,
              icon: <IconTrendingUp />,
            },
            {
              title: "Cantidad de Ventas",
              value: formatUnidades(transaccionHoy.CantidadTransaccionesHoy),
              subtitle: `Periodo Anterior: ${formatUnidades(transaccionHoy.CantidadTransaccionesAyer)}`,
              percentageChange: transaccionHoy.PorcentajeCambio,
              cargando: cargandoTransacciones,
              icon: <IconShoppingCart />,
            },
            {
              title: "Notas de Crédito",
              value: formatUnidades(Notascredito.CantidadNotasCreditoPeriodo),
              subtitle: `Periodo Anterior: ${formatUnidades(Notascredito.CantidadNotasCreditoAnterior)}`,
              percentageChange: Notascredito.PorcentajeCambioNotasCredito,
              cargando: cargandoNotas,
              icon: <IconCreditCard />,
            },
            {
              title: "Ítems Vendidos",
              value: formatUnidades(productosDistintos.ProductosPeriodoActual),
              subtitle: `Periodo Anterior: ${formatUnidades(productosDistintos.ProductosPeriodoAnterior)}`,
              percentageChange: productosDistintos.PorcentajeCambio,
              cargando: cargandoProductos,
              icon: <IconStack2 />,
            },
            {
              title: "Unidades Vendidas",
              value: formatUnidades(unidadesVendidas.CantidadVendida),
              subtitle: `Periodo Anterior: ${formatUnidades(unidadesVendidas.CantidadVendidaAnterior)}`,
              percentageChange: unidadesVendidas.PorcentajeCambio,
              cargando: cargandoUnidades,
              icon: <IconBox />,
            },
          ].map((card, index) => (
            <Grid item xs={12} sm={6} md={4} lg={2} key={index}> 
              <MetricCard
                title={card.title}
                value={card.value}
                subtitle={card.subtitle}
                percentageChange={card.percentageChange}
                icon={card.icon}
                elevation={1}
                cargando={card.cargando}
              />
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
          {conCarga(categorias, <CategoriasBarChart data={categorias.datos} />)}
        </Grid>
        <Grid item xs={12} md={6.5}> {/* Top sellers chart next to category performance */}
          {conCarga(vendedores, <TopVendedoresChart data={vendedores.datos} />)}
        </Grid>
        <Grid item xs={12}>
          <SeccionTitulo
            title="Rendimiento de Productos"
            infoRight="Desglose por productos más vendidos y rentables."
          />
        </Grid>
        <Grid item xs={12} md={7}> {/* Top selling products chart */}
          {conCarga(rentabilidadMinima, <TopRentabilidadMinima data={rentabilidadMinima.datos} />)}
        </Grid>
        <Grid item xs={12} md={5}> {/* Rentability chart next to top sellers */}
          {conCarga(rentabilidad, <RentabilidadChart data={rentabilidad.datos} />)}
        </Grid>
        <Grid item xs={12}> {/* Full width for detailed product table */}
          {conCarga(detalle, <ProductosVendidos data={detalleTransformado} />, 400)}
        </Grid>
      </Grid>
  </Box>
</PageContainer>
  );
};
export default ResumenVentas;






