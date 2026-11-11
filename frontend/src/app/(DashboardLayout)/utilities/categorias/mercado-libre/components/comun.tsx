"use client";
// Piezas comunes de Categorías → Mercado Libre: tipos de la respuesta de
// analysis-service /api/mercado-libre/categorias-analisis/*, el selector de
// período y de «comparar con» (mismo calendario de rangos que el resto de las
// vistas) y los avisos de datos.
//
// Montos: ML los informa con IVA; se muestra el neto (cuadra con el resto del
// dashboard) y el con IVA en el detalle. El margen es estimado (comisión y
// envío de la publicación actual, costo promedio de SAP de hoy).
import React from "react";
import { Box, Tooltip, Typography } from "@mui/material";
import { IconAlertTriangle, IconInfoCircle } from "@tabler/icons-react";
import { BACKEND_URL } from "@/config";
import { useEstadoVista } from "@/utils/estadoVista";
import DateRangeFilter from "../../../ventas/components/DateRangeFilter";
import { ChipVariacion, cifraSx, estado, formatoMonto, formatoPorcentaje, tarjetaSx, tinta } from "../../../ventas/components/estilo";
import { Par } from "../../../ventas/mercado-libre/components/comun";

export type { Par };
export type TipoEnvioCat = "full" | "colecta" | "flex" | "otro" | "sin_dato";

export const TIPOS_CAT: { clave: TipoEnvioCat; nombre: string; color: string }[] = [
  { clave: "full", nombre: "Full", color: "#2a78d6" },
  { clave: "colecta", nombre: "Colecta", color: "#eda100" },
  { clave: "flex", nombre: "Flex", color: "#1baf7a" },
  { clave: "otro", nombre: "Otros envíos", color: "#94a3b8" },
  { clave: "sin_dato", nombre: "Sin dato", color: "#cbd5e1" },
];

export interface Bloque {
  venta: Par;
  unidades: number;
  ordenes: number;
  productos: number;
  ticket: Par;
  comision: Par;
  envio: Par;
  costo: number | null;
  margen: number | null;
  margenPct: number | null;
  coberturaCosto: number | null;
  porTipo: Record<TipoEnvioCat, Par>;
}

export interface Variacion {
  venta: number | null;
  unidades: number | null;
  ordenes?: number | null;
  margen?: number | null;
  margenPuntos: number | null;
}

export interface Contexto {
  modo: string;
  actual: { desde: string; hasta: string };
  comparacion: { desde: string; hasta: string };
  datosDesde: string | null;
  datosAl: string | null;
  comparacionParcial: boolean;
  estimaciones?: boolean;
}

export interface FilaCategoria {
  id: string | null;
  nombre: string;
  tieneHijos: boolean;
  actual: Bloque;
  comparacion: Bloque;
  variacion: Variacion;
  diferencia: Par;
  participacion: { actual: number | null; comparacion: number | null };
  aporte: number | null;
  nueva: boolean;
}

export interface Comparativo extends Contexto {
  total: { actual: Bloque; comparacion: Bloque; variacion: Variacion; diferencia: Par };
  categorias: FilaCategoria[];
}

export interface FilaProducto {
  sku: string;
  /** Foto del producto (portada de su ficha). */
  imagen?: string | null;
  nombre: string | null;
  categoriaId: string | null;
  categoria: string | null;
  rutaCategoria: { id: string; nombre: string }[];
  actual: Bloque;
  comparacion: Bloque;
  variacion: Variacion;
  diferencia: Par;
  participacion: number | null;
  nuevo: boolean;
  sinVentas: boolean;
}

export interface Productos extends Contexto {
  orden: string;
  cantidad: number;
  filas: FilaProducto[];
}

export interface Mes {
  mes: string;
  venta: Par;
  unidades: number;
  ordenes: number;
  productos: number;
  margen: number | null;
  margenPct: number | null;
  porTipo: Record<TipoEnvioCat, Par>;
  vsAnioAnterior: number | null;
}

export interface Evolucion {
  desde: string;
  hasta: string;
  datosDesde: string | null;
  datosAl: string | null;
  estimaciones: boolean;
  meses: Mes[];
}

export interface Mercado {
  categoria: null | {
    id: string;
    nombre: string;
    nivel: number | null;
    esHoja: boolean;
    publicacionesEnMl: number | null;
    ruta: { id: string; nombre: string }[];
    subcategorias: { id: string; nombre: string; publicacionesEnMl: number | null; esHoja: boolean }[];
    nuestras: { publicaciones: number; activas: number; pausadas: number; activasFull: number; skus: number };
  };
  tendencias: { posicion: number; busqueda: string; url: string | null }[];
  tendenciasError: string | null;
  tendenciasAl: string | null;
  noDisponible: string[];
}

