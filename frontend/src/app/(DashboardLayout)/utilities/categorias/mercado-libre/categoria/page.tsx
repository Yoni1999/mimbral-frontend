"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Box, Button, Grid, Skeleton, Typography } from "@mui/material";
import { IconArrowLeft, IconCash, IconPackages, IconPercentage, IconShoppingCart } from "@tabler/icons-react";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { useApiDatos } from "@/utils/useCargaDatos";
import MetricCard from "../../../ventas/components/MetricCard";
import SeccionTitulo from "../../../ventas/components/SeccionTitulo";
import { Panel, cifraSx, formatoMonto, formatoPesos, formatoPorcentaje, tarjetaSx, tinta } from "../../../ventas/components/estilo";
import { AvisosDatos, Comparativo, Evolucion, LeyendaTiposCat, Mercado, Productos, SelectorPeriodo, TIPOS_CAT, fecha, mensajeError, n, nombreMes, parametrosPeriodo, pct, pp, unidades, urlCat, usePeriodoMl } from "../components/comun";
import { TablaCategorias, TablaProductosCat, rutaFicha } from "../components/tablas";

function TooltipMes({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const fila = payload[0]?.payload ?? {};
  return (
    <Box sx={{ ...tarjetaSx, p: 1.5, minWidth: 210, boxShadow: "0 12px 30px rgba(15,23,42,0.14)" }}>
      <Typography sx={{ fontSize: 12, fontWeight: 700, color: tinta.secundaria, mb: 1 }}>{label}</Typography>
      {TIPOS_CAT.filter((t) => n(fila[t.clave]) > 0).map((t) => (
        <Box key={t.clave} sx={{ display: "flex", justifyContent: "space-between", gap: 2, fontSize: 12.5, py: 0.25 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: "2px", bgcolor: t.color }} />
            {t.nombre}
          </Box>
          <Box sx={{ fontWeight: 600, ...cifraSx }}>{formatoPesos(fila[t.clave])}</Box>
        </Box>
      ))}
      <Box sx={{ borderTop: `1px solid ${tinta.borde}`, mt: 1, pt: 1, fontSize: 12.5, ...cifraSx }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
          <span>Venta neta</span>
          <span>{formatoPesos(fila.total)}</span>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", color: tinta.secundaria }}>
          <span>Margen</span>
          <span>{fila.margenPct == null ? "—" : formatoPorcentaje(fila.margenPct)}</span>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "space-between", color: tinta.secundaria }}>
          <span>vs año anterior</span>
          <span>{fila.vs == null ? "sin dato" : `${fila.vs > 0 ? "+" : ""}${formatoPorcentaje(fila.vs)}`}</span>
        </Box>
      </Box>
    </Box>
  );
}

