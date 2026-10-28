"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Grid, Typography } from "@mui/material";
import { IconArrowRight, IconCurrencyDollar, IconPackages, IconPigMoney } from "@tabler/icons-react";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { useApiDatos } from "@/utils/useCargaDatos";
import { useEstadoVista } from "@/utils/estadoVista";
import MetricCard from "../components/MetricCard";
import SeccionTitulo from "../components/SeccionTitulo";
import ListaBarras from "../components/ListaBarras";
import { conPeriodoRapido, etiquetaRango, rangoInicial, resolverPeriodoRapido } from "../components/RangosRapidos";
import { Panel, Pildoras, formatoMonto, formatoPesos, formatoPorcentaje, tinta } from "../components/estilo";
import HeaderMl, { RangoMl } from "./components/HeaderMl";
import TendenciaTipos from "./components/TendenciaTipos";
import TablaProductosMl from "./components/TablaProductosMl";
import DesgloseMl, { VistaDesglose } from "./components/DesgloseMl";
import {
  AvisoEstimaciones,
  BarraTipos,
  CategoriasMl,
  ProductosMl,
  ResumenMl,
  TIPOS_ENVIO,
  TipoEnvio,
  Totales,
  cobros,
  n,
  sumaPar,
  unidades,
  urlMl,
  variacion,
} from "./components/comun";

type FiltroTipo = TipoEnvio | "";
const OPCIONES_TIPO: { valor: FiltroTipo | "todos"; texto: string }[] = [
  { valor: "todos", texto: "Todos" },
  { valor: "full", texto: "Full" },
  { valor: "colecta", texto: "Colecta" },
  { valor: "flex", texto: "Flex" },
];

/** Totales de todos los envíos (sin "sin detalle", que no tiene SKU ni cobros). */
const conDetalle = (t?: ResumenMl["actual"]): Totales | undefined =>
  t && {
    venta: sumaPar(...TIPOS_ENVIO.map((x) => t[x.clave]?.venta)),
    unidades: TIPOS_ENVIO.reduce((s, x) => s + n(t[x.clave]?.unidades), 0),
    ordenes: TIPOS_ENVIO.reduce((s, x) => s + n(t[x.clave]?.ordenes), 0),
    comision: sumaPar(...TIPOS_ENVIO.map((x) => t[x.clave]?.comision)),
    envio: sumaPar(...TIPOS_ENVIO.map((x) => t[x.clave]?.envio)),
    costo: sumaPar(...TIPOS_ENVIO.map((x) => t[x.clave]?.costo)),
    margen: sumaPar(...TIPOS_ENVIO.map((x) => t[x.clave]?.margen)),
    ventaConCosto: sumaPar(...TIPOS_ENVIO.map((x) => t[x.clave]?.ventaConCosto)),
  };

/** Ventas → Mercado Libre: cuánto se vende en ML, cuánto cobra ML, cuánto
 *  queda y el margen después de todo (tarjetas pulsables con su detalle);
 *  reparto y tendencia por Full, Colecta y Flex, categorías de ML y los
 *  productos más vendidos. */
