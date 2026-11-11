"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Box, Grid, Tooltip, Typography } from "@mui/material";
import { IconAlertCircle, IconPercentage, IconTag, IconTrendingDown } from "@tabler/icons-react";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { useApiDatos } from "@/utils/useCargaDatos";
import { useEstadoVista } from "@/utils/estadoVista";
import MetricCard from "../../../utilities/ventas/components/MetricCard";
import { Pildoras, cifraSx, formatoPorcentaje, tinta } from "../../../utilities/ventas/components/estilo";
import TablaInforme, { CeldaProducto, ColumnaInforme, EncabezadoInforme, Etiqueta } from "../../../utilities/ventas/mercado-libre/components/TablaInforme";
import { Par } from "../../../utilities/ventas/mercado-libre/components/comun";
import { mensajeError, n, unidades } from "../../../utilities/categorias/mercado-libre/components/comun";
import { Estimaciones, pesos, urlFal } from "../../../utilities/falabella/components/comun";

type Problema = "inactiva" | "rechazada" | "en_revision" | "sin_stock" | "contenido_bajo" | "sin_peso" | "sin_comision" | "sin_costo" | "margen_negativo";
interface Fila {
  sku: string;
  skuFalabella: string | null;
  nombre: string | null;
  imagen: string | null;
  url: string | null;
  categoria: string | null;
  categoriaId: string | null;
  estado: string | null;
  calidad: string | null;
  puntaje: number | null;
  stock: number | null;
  precioLista: Par;
  oferta: Par | null;
  ofertaHasta: string | null;
  precio: Par;
  comisionPct: number | null;
  comision: Par;
  despacho: Par;
  pesoFacturable: number | null;
  costo: number | null;
  margen: number | null;
  margenPct: number | null;
  unidades30: number;
  venta30: Par;
  problemas: Problema[];
}
interface Respuesta {
  estimaciones: Estimaciones;
  sincronizado: string;
  resumen: { total: number; activas: number; conOferta: number; problemas: Record<Problema, number> };
  filas: Fila[];
}

const PROBLEMAS: Record<Problema, { texto: string; color: string; fondo: string; ayuda: string }> = {
  margen_negativo: { texto: "Pierde plata", color: "#b42318", fondo: "#fef3f2", ayuda: "A su precio de hoy el margen estimado es negativo" },
  rechazada: { texto: "Rechazada", color: "#b42318", fondo: "#fef3f2", ayuda: "Falabella rechazó la publicación en su control de calidad" },
  sin_stock: { texto: "Sin stock", color: "#b54708", fondo: "#fffaeb", ayuda: "Activa pero con stock 0 en Falabella" },
  inactiva: { texto: "Inactiva", color: "#475467", fondo: "#f2f4f7", ayuda: "No está a la venta" },
  en_revision: { texto: "En revisión", color: "#1d4ed8", fondo: "#eff6ff", ayuda: "Falabella todavía la está revisando" },
  contenido_bajo: { texto: "Contenido bajo 70", color: "#b54708", fondo: "#fffaeb", ayuda: "Puntaje de contenido menor a 70: Falabella la revisa a mano o la rechaza" },
  sin_peso: { texto: "Sin peso", color: "#b54708", fondo: "#fffaeb", ayuda: "Falabella no tiene peso ni medidas del paquete" },
  sin_comision: { texto: "Sin comisión", color: "#b54708", fondo: "#fffaeb", ayuda: "Su categoría no está en la planilla de comisiones (se estima 15 %)" },
  sin_costo: { texto: "Sin costo SAP", color: "#b54708", fondo: "#fffaeb", ayuda: "Sin costo promedio en SAP: no se puede calcular el margen" },
};
const ORDEN_PROBLEMAS = Object.keys(PROBLEMAS) as Problema[];
type Vista = "precios" | "problemas";
type Filtro = "todos" | Problema;

const porcentaje = (v: number | null) => (v == null ? "—" : formatoPorcentaje(v * 100));

