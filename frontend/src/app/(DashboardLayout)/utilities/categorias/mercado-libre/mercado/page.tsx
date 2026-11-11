"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Box, Button, Grid, Skeleton, Tooltip, Typography } from "@mui/material";
import { IconBuildingStore, IconExternalLink, IconPackages, IconPlayerPause, IconWorld } from "@tabler/icons-react";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { useApiDatos } from "@/utils/useCargaDatos";
import { useEstadoVista } from "@/utils/estadoVista";
import SeccionTitulo from "../../../ventas/components/SeccionTitulo";
import MetricCard from "../../../ventas/components/MetricCard";
import ListaBarras from "../../../ventas/components/ListaBarras";
import TablaInforme, { ColumnaInforme } from "../../../ventas/mercado-libre/components/TablaInforme";
import { Panel, TextoCelda, cifraSx, estado, formatoMonto, formatoPesos, formatoPorcentaje, tinta } from "../../../ventas/components/estilo";
import { Comparativo, Mercado, MontoCorto, Par, fecha, n, parametrosPeriodo, unidades, urlCat, usePeriodoMl } from "../components/comun";
import { rutaFicha } from "../components/tablas";

type Paso = { id: string; nombre: string };

interface Publicacion {
  itemId: string;
  sku: string;
  variaciones: number;
  titulo: string | null;
  nombre: string | null;
  estado: string | null;
  logistica: string | null;
  catalogo: boolean;
  categoriaId: string | null;
  categoria: string | null;
  precio: number | null;
  precioOferta: number | null;
  stock: number | null;
  unidades30: number;
  venta30: Par;
  publicadaEl: string | null;
  url: string | null;
  /** Foto del producto (portada de su ficha). */
  imagen?: string | null;
}
interface Publicaciones {
  cantidad: number;
  conDatosPim: boolean;
  datosAl: string | null;
  filas: Publicacion[];
}

const ESTADOS: Record<string, { texto: string; tono: { color: string; fondo: string } }> = {
  active: { texto: "Activa", tono: estado.bien },
  paused: { texto: "Pausada", tono: { color: "#b54708", fondo: "#fffaeb" } },
  under_review: { texto: "En revisión", tono: estado.mal },
  inactive: { texto: "Inactiva", tono: estado.neutro },
  closed: { texto: "Finalizada", tono: estado.neutro },
};
const ENVIOS: Record<string, string> = { fulfillment: "Full", cross_docking: "Colecta", self_service: "Flex" };
const envio = (l: string | null) => (l ? ENVIOS[l] ?? "Otro" : "—");
const estadoDe = (e: string | null) => ESTADOS[e ?? ""] ?? { texto: e || "—", tono: estado.neutro };

function Chip({ texto, tono }: { texto: string; tono: { color: string; fondo: string } }) {
  return (
    <Box component="span" sx={{ px: 0.9, py: 0.25, borderRadius: 999, bgcolor: tono.fondo, color: tono.color, fontSize: 11.5, fontWeight: 700, whiteSpace: "nowrap" }}>
      {texto}
    </Box>
  );
}

/** Foto del producto en chico; al pasar el cursor se ve en grande. Sin foto, un recuadro vacío del mismo tamaño. */
function Miniatura({ url, titulo }: { url?: string | null; titulo: string }) {
  const [rota, setRota] = React.useState(false);
  const caja = { width: 44, height: 44, flexShrink: 0, borderRadius: "8px", border: `1px solid ${tinta.borde}`, bgcolor: "#fff" } as const;
  if (!url || rota) return <Box sx={{ ...caja, bgcolor: tinta.fondoSuave }} aria-hidden />;
  return (
    <Tooltip
      arrow
      placement="right"
      title={<Box component="img" src={url} alt={titulo} sx={{ display: "block", width: 240, height: 240, objectFit: "contain", bgcolor: "#fff", borderRadius: "6px" }} />}
    >
      <Box component="img" src={url} alt={titulo} loading="lazy" onError={() => setRota(true)} sx={{ ...caja, objectFit: "contain" }} />
    </Tooltip>
  );
}

