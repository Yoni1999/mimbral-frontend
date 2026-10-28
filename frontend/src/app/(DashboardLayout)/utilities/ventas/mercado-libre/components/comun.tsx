// Piezas comunes de las vistas de Mercado Libre (Ventas → Mercado Libre, el
// árbol de Mercado Libre en Categorías y el informe de más vendidos). Los
// datos vienen de analysis-service /api/mercado-libre/*: ventas de ML por tipo
// de envío, con lo que cobra ML y el stock de cada lado.
//
// Montos: ML los informa con IVA. Las vistas muestran el neto (sin IVA), que
// cuadra con el resto del dashboard, y el con IVA en el detalle.
import React from "react";
import { Box, Tooltip, Typography } from "@mui/material";
import { BACKEND_URL } from "@/config";
import { cifraSx, formatoMonto, formatoPesos, tinta } from "../../components/estilo";

export type TipoEnvio = "full" | "colecta" | "flex" | "otro";

/** Tipos de envío en orden y color fijos (colores de la paleta de canales). */
export const TIPOS_ENVIO: { clave: TipoEnvio; nombre: string; color: string; descripcion: string }[] = [
  { clave: "full", nombre: "Full", color: "#2a78d6", descripcion: "Despacha ML desde su bodega" },
  { clave: "colecta", nombre: "Colecta", color: "#eda100", descripcion: "ML retira en nuestra bodega 03" },
  { clave: "flex", nombre: "Flex", color: "#1baf7a", descripcion: "Despacho propio el mismo día" },
  { clave: "otro", nombre: "Otros envíos", color: "#94a3b8", descripcion: "Tipo de envío 'default' de ML o sin tipo informado" },
];
export const tipoEnvio = (clave: string) => TIPOS_ENVIO.find((t) => t.clave === clave);

/** Monto con y sin IVA, como lo entrega el back. */
export type Par = { neto: number | null; conIva: number | null };

export interface Totales {
  venta: Par;
  unidades: number;
  ordenes: number | null;
  comision: Par;
  envio: Par;
  coberturaComision?: number | null;
  coberturaEnvio?: number | null;
  comisionEstimada?: boolean;
  /** Productos distintos vendidos. */
  items?: number;
  /** Costo promedio de SAP × unidades (sin IVA; el par lleva el mismo número en los dos lados). */
  costo?: Par;
  /** Venta − comisión − envío − costo, sin IVA, de las filas con costo. */
  margen?: Par;
  /** Venta de las filas con costo (base del % de margen). */
  ventaConCosto?: Par;
  coberturaCosto?: number | null;
}

export interface ResumenMl {
  periodo: { desde: string; hasta: string };
  periodoAnterior: { desde: string; hasta: string };
  datosAl: string | null;
  estimaciones: boolean;
  actual: Record<TipoEnvio | "sin_dato", Totales>;
  anterior: Record<TipoEnvio | "sin_dato", Totales>;
  /** Productos distintos del total (un SKU en Full y Colecta cuenta una vez). */
  items?: { actual: number; anterior: number };
  tendencia: { fecha: string; tipo: TipoEnvio; venta: Par; unidades: number }[];
}

export interface PorTipo {
  venta: Par;
  unidades: number | null;
}

/** Una publicación de ML del SKU (ml_sku_items), con su enlace. */
export interface PublicacionMl {
  itemId: string;
  estado: string | null;
  catalogo: boolean;
  catalogoId: string | null;
  logistica: string | null;
  tipo: string | null;
  titulo: string | null;
  principal: boolean;
  url: string | null;
}

export interface ProductoMl {
  sku: string;
  /** Activas primero; null si no se pudieron leer. */
  publicaciones?: PublicacionMl[] | null;
  nombre: string | null;
  categoria: string | null;
  categoriaId: string | null;
  rutaCategoria: { id: string; nombre: string }[];
  venta: Par;
  unidades: number | null;
  ordenes: number | null;
  participacion: number | null;
  porTipo: Record<TipoEnvio, PorTipo>;
  comision: Par;
  comisionEstimada: boolean;
  envio: Par;
  queda: Par;
  stockFull: number | null;
  stockFullAl: string | null;
  stock03: number | null;
}

export interface ProductosMl {
  periodo: { desde: string; hasta: string };
  datosAl: string | null;
  estimaciones: boolean;
  total: Par;
  cantidad: number;
  filas: ProductoMl[];
}

export interface CategoriaMl {
  id: string | null;
  nombre: string;
  tieneHijos: boolean;
  venta: Par;
  unidades: number | null;
  productos: number | null;
  participacion: number | null;
  porTipo: Record<TipoEnvio, PorTipo>;
  comision: Par;
  envio: Par;
}

export interface CategoriasMl {
  periodo: { desde: string; hasta: string };
  nivel: number;
  padre: string | null;
  datosAl: string | null;
  estimaciones: boolean;
  total: Par;
  filas: CategoriaMl[];
}

/** URL de un endpoint de /api/mercado-libre con sus filtros (los vacíos no van). */
export const urlMl = (endpoint: "resumen" | "productos" | "categorias" | "reposicion", filtros: Record<string, string | number | null | undefined>) => {
  const q = new URLSearchParams(
    Object.entries(filtros)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => [k, String(v)])
  ).toString();
  return `${BACKEND_URL}/api/mercado-libre/${endpoint}?${q}`;
};