const COLUMNAS: ColumnaInforme<Fila>[] = [
  { clave: "sku", titulo: "Producto", ancho: 26, valor: (f) => f.sku, celda: (f) => <CeldaProducto sku={f.sku} nombre={f.nombre} imagen={f.imagen} secundario={f.categoria ?? undefined} /> },
  {
    clave: "precio",
    titulo: "Precio hoy",
    ancho: 9,
    alinear: "right",
    valor: (f) => n(f.precio.conIva),
    excel: "Precio vigente con IVA",
    celda: (f) => (
      <Box>
        <Box component="span" sx={{ ...cifraSx, fontWeight: 700 }}>{pesos(f.precio.conIva)}</Box>
        {f.oferta ? <Box sx={{ fontSize: 11, color: tinta.secundaria }}>oferta · lista {pesos(f.precioLista.conIva)}</Box> : null}
      </Box>
    ),
  },
  { clave: "costo", titulo: "Costo SAP", ancho: 8, alinear: "right", valor: (f) => f.costo, celda: (f) => <Box sx={cifraSx}>{pesos(f.costo)}</Box> },
  { clave: "com", titulo: "Comisión", ancho: 7, alinear: "right", valor: (f) => (f.comisionPct == null ? null : f.comisionPct * 100), excel: "Comisión %", celda: (f) => porcentaje(f.comisionPct) },
  {
    clave: "desp",
    titulo: "Despacho",
    ancho: 8,
    alinear: "right",
    valor: (f) => n(f.despacho.conIva),
    excel: "Despacho con IVA",
    celda: (f) => (
      <Tooltip title={f.pesoFacturable == null ? "Sin peso en Falabella: tramo más liviano" : `Se cobra por ${f.pesoFacturable.toLocaleString("es-CL", { maximumFractionDigits: 1 })} kg`} arrow placement="top">
        <Box component="span" sx={cifraSx}>{pesos(f.despacho.conIva)}</Box>
      </Tooltip>
    ),
  },
  { clave: "margenPct", titulo: "Margen %", ancho: 7, alinear: "right", valor: (f) => (f.margenPct == null ? null : f.margenPct * 100), celda: (f) => <Box component="span" sx={{ ...cifraSx, fontWeight: 700, color: f.margenPct == null ? tinta.tenue : f.margenPct < 0 ? "#b42318" : f.margenPct < 0.1 ? "#b54708" : "#067647" }}>{porcentaje(f.margenPct)}</Box> },
  { clave: "stock", titulo: "Stock", ancho: 6, alinear: "right", valor: (f) => f.stock, celda: (f) => <Box sx={cifraSx}>{f.stock == null ? "—" : unidades(f.stock)}</Box> },
  { clave: "u30", titulo: "Unid. 30 días", ancho: 7, alinear: "right", valor: (f) => f.unidades30, celda: (f) => <Box sx={cifraSx}>{unidades(f.unidades30)}</Box> },
  {
    clave: "prob",
    titulo: "Problemas",
    ancho: 14,
    valor: (f) => f.problemas.length,
    excel: "Cantidad de problemas",
    celda: (f) =>
      f.problemas.length ? (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          {ORDEN_PROBLEMAS.filter((p) => f.problemas.includes(p)).map((p) => (
            <Tooltip key={p} title={PROBLEMAS[p].ayuda} arrow placement="top">
              <span><Etiqueta texto={PROBLEMAS[p].texto} color={PROBLEMAS[p].color} fondo={PROBLEMAS[p].fondo} /></span>
            </Tooltip>
          ))}
        </Box>
      ) : (
        <Box component="span" sx={{ color: tinta.tenue }}>—</Box>
      ),
  },
];

