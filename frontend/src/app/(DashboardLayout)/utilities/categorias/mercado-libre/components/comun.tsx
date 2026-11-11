"use client";
// Piezas comunes de Categorías → Mercado Libre: tipos de la respuesta de
// analysis-service /api/mercado-libre/categorias-analisis/*, el selector de
// períodos (mes, año, 12 meses o rango contra el mismo período del año
// anterior) y los avisos de datos.
//
// Montos: ML los informa con IVA; se muestra el neto (cuadra con el resto del
// dashboard) y el con IVA en el detalle. El margen es estimado (comisión y
// envío de la publicación actual, costo promedio de SAP de hoy).
import React from "react";
import { Box, TextField, Tooltip, Typography } from "@mui/material";
import { IconAlertTriangle, IconInfoCircle } from "@tabler/icons-react";
import { BACKEND_URL } from "@/config";
import { useEstadoVista } from "@/utils/estadoVista";
import { ChipVariacion, Pildoras, cifraSx, estado, formatoMonto, formatoPorcentaje, tarjetaSx, tinta } from "../../../ventas/components/estilo";
import { Par } from "../../../ventas/mercado-libre/components/comun";

export type { Par };
export type Modo = "mes" | "anio" | "12m" | "rango";
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
  modo: Modo;
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

/** Filtros de período que comparten las páginas (se recuerdan por vista). */
export interface FiltrosPeriodo {
  modo: Modo;
  /** Mes elegido (YYYY-MM) en modo mes; vacío = el mes en curso. */
  mes: string;
  fechaInicio: string;
  fechaFin: string;
  compInicio: string;
  compFin: string;
}

export const periodoInicial = (): FiltrosPeriodo => ({ modo: "mes", mes: "", fechaInicio: "", fechaFin: "", compInicio: "", compFin: "" });

/** Filtros de período compartidos entre las páginas de Categorías → Mercado Libre. */
export const usePeriodoMl = () => useEstadoVista<FiltrosPeriodo>("categorias-ml:periodo", periodoInicial);

/** Último día de un mes YYYY-MM. */
const finDeMes = (mes: string) => {
  const [y, m] = mes.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
};

/** Parámetros del back para el período elegido (los vacíos no van). */
export function parametrosPeriodo(f: FiltrosPeriodo): Record<string, string> {
  if (f.modo === "rango") {
    if (!f.fechaInicio || !f.fechaFin) return { modo: "mes" };
    return {
      modo: "rango",
      fechaInicio: f.fechaInicio,
      fechaFin: f.fechaFin,
      ...(f.compInicio && f.compFin ? { compInicio: f.compInicio, compFin: f.compFin } : {}),
    };
  }
  if (f.modo === "mes" && f.mes) return { modo: "mes", fecha: finDeMes(f.mes) };
  return { modo: f.modo };
}

/** URL de un endpoint de /api/mercado-libre/categorias-analisis. */
export const urlCat = (endpoint: "comparativo" | "evolucion" | "productos" | "mercado", filtros: Record<string, string | number | null | undefined>) => {
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

/** Selector de comparación: píldoras de modo + mes o rangos. */
export function SelectorPeriodo({ filtros, setFiltros, contexto }: { filtros: FiltrosPeriodo; setFiltros: React.Dispatch<React.SetStateAction<FiltrosPeriodo>>; contexto?: Contexto | null }) {
  const cambiar = (c: Partial<FiltrosPeriodo>) => setFiltros((f) => ({ ...f, ...c }));
  const campo = (etiqueta: string, valor: string, clave: keyof FiltrosPeriodo, tipo: "date" | "month" = "date") => (
    <TextField
      size="small"
      type={tipo}
      label={etiqueta}
      value={valor}
      onChange={(e) => cambiar({ [clave]: e.target.value } as Partial<FiltrosPeriodo>)}
      InputLabelProps={{ shrink: true }}
      sx={{ width: tipo === "month" ? 160 : 150, "& .MuiOutlinedInput-root": { borderRadius: "10px", fontSize: 13 } }}
    />
  );
  return (
    <Box sx={{ ...tarjetaSx, p: 2, mb: 2 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5 }}>
        <Pildoras<Modo>
          etiqueta="Comparar"
          valor={filtros.modo}
          onCambiar={(modo) => cambiar({ modo })}
          opciones={[
            { valor: "mes", texto: "Mes vs mismo mes año anterior" },
            { valor: "anio", texto: "Año a la fecha vs año anterior" },
            { valor: "12m", texto: "Últimos 12 meses vs 12 anteriores" },
            { valor: "rango", texto: "Rango libre" },
          ]}
        />
        {filtros.modo === "mes" && campo("Mes", filtros.mes, "mes", "month")}
        {filtros.modo === "rango" && (
          <>
            {campo("Desde", filtros.fechaInicio, "fechaInicio")}
            {campo("Hasta", filtros.fechaFin, "fechaFin")}
            <Typography sx={{ fontSize: 12.5, color: tinta.tenue }}>contra</Typography>
            {campo("Comparar desde", filtros.compInicio, "compInicio")}
            {campo("Comparar hasta", filtros.compFin, "compFin")}
          </>
        )}
      </Box>
      {contexto && (
        <Typography sx={{ fontSize: 12.5, color: tinta.secundaria, mt: 1.25 }}>
          <b>{etiquetaPeriodo(contexto.actual)}</b> contra <b>{etiquetaPeriodo(contexto.comparacion)}</b>
          {contexto.datosAl ? ` · datos al ${fecha(contexto.datosAl)}` : ""}
          {filtros.modo === "rango" && !(filtros.compInicio && filtros.compFin) ? " · sin comparación elegida se usa el mismo rango un año antes" : ""}
        </Typography>
      )}
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

/** Margen % con la diferencia en puntos. */
export function MargenCelda({ actual, puntos }: { actual: number | null; puntos: number | null }) {
  if (actual == null) return <Box component="span" sx={{ color: tinta.tenue }}>—</Box>;
  const tono = actual < 0 ? estado.mal.color : actual < 0.15 ? "#b54708" : estado.bien.color;
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.75 }}>
      <Box component="span" sx={{ fontWeight: 700, color: tono, ...cifraSx }}>{formatoPorcentaje(actual * 100)}</Box>
      <ChipVariacion valor={pp(puntos)} unidad="pp" />
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
