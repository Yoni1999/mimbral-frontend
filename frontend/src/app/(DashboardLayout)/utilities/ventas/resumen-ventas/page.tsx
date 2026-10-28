"use client";

import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { Grid, Skeleton, Box } from "@mui/material";
import VentasChart from "./components/VentasChart";
import MetricCard, { notaSinNc } from "../components/MetricCard";
import CategoriasBarChart from "./components/CategoriasBarChart";
import SeccionTitulo from "../components/SeccionTitulo";
import { apiJson } from "@/utils/apiClient";
import { useApiDatos, useCargaDatos } from "@/utils/useCargaDatos";
import { IconCurrencyDollar, IconTrendingUp, IconCreditCard, IconShoppingCart, IconStack2, IconBox, } from "@tabler/icons-react";
import TopRentabilidadMinima from "./components/Top10RentabilidadMinima";
import FotoDelDiaHeader, { Filters, filtrosIniciales } from "./components/FotoDelDiaHeader";
import { BACKEND_URL } from "@/config";
import { formatUnidades } from "@/utils/format";
import { canalPorClave, formatoMonto, formatoPorcentaje } from "../components/estilo";
import { conPeriodoRapido, etiquetaRango, resolverPeriodoRapido } from "../components/RangosRapidos";
import { useDetalleTarjetas } from "../components/detalle/useDetalleTarjetas";
import { useEstadoVista } from "@/utils/estadoVista";
import ProductosVendidos from "./components/ProductosVendidos";
import TopVendedoresChart from "./components/Top10Vendedores";

import VentasCanalChart from "./components/VentasCanalChart";
import RentabilidadChart from "./components/Top10RentabilidadChart";