export default function VentasMercadoLibre() {
  const router = useRouter();
  const [vista, setVista] = useEstadoVista<RangoMl & { tipo: FiltroTipo }>("ventas-mercado-libre", () => ({ tipo: "", ...rangoInicial() }), {
    serializar: conPeriodoRapido,
    restaurar: (g) => {
      const f = resolverPeriodoRapido<RangoMl & { tipo: FiltroTipo }>(g);
      return { tipo: f.tipo ?? "", ...(f.fechaInicio && f.fechaFin ? { fechaInicio: f.fechaInicio, fechaFin: f.fechaFin } : rangoInicial()) };
    },
  });
  const rango = { fechaInicio: vista.fechaInicio, fechaFin: vista.fechaFin };

  const resumen = useApiDatos<ResumenMl | null>(urlMl("resumen", rango), null);
  const categorias = useApiDatos<CategoriasMl | null>(urlMl("categorias", rango), null);
  const productos = useApiDatos<ProductosMl | null>(urlMl("productos", { ...rango, tipo: vista.tipo, limite: 10 }), null);

  const a = resumen.datos?.actual;
  const p = resumen.datos?.anterior;
  const total = sumaPar(conDetalle(a)?.venta, a?.sin_dato.venta);
  const totalAnterior = sumaPar(conDetalle(p)?.venta, p?.sin_dato.venta);
  const detalle = conDetalle(a);
  const detalleAnterior = conDetalle(p);
  const pct = (parte: number, todo: number) => (todo ? (parte / todo) * 100 : null);
  const [desglose, setDesglose] = React.useState<VistaDesglose | null>(null);

  const cobra = cobros(detalle);
  const queda = n(detalle?.venta.neto) - n(cobra.neto);
  const margen = n(detalle?.margen?.neto);
  const margenAnterior = n(detalleAnterior?.margen?.neto);
  // % de margen sobre la venta que tiene costo en SAP (la que entra en el margen).
  const margenPct = pct(margen, n(detalle?.ventaConCosto?.neto));
  const margenPctAnterior = pct(margenAnterior, n(detalleAnterior?.ventaConCosto?.neto));
  const unidadesTotal = n(detalle?.unidades) + n(a?.sin_dato.unidades);
  const unidadesAnterior = n(detalleAnterior?.unidades) + n(p?.sin_dato.unidades);
  const items = resumen.datos?.items;

  // Tres tarjetas; cada una abre su detalle. Full, Colecta y Flex están en
  // "Reparto de la venta"; lo que cobra ML y lo que queda, en el detalle de la venta.
  const tarjetas = [
    {
      title: "Venta Mercado Libre",
      value: formatoMonto(total.neto),
      subtitle: `vs ${formatoMonto(totalAnterior.neto)} · cobra ML ${formatoMonto(cobra.neto)} · queda ${formatoMonto(queda)}${n(a?.sin_dato.venta.neto) ? ` · incluye ${formatoMonto(a?.sin_dato.venta.neto)} sin detalle` : ""}`,
      percentageChange: variacion(n(total.neto), n(totalAnterior.neto)) ?? undefined,
      nota: `Sin IVA. Con IVA: ${formatoPesos(total.conIva)}. ML cobra ${formatoPesos(cobra.neto)} (${formatoPorcentaje(pct(n(cobra.neto), n(detalle?.venta.neto)))}) en comisión y envío.${n(a?.sin_dato.venta.neto) ? ` Incluye ${formatoMonto(a?.sin_dato.venta.neto)} que ML informa pero no están en mercadolibre-oms (sin tipo de envío ni producto).` : ""}`,
      icon: <IconCurrencyDollar />,
      onClick: () => setDesglose("dinero"),
    },
    {
      title: "Unidades e ítems vendidos",
      value: `${unidades(unidadesTotal)} u.`,
      subtitle: `${unidades(items?.actual)} ítems · vs ${unidades(unidadesAnterior)} u. y ${unidades(items?.anterior)} ítems`,
      percentageChange: variacion(unidadesTotal, unidadesAnterior) ?? undefined,
      nota: "Unidades vendidas y productos distintos (un producto que vende por Full y Colecta cuenta una vez).",
      icon: <IconPackages />,
      onClick: () => setDesglose("unidades"),
    },
    {
      title: "Margen después de todo",
      // El % es la cifra principal; la variación es la diferencia en puntos (pp), como en Resumen de ventas.
      value: formatoPorcentaje(margenPct),
      subtitle: `${formatoMonto(margen)} de margen · vs ${formatoPorcentaje(margenPctAnterior)} (${formatoMonto(margenAnterior)})`,
      percentageChange: margenPct != null && margenPctAnterior != null ? margenPct - margenPctAnterior : undefined,
      unidadVariacion: "pp" as const,
      nota: "Margen sobre la venta: venta − comisión − envío − costo de los productos (costo promedio de SAP), todo sin IVA. La variación es en puntos porcentuales.",
      icon: <IconPigMoney />,
      onClick: () => setDesglose("dinero"),
    },
  ];

  // Reparto por tipo de envío, con "sin detalle" al final si lo hay.
  const filasTipo = [
    ...TIPOS_ENVIO.map((t) => ({ ...t, totales: a?.[t.clave] })),
    { clave: "sin_dato", nombre: "Sin detalle", color: "#cbd5e1", descripcion: "Informado por ML, no está en mercadolibre-oms", totales: a?.sin_dato },
  ].filter((f) => n(f.totales?.venta.neto) !== 0);

  const irACategoria = (id: string, nombre: string) =>
    router.push(
      `/utilities/analisis-categoria?${new URLSearchParams({ arbol: "mercadolibre", mlCategoria: id, mlNombre: nombre, fechaInicio: rango.fechaInicio, fechaFin: rango.fechaFin })}`
    );
  const irAlInforme = () =>
    router.push(`/informes/mas-vendidos-mercado-libre?${new URLSearchParams({ tipo: vista.tipo, fechaInicio: rango.fechaInicio, fechaFin: rango.fechaFin })}`);

  const filasCategorias = (categorias.datos?.filas ?? []).filter((c) => n(c.venta.neto) !== 0).slice(0, 10);

  return (
    <PageContainer title="Ventas Mercado Libre" description="Ventas de Mercado Libre por tipo de envío: Full, Colecta y Flex">
      <Box sx={{ maxWidth: 1680, mx: "auto" }}>
        <HeaderMl
          titulo="Ventas Mercado Libre"
          contexto="Full, Colecta y Flex"
          rango={rango}
          onRango={(r) => setVista((v) => ({ ...v, ...r }))}
          datosAl={resumen.cargando ? undefined : resumen.datos?.datosAl ?? null}
          enEstadoInicial={!vista.tipo && etiquetaRango(rango.fechaInicio, rango.fechaFin) === "Ayer"}
          onLimpiar={() => setVista({ tipo: "", ...rangoInicial() })}
        />
        <AvisoEstimaciones estimaciones={resumen.datos?.estimaciones} />

        <Grid container spacing={2}>
          {tarjetas.map((t) => (
            <Grid item xs={12} sm={4} key={t.title}>
              <MetricCard {...t} cargando={resumen.cargando} onClick={resumen.datos ? t.onClick : undefined} />
            </Grid>
          ))}

          <Grid item xs={12}>
            <SeccionTitulo title="Por tipo de envío" infoRight="Montos sin IVA. Pasa el cursor para ver el con IVA y lo que cobra ML." />
          </Grid>
          <Grid item xs={12} lg={5}>
            <Panel titulo="Reparto de la venta" descripcion={resumen.cargando ? "Cargando…" : `Total del período: ${formatoMonto(total.neto)}`}>
              <ListaBarras
                cargando={resumen.cargando}
                filasCargando={4}
                items={filasTipo.map((f) => {
                  const c = cobros(f.totales);
                  return {
                    clave: f.clave,
                    etiqueta: f.nombre,
                    valor: n(f.totales?.venta.neto),
                    color: f.color,
                    texto: formatoMonto(f.totales?.venta.neto),
                    detalle: (
                      <Typography component="span" sx={{ fontSize: 12, color: tinta.tenue, minWidth: 44, textAlign: "right" }}>
                        {formatoPorcentaje(pct(n(f.totales?.venta.neto), n(total.neto)))}
                      </Typography>
                    ),
                    tooltip: [
                      f.descripcion,
                      `${unidades(f.totales?.unidades)} unidades`,
                      f.totales?.ordenes ? `${unidades(f.totales.ordenes)} ${f.clave === "full" ? "órdenes (por SKU y día)" : "líneas de orden"}` : null,
                      `Con IVA ${formatoPesos(f.totales?.venta.conIva)}`,
                      c.neto ? `Cobra ML ${formatoPesos(c.neto)} (${formatoPorcentaje(pct(n(c.neto), n(f.totales?.venta.neto)))})` : null,
                    ]
                      .filter(Boolean)
                      .join(" · "),
                  };
                })}
              />
            </Panel>
          </Grid>
          <Grid item xs={12} lg={7}>
            <TendenciaTipos tendencia={resumen.datos?.tendencia ?? []} cargando={resumen.cargando} />
          </Grid>

          <Grid item xs={12}>
            <SeccionTitulo title="Categorías y productos" infoRight="Categorías según Mercado Libre." />
          </Grid>
          <Grid item xs={12} lg={5}>
            <Panel
              titulo="Categorías de Mercado Libre"
              descripcion="Primer nivel del árbol de ML · pulsa una para entrar"
              accion={
                <Button size="small" endIcon={<IconArrowRight size={14} />} onClick={() => router.push("/utilities/analisis-categoria?arbol=mercadolibre")} sx={{ textTransform: "none", fontWeight: 600 }}>
                  Ver árbol
                </Button>
              }
            >
              <ListaBarras
                cargando={categorias.cargando}
                numerado
                items={filasCategorias.map((c) => ({
                  clave: c.id ?? "sin-categoria",
                  etiqueta: c.nombre,
                  valor: n(c.venta.neto),
                  texto: formatoMonto(c.venta.neto),
                  detalle: (
                    <Box sx={{ width: 56 }}>
                      <BarraTipos porTipo={c.porTipo} alto={5} />
                    </Box>
                  ),
                  tooltip: `${formatoPorcentaje(n(c.participacion) * 100)} del total · ${unidades(c.unidades)} unidades · ${unidades(c.productos)} productos`,
                }))}
                onSeleccionar={(item) => item.clave !== "sin-categoria" && irACategoria(item.clave, item.etiqueta)}
              />
            </Panel>
          </Grid>
          <Grid item xs={12} lg={7}>
            <Panel
              titulo="Productos más vendidos"
              descripcion="Top 10 por venta · el stock abre todas las bodegas"
              accion={
                <Button size="small" endIcon={<IconArrowRight size={14} />} onClick={irAlInforme} sx={{ textTransform: "none", fontWeight: 600, whiteSpace: "nowrap" }}>
                  Informe completo
                </Button>
              }
              sx={{ px: 0, "& > :first-of-type": { px: 2.5 } }}
            >
              <Box sx={{ px: 2.5, mb: 1.5 }}>
                <Pildoras
                  etiqueta="Tipo de envío"
                  opciones={OPCIONES_TIPO}
                  valor={vista.tipo || "todos"}
                  onCambiar={(t) => setVista((v) => ({ ...v, tipo: t === "todos" ? "" : (t as TipoEnvio) }))}
                />
              </Box>
              <TablaProductosMl filas={productos.datos?.filas ?? []} cargando={productos.cargando} tipo={vista.tipo} filasCargando={10} />
            </Panel>
          </Grid>
        </Grid>
      </Box>
      {desglose && resumen.datos && detalle ? (
        <DesgloseMl
          vista={desglose}
          resumen={resumen.datos}
          total={detalle}
          etiquetaPeriodo={etiquetaRango(rango.fechaInicio, rango.fechaFin)}
          onCerrar={() => setDesglose(null)}
        />
      ) : (
        <></>
      )}
    </PageContainer>
  );
}
