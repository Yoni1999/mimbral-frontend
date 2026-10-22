"use client";

import React from "react";
import { Box, Button, Grid, Tab, Tabs, Typography } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import {
  IconCreditCard,
  IconCurrencyDollar,
  IconPackage,
  IconReceipt2,
  IconSearch,
  IconShoppingCart,
  IconTrendingUp,
} from "@tabler/icons-react";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import MetricCard from "@/app/(DashboardLayout)/utilities/ventas/components/MetricCard";
import ListaBarras from "@/app/(DashboardLayout)/utilities/ventas/components/ListaBarras";
import RankingProductos from "@/app/(DashboardLayout)/utilities/ventas/components/RankingProductos";
import TendenciaCanales, { Punto, puntosDeTendencia, totalesPorCanal } from "@/app/(DashboardLayout)/utilities/ventas/components/TendenciaCanales";
import { conPeriodoRapido, etiquetaRango, rangoInicial, resolverPeriodoRapido } from "@/app/(DashboardLayout)/utilities/ventas/components/RangosRapidos";
import { CANALES, Panel, formatoMonto, formatoPorcentaje, pestanasSx, tarjetaSx, tinta } from "@/app/(DashboardLayout)/utilities/ventas/components/estilo";
import { useDetalleTarjetas } from "@/app/(DashboardLayout)/utilities/ventas/components/detalle/useDetalleTarjetas";
import { apiJson } from "@/utils/apiClient";
import { useCargaDatos } from "@/utils/useCargaDatos";
import { useEstadoVista } from "@/utils/estadoVista";
import { BACKEND_URL } from "@/config";
import HeaderProducto, { FiltrosProducto } from "./components/HeaderProducto";
import PanelVendedores from "./components/PanelVendedores";
import PanelInventario from "./components/PanelInventario";
import PanelHistoria from "./components/PanelHistoria";
import PanelCompras from "./components/PanelCompras";

type Pestana = "resumen" | "vendedores" | "inventario" | "historia" | "compras";

const PESTANAS: { valor: Pestana; texto: string }[] = [
  { valor: "resumen", texto: "Resumen" },
  { valor: "vendedores", texto: "Vendedores" },
  { valor: "inventario", texto: "Inventario" },
  { valor: "historia", texto: "Historia de ventas" },
  { valor: "compras", texto: "Compras" },
];

const n = (v: unknown) => Number(v) || 0;
const unidades = (v: number) => v.toLocaleString("es-CL", { maximumFractionDigits: 0 });
const vs = (texto: string) => `vs ${texto}`;

/** Los KPI de /api/pv llegan como arreglo de una fila (o como objeto). */
const primeraFila = async (url: string, signal: AbortSignal) => {
  const data = await apiJson(url, { signal });
  return (Array.isArray(data) ? data[0] : data) ?? {};
};

const useKpi = (url: string | null) =>
  useCargaDatos<Record<string, any>>(url, (signal) => primeraFila(url!, signal), {});

/** Análisis de producto: un SKU visto por período y canal (resumen, quién lo
 *  vende, stock, historia y compras), con los mismos filtros y componentes que
 *  el resto de las vistas. Abre con ?itemCode=<sku> (desde cualquier lista de
 *  productos) o con el último producto visto. */
const AnalisisProductoPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const skuUrl = searchParams?.get("itemCode") || "";

  const [filtros, setFiltros] = useEstadoVista<FiltrosProducto>(
    "producto-analisis",
    () => ({ producto: null, canal: "", temporada: "", modoComparacion: "", ...rangoInicial() }),
    { serializar: conPeriodoRapido, restaurar: (g) => resolverPeriodoRapido<FiltrosProducto>(g) }
  );
  const [pestana, setPestana] = useEstadoVista<{ valor: Pestana }>("producto-analisis:pestana", () => ({ valor: "resumen" }));
  const [selectorAbierto, setSelectorAbierto] = React.useState(false);

  // Producto pedido por la URL: se toma y se limpia la dirección, así al
  // recargar manda lo que el usuario eligió después.
  React.useEffect(() => {
    if (!skuUrl) return;
    setFiltros((f) => (f.producto?.sku === skuUrl ? f : { ...f, producto: { sku: skuUrl, nombre: "" } }));
    router.replace("/utilities/analisis-producto1.1");
  }, [skuUrl, router, setFiltros]);

  // Producto que llegó solo con el SKU: se busca su nombre e imagen.
  const producto = filtros.producto;
  const urlNombre = producto && !producto.nombre ? `${BACKEND_URL}/api/pv/SKU?query=${encodeURIComponent(producto.sku)}` : null;
  const { datos: encontrado } = useCargaDatos<{ nombre: string; imagen?: string } | null>(
    urlNombre,
    async (signal) => {
      const json = await apiJson(urlNombre!, { signal });
      const p = (Array.isArray(json) ? json : []).find((x: any) => String(x.itemcode) === producto!.sku);
      return p ? { nombre: p.itemname, imagen: p.U_Imagen || undefined } : null;
    },
    null
  );
  React.useEffect(() => {
    if (encontrado && producto && !producto.nombre) setFiltros((f) => ({ ...f, producto: { ...f.producto!, ...encontrado } }));
  }, [encontrado, producto, setFiltros]);

  const sku = producto?.sku ?? "";
  const params = (extra: Record<string, string> = {}) =>
    new URLSearchParams({
      itemCode: sku,
      fechaInicio: filtros.fechaInicio,
      fechaFin: filtros.fechaFin,
      ...(filtros.canal ? { canal: filtros.canal } : {}),
      ...extra,
    }).toString();
  const queryKpi = params(filtros.modoComparacion ? { modoComparacion: filtros.modoComparacion } : {});
  const urlKpi = (endpoint: string) => (sku ? `${BACKEND_URL}/api/pv/${endpoint}?${queryKpi}` : null);

  // KPIs y tendencia solo con la pestaña Resumen a la vista.
  const enResumen = pestana.valor === "resumen";
  const ventas = useKpi(enResumen ? urlKpi("ventastotal") : null);
  const margen = useKpi(enResumen ? urlKpi("margentotal") : null);
  const unidadesVendidas = useKpi(enResumen ? urlKpi("unidadesvendidas") : null);
  const transacciones = useKpi(enResumen ? urlKpi("transacciones") : null);
  const ticket = useKpi(enResumen ? urlKpi("ticketpromedio") : null);
  const notas = useKpi(enResumen ? urlKpi("notascreditopv") : null);

  const urlTendencia = sku && enResumen ? `${BACKEND_URL}/api/pv/historico?${params()}` : null;
  const tendencia = useCargaDatos<Punto[]>(urlTendencia, async (signal) => puntosDeTendencia(await apiJson(urlTendencia!, { signal })), []);
  const canales = totalesPorCanal(tendencia.datos)
    .filter((c) => c.venta !== 0)
    .sort((a, b) => b.venta - a.venta);
  const totalCanales = canales.reduce((s, c) => s + c.venta, 0);

  // Margen en % de la venta, como en el resto de las vistas.
  const ventaActual = n(ventas.datos.TotalVentasPeriodo);
  const ventaAnterior = n(margen.datos.TotalVentasAnterior);
  const margenActual = ventaActual ? (n(margen.datos.MargenBrutoPeriodo) / ventaActual) * 100 : 0;
  const margenAnterior = ventaAnterior ? (n(margen.datos.MargenBrutoAnterior) / ventaAnterior) * 100 : 0;

  const tarjetas = [
    {
      title: "Ventas",
      value: formatoMonto(ventaActual),
      subtitle: vs(formatoMonto(ventas.datos.TotalVentasAnterior)),
      percentageChange: ventas.datos.PorcentajeCambio,
      cargando: ventas.cargando,
      icon: <IconCurrencyDollar />,
    },
    {
      title: "Margen de ventas",
      value: formatoPorcentaje(margenActual, 2),
      subtitle: vs(formatoPorcentaje(margenAnterior, 2)),
      percentageChange: ventaAnterior && ventaActual ? margenActual - margenAnterior : undefined,
      cargando: margen.cargando || ventas.cargando,
      icon: <IconTrendingUp />,
    },
    {
      title: "Unidades vendidas",
      value: unidades(n(unidadesVendidas.datos.CantidadVendida)),
      subtitle: vs(unidades(n(unidadesVendidas.datos.CantidadVendidaAnterior))),
      percentageChange: unidadesVendidas.datos.PorcentajeCambio,
      cargando: unidadesVendidas.cargando,
      icon: <IconPackage />,
    },
    {
      title: "Cantidad de ventas",
      value: unidades(n(transacciones.datos.CantidadTransaccionesPeriodo)),
      subtitle: vs(unidades(n(transacciones.datos.CantidadTransaccionesAnterior))),
      percentageChange: transacciones.datos.PorcentajeCambio,
      cargando: transacciones.cargando,
      icon: <IconShoppingCart />,
    },
    {
      title: "Ticket promedio",
      value: formatoMonto(ticket.datos.PromedioPorTicket),
      subtitle: vs(formatoMonto(ticket.datos.PromedioAnterior)),
      percentageChange: ticket.datos.PorcentajeCambio,
      cargando: ticket.cargando,
      icon: <IconReceipt2 />,
    },
    {
      title: "Notas de crédito",
      value: unidades(n(notas.datos.CantidadNotasCreditoPeriodo)),
      subtitle: `${unidades(n(notas.datos.CantidadProductosDevueltosPeriodo))} unidades devueltas`,
      percentageChange: notas.datos.PorcentajeCambioNotasCredito,
      cargando: notas.cargando,
      masEsMejor: false,
      icon: <IconCreditCard />,
    },
  ];

  // Detalle de las tarjetas: el producto, su canal y el período.
  const detalleTarjetas = useDetalleTarjetas(
    { fechaInicio: filtros.fechaInicio, fechaFin: filtros.fechaFin, canal: filtros.canal, sku },
    [
      filtros.temporada || etiquetaRango(filtros.fechaInicio, filtros.fechaFin),
      producto ? `${producto.sku} · ${producto.nombre}` : "",
      filtros.canal ? `Canal: ${CANALES.find((c) => c.clave === filtros.canal)?.nombre ?? filtros.canal}` : "Todos los canales",
    ].filter(Boolean)
  );

  const cuerpo = !producto ? (
    // Sin producto: se invita a buscar uno, o a partir por los más vendidos.
    <>
      <Box sx={{ ...tarjetaSx, p: { xs: 3, md: 4 }, mb: 2, textAlign: "center" }}>
        <Typography sx={{ fontSize: 18, fontWeight: 750, color: tinta.primaria }}>¿Qué producto quieres analizar?</Typography>
        <Typography sx={{ fontSize: 13, color: tinta.secundaria, mt: 0.5, mb: 2 }}>
          Búscalo por nombre o SKU, o elige uno de los más vendidos del período.
        </Typography>
        <Button
          variant="contained"
          disableElevation
          startIcon={<IconSearch size={16} />}
          onClick={() => setSelectorAbierto(true)}
          sx={{ textTransform: "none", borderRadius: "10px", fontWeight: 600 }}
        >
          Buscar producto
        </Button>
      </Box>
      <RankingProductos
        claveVista="producto-analisis:sugeridos"
        parametros={{ fechaInicio: filtros.fechaInicio, fechaFin: filtros.fechaFin, canal: filtros.canal }}
        onElegir={(p) => setFiltros((f) => ({ ...f, producto: { sku: p.sku, nombre: p.nombre, imagen: p.imagen } }))}
      />
    </>
  ) : (
    <>
      <Tabs value={pestana.valor} onChange={(_, v) => setPestana({ valor: v })} variant="scrollable" allowScrollButtonsMobile sx={pestanasSx}>
        {PESTANAS.map((p) => (
          <Tab key={p.valor} value={p.valor} label={p.texto} />
        ))}
      </Tabs>

      {pestana.valor === "resumen" && (
        <>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {tarjetas.map((t) => (
              <Grid item xs={12} sm={6} md={4} lg={2} key={t.title}>
                <MetricCard {...t} onClick={detalleTarjetas.alPulsar(t.title)} />
              </Grid>
            ))}
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={12} lg={5}>
              <Panel
                titulo="Ventas por canal"
                descripcion={tendencia.cargando ? "Cargando…" : `Total del período: ${formatoMonto(totalCanales)} · pulsa uno para filtrar`}
              >
                <ListaBarras
                  cargando={tendencia.cargando}
                  vacio="Sin ventas en el período."
                  seleccionada={filtros.canal || null}
                  items={canales.map((c) => ({
                    clave: c.clave,
                    etiqueta: c.nombre,
                    valor: c.venta,
                    color: c.color,
                    texto: formatoMonto(c.venta),
                    detalle: (
                      <Typography component="span" sx={{ fontSize: 12, color: tinta.tenue, minWidth: 44, textAlign: "right" }}>
                        {totalCanales > 0 ? formatoPorcentaje((c.venta / totalCanales) * 100) : "—"}
                      </Typography>
                    ),
                  }))}
                  onSeleccionar={(item) => setFiltros((f) => ({ ...f, canal: f.canal === item.clave ? "" : item.clave }))}
                />
              </Panel>
            </Grid>
            <Grid item xs={12} lg={7}>
              <TendenciaCanales datos={tendencia.datos} cargando={tendencia.cargando} />
            </Grid>
          </Grid>
        </>
      )}
      {pestana.valor === "vendedores" && <PanelVendedores query={params()} />}
      {pestana.valor === "inventario" && <PanelInventario sku={sku} />}
      {pestana.valor === "historia" && <PanelHistoria sku={sku} />}
      {pestana.valor === "compras" && <PanelCompras sku={sku} />}
    </>
  );

  return (
    <PageContainer title="Análisis de producto" description="Ventas, vendedores, stock, historia y compras de un producto">
      <Box sx={{ maxWidth: 1680, mx: "auto" }}>
        <HeaderProducto filtros={filtros} setFiltros={setFiltros} selectorAbierto={selectorAbierto} setSelectorAbierto={setSelectorAbierto} />
        {cuerpo}
      </Box>
      {detalleTarjetas.ventana}
    </PageContainer>
  );
};

export default AnalisisProductoPage;
