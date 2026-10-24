"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Box, Grid, Tab, Tabs } from "@mui/material";
import { IconBox, IconCurrencyDollar, IconReceipt, IconShoppingCart, IconStack2, IconTrendingUp } from "@tabler/icons-react";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { formatUnidades } from "@/utils/format";
import { useApiDatos } from "@/utils/useCargaDatos";
import { BACKEND_URL } from "@/config";
import SeccionTitulo from "../components/SeccionTitulo";
import MetricCard from "../components/MetricCard";
import { conPeriodoRapido, etiquetaRango, rangoInicial, resolverPeriodoRapido } from "../components/RangosRapidos";
import { useEstadoVista } from "@/utils/estadoVista";
import { canalPorClave, formatoMonto, formatoPorcentaje, pestanasSx } from "../components/estilo";
import { useDetalleTarjetas } from "../components/detalle/useDetalleTarjetas";
import HeaderFilters, { Filters } from "./components/Header";
import VendedoresDelCanal from "./components/Sellers";
import VentasMensuales from "./components/MonthlySalesRotation";
import ClientesFrecuentesTable from "./components/FrequentCustomers";
import TopProductosChart from "./components/Top10SoldProducts";
import VentasPorCategoriaChart from "./components/SalesByCategory";
import ProductosVendidos from "./components/SoldProducts";

/** Variación porcentual entre dos montos; null si no hay base. */
const variacion = (actual: number, anterior: number) =>
  anterior ? ((actual - anterior) / anterior) * 100 : null;