const COLUMNAS: ColumnaInforme<Publicacion>[] = [
  {
    clave: "titulo",
    titulo: "Publicación",
    ancho: 30,
    valor: (f) => f.titulo,
    excel: "Título",
    celda: (f) => (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
        <Miniatura url={f.imagen} titulo={f.titulo || f.nombre || f.itemId} />
        <Box sx={{ minWidth: 0, flex: 1 }}>
        <TextoCelda texto={f.titulo || f.nombre || f.itemId} />
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, fontSize: 11.5 }}>
          {f.url ? (
            <Box component="a" href={f.url} target="_blank" rel="noreferrer" sx={{ color: tinta.acento, textDecoration: "none", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 0.25, "&:hover": { textDecoration: "underline" } }}>
              {f.itemId} <IconExternalLink size={12} />
            </Box>
          ) : (
            <span>{f.itemId}</span>
          )}
          {f.catalogo && <Box component="span" sx={{ color: tinta.tenue }}>· catálogo</Box>}
          {f.variaciones > 1 && <Box component="span" sx={{ color: tinta.tenue }}>· {f.variaciones} variaciones</Box>}
        </Box>
        </Box>
      </Box>
    ),
  },
  {
    clave: "sku",
    titulo: "SKU",
    ancho: 9,
    valor: (f) => f.sku,
    celda: (f) => (
      <Box component={Link} href={`/utilities/analisis-producto1.1?itemCode=${encodeURIComponent(f.sku)}`} sx={{ color: tinta.acento, textDecoration: "none", fontWeight: 600, "&:hover": { textDecoration: "underline" } }}>
        {f.sku}
      </Box>
    ),
  },
  { clave: "categoria", titulo: "Categoría", ancho: 13, valor: (f) => f.categoria, celda: (f) => <TextoCelda texto={f.categoria || "—"} fuerte={false} /> },
  { clave: "estado", titulo: "Estado", ancho: 8, valor: (f) => estadoDe(f.estado).texto, celda: (f) => <Chip {...estadoDe(f.estado)} /> },
  { clave: "envio", titulo: "Envío", ancho: 6, valor: (f) => envio(f.logistica) },
  {
    clave: "precio",
    titulo: "Precio",
    ancho: 9,
    alinear: "right",
    valor: (f) => f.precioOferta ?? f.precio,
    excel: "Precio vigente",
    celda: (f) =>
      f.precio == null ? (
        "—"
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", ...cifraSx }}>
          <Box component="span" sx={{ fontWeight: 700 }}>{formatoPesos(f.precioOferta ?? f.precio)}</Box>
          {f.precioOferta != null && <Box component="span" sx={{ fontSize: 10.5, color: tinta.tenue, textDecoration: "line-through" }}>{formatoPesos(f.precio)}</Box>}
        </Box>
      ),
  },
  { clave: "stock", titulo: "Stock", ancho: 6, alinear: "right", valor: (f) => f.stock, celda: (f) => (f.stock == null ? "—" : <Box sx={{ ...cifraSx, color: f.stock <= 0 ? "#b42318" : tinta.primaria, fontWeight: f.stock <= 0 ? 700 : 500 }}>{unidades(f.stock)}</Box>) },
  { clave: "un30", titulo: "Unid. 30 d", ancho: 8, alinear: "right", valor: (f) => f.unidades30, excel: "Unidades 30 días (producto)", celda: (f) => <Box sx={cifraSx}>{unidades(f.unidades30)}</Box> },
  { clave: "venta30", titulo: "Venta 30 d", ancho: 11, alinear: "right", valor: (f) => n(f.venta30?.neto), excel: "Venta neta 30 días (producto)", celda: (f) => <MontoCorto par={f.venta30} fuerte /> },
];

/**
 * Mercado: nuestras publicaciones en Mercado Libre por categoría (en tabla),
 * el tamaño de la categoría, y las búsquedas en tendencia de la API de ML.
 */