/** Con qué se compara: el mismo período un año antes, el período justo anterior o uno elegido. */
export type Comparar = "anio" | "anterior" | "personalizado";

/** Filtros de período que comparten las páginas (se recuerdan entre ellas). */
export interface FiltrosPeriodo {
  /** Opción rápida elegida (se recalcula cada día); vacío = fechas explícitas. */
  rapido: string;
  fechaInicio: string;
  fechaFin: string;
  comparar: Comparar;
  compInicio: string;
  compFin: string;
  /** Primer día con ventas guardadas (lo informa el back): antes de él no se compara. */
  datosDesde: string;
}

const DIA = 86_400_000;
const isoUtc = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const sumar = (iso: string, dias: number) => isoUtc(Date.parse(iso) + dias * DIA);
export const diasDe = (p: { desde: string; hasta: string }) => Math.round((Date.parse(p.hasta) - Date.parse(p.desde)) / DIA) + 1;
/** Misma fecha un año antes (29-02 → 28-02). */
const anioAntes = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  const ultimo = new Date(Date.UTC(y - 1, m, 0)).getUTCDate();
  return isoUtc(Date.UTC(y - 1, m - 1, Math.min(d, ultimo)));
};
/** Ayer, hora de Chile: las ventas Full se cargan cada madrugada hasta el día anterior. */
const ayer = () => sumar(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago" }).format(new Date()), -1);
const aFecha = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

type Rango = { desde: string; hasta: string };

/** Períodos rápidos, todos hasta `fin` (el último día con datos). */
export function periodosRapidos(fin: string): { label: string; rango: Rango }[] {
  const [y, m] = fin.split("-").map(Number);
  const mesPasadoFin = isoUtc(Date.UTC(y, m - 1, 0));
  return [
    { label: "Últimos 7 días", rango: { desde: sumar(fin, -6), hasta: fin } },
    { label: "Últimos 15 días", rango: { desde: sumar(fin, -14), hasta: fin } },
    { label: "Últimos 30 días", rango: { desde: sumar(fin, -29), hasta: fin } },
    { label: "Este mes", rango: { desde: `${fin.slice(0, 7)}-01`, hasta: fin } },
    { label: "Mes pasado", rango: { desde: `${mesPasadoFin.slice(0, 7)}-01`, hasta: mesPasadoFin } },
    { label: "Últimos 3 meses", rango: { desde: sumar(isoUtc(Date.UTC(y, m - 4, Number(fin.slice(8)))), 1), hasta: fin } },
    { label: "Año a la fecha", rango: { desde: `${y}-01-01`, hasta: fin } },
    { label: "Últimos 12 meses", rango: { desde: sumar(anioAntes(fin), 1), hasta: fin } },
  ];
}

export const periodoInicial = (): FiltrosPeriodo => ({ rapido: "Este mes", fechaInicio: "", fechaFin: "", comparar: "anio", compInicio: "", compFin: "", datosDesde: "" });

/** Filtros de período compartidos entre las páginas de Categorías → Mercado Libre. */
export const usePeriodoMl = () =>
  useEstadoVista<FiltrosPeriodo>("categorias-ml:periodo", periodoInicial, { restaurar: (g) => ({ ...periodoInicial(), ...(g && "comparar" in g ? g : {}) }) });

/** Opciones de «comparar con» para un período; `desde` = primer día con datos (las que empiezan antes no se ofrecen). */
export function opcionesComparar(actual: Rango, datosDesde?: string | null): { clave: Comparar | "mes"; label: string; rango: Rango }[] {
  const n = diasDe(actual);
  const [y, m, d] = actual.desde.split("-").map(Number);
  const mesAntesDesde = isoUtc(Date.UTC(y, m - 2, Math.min(d, new Date(Date.UTC(y, m - 1, 0)).getUTCDate())));
  const todas: { clave: Comparar | "mes"; label: string; rango: Rango }[] = [
    { clave: "anio", label: "Mismo período, año anterior", rango: { desde: anioAntes(actual.desde), hasta: anioAntes(actual.hasta) } },
    { clave: "anterior", label: `Período anterior (${n} ${n === 1 ? "día" : "días"} antes)`, rango: { desde: sumar(actual.desde, -n), hasta: sumar(actual.desde, -1) } },
    { clave: "mes", label: "Mismos días, mes anterior", rango: { desde: mesAntesDesde, hasta: sumar(mesAntesDesde, n - 1) } },
  ];
  return todas.filter((o) => o.rango.hasta < actual.desde && (!datosDesde || o.rango.desde >= datosDesde));
}

/** Período y comparación que resultan de los filtros. */
export function resolverPeriodo(f: FiltrosPeriodo): { actual: Rango; comparacion: Rango; comparar: Comparar } {
  const fin = ayer();
  const rapido = f.rapido ? periodosRapidos(fin).find((p) => p.label === f.rapido) : undefined;
  const actual: Rango = rapido?.rango ?? (f.fechaInicio && f.fechaFin ? { desde: f.fechaInicio, hasta: f.fechaFin } : periodosRapidos(fin)[3].rango);
  const n = diasDe(actual);
  const opciones = opcionesComparar(actual, f.datosDesde || null);
  // Un rango elegido a mano vale mientras tenga el mismo largo y no se cruce con el período.
  if (f.comparar === "personalizado" && f.compInicio && f.compFin && diasDe({ desde: f.compInicio, hasta: f.compFin }) === n && f.compFin < actual.desde) {
    return { actual, comparacion: { desde: f.compInicio, hasta: f.compFin }, comparar: "personalizado" };
  }
  // Año anterior si hay datos; si no, el período anterior.
  const elegida = opciones.find((o) => o.clave === f.comparar) ?? opciones.find((o) => o.clave === "anio") ?? opciones.find((o) => o.clave === "anterior");
  if (elegida) return { actual, comparacion: elegida.rango, comparar: elegida.clave === "mes" ? "anterior" : (elegida.clave as Comparar) };
  return { actual, comparacion: { desde: sumar(actual.desde, -n), hasta: sumar(actual.desde, -1) }, comparar: "anterior" };
}

/** Parámetros del back para el período elegido. */
export function parametrosPeriodo(f: FiltrosPeriodo): Record<string, string> {
  const { actual, comparacion } = resolverPeriodo(f);
  return { modo: "rango", fechaInicio: actual.desde, fechaFin: actual.hasta, compInicio: comparacion.desde, compFin: comparacion.hasta };
}

/** URL de un endpoint de /api/mercado-libre/categorias-analisis. */
export const urlCat = (endpoint: "comparativo" | "evolucion" | "productos" | "mercado" | "publicaciones", filtros: Record<string, string | number | null | undefined>) => {
  const q = new URLSearchParams(
    Object.entries(filtros)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => [k, String(v)])
  ).toString();
  return `${BACKEND_URL}/api/mercado-libre/categorias-analisis/${endpoint}?${q}`;
};