const VentasPorCanal = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Recuerda lo buscado (al volver a la vista o reabrir la pestaña sigue
  // ahí); la primera vez abre en "Ayer". El canal de la URL (p. ej. al
  // venir desde Resumen de ventas) manda sobre lo guardado.
  const canalParam = searchParams?.get("canal") || "";
  const [filters, setFilters] = useEstadoVista<Filters>("ventas-por-canal", () => ({ canal: "", ...rangoInicial() }), {
    serializar: conPeriodoRapido,
    restaurar: (guardado) => {
      const f = resolverPeriodoRapido<Filters>(guardado);
      return {
        canal: canalParam || f.canal || "",
        ...(f.fechaInicio && f.fechaFin ? { fechaInicio: f.fechaInicio, fechaFin: f.fechaFin } : rangoInicial()),
      };
    },
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/authentication/login");
    }
  }, [router]);

  // Pestaña abierta y vendedor elegido también se recuerdan.
  const [vista, setVista] = useEstadoVista<{
    pestana: "resumen" | "productos";
    vendedor: { codigo: number; nombre: string } | null;
  }>("ventas-por-canal:vista", () => ({ pestana: "resumen", vendedor: null }), {
    // Un vendedor guardado solo vale si se vuelve al mismo canal.
    restaurar: (g) => (canalParam && canalParam !== filters.canal ? { ...g, vendedor: null } : g),
  });
  const { pestana, vendedor } = vista;
  const setVendedor = (v: { codigo: number; nombre: string } | null) => setVista((x) => ({ ...x, vendedor: v }));
  const setPestana = (p: "resumen" | "productos") => setVista((x) => ({ ...x, pestana: p }));

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
    setVendedor(null); // otro canal o rango: el vendedor elegido ya no aplica
  };

  // Cada bloque se identifica por su URL con los filtros: al cambiar un
  // filtro (o el vendedor) se limpia al instante, se cancela lo pendiente y
  // solo se muestra la respuesta del filtro actual (ver useCargaDatos).
  const query = new URLSearchParams(
    Object.fromEntries(
      Object.entries({ ...filters, vendedorEmpresa: vendedor?.codigo })
        .filter(([_, value]) => value !== undefined && value !== null && value !== "")
        .map(([key, value]) => [key, String(value)])
    )
  ).toString();
  const url = (endpoint: string) => `${BACKEND_URL}/api/${endpoint}?${query}`;
  const enResumen = pestana === "resumen";
  const urlResumen = (endpoint: string) => (enResumen ? url(endpoint) : null);

  const ventas = useApiDatos<any>(urlResumen("ventas-periodo"), {});
  const transacciones = useApiDatos<any>(urlResumen("transacciones-periodo"), {});
  const unidades = useApiDatos<any>(urlResumen("unidades-vendidas-periodo"), {});
  const productos = useApiDatos<any>(urlResumen("productos-distintos-periodo"), {});
  const margen = useApiDatos<any>(urlResumen("margen/bruto-periodo"), {});
  const topProductos = useApiDatos<any[]>(urlResumen("top-productos"), []);
  const ventasCategoria = useApiDatos<any[]>(urlResumen("categorias/ventas-categoria"), []);

  const ticket = (venta?: number, tx?: number) => (venta && tx ? venta / tx : 0);
  const ticketActual = ticket(ventas.datos.TotalVentasPeriodo, transacciones.datos.CantidadTransaccionesPeriodo);
  const ticketAnterior = ticket(ventas.datos.TotalVentasAnterior, transacciones.datos.CantidadTransaccionesAnterior);

  // Margen como porcentaje de la venta, igual que en Resumen de ventas.
  const pct = (margen?: number, venta?: number) => (venta ? ((margen ?? 0) / venta) * 100 : null);
  const margenActual = pct(margen.datos.MargenBrutoPeriodo, margen.datos.TotalVentasPeriodo);
  const margenAnterior = pct(margen.datos.MargenBrutoAnterior, margen.datos.TotalVentasAnterior);

  const tarjetas = [
    {
      title: "Ventas",
      value: formatoMonto(ventas.datos.TotalVentasPeriodo),
      subtitle: `vs ${formatoMonto(ventas.datos.TotalVentasAnterior)}`,
      percentageChange: ventas.datos.PorcentajeCambio,
      cargando: ventas.cargando,
      icon: <IconCurrencyDollar />,
    },
    {
      title: "Margen de ventas",
      value: formatoPorcentaje(margenActual, 2),
      subtitle: `vs ${formatoPorcentaje(margenAnterior, 2)} · ${formatoMonto(margen.datos.MargenBrutoPeriodo)} de margen`,
      // Margen actual menos el anterior, como en Resumen. (PorcentajeCambio de
      // margen/bruto-periodo es la variación de la venta, no del margen.)
      percentageChange: margenActual != null && margenAnterior != null ? margenActual - margenAnterior : undefined,
      cargando: margen.cargando,
      icon: <IconTrendingUp />,
    },
    {
      title: "Unidades vendidas",
      value: formatUnidades(unidades.datos.CantidadVendida),
      subtitle: `vs ${formatUnidades(unidades.datos.CantidadVendidaAnterior)}`,
      percentageChange: unidades.datos.PorcentajeCambio,
      cargando: unidades.cargando,
      icon: <IconStack2 />,
    },
    {
      title: "Ítems vendidos",
      value: formatUnidades(productos.datos.ProductosPeriodoActual),
      subtitle: `vs ${formatUnidades(productos.datos.ProductosPeriodoAnterior)}`,
      percentageChange: productos.datos.PorcentajeCambio,
      cargando: productos.cargando,
      icon: <IconBox />,
    },
    {
      title: "Cantidad de ventas",
      value: formatUnidades(transacciones.datos.CantidadTransaccionesPeriodo),
      subtitle: `vs ${formatUnidades(transacciones.datos.CantidadTransaccionesAnterior)}`,
      percentageChange: transacciones.datos.PorcentajeCambio,
      cargando: transacciones.cargando,
      icon: <IconShoppingCart />,
    },
    {
      title: "Ticket promedio",
      value: formatoMonto(ticketActual),
      subtitle: `vs ${formatoMonto(ticketAnterior)}`,
      // Antes mostraba la variación de la cantidad de ventas.
      percentageChange: variacion(ticketActual, ticketAnterior) ?? undefined,
      cargando: ventas.cargando || transacciones.cargando,
      icon: <IconReceipt />,
    },
  ];

  // Detalle de las tarjetas: canal, período y vendedor elegido.
  const detalleTarjetas = useDetalleTarjetas(
    {
      fechaInicio: filters.fechaInicio,
      fechaFin: filters.fechaFin,
      canal: filters.canal,
      vendedorEmpresa: vendedor?.codigo,
    },
    [
      etiquetaRango(filters.fechaInicio, filters.fechaFin),
      filters.canal ? `Canal: ${canalPorClave(filters.canal)?.nombre ?? filters.canal}` : "Todos los canales",
      vendedor ? `Vendedor: ${vendedor.nombre}` : "",
    ].filter(Boolean)
  );

  return (
    <PageContainer title="Ventas por Canal" description="Resumen de ventas filtradas por canal, período y rango de fechas">
      <Box sx={{ maxWidth: 1680, mx: "auto" }}>
        <HeaderFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          vendedor={vendedor}
          onQuitarVendedor={() => setVendedor(null)}
        />

        <Tabs
          value={pestana}
          onChange={(_, v) => setPestana(v)}
          sx={pestanasSx}
        >
          <Tab value="resumen" label="Resumen del canal" />
          <Tab value="productos" label="Productos vendidos" />
        </Tabs>

        {pestana === "productos" ? (
          <ProductosVendidos filters={{ ...filters, vendedor: vendedor?.codigo ?? null }} />
        ) : (
          <Grid container spacing={2}>
            {tarjetas.map((card) => (
              <Grid item xs={6} sm={6} md={4} xl={2} key={card.title}>
                <MetricCard {...card} onClick={detalleTarjetas.alPulsar(card.title)} />
              </Grid>
            ))}

            <Grid item xs={12}>
              <SeccionTitulo title="Vendedores y estacionalidad" infoRight="Quién vende en el canal y cómo va el año contra los anteriores." />
            </Grid>
            <Grid item xs={12} lg={5}>
              <VendedoresDelCanal
                canal={filters.canal}
                fechaInicio={filters.fechaInicio}
                fechaFin={filters.fechaFin}
                seleccionado={vendedor?.codigo ?? null}
                onVendedorSeleccionado={setVendedor}
              />
            </Grid>
            <Grid item xs={12} lg={7}>
              <VentasMensuales filters={filters} />
            </Grid>

            <Grid item xs={12}>
              <SeccionTitulo title="Clientes" infoRight="Los que más compraron en el período." />
            </Grid>
            <Grid item xs={12}>
              <ClientesFrecuentesTable filters={{ ...filters, vendedor: vendedor?.codigo ?? null }} />
            </Grid>

            <Grid item xs={12}>
              <SeccionTitulo title="Productos y categorías" infoRight="Qué se vende en el canal." />
            </Grid>
            <Grid item xs={12} lg={6}>
              <TopProductosChart data={topProductos.datos} cargando={topProductos.cargando} />
            </Grid>
            <Grid item xs={12} lg={6}>
              <VentasPorCategoriaChart data={ventasCategoria.datos} cargando={ventasCategoria.cargando} />
            </Grid>
          </Grid>
        )}
      </Box>
      {detalleTarjetas.ventana}
    </PageContainer>
  );
};

export default VentasPorCanal;