const ResumenVentas = () => {
  // Recuerda lo buscado (al volver a la vista o reabrir la pestaña sigue
  // ahí); la primera vez abre en "Ayer". Ver useEstadoVista.
  const [filtros, setFiltros] = useEstadoVista<Filters>("resumen-ventas", filtrosIniciales, {
    serializar: conPeriodoRapido,
    restaurar: resolverPeriodoRapido,
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

  // Mientras un bloque carga se muestra un esqueleto del alto del panel en
  // lugar del dato viejo.
  const conCarga = (bloque: { cargando: boolean }, contenido: React.ReactNode, alto = 420) =>
    !tarjetasListas || bloque.cargando ? (
      <Skeleton variant="rounded" height={alto} sx={{ borderRadius: "14px" }} />
    ) : (
      contenido
    );

  const tarjetas = [
    {
      title: "Ventas",
      value: formatoMonto(ventasHoy.TotalVentasPeriodo),
      subtitle: `vs ${formatoMonto(ventasHoy.PromedioVentasPeriodo)}`,
      percentageChange: ventasHoy.PorcentajeCambio,
      cargando: cargandoVentas,
      icon: <IconCurrencyDollar />,
    },
    {
      title: "Margen de ventas",
      value: formatoPorcentaje(margenBrutoHoy.MargenPorcentajePeriodo, 2),
      // VariacionMargen es la diferencia en puntos: margen actual − anterior.
      subtitle: `vs ${formatoPorcentaje(
        (margenBrutoHoy.MargenPorcentajePeriodo ?? 0) - (margenBrutoHoy.VariacionMargen ?? 0),
        2
      )}`,
      percentageChange: margenBrutoHoy.VariacionMargen,
      cargando: cargandoMargen,
      icon: <IconTrendingUp />,
    },
    {
      title: "Cantidad de ventas",
      value: formatUnidades(transaccionHoy.CantidadTransaccionesHoy),
      subtitle: `vs ${formatUnidades(transaccionHoy.CantidadTransaccionesAyer)}`,
      percentageChange: transaccionHoy.PorcentajeCambio,
      cargando: cargandoTransacciones,
      icon: <IconShoppingCart />,
    },
    {
      title: "Notas de crédito",
      value: formatUnidades(Notascredito.CantidadNotasCreditoPeriodo),
      subtitle: `vs ${formatUnidades(Notascredito.CantidadNotasCreditoAnterior)}`,
      percentageChange: Notascredito.PorcentajeCambioNotasCredito,
      // Más notas de crédito es peor: la subida se pinta en rojo.
      masEsMejor: false,
      cargando: cargandoNotas,
      icon: <IconCreditCard />,
    },
    {
      title: "Ítems vendidos",
      value: formatUnidades(productosDistintos.ProductosPeriodoActual),
      subtitle: `vs ${formatUnidades(productosDistintos.ProductosPeriodoAnterior)}`,
      percentageChange: productosDistintos.PorcentajeCambio,
      cargando: cargandoProductos,
      icon: <IconStack2 />,
    },
    {
      title: "Unidades vendidas",
      value: formatUnidades(unidadesVendidas.CantidadVendida),
      subtitle: `vs ${formatUnidades(unidadesVendidas.CantidadVendidaAnterior)}`,
      percentageChange: unidadesVendidas.PorcentajeCambio,
      cargando: cargandoUnidades,
      icon: <IconBox />,
    },
  ];

  // Detalle de las tarjetas: mismos filtros que ellas.
  const detalleTarjetas = useDetalleTarjetas(
    {
      fechaInicio: filtros.fechaInicio,
      fechaFin: filtros.fechaFin,
      canal: filtros.canal,
      sku: filtros.sku,
      familia: filtros.familia,
      subfamilia: filtros.subfamilia,
    },
    [
      filtros.temporada || etiquetaRango(filtros.fechaInicio, filtros.fechaFin),
      filtros.canal ? `Canal: ${canalPorClave(filtros.canal)?.nombre ?? filtros.canal}` : "Todos los canales",
      filtros.sku ? `SKU: ${filtros.sku}` : "",
      filtros.familia ? `Familia: ${filtros.familia}` : "",
      filtros.subfamilia ? `Subfamilia: ${filtros.subfamilia}` : "",
    ].filter(Boolean)
  );

  return (
    <PageContainer title="Resumen Ventas" description="Resumen de las ventas">
      <Box sx={{ maxWidth: 1680, mx: "auto" }}>
        <FotoDelDiaHeader valorInicial={filtros} onFilterChange={(f) => setFiltros(f)} />

        <Grid container spacing={2}>
          {tarjetas.map((card) => (
            <Grid item xs={6} sm={6} md={4} xl={2} key={card.title}>
              <MetricCard {...card} nota={notaSinNc(card.title, true)} onClick={detalleTarjetas.alPulsar(card.title)} />
            </Grid>
          ))}

          <Grid item xs={12}>
            <SeccionTitulo title="Canales" infoRight="Participación de cada canal y su tendencia diaria." />
          </Grid>
          <Grid item xs={12} lg={4.5}>
            <VentasCanalChart filters={filtros} />
          </Grid>
          <Grid item xs={12} lg={7.5}>
            <VentasChart filtros={filtros} />
          </Grid>

          <Grid item xs={12}>
            <SeccionTitulo title="Categorías y vendedores" infoRight="Dónde está el margen y quién vende más." />
          </Grid>
          <Grid item xs={12} xl={5.5}>
            {conCarga(categorias, <CategoriasBarChart data={categorias.datos} />)}
          </Grid>
          <Grid item xs={12} xl={6.5}>
            {conCarga(vendedores, <TopVendedoresChart data={vendedores.datos} />)}
          </Grid>

          <Grid item xs={12}>
            <SeccionTitulo title="Productos" infoRight="Más rentables, menos rentables y más vendidos." />
          </Grid>
          <Grid item xs={12} xl={5}>
            {conCarga(rentabilidad, <RentabilidadChart data={rentabilidad.datos} />, 480)}
          </Grid>
          <Grid item xs={12} xl={7}>
            {conCarga(rentabilidadMinima, <TopRentabilidadMinima data={rentabilidadMinima.datos} />, 480)}
          </Grid>
          <Grid item xs={12}>
            {conCarga(detalle, <ProductosVendidos data={detalleTransformado} />, 560)}
          </Grid>
        </Grid>
      </Box>
      {detalleTarjetas.ventana}
    </PageContainer>
  );
};
export default ResumenVentas;