export const n = (v: unknown) => Number(v) || 0;
export const unidades = (v: number | null | undefined) => (Number(v) || 0).toLocaleString("es-CL", { maximumFractionDigits: 0 });
export const fechaCorta = (iso?: string | null) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "—");

/** Suma de pares (los nulos cuentan como cero). */
export const sumaPar = (...pares: (Par | undefined)[]): Par => ({
  neto: pares.reduce((s, p) => s + n(p?.neto), 0),
  conIva: pares.reduce((s, p) => s + n(p?.conIva), 0),
});

/** Lo que cobra ML (comisión + envío) de unos totales. */
export const cobros = (t?: Totales | ProductoMl | CategoriaMl) => sumaPar(t?.comision, t?.envio);

/** Variación porcentual; null sin base. */
export const variacion = (actual: number, anterior: number) => (anterior ? ((actual - anterior) / anterior) * 100 : null);

/**
 * Monto neto en grande y el con IVA debajo (tablas). `corto` usa el formato
 * de tarjetas ($1,2 M).
 */
export function Monto({ par, corto = false, fuerte = true, color }: { par: Par; corto?: boolean; fuerte?: boolean; color?: string }) {
  if (par.neto == null) return <Box component="span" sx={{ color: tinta.tenue }}>—</Box>;
  const f = corto ? formatoMonto : formatoPesos;
  return (
    <Tooltip title={`Sin IVA ${formatoPesos(par.neto)} · Con IVA ${formatoPesos(par.conIva)}`} placement="top" arrow>
      <Box component="span" sx={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end", ...cifraSx }}>
        <Box component="span" sx={{ fontWeight: fuerte ? 700 : 500, color: color ?? tinta.primaria }}>{f(par.neto)}</Box>
        <Box component="span" sx={{ fontSize: 10.5, color: tinta.tenue }}>{f(par.conIva)} c/IVA</Box>
      </Box>
    </Tooltip>
  );
}

/** Barra apilada Full / Colecta / Flex / otros de una venta. */
export function BarraTipos({ porTipo, alto = 6 }: { porTipo: Record<TipoEnvio, PorTipo>; alto?: number }) {
  const total = TIPOS_ENVIO.reduce((s, t) => s + Math.max(0, n(porTipo[t.clave]?.venta.neto)), 0);
  if (!total) return null;
  const partes = TIPOS_ENVIO.map((t) => ({ ...t, valor: Math.max(0, n(porTipo[t.clave]?.venta.neto)) })).filter((p) => p.valor > 0);
  return (
    <Tooltip
      placement="top"
      arrow
      title={
        <>
          {partes.map((p) => (
            <Box key={p.clave} sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
              <span>{p.nombre}</span>
              <span>
                {formatoMonto(p.valor)} · {Math.round((p.valor / total) * 100)}% · {unidades(porTipo[p.clave]?.unidades)} u.
              </span>
            </Box>
          ))}
        </>
      }
    >
      <Box sx={{ display: "flex", height: alto, borderRadius: 999, overflow: "hidden", bgcolor: "#eef2f6" }}>
        {partes.map((p) => (
          <Box key={p.clave} sx={{ width: `${(p.valor / total) * 100}%`, bgcolor: p.color }} />
        ))}
      </Box>
    </Tooltip>
  );
}

/** Leyenda de los tipos de envío. */
export function LeyendaTipos({ tipos = TIPOS_ENVIO }: { tipos?: typeof TIPOS_ENVIO }) {
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
      {tipos.map((t) => (
        <Box key={t.clave} title={t.descripcion} sx={{ display: "flex", alignItems: "center", gap: 0.6, fontSize: 12, color: tinta.secundaria }}>
          <Box sx={{ width: 8, height: 8, borderRadius: "2px", bgcolor: t.color }} />
          {t.nombre}
        </Box>
      ))}
    </Box>
  );
}

/**
 * Hasta qué día llegan las ventas de ML (última corrida completa de la carga
 * diaria de la API de órdenes). Va sobre la tarjeta de filtros, como
 * FrescuraDatos: la tarjeta debe tener `position: relative`.
 */
export function DatosMlAl({ datosAl }: { datosAl?: string | null }) {
  if (datosAl === undefined) return null;
  return (
    <Box
      title="Ventas Full: carga diaria desde la API de órdenes de Mercado Libre. Colecta y Flex: pedidos de mercadolibre-oms."
      sx={{
        position: "absolute",
        right: 12,
        bottom: "calc(100% + 3px)",
        display: "flex",
        alignItems: "center",
        gap: 0.6,
        fontSize: 10.5,
        lineHeight: 1,
        color: tinta.tenue,
        whiteSpace: "nowrap",
      }}
    >
      <Box component="span" sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: datosAl ? "#16a34a" : "#dc2626", flexShrink: 0 }} />
      {datosAl ? `Ventas Mercado Libre al ${fechaCorta(datosAl)}` : "Sin carga de Mercado Libre registrada"}
    </Box>
  );
}

/** Aviso cuando el back no pudo leer la comisión por publicación (pim-service). */
export function AvisoEstimaciones({ estimaciones }: { estimaciones?: boolean }) {
  if (estimaciones !== false) return null;
  return (
    <Typography sx={{ fontSize: 12, color: "#b54708", bgcolor: "#fffaeb", border: "1px solid #fedf89", borderRadius: "10px", px: 1.5, py: 0.75, mb: 2 }}>
      No se pudo leer la comisión por publicación: la comisión del Full y el costo de envío no se muestran. Las ventas sí.
    </Typography>
  );
}