export const n = (v: unknown) => Number(v) || 0;
export const unidades = (v: number | null | undefined) => (Number(v) || 0).toLocaleString("es-CL", { maximumFractionDigits: 0 });
export const fecha = (iso?: string | null) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "—");
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sept", "oct", "nov", "dic"];
export const nombreMes = (yyyymm: string) => {
  const [y, m] = yyyymm.split("-");
  return `${MESES[Number(m) - 1]} ${y.slice(2)}`;
};
/** Variación (0,25) → número para ChipVariacion (25). */
export const pct = (v: number | null | undefined) => (v == null ? null : v * 100);
/** Puntos de margen (0,02) → pp (2). */
export const pp = (v: number | null | undefined) => (v == null ? null : v * 100);

export const etiquetaPeriodo = (p: { desde: string; hasta: string }) => `${fecha(p.desde)} – ${fecha(p.hasta)}`;

/**
 * Período y «comparar con», los dos con el calendario de rangos de las demás
 * vistas. En «comparar con» el largo queda fijo en los días del período: un
 * clic en el calendario marca el rango completo desde ese día. Solo se pueden
 * elegir días con ventas guardadas (desde `datosDesde`) y anteriores al período.
 */
export function SelectorPeriodo({ filtros, setFiltros, contexto }: { filtros: FiltrosPeriodo; setFiltros: React.Dispatch<React.SetStateAction<FiltrosPeriodo>>; contexto?: Contexto | null }) {
  const datosDesde = contexto?.datosDesde ?? (filtros.datosDesde || null);
  const fin = contexto?.datosAl ?? ayer();
  // El primer día con datos se guarda con los filtros: así el período y lo que se pide al back salen de lo mismo.
  React.useEffect(() => {
    if (contexto?.datosDesde && contexto.datosDesde !== filtros.datosDesde) setFiltros((f) => ({ ...f, datosDesde: contexto.datosDesde as string }));
  }, [contexto?.datosDesde, filtros.datosDesde, setFiltros]);
  const { actual, comparacion, comparar } = resolverPeriodo(filtros);
  const n = diasDe(actual);
  const rapidos = periodosRapidos(ayer()).filter((p) => !datosDesde || p.rango.hasta >= datosDesde);
  const opciones = opcionesComparar(actual, datosDesde);

  const elegirPeriodo = (v: { start: string; end: string } | null) => {
    if (!v) return setFiltros((f) => ({ ...f, rapido: "Este mes", fechaInicio: "", fechaFin: "" }));
    const rapido = rapidos.find((p) => p.rango.desde === v.start && p.rango.hasta === v.end);
    setFiltros((f) => ({ ...f, rapido: rapido?.label ?? "", fechaInicio: v.start, fechaFin: v.end }));
  };
  const elegirComparacion = (v: { start: string; end: string } | null) => {
    if (!v) return setFiltros((f) => ({ ...f, comparar: "anio", compInicio: "", compFin: "" }));
    const opcion = opciones.find((o) => o.rango.desde === v.start && o.rango.hasta === v.end);
    setFiltros((f) =>
      opcion && opcion.clave !== "mes" ? { ...f, comparar: opcion.clave as Comparar, compInicio: "", compFin: "" } : { ...f, comparar: "personalizado", compInicio: v.start, compFin: v.end }
    );
  };
  const etiquetaComparar = comparar === "anio" ? "año anterior" : comparar === "anterior" ? "período anterior" : "elegido a mano";

  return (
    <Box sx={{ ...tarjetaSx, p: 2, mb: 2 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 2 }}>
        <Box sx={{ width: { xs: "100%", sm: 250 } }}>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: tinta.secundaria, mb: 0.5 }}>Período{filtros.rapido ? ` · ${filtros.rapido}` : ""}</Typography>
          <DateRangeFilter
            compacto
            label="Período"
            value={{ start: actual.desde, end: actual.hasta }}
            onChange={elegirPeriodo}
            min={datosDesde ?? undefined}
            max={fin}
            rangos={rapidos.map((p) => ({ label: p.label, range: [aFecha(p.rango.desde), aFecha(p.rango.hasta)] as const }))}
          />
        </Box>
        <Box sx={{ width: { xs: "100%", sm: 250 } }}>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: tinta.secundaria, mb: 0.5 }}>Comparar con · {etiquetaComparar}</Typography>
          <DateRangeFilter
            compacto
            label="Comparar con"
            value={{ start: comparacion.desde, end: comparacion.hasta }}
            onChange={elegirComparacion}
            largoFijo={n}
            min={datosDesde ?? undefined}
            max={sumar(actual.desde, -1)}
            tituloRangos="COMPARAR CON"
            rangos={opciones.map((o) => ({ label: o.label, range: [aFecha(o.rango.desde), aFecha(o.rango.hasta)] as const }))}
          />
        </Box>
        <Typography sx={{ fontSize: 12.5, color: tinta.secundaria, pb: 0.75, flex: 1, minWidth: 200 }}>
          <b>{n} {n === 1 ? "día" : "días"}</b>
          {datosDesde ? ` · datos desde el ${fecha(datosDesde)}` : ""}
        </Typography>
      </Box>
    </Box>
  );
}

