"use client";
import React from "react";
import { Box, Grid, Tab, Tabs } from "@mui/material";
import { useSearchParams } from "next/navigation";
import {
  IconCreditCard,
  IconCurrencyDollar,
  IconPackage,
  IconReceipt,
  IconShoppingCart,
  IconTrendingUp,
} from "@tabler/icons-react";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import HeaderVendedor, { Filters } from "./components/Header";
import FormasPago, { FormaPagoItem } from "./components/FormaPago";
import CategoriasVendidas from "./components/SoldCategories";
import { consultaVendedor, textoComparacion } from "./components/consulta";
import RankingProductos from "../components/RankingProductos";
import MetricCard from "../components/MetricCard";
import SeccionTitulo from "../components/SeccionTitulo";
import {
  canalPorClave,
  formatoMonto,
  formatoPorcentaje,
  pestanasSx,
} from "../components/estilo";
import ListaClientes from "../components/detalle/ListaClientes";
import { useDetalleTarjetas } from "../components/detalle/useDetalleTarjetas";
import {
  conPeriodoRapido,
  etiquetaRango,
  rangoInicial,
  resolverPeriodoRapido,
} from "../components/RangosRapidos";
import { apiJson } from "@/utils/apiClient";
import { useCargaDatos } from "@/utils/useCargaDatos";
import { useEstadoVista } from "@/utils/estadoVista";
import { BACKEND_URL } from "@/config";

/** Los KPIs llegan como un arreglo de una fila (a veces como objeto suelto). */
const primeraFila = async (url: string, signal: AbortSignal) => {
  const data = await apiJson(url, { signal });
  return (Array.isArray(data) ? data[0] : data) ?? {};
};

const n = (v: unknown) => Number(v) || 0;

const unidades = (v: number) =>
  v.toLocaleString("es-CL", { maximumFractionDigits: 0 });

/** Un KPI de /api/pv/*: lo pide con los filtros y entrega la fila tal cual. */
const useKpi = (ruta: string, query: string | null) => {
  const url = query === null ? null : `${BACKEND_URL}/api/pv/${ruta}?${query}`;
  return useCargaDatos<Record<string, any>>(
    url,
    (signal) => primeraFila(url!, signal),
    {},
  );
};

