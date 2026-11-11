"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Box, Grid, Skeleton, Typography } from "@mui/material";
import { IconExternalLink, IconInfoCircle } from "@tabler/icons-react";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { useApiDatos } from "@/utils/useCargaDatos";
import { useEstadoVista } from "@/utils/estadoVista";
import SeccionTitulo from "../../../ventas/components/SeccionTitulo";
import ListaBarras from "../../../ventas/components/ListaBarras";
import { Panel, cifraSx, formatoMonto, formatoPorcentaje, tinta } from "../../../ventas/components/estilo";
import { Aviso, Comparativo, Mercado, fecha, n, parametrosPeriodo, unidades, urlCat, usePeriodoMl } from "../components/comun";
import { rutaFicha } from "../components/tablas";

type Paso = { id: string; nombre: string };

/**
 * Mercado: qué se busca en Mercado Libre en cada categoría (tendencias de la
 * API de ML), el tamaño de la categoría y nuestra presencia y venta en ella.
 */
export default function MercadoMl() {
  const sp = useSearchParams();
  const idUrl = sp?.get("id");
  const [periodo] = usePeriodoMl();
  const [nav, setNav] = useEstadoVista<{ ruta: Paso[] }>("categorias-ml:mercado", () => ({ ruta: [] }), {
    restaurar: (g) => (idUrl ? { ruta: [{ id: idUrl, nombre: sp?.get("nombre") || idUrl }] } : g),
  });
  const ruta = nav.ruta;
  const actual = ruta[ruta.length - 1];

  const mercado = useApiDatos<Mercado | null>(urlCat("mercado", { categoria: actual?.id }), null);
  const cat = mercado.datos?.categoria;
  // Nuestra venta por categoría en el nivel que se mira (para elegir y para comparar tamaño con venta).
  const ventas = useApiDatos<Comparativo | null>(
    actual && !cat ? null : urlCat("comparativo", { ...parametrosPeriodo(periodo), nivel: cat ? cat.ruta.length : 0, padre: actual?.id }),
    null
  );
  const filas = ventas.datos?.categorias.filter((c) => c.id) ?? [];
  const ventaPorId = new Map(filas.map((c) => [c.id as string, c]));

  // Subcategorías de ML (todas, vendamos o no) con nuestra venta al lado.
  const sub = cat?.subcategorias ?? [];
  const sinVenta = sub.filter((s) => !n(ventaPorId.get(s.id)?.actual.venta.neto));

  const miga = (texto: string, indice: number, activa: boolean) => (
    <Box
      key={indice}
      component={activa ? "span" : "button"}
      type={activa ? undefined : "button"}
      onClick={activa ? undefined : () => setNav({ ruta: ruta.slice(0, indice) })}
      sx={{ all: "unset", cursor: activa ? "default" : "pointer", fontSize: 13, fontWeight: activa ? 700 : 600, color: activa ? tinta.primaria : tinta.acento }}
    >
      {texto}
    </Box>
  );

  return (
    <PageContainer title="Mercado · Mercado Libre" description="Tendencias de búsqueda de Mercado Libre por categoría y nuestra presencia">
      <Box sx={{ maxWidth: 1680, mx: "auto" }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.75, mb: 1.5 }}>
          {miga("Todo Mercado Libre", 0, ruta.length === 0)}
          {ruta.map((p, i) => (
            <React.Fragment key={p.id}>
              <Box component="span" sx={{ color: tinta.tenue }}>›</Box>
              {miga(p.nombre, i + 1, i === ruta.length - 1)}
            </React.Fragment>
          ))}
          {actual && (
            <Box component={Link} href={rutaFicha(actual.id, actual.nombre)} sx={{ ml: 1, fontSize: 12.5, fontWeight: 600, color: tinta.acento, textDecoration: "none" }}>
              Ver ficha de la categoría
            </Box>
          )}
        </Box>

        <Box sx={{ mb: 2 }}>
          <Aviso tono="neutro" icono={<IconInfoCircle size={16} />}>
            Las tendencias vienen de la API de Mercado Libre (se actualizan a diario; se guardan una hora). Mercado Libre no entrega a nuestra aplicación
            los más vendidos del mercado por categoría ni las ventas de otros vendedores.
          </Aviso>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} lg={7}>
            <Panel
              titulo={actual ? `Búsquedas en tendencia en ${actual.nombre}` : "Búsquedas en tendencia en todo Mercado Libre Chile"}
              descripcion={mercado.datos?.tendenciasAl ? `Según Mercado Libre · consultado el ${fecha(mercado.datos.tendenciasAl)}` : "Según Mercado Libre"}
            >
              {mercado.cargando ? (
                <Skeleton variant="rounded" height={260} />
              ) : mercado.datos?.tendenciasError ? (
                <Typography sx={{ fontSize: 13, color: "#b54708" }}>{mercado.datos.tendenciasError}</Typography>
              ) : (mercado.datos?.tendencias ?? []).length === 0 ? (
                <Typography sx={{ fontSize: 13, color: tinta.tenue, py: 4, textAlign: "center" }}>Mercado Libre no informa tendencias para esta categoría.</Typography>
              ) : (
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, columnGap: 3 }}>
                  {mercado.datos!.tendencias.map((t) => (
                    <Box key={t.posicion} component="a" href={t.url ?? undefined} target="_blank" rel="noreferrer" sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.6, borderBottom: "1px solid #f1f5f9", fontSize: 13, color: tinta.primaria, textDecoration: "none", "&:hover": { color: tinta.acento } }}>
                      <Box sx={{ width: 24, color: tinta.tenue, fontWeight: 700, ...cifraSx }}>{t.posicion}</Box>
                      <Box sx={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.busqueda}</Box>
                      <IconExternalLink size={13} color={tinta.tenue} />
                    </Box>
                  ))}
                </Box>
              )}
            </Panel>
          </Grid>

          <Grid item xs={12} lg={5}>
            {cat ? (
              <Panel titulo="Tamaño y presencia" descripcion={`${cat.nombre} · ${cat.id}`}>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr auto", rowGap: 0.75, fontSize: 13, ...cifraSx }}>
                  <span>Publicaciones en Mercado Libre (todos los vendedores)</span>
                  <b>{unidades(cat.publicacionesEnMl)}</b>
                  <span>Nuestras publicaciones activas</span>
                  <b>{unidades(cat.nuestras.activas)}</b>
                  <span>… de ellas en Full</span>
                  <b>{unidades(cat.nuestras.activasFull)}</b>
                  <span>Nuestras publicaciones pausadas</span>
                  <b>{unidades(cat.nuestras.pausadas)}</b>
                  <span>Productos (SKU) publicados</span>
                  <b>{unidades(cat.nuestras.skus)}</b>
                  <span>Nuestra parte de las publicaciones</span>
                  <b>{cat.publicacionesEnMl ? formatoPorcentaje((cat.nuestras.activas / cat.publicacionesEnMl) * 100, 2) : "—"}</b>
                  <span>Subcategorías de ML sin venta nuestra en el período</span>
                  <b>
                    {ventas.cargando ? "…" : sinVenta.length} de {sub.length}
                  </b>
                </Box>
              </Panel>
            ) : (
              <Panel titulo="Elige una categoría" descripcion="Para ver su tamaño en Mercado Libre y nuestra presencia">
                <Typography sx={{ fontSize: 13, color: tinta.secundaria }}>
                  Pulsa una categoría de la lista de abajo. Sin categoría se muestran las búsquedas en tendencia de todo Mercado Libre Chile.
                </Typography>
              </Panel>
            )}
          </Grid>
        </Grid>

        <SeccionTitulo
          title={cat ? "Subcategorías" : "Categorías"}
          infoRight={cat ? "Tamaño en Mercado Libre (publicaciones de todos los vendedores) y nuestra venta neta del período." : "Nuestra venta neta del período por categoría; pulsa una para ver su mercado."}
        />
        <Grid container spacing={2}>
          {cat ? (
            <>
              <Grid item xs={12} md={6}>
                <Panel titulo="Más grandes en Mercado Libre" descripcion="Publicaciones de todos los vendedores; al lado, nuestra venta">
                  <ListaBarras
                    cargando={mercado.cargando}
                    vacio="Esta categoría no tiene subcategorías."
                    numerado
                    items={sub.slice(0, 15).map((s) => {
                      const v = n(ventaPorId.get(s.id)?.actual.venta.neto);
                      return { clave: s.id, etiqueta: s.nombre, valor: n(s.publicacionesEnMl), texto: `${unidades(s.publicacionesEnMl)} publ.`, detalle: <Box component="span" sx={{ fontSize: 12, color: v ? tinta.secundaria : "#b54708", minWidth: 84, textAlign: "right" }}>{v ? formatoMonto(v) : "sin venta"}</Box> };
                    })}
                    onSeleccionar={(i) => setNav({ ruta: [...ruta, { id: i.clave, nombre: i.etiqueta }] })}
                  />
                </Panel>
              </Grid>
              <Grid item xs={12} md={6}>
                <Panel titulo="Donde no vendemos" descripcion="Subcategorías de Mercado Libre sin venta nuestra en el período, de mayor a menor tamaño">
                  <ListaBarras
                    cargando={mercado.cargando || ventas.cargando}
                    vacio="Vendemos en todas las subcategorías."
                    numerado
                    colorPorDefecto="#eda100"
                    items={sinVenta.slice(0, 15).map((s) => ({ clave: s.id, etiqueta: s.nombre, valor: n(s.publicacionesEnMl), texto: `${unidades(s.publicacionesEnMl)} publ.` }))}
                    onSeleccionar={(i) => setNav({ ruta: [...ruta, { id: i.clave, nombre: i.etiqueta }] })}
                  />
                </Panel>
              </Grid>
            </>
          ) : (
            <Grid item xs={12}>
              <Panel titulo="Nuestra venta por categoría" descripcion="Pulsa una categoría para ver sus tendencias y su tamaño">
                <ListaBarras
                  cargando={ventas.cargando}
                  numerado
                  items={filas.map((c) => ({ clave: c.id as string, etiqueta: c.nombre, valor: n(c.actual.venta.neto), texto: formatoMonto(c.actual.venta.neto) }))}
                  onSeleccionar={(i) => setNav({ ruta: [...ruta, { id: i.clave, nombre: i.etiqueta }] })}
                />
              </Panel>
            </Grid>
          )}
        </Grid>
      </Box>
    </PageContainer>
  );
}