/** Avisos de datos: comparación con historia parcial y margen estimado. */
export function AvisosDatos({ contexto }: { contexto?: Contexto | null }) {
  if (!contexto) return null;
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
      {contexto.comparacionParcial && (
        <Aviso tono="mal" icono={<IconAlertTriangle size={16} />}>
          El período de comparación empieza antes del {fecha(contexto.datosDesde)}, primer día con ventas de Mercado Libre guardadas: sus cifras están
          incompletas y el crecimiento se ve mayor de lo que es.
        </Aviso>
      )}
      <Aviso tono="neutro" icono={<IconInfoCircle size={16} />}>
        Margen estimado: venta − comisión − envío (de la publicación actual) − costo promedio de SAP de hoy. La categoría es la de la publicación principal
        de cada producto hoy.
      </Aviso>
    </Box>
  );
}

export function Aviso({ tono, icono, children }: { tono: "mal" | "neutro"; icono: React.ReactNode; children: React.ReactNode }) {
  const t = tono === "mal" ? { color: "#b54708", fondo: "#fffaeb" } : estado.neutro;
  return (
    <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", px: 1.5, py: 1, borderRadius: "10px", bgcolor: t.fondo, color: t.color, fontSize: 12.5 }}>
      <Box sx={{ display: "flex", mt: "1px" }}>{icono}</Box>
      <Box>{children}</Box>
    </Box>
  );
}