function Contenido() {
  const vistaUrl: Vista = useSearchParams().get("vista") === "problemas" ? "problemas" : "precios";
  const [estado, setEstado] = useEstadoVista<{ filtro: Filtro }>(`falabella:publicaciones:${vistaUrl}`, () => ({ filtro: "todos" }));
  const { datos, cargando, error } = useApiDatos<Respuesta | null>(urlFal("publicaciones", {}), null);
  const r = datos?.resumen;
  const todas = datos?.filas ?? [];
  const base = vistaUrl === "problemas" ? todas.filter((f) => f.problemas.length > 0) : todas.filter((f) => f.estado === "active");
  const filas = estado.filtro === "todos" ? base : base.filter((f) => f.problemas.includes(estado.filtro as Problema));
  const conMargen = todas.filter((f) => f.estado === "active" && f.margenPct != null).map((f) => f.margenPct as number).sort((a, b) => a - b);
  const mediana = conMargen.length ? conMargen[Math.floor(conMargen.length / 2)] : null;
  const bajo10 = conMargen.filter((m) => m < 0.1).length;
  const opciones: { valor: Filtro; texto: string }[] = [
    { valor: "todos", texto: `Todas (${unidades(base.length)})` },
    ...ORDEN_PROBLEMAS.filter((p) => base.some((f) => f.problemas.includes(p))).map((p) => ({ valor: p as Filtro, texto: `${PROBLEMAS[p].texto} (${unidades(base.filter((f) => f.problemas.includes(p)).length)})` })),
  ];
  const titulo = vistaUrl === "problemas" ? "Publicaciones con problemas · Falabella" : "Precio y margen de hoy · Falabella";

  return (
    <PageContainer title={titulo} description="Publicaciones de Falabella con su precio vigente, el margen que dejan hoy y sus problemas">
      <Box sx={{ maxWidth: 1680, mx: "auto" }}>
        <EncabezadoInforme
          titulo={titulo}
          descripcion={`Margen por unidad al precio vigente (oferta si la hay), con despacho normal. ${datos?.estimaciones.margen ?? ""}${datos?.sincronizado ? ` Catálogo de Falabella al ${datos.sincronizado.slice(0, 16).replace("T", " ")}.` : ""}`}
        >
          <Pildoras<Filtro> etiqueta="Ver" valor={estado.filtro} onCambiar={(filtro) => setEstado({ filtro })} opciones={opciones} />
        </EncabezadoInforme>
        {error ? <Typography sx={{ color: "#b42318", fontSize: 13, mb: 2 }}>No se pudo cargar: {mensajeError(error)}</Typography> : null}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6} md={3}>
            <MetricCard title="Publicaciones activas" value={unidades(r?.activas)} subtitle={`${unidades(r?.conOferta)} con oferta vigente · ${unidades(r?.problemas.inactiva)} inactivas`} cargando={cargando} icon={<IconTag size={18} />} />
          </Grid>
          <Grid item xs={6} md={3}>
            <MetricCard title="Margen típico de hoy" value={porcentaje(mediana)} subtitle={`${unidades(bajo10)} activas bajo 10 %`} cargando={cargando} icon={<IconPercentage size={18} />} />
          </Grid>
          <Grid item xs={6} md={3}>
            <MetricCard title="Pierden plata a su precio" value={unidades(r?.problemas.margen_negativo)} subtitle="Margen estimado negativo" cargando={cargando} masEsMejor={false} icon={<IconTrendingDown size={18} />} />
          </Grid>
          <Grid item xs={6} md={3}>
            <MetricCard title="Rechazadas o sin stock" value={unidades(n(r?.problemas.rechazada) + n(r?.problemas.sin_stock))} subtitle={`${unidades(r?.problemas.rechazada)} rechazadas · ${unidades(r?.problemas.sin_stock)} sin stock`} cargando={cargando} masEsMejor={false} icon={<IconAlertCircle size={18} />} />
          </Grid>
        </Grid>
        <TablaInforme<Fila>
          key={`${vistaUrl}-${estado.filtro}`}
          filas={filas}
          cargando={cargando}
          columnas={COLUMNAS}
          clave={(f) => f.sku}
          textoBusqueda={(f) => `${f.sku} ${f.skuFalabella ?? ""} ${f.nombre ?? ""} ${f.categoriaId ?? ""}`}
          ordenInicial={{ clave: "u30", direccion: "desc" }}
          nombreExcel={vistaUrl === "problemas" ? "falabella-publicaciones-problemas" : "falabella-precio-margen"}
          extraExcel={[
            { titulo: "Nombre", valor: (f) => f.nombre },
            { titulo: "SKU Falabella", valor: (f) => f.skuFalabella },
            { titulo: "Ruta categoría", valor: (f) => f.categoriaId },
            { titulo: "Estado", valor: (f) => f.estado },
            { titulo: "Control de calidad", valor: (f) => f.calidad },
            { titulo: "Puntaje de contenido", valor: (f) => f.puntaje },
            { titulo: "Precio lista con IVA", valor: (f) => f.precioLista.conIva },
            { titulo: "Oferta con IVA", valor: (f) => f.oferta?.conIva },
            { titulo: "Oferta hasta", valor: (f) => f.ofertaHasta },
            { titulo: "Peso facturable kg", valor: (f) => f.pesoFacturable },
            { titulo: "Venta neta 30 días", valor: (f) => f.venta30.neto },
            { titulo: "Problemas", valor: (f) => f.problemas.map((p) => PROBLEMAS[p].texto).join(", ") },
            { titulo: "URL", valor: (f) => f.url },
          ]}
          nota="Precio y despacho con IVA; costo sin IVA; margen en % de la venta."
          anchoMinimo={1250}
        />
      </Box>
    </PageContainer>
  );
}

/** Falabella: precio, margen de hoy y problemas de cada publicación (?vista=problemas muestra solo las que tienen alguno). */
export default function PublicacionesFalabella() {
  return (
    <Suspense fallback={null}>
      <Contenido />
    </Suspense>
  );
}