const VentasVendedorPage: React.FC = () => {
  const searchParams = useSearchParams();

  // Lo buscado se recuerda al volver a la vista; si la URL trae parámetros
  // (al venir desde otra vista), mandan ellos. Sin fechas se abre en "Ayer".
  const desdeUrl: Filters = {
    fechaInicio: searchParams?.get("fechaInicio") || "",
    fechaFin: searchParams?.get("fechaFin") || "",
    vendedorEmpresa: searchParams?.get("vendedor") || "",
    modoComparacion: searchParams?.get("modoComparacion") || "",
    canal: searchParams?.get("canal") || "",
  };
  const conUrl = Object.values(desdeUrl).some(Boolean);
  const normalizar = (f: Filters): Filters => ({
    ...f,
    ...(!f.fechaInicio || !f.fechaFin ? rangoInicial() : {}),
    // "Período anterior" es la comparación por defecto: se guarda vacía.
    modoComparacion:
      f.modoComparacion === "MismoPeriodoAnoAnterior" ? f.modoComparacion : "",
  });
  const [filtros, setFiltros] = useEstadoVista<Filters>(
    "ventas-por-vendedor",
    () => normalizar(desdeUrl),
    {
      serializar: conPeriodoRapido,
      restaurar: (guardado) =>
        normalizar(
          conUrl ? desdeUrl : resolverPeriodoRapido<Filters>(guardado),
        ),
    },
  );

  // Cada bloque se identifica por su URL con los filtros: al cambiar uno se
  // limpia al instante y solo se muestra la respuesta del filtro actual.
  // Pestaña Ventas o Clientes (debajo de la barra de filtros); los datos de
  // Ventas solo se piden con esa pestaña abierta.
  const [pestana, setPestana] = useEstadoVista<{
    valor: "ventas" | "clientes";
  }>("ventas-por-vendedor:pestana", () => ({ valor: "ventas" }));
  const enVentas = pestana.valor === "ventas";

  const query = consultaVendedor(filtros);
  const queryVentas = enVentas ? query : null;
  const ventas = useKpi("ventastotal", queryVentas);
  const margen = useKpi("margentotal", queryVentas);
  const productos = useKpi("productosdistintos", queryVentas);
  const unidadesVendidas = useKpi("unidadesvendidas", queryVentas);
  const transacciones = useKpi("transacciones", queryVentas);
  const notas = useKpi("notascreditopv", queryVentas);

  const urlFormasPago = enVentas
    ? `${BACKEND_URL}/api/oc/formas-pago?${query}`
    : null;
  const formasPago = useCargaDatos<FormaPagoItem[]>(
    urlFormasPago,
    async (signal) => {
      const data = await apiJson(urlFormasPago!, { signal });
      return Array.isArray(data) ? data : [];
    },
    [],
  );

  // Margen en % de la venta, como en Resumen de ventas: la variación es la
  // diferencia entre el margen actual y el anterior.
  const ventaActual = n(ventas.datos.TotalVentasPeriodo);
  const ventaAnterior = n(margen.datos.TotalVentasAnterior);
  const margenActual = ventaActual
    ? (n(margen.datos.MargenBrutoPeriodo) / ventaActual) * 100
    : 0;
  const margenAnterior = ventaAnterior
    ? (n(margen.datos.MargenBrutoAnterior) / ventaAnterior) * 100
    : 0;

  const vs = (texto: string) => `vs ${texto}`;

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
      percentageChange: ventaAnterior
        ? margenActual - margenAnterior
        : undefined,
      cargando: margen.cargando || ventas.cargando,
      icon: <IconTrendingUp />,
    },
    {
      title: "Cantidad de ventas",
      value: unidades(n(transacciones.datos.CantidadTransaccionesPeriodo)),
      subtitle: vs(
        unidades(n(transacciones.datos.CantidadTransaccionesAnterior)),
      ),
      percentageChange: transacciones.datos.PorcentajeCambio,
      cargando: transacciones.cargando,
      icon: <IconShoppingCart />,
    },
    {
      title: "Notas de crédito",
      value: unidades(n(notas.datos.CantidadNotasCreditoPeriodo)),
      subtitle: vs(unidades(n(notas.datos.CantidadNotasCreditoAnterior))),
      percentageChange: notas.datos.PorcentajeCambioNotasCredito,
      cargando: notas.cargando,
      masEsMejor: false,
      icon: <IconCreditCard />,
    },
    {
      title: "Ítems vendidos",
      value: unidades(n(productos.datos.ProductosPeriodoActual)),
      subtitle: vs(unidades(n(productos.datos.ProductosPeriodoAnterior))),
      percentageChange: productos.datos.PorcentajeCambio,
      cargando: productos.cargando,
      icon: <IconReceipt />,
    },
    {
      title: "Unidades vendidas",
      value: unidades(n(unidadesVendidas.datos.CantidadVendida)),
      subtitle: vs(unidades(n(unidadesVendidas.datos.CantidadVendidaAnterior))),
      percentageChange: unidadesVendidas.datos.PorcentajeCambio,
      cargando: unidadesVendidas.cargando,
      icon: <IconPackage />,
    },
  ];

  // Detalle de las tarjetas: canal, período y vendedor.
  const filtrosDetalle = {
    fechaInicio: filtros.fechaInicio,
    fechaFin: filtros.fechaFin,
    canal: filtros.canal,
    vendedorEmpresa: filtros.vendedorEmpresa,
  };
  const etiquetasDetalle = [
    etiquetaRango(filtros.fechaInicio, filtros.fechaFin),
    filtros.canal
      ? `Canal: ${canalPorClave(filtros.canal)?.nombre ?? filtros.canal}`
      : "Todos los canales",
    filtros.vendedorEmpresa
      ? `Vendedor: ${filtros.vendedorEmpresa}`
      : "Todos los vendedores",
  ];
  const detalleTarjetas = useDetalleTarjetas(filtrosDetalle, etiquetasDetalle);

  return (
    <PageContainer
      title="Ventas por vendedor"
      description="Ventas, margen y productos por vendedor y canal"
    >
      <Box sx={{ maxWidth: 1680, mx: "auto" }}>
        <HeaderVendedor filtros={filtros} setFiltros={setFiltros} />

        <Tabs
          value={pestana.valor}
          onChange={(_, v) => setPestana({ valor: v })}
          sx={pestanasSx}
        >
          <Tab value="ventas" label="Ventas" />
          <Tab value="clientes" label="Clientes" />
        </Tabs>

        {pestana.valor === "clientes" ? (
          <ListaClientes
            filtros={filtrosDetalle}
            etiquetas={etiquetasDetalle}
          />
        ) : (
          <>
            <Grid container spacing={2}>
              {tarjetas.map((t) => (
                <Grid item xs={6} sm={6} md={4} lg={2} key={t.title}>
                  <MetricCard
                    {...t}
                    onClick={detalleTarjetas.alPulsar(t.title)}
                  />
                </Grid>
              ))}
            </Grid>

            <SeccionTitulo
              title="Cómo vende"
              infoRight="Categorías del período y condición de pago."
            />
            <Grid container spacing={2}>
              <Grid item xs={12} lg={7}>
                <CategoriasVendidas filtros={filtros} />
              </Grid>
              <Grid item xs={12} lg={5}>
                <FormasPago
                  data={formasPago.datos}
                  cargando={formasPago.cargando}
                />
              </Grid>
            </Grid>

            <SeccionTitulo
              title="Productos"
              infoRight="Ordena por venta, unidades o margen; de más a menos o al revés."
            />
            <RankingProductos
              claveVista="ventas-por-vendedor:productos"
              parametros={{
                fechaInicio: filtros.fechaInicio,
                fechaFin: filtros.fechaFin,
                canal: filtros.canal,
                vendedor: filtros.vendedorEmpresa,
              }}
              comparacion={{
                url: `${BACKEND_URL}/api/pv/topproductosmasvendidos?${query}`,
                texto: textoComparacion(filtros.modoComparacion),
              }}
            />
          </>
        )}
      </Box>
      {detalleTarjetas.ventana}
    </PageContainer>
  );
};

export default VentasVendedorPage;