/** Monto neto (con IVA al pasar el cursor). */
export function MontoCorto({ par, fuerte = false, color }: { par: Par; fuerte?: boolean; color?: string }) {
  if (par?.neto == null) return <Box component="span" sx={{ color: tinta.tenue }}>—</Box>;
  return (
    <Tooltip title={`Sin IVA ${formatoMonto(par.neto)} · Con IVA ${formatoMonto(par.conIva)}`} arrow placement="top">
      <Box component="span" sx={{ fontWeight: fuerte ? 700 : 500, color: color ?? tinta.primaria, ...cifraSx }}>
        {formatoMonto(par.neto)}
      </Box>
    </Tooltip>
  );
}

/**
 * Margen % del período y, al lado, cuánto cambió frente a la comparación (en
 * puntos). Cada parte explica qué es al pasar el cursor.
 */
export function MargenCelda({ actual, puntos, anterior }: { actual: number | null; puntos: number | null; anterior?: number | null }) {
  if (actual == null) {
    return (
      <Tooltip title="Sin margen: el producto no tiene costo en SAP." arrow placement="top">
        <Box component="span" sx={{ color: tinta.tenue }}>—</Box>
      </Tooltip>
    );
  }
  const tono = actual < 0 ? estado.mal.color : actual < 0.15 ? "#b54708" : estado.bien.color;
  const cambio = pp(puntos);
  // Un cambio que se redondea a 0,0 se muestra como "sin cambio", no como subida o baja.
  const cambioVisible = cambio == null ? null : Math.abs(cambio) < 0.05 ? 0 : cambio;
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.75 }}>
      <Tooltip
        arrow
        placement="top"
        title={`Margen del período: ${formatoPorcentaje(actual * 100)} de la venta neta. Es estimado: venta − comisión − envío − costo promedio de SAP de hoy.`}
      >
        <Box component="span" sx={{ fontWeight: 700, color: tono, ...cifraSx }}>{formatoPorcentaje(actual * 100)}</Box>
      </Tooltip>
      {cambioVisible != null && (
        <Tooltip
          arrow
          placement="top"
          title={
            <>
              Esto no es el margen: es cuánto cambió el margen % frente al período de comparación
              {anterior != null ? ` (antes ${formatoPorcentaje(anterior * 100)}, ahora ${formatoPorcentaje(actual * 100)})` : ""}, en puntos porcentuales.
              {cambioVisible === 0 ? " Sin cambio." : ""}
              <Box component="span" sx={{ display: "block", mt: 0.5, opacity: 0.85 }}>
                Como el costo y la comisión son los de hoy para los dos períodos, en un producto solo cambia si se vendió a otro precio o por otro tipo de envío.
              </Box>
            </>
          }
        >
          <Box component="span" sx={{ display: "inline-flex" }}>
            <ChipVariacion valor={cambioVisible} unidad="pp" />
          </Box>
        </Tooltip>
      )}
    </Box>
  );
}

/** Barra apilada por tipo de envío. */
export function BarraTiposCat({ porTipo }: { porTipo: Record<TipoEnvioCat, Par> }) {
  const partes = TIPOS_CAT.map((t) => ({ ...t, valor: Math.max(0, n(porTipo?.[t.clave]?.neto)) })).filter((p) => p.valor > 0);
  const total = partes.reduce((s, p) => s + p.valor, 0);
  if (!total) return <Box component="span" sx={{ color: tinta.tenue, fontSize: 12 }}>—</Box>;
  return (
    <Tooltip
      arrow
      placement="top"
      title={
        <>
          {partes.map((p) => (
            <Box key={p.clave} sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
              <span>{p.nombre}</span>
              <span>
                {formatoMonto(p.valor)} · {Math.round((p.valor / total) * 100)}%
              </span>
            </Box>
          ))}
        </>
      }
    >
      <Box sx={{ display: "flex", height: 8, borderRadius: 999, overflow: "hidden", bgcolor: "#eef2f6" }}>
        {partes.map((p) => (
          <Box key={p.clave} sx={{ width: `${(p.valor / total) * 100}%`, bgcolor: p.color }} />
        ))}
      </Box>
    </Tooltip>
  );
}

export function LeyendaTiposCat() {
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
      {TIPOS_CAT.map((t) => (
        <Box key={t.clave} sx={{ display: "flex", alignItems: "center", gap: 0.6, fontSize: 12, color: tinta.secundaria }}>
          <Box sx={{ width: 10, height: 10, borderRadius: "3px", bgcolor: t.color }} />
          {t.nombre}
        </Box>
      ))}
    </Box>
  );
}

/** Ruta del mensaje de error de una carga (texto legible). */
export const mensajeError = (e: unknown) => (e instanceof Error ? e.message : e ? String(e) : null);