export default function MercadoMl() {
  const sp = useSearchParams();
  const idUrl = sp?.get("id");
  const [periodo] = usePeriodoMl();
  const [nav, setNav] = useEstadoVista<{ ruta: Paso[] }>("categorias-ml:mercado", () => ({ ruta: [] }), {
    restaurar: (g) => (idUrl ? { ruta: [{ id: idUrl, nombre: sp?.get("nombre") || idUrl }] } : g),
  });
  const [todas, setTodas] = React.useState(false);
  const ruta = nav.ruta;
  const actual = ruta[ruta.length - 1];

  const mercado = useApiDatos<Mercado | null>(urlCat("mercado", { categoria: actual?.id }), null);
  const cat = mercado.datos?.categoria;
  const pubs = useApiDatos<Publicaciones | null>(urlCat("publicaciones", { categoria: actual?.id, limite: 2000 }), null);
  // Nuestra venta por categoría en el nivel que se mira (para elegir y para ver dónde no vendemos).
  const ventas = useApiDatos<Comparativo | null>(
    actual && !cat ? null : urlCat("comparativo", { ...parametrosPeriodo(periodo), nivel: cat ? cat.ruta.length : 0, padre: actual?.id }),
    null
  );
  const filasVenta = ventas.datos?.categorias.filter((c) => c.id) ?? [];
  const ventaPorId = new Map(filasVenta.map((c) => [c.id as string, c]));
  const sub = cat?.subcategorias ?? [];
  const entrar = (id: string, nombre: string) => setNav({ ruta: [...ruta, { id, nombre }] });

  // Lista para navegar: subcategorías de ML (con su tamaño y nuestra venta) o, arriba del todo, nuestras categorías.
  const itemsNavegar = cat
    ? sub.map((s) => {
        const v = n(ventaPorId.get(s.id)?.actual.venta.neto);
        return {
          clave: s.id,
          etiqueta: s.nombre,
          valor: n(s.publicacionesEnMl),
          texto: `${unidades(s.publicacionesEnMl)} publ.`,
          detalle: <Box component="span" sx={{ fontSize: 12, fontWeight: 600, color: v ? tinta.secundaria : "#b54708", minWidth: 92, textAlign: "right" }}>{v ? formatoMonto(v) : "sin venta"}</Box>,
        };
      })
    : filasVenta.map((c) => ({ clave: c.id as string, etiqueta: c.nombre, valor: n(c.actual.venta.neto), texto: formatoMonto(c.actual.venta.neto) }));

  const tendencias = mercado.datos?.tendencias ?? [];
  const visibles = todas ? tendencias : tendencias.slice(0, 20);
  const sinVenta = sub.filter((s) => !n(ventaPorId.get(s.id)?.actual.venta.neto)).length;

  const miga = (texto: string, indice: number, activa: boolean) => (
    <Box
      key={indice}
      component={activa ? "span" : "button"}
      type={activa ? undefined : "button"}
      onClick={activa ? undefined : () => setNav({ ruta: ruta.slice(0, indice) })}
      sx={{ all: "unset", cursor: activa ? "default" : "pointer", fontSize: activa ? 18 : 13, fontWeight: activa ? 750 : 600, color: activa ? tinta.primaria : tinta.acento }}
    >
      {texto}
    </Box>
  );

  return (
    <PageContainer title="Mercado · Mercado Libre" description="Nuestras publicaciones por categoría, tamaño de la categoría y tendencias de búsqueda de Mercado Libre">
      <Box sx={{ maxWidth: 1680, mx: "auto" }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 0.75, mb: 2 }}>
          {miga("Todo Mercado Libre", 0, ruta.length === 0)}
          {ruta.map((p, i) => (
            <React.Fragment key={p.id}>
              <Box component="span" sx={{ color: tinta.tenue }}>›</Box>
              {miga(p.nombre, i + 1, i === ruta.length - 1)}
            </React.Fragment>
          ))}
          {actual && (
            <Box component={Link} href={rutaFicha(actual.id, actual.nombre)} sx={{ ml: 1.5, fontSize: 12.5, fontWeight: 600, color: tinta.acento, textDecoration: "none" }}>
              Ver ficha de ventas →
            </Box>
          )}
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>
            <MetricCard
              title="Publicaciones en Mercado Libre"
              value={cat ? unidades(cat.publicacionesEnMl) : "—"}
              subtitle={cat ? "De todos los vendedores, en esta categoría" : "Elige una categoría para ver su tamaño"}
              icon={<IconWorld size={18} />}
              cargando={mercado.cargando}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <MetricCard
              title="Nuestras publicaciones"
              value={unidades(cat ? cat.nuestras.publicaciones : pubs.datos?.cantidad)}
              subtitle={cat ? `${unidades(cat.nuestras.skus)} productos (SKU) · ${cat.publicacionesEnMl ? formatoPorcentaje((cat.nuestras.activas / cat.publicacionesEnMl) * 100, 2) : "—"} del total activas` : "En todo Mercado Libre"}
              icon={<IconBuildingStore size={18} />}
              cargando={cat ? mercado.cargando : pubs.cargando}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <MetricCard
              title="Activas"
              value={cat ? unidades(cat.nuestras.activas) : "—"}
              subtitle={cat ? `${unidades(cat.nuestras.activasFull)} en Full` : "Elige una categoría"}
              icon={<IconPackages size={18} />}
              cargando={mercado.cargando}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <MetricCard
              title="Pausadas"
              value={cat ? unidades(cat.nuestras.pausadas) : "—"}
              subtitle={cat ? `${ventas.cargando ? "…" : sinVenta} de ${sub.length} subcategorías sin venta nuestra` : "Elige una categoría"}
              icon={<IconPlayerPause size={18} />}
              cargando={mercado.cargando}
              masEsMejor={false}
            />
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mt: 0 }}>
          <Grid item xs={12} lg={6}>
            <Panel
              titulo={cat ? "Subcategorías" : "Categorías"}
              descripcion={cat ? "Tamaño en Mercado Libre (publicaciones de todos los vendedores) y, al lado, nuestra venta del período. Pulsa una para entrar." : "Nuestra venta del período por categoría. Pulsa una para ver su mercado."}
            >
              <Box sx={{ maxHeight: 520, overflowY: "auto", pr: 0.5 }}>
                <ListaBarras
                  cargando={mercado.cargando || ventas.cargando}
                  vacio={cat ? "Esta categoría no tiene subcategorías." : "Sin ventas en el período."}
                  numerado
                  items={itemsNavegar}
                  onSeleccionar={(i) => entrar(i.clave, i.etiqueta)}
                />
              </Box>
            </Panel>
          </Grid>
          <Grid item xs={12} lg={6}>
            <Panel
              titulo={actual ? `Qué se busca en ${actual.nombre}` : "Qué se busca en Mercado Libre Chile"}
              descripcion={`Búsquedas en tendencia según Mercado Libre${mercado.datos?.tendenciasAl ? ` · ${fecha(mercado.datos.tendenciasAl)}` : ""}`}
              accion={
                tendencias.length > 20 ? (
                  <Button size="small" onClick={() => setTodas((v) => !v)} sx={{ textTransform: "none", fontWeight: 600 }}>
                    {todas ? "Ver las 20 primeras" : `Ver las ${tendencias.length}`}
                  </Button>
                ) : undefined
              }
            >
              {mercado.cargando ? (
                <Skeleton variant="rounded" height={320} />
              ) : mercado.datos?.tendenciasError ? (
                <Typography sx={{ fontSize: 13, color: "#b54708" }}>{mercado.datos.tendenciasError}</Typography>
              ) : tendencias.length === 0 ? (
                <Typography sx={{ fontSize: 13, color: tinta.tenue, py: 4, textAlign: "center" }}>Mercado Libre no informa tendencias para esta categoría.</Typography>
              ) : (
                <Box sx={{ maxHeight: 520, overflowY: "auto", display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, columnGap: 3, pr: 0.5 }}>
                  {visibles.map((t) => (
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
        </Grid>

        <SeccionTitulo
          title={actual ? `Nuestras publicaciones en ${actual.nombre}` : "Nuestras publicaciones"}
          infoRight={
            pubs.datos && pubs.datos.cantidad > pubs.datos.filas.length
              ? `Se muestran las ${unidades(pubs.datos.filas.length)} de mayor venta de ${unidades(pubs.datos.cantidad)}; entra a una categoría para ver las demás.`
              : "De mayor a menor venta de los últimos 30 días."
          }
        />
        <TablaInforme<Publicacion>
          filas={pubs.datos?.filas ?? []}
          cargando={pubs.cargando}
          columnas={COLUMNAS}
          clave={(f) => f.itemId}
          textoBusqueda={(f) => `${f.itemId} ${f.sku} ${f.titulo ?? ""} ${f.nombre ?? ""} ${f.categoria ?? ""}`}
          ordenInicial={{ clave: "venta30", direccion: "desc" }}
          nombreExcel={`publicaciones-ml${actual ? `-${actual.nombre}` : ""}`}
          extraExcel={[
            { titulo: "Publicación", valor: (f) => f.itemId },
            { titulo: "Nombre SAP", valor: (f) => f.nombre },
            { titulo: "Precio publicado", valor: (f) => f.precio },
            { titulo: "Precio oferta", valor: (f) => f.precioOferta },
            { titulo: "Catálogo", valor: (f) => (f.catalogo ? "Sí" : "No") },
            { titulo: "Publicada el", valor: (f) => f.publicadaEl },
            { titulo: "Enlace", valor: (f) => f.url },
            { titulo: "Imagen", valor: (f) => f.imagen },
          ]}
          nota={
            <Tooltip arrow title="La venta y las unidades de 30 días son del producto (SKU), sumando todas sus publicaciones. Precio y stock son de la última foto del catálogo.">
              <span>Venta de 30 días por producto, sin IVA{pubs.datos?.datosAl ? ` · precios y stock al ${fecha(pubs.datos.datosAl)}` : ""}</span>
            </Tooltip>
          }
          anchoMinimo={1100}
        />
        <Typography sx={{ fontSize: 12, color: tinta.tenue, mt: 1.5 }}>
          Las tendencias vienen de la API de Mercado Libre. Mercado Libre no entrega a nuestra aplicación los más vendidos del mercado ni las ventas de otros vendedores.
        </Typography>
      </Box>
    </PageContainer>
  );
}