/** Ficha de una categoría de Mercado Libre: evolución mensual, subcategorías, productos y mercado. */
export default function FichaCategoriaMl() {
  const sp = useSearchParams();
  const id = sp?.get("id") || "";
  const nombreUrl = sp?.get("nombre") || id;
  const [periodo, setPeriodo] = usePeriodoMl();
  const params = parametrosPeriodo(periodo);

  const mercado = useApiDatos<Mercado | null>(id ? urlCat("mercado", { categoria: id }) : null, null);
  const cat = mercado.datos?.categoria;
  const nombre = cat?.nombre || nombreUrl;
  // Posición en el árbol según su ruta (0 = primer nivel).
  const posicion = cat ? cat.ruta.length - 1 : null;
  const padreId = cat && cat.ruta.length > 1 ? cat.ruta[cat.ruta.length - 2].id : undefined;

  const evolucion = useApiDatos<Evolucion | null>(id ? urlCat("evolucion", { categoria: id, meses: 24 }) : null, null);
  const productos = useApiDatos<Productos | null>(id ? urlCat("productos", { ...params, categoria: id, orden: "venta", limite: 1000 }) : null, null);
  // Subcategorías: mismo comparativo, un nivel más abajo, dentro de esta categoría.
  const hijas = useApiDatos<Comparativo | null>(id && posicion != null && !cat?.esHoja ? urlCat("comparativo", { ...params, nivel: posicion + 1, padre: id }) : null, null);
  // Totales de la categoría: su propia fila en el comparativo de su nivel (no dependen del tope de productos).
  const propia = useApiDatos<Comparativo | null>(id && posicion != null ? urlCat("comparativo", { ...params, nivel: posicion, padre: padreId }) : null, null);
  const fila = propia.datos?.categorias.find((c) => c.id === id);

  const filas = productos.datos?.filas ?? [];
  const cargandoTotales = mercado.cargando || propia.cargando;

  const serie = (evolucion.datos?.meses ?? []).map((m) => ({
    mes: nombreMes(m.mes),
    ...Object.fromEntries(TIPOS_CAT.map((t) => [t.clave, n(m.porTipo?.[t.clave]?.neto)])),
    total: n(m.venta.neto),
    margenPct: m.margenPct == null ? null : m.margenPct * 100,
    vs: m.vsAnioAnterior == null ? null : m.vsAnioAnterior * 100,
  }));

  if (!id) {
    return (
      <PageContainer title="Categoría de Mercado Libre" description="Ficha de una categoría">
        <Typography sx={{ p: 3 }}>
          Elige una categoría desde el <Link href="/utilities/categorias/mercado-libre/informe">informe de categorías</Link>.
        </Typography>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={`${nombre} · Mercado Libre`} description="Evolución, productos y mercado de una categoría de Mercado Libre">
      <Box sx={{ maxWidth: 1680, mx: "auto" }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, mb: 1.5 }}>
          <Button component={Link} href="/utilities/categorias/mercado-libre/informe" size="small" startIcon={<IconArrowLeft size={15} />} sx={{ textTransform: "none" }}>
            Informe de categorías
          </Button>
          {(cat?.ruta ?? []).slice(0, -1).map((r) => (
            <React.Fragment key={r.id}>
              <Box component="span" sx={{ color: tinta.tenue }}>›</Box>
              <Box component={Link} href={rutaFicha(r.id, r.nombre)} sx={{ fontSize: 13, fontWeight: 600, color: tinta.acento, textDecoration: "none" }}>
                {r.nombre}
              </Box>
            </React.Fragment>
          ))}
          <Box component="span" sx={{ color: tinta.tenue }}>›</Box>
          <Typography sx={{ fontSize: 18, fontWeight: 750, color: tinta.primaria }}>{nombre}</Typography>
          <Typography sx={{ fontSize: 12, color: tinta.tenue }}>{id}</Typography>
        </Box>

        <SelectorPeriodo filtros={periodo} setFiltros={setPeriodo} contexto={productos.datos} />
        {productos.error ? <Typography sx={{ color: "#b42318", fontSize: 13, mb: 2 }}>No se pudo cargar la categoría: {mensajeError(productos.error)}</Typography> : null}
        <AvisosDatos contexto={productos.datos} />

        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>
            <MetricCard title="Venta neta" value={formatoMonto(fila?.actual.venta.neto)} subtitle={`Comparación: ${formatoMonto(fila?.comparacion.venta.neto)}`} percentageChange={pct(fila?.variacion.venta) ?? undefined} icon={<IconCash size={18} />} cargando={cargandoTotales} />
          </Grid>
          <Grid item xs={6} md={3}>
            <MetricCard title="Unidades" value={unidades(fila?.actual.unidades)} subtitle={`Comparación: ${unidades(fila?.comparacion.unidades)}`} percentageChange={pct(fila?.variacion.unidades) ?? undefined} icon={<IconPackages size={18} />} cargando={cargandoTotales} />
          </Grid>
          <Grid item xs={6} md={3}>
            <MetricCard
              title="Margen %"
              value={fila?.actual.margenPct == null ? "—" : formatoPorcentaje(fila.actual.margenPct * 100)}
              subtitle={`Comparación: ${fila?.comparacion.margenPct == null ? "—" : formatoPorcentaje(fila.comparacion.margenPct * 100)} · margen ${formatoMonto(fila?.actual.margen)}`}
              percentageChange={pp(fila?.variacion.margenPuntos) ?? undefined}
              unidadVariacion="pp"
              icon={<IconPercentage size={18} />}
              cargando={cargandoTotales}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <MetricCard title="Productos con venta" value={unidades(fila?.actual.productos)} subtitle={`Comparación: ${unidades(fila?.comparacion.productos)} · ${fila?.participacion.actual == null ? "—" : formatoPorcentaje(fila.participacion.actual * 100)} de su nivel`} icon={<IconShoppingCart size={18} />} cargando={cargandoTotales} />
          </Grid>
        </Grid>

        <SeccionTitulo title="Evolución mensual" infoRight={evolucion.datos?.datosDesde ? `Venta neta por tipo de envío · datos desde el ${fecha(evolucion.datos.datosDesde)}` : "Venta neta por tipo de envío"} />
        <Panel titulo="Venta por mes y margen %" descripcion="Barras: venta neta por tipo de envío. Línea: margen % estimado." accion={<LeyendaTiposCat />}>
          {evolucion.cargando ? (
            <Skeleton variant="rounded" height={320} />
          ) : serie.length === 0 ? (
            <Typography sx={{ color: tinta.tenue, fontSize: 13, py: 6, textAlign: "center" }}>Sin ventas en esta categoría.</Typography>
          ) : (
            <Box sx={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={serie} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#eef2f6" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: tinta.secundaria }} tickLine={false} axisLine={{ stroke: tinta.borde }} />
                  <YAxis yAxisId="venta" tick={{ fontSize: 11, fill: tinta.secundaria }} tickFormatter={(v) => formatoMonto(v)} tickLine={false} axisLine={false} width={70} />
                  <YAxis yAxisId="margen" orientation="right" tick={{ fontSize: 11, fill: tinta.secundaria }} tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} width={44} />
                  <Tooltip content={<TooltipMes />} cursor={{ fill: "rgba(37,99,235,0.05)" }} />
                  {TIPOS_CAT.map((t) => (
                    <Bar key={t.clave} yAxisId="venta" dataKey={t.clave} name={t.nombre} stackId="v" fill={t.color} maxBarSize={38} />
                  ))}
                  <Line yAxisId="margen" type="monotone" dataKey="margenPct" name="Margen %" stroke="#0f172a" strokeWidth={2} dot={{ r: 2.5 }} connectNulls />
                </ComposedChart>
              </ResponsiveContainer>
            </Box>
          )}
        </Panel>

        {!cat?.esHoja && (
          <>
            <SeccionTitulo title="Subcategorías" infoRight="Dentro de esta categoría, período contra comparación." />
            <TablaCategorias filas={hijas.datos?.categorias ?? []} cargando={hijas.cargando || mercado.cargando} nombreExcel={`subcategorias-ml-${nombre}`} />
          </>
        )}

        <SeccionTitulo title="Productos" infoRight={`Productos con venta en alguno de los dos períodos${(productos.datos?.cantidad ?? 0) > filas.length ? ` · se muestran los ${filas.length} de mayor venta de ${productos.datos?.cantidad}` : ""}.`} />
        <TablaProductosCat filas={filas} cargando={productos.cargando} nombreExcel={`productos-ml-${nombre}`} conCategoria={false} />

        <SeccionTitulo title="Mercado" infoRight="Qué se busca en esta categoría en Mercado Libre y nuestra presencia." />
        <Grid container spacing={2}>
          <Grid item xs={12} md={5}>
            <Panel titulo="Nuestra presencia" descripcion="Publicaciones nuestras en esta categoría">
              {mercado.cargando ? (
                <Skeleton height={120} />
              ) : cat ? (
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", rowGap: 0.75, fontSize: 13, ...cifraSx }}>
                  <span>Publicaciones en Mercado Libre (todos los vendedores)</span>
                  <b>{unidades(cat.publicacionesEnMl)}</b>
                  <span>Nuestras publicaciones</span>
                  <b>{unidades(cat.nuestras.publicaciones)}</b>
                  <span>… activas</span>
                  <b>{unidades(cat.nuestras.activas)}</b>
                  <span>… activas en Full</span>
                  <b>{unidades(cat.nuestras.activasFull)}</b>
                  <span>… pausadas</span>
                  <b>{unidades(cat.nuestras.pausadas)}</b>
                  <span>Productos (SKU) publicados</span>
                  <b>{unidades(cat.nuestras.skus)}</b>
                </Box>
              ) : (
                <Typography sx={{ fontSize: 13, color: tinta.tenue }}>Sin datos de la categoría.</Typography>
              )}
            </Panel>
          </Grid>
          <Grid item xs={12} md={7}>
            <Panel
              titulo="Búsquedas en tendencia"
              descripcion="Lo que más crece en búsquedas en esta categoría, según Mercado Libre"
              accion={
                <Button component={Link} href={`/utilities/categorias/mercado-libre/mercado?${new URLSearchParams({ id, nombre }).toString()}`} size="small" sx={{ textTransform: "none" }}>
                  Ver mercado
                </Button>
              }
            >
              {mercado.cargando ? (
                <Skeleton height={120} />
              ) : mercado.datos?.tendenciasError ? (
                <Typography sx={{ fontSize: 13, color: "#b54708" }}>{mercado.datos.tendenciasError}</Typography>
              ) : (mercado.datos?.tendencias ?? []).length === 0 ? (
                <Typography sx={{ fontSize: 13, color: tinta.tenue }}>Mercado Libre no informa tendencias para esta categoría.</Typography>
              ) : (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                  {mercado.datos!.tendencias.slice(0, 30).map((t) => (
                    <Box key={t.posicion} component="a" href={t.url ?? undefined} target="_blank" rel="noreferrer" sx={{ fontSize: 12.5, px: 1.1, py: 0.4, borderRadius: 999, border: `1px solid ${tinta.borde}`, color: tinta.primaria, textDecoration: "none", "&:hover": { borderColor: tinta.acento, color: tinta.acento } }}>
                      {t.posicion}. {t.busqueda}
                    </Box>
                  ))}
                </Box>
              )}
            </Panel>
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
}
