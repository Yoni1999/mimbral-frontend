"use client";
// Piezas comunes de los informes de Falabella: tipos de la respuesta de
// analysis-service /api/falabella/*, filtros compartidos, avisos y tablas.
//
// Los costos son estimados con las reglas publicadas por Falabella: comisión
// de la categoría sobre el precio de lista y despacho por el peso del paquete
// que Falabella tiene del producto, ajustado contra sus facturas. «Full» es
// Fulfillment by Falabella; «Normal», despacho desde nuestra bodega.
import React from "react";
import Link from "next/link";
import { Box, Tooltip } from "@mui/material";
import { IconAlertTriangle, IconChevronRight, IconInfoCircle } from "@tabler/icons-react";
import { BACKEND_URL } from "@/config";
import { useEstadoVista } from "@/utils/estadoVista";
import TablaInforme, { ColumnaInforme, ConMiniatura } from "../../ventas/mercado-libre/components/TablaInforme";
import { ChipVariacion, TextoCelda, cifraSx, formatoMonto, formatoPorcentaje, tinta } from "../../ventas/components/estilo";
import { Par } from "../../ventas/mercado-libre/components/comun";
import { Aviso, Contexto, FiltrosPeriodo, MargenCelda, MontoCorto, Variacion, fecha, n, pct, periodoInicial, unidades } from "../../categorias/mercado-libre/components/comun";

export type TipoFal = "full" | "normal";
export type FiltroTipo = "todos" | TipoFal;
export const TIPOS_FAL: { clave: TipoFal; nombre: string; color: string }[] = [
  { clave: "full", nombre: "Full", color: "#2563eb" },
  { clave: "normal", nombre: "Normal", color: "#f59e0b" },
];

export interface BloqueFal {
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
  canceladas: number;
  devueltas: number;
  devuelto: Par;
  porTipo: Record<TipoFal, Par>;
}

export interface Estimaciones {
  margen: string;
  despacho: string;
  noIncluye: string;
}

export interface ContextoFal extends Omit<Contexto, "estimaciones"> {
  estimaciones?: Estimaciones;
}

export interface FilaCategoriaFal {
  /** Ruta de la categoría ("Hogar > Muebles"); null en «Sin categoría». */
  id: string | null;
  nombre: string;
  tieneHijos: boolean;
  actual: BloqueFal;
  comparacion: BloqueFal;
  variacion: Variacion;
  diferencia: Par;
  participacion: { actual: number | null; comparacion: number | null };
  aporte: number | null;
  nueva: boolean;
}

export interface ComparativoFal extends ContextoFal {
  calidad: { lineasSinPeso: number; lineasConComisionEstimada: number };
  total: { actual: BloqueFal; comparacion: BloqueFal; variacion: Variacion; diferencia: Par };
  categorias: FilaCategoriaFal[];
}

export interface FilaProductoFal {
  sku: string;
  nombre: string | null;
  imagen: string | null;
  categoriaId: string | null;
  categoria: string | null;
  rutaCategoria: { id: string; nombre: string }[];
  /** Comisión de su categoría (0,15 = 15 %); null si la categoría no está en la planilla. */
  comisionPct: number | null;
  /** Peso con que Falabella cobra el despacho (kg): el mayor entre real y volumétrico. */
  pesoFacturable: number | null;
  costoUnitario: number | null;
  actual: BloqueFal;
  comparacion: BloqueFal;
  variacion: Variacion;
  diferencia: Par;
  participacion: number | null;
  nuevo: boolean;
  sinVentas: boolean;
}

export interface ProductosFal extends ContextoFal {
  cantidad: number;
  filas: FilaProductoFal[];
}

export interface EvolucionFal {
  desde: string | null;
  hasta: string | null;
  meses: ({ mes: string } & BloqueFal)[];
}

/** Filtros de período y tipo de envío, compartidos entre las páginas de Falabella. */
export const usePeriodoFal = () =>
  useEstadoVista<FiltrosPeriodo>("falabella:periodo", () => ({ ...periodoInicial(), comparar: "anterior" }), {
    restaurar: (g) => ({ ...periodoInicial(), comparar: "anterior", ...(g && "comparar" in g ? g : {}) }),
  });
export const useTipoFal = () => useEstadoVista<{ tipo: FiltroTipo }>("falabella:tipo", () => ({ tipo: "todos" }));

export const OPCIONES_TIPO: { valor: FiltroTipo; texto: string }[] = [
  { valor: "todos", texto: "Todo" },
  { valor: "full", texto: "Full" },
  { valor: "normal", texto: "Normal" },
];

/** URL de un endpoint de /api/falabella. */
export const urlFal = (endpoint: "resumen" | "comparativo" | "productos" | "evolucion" | "devoluciones" | "publicaciones" | "stock-full", filtros: Record<string, string | number | null | undefined>) => {
  const q = new URLSearchParams(
    Object.entries(filtros)
      .filter(([, v]) => v !== undefined && v !== null && v !== "" && v !== "todos")
      .map(([k, v]) => [k, String(v)])
  ).toString();
  return `${BACKEND_URL}/api/falabella/${endpoint}?${q}`;
};

/** Monto en pesos exactos (para valores por unidad, donde «$5 mil» esconde la diferencia). */
export const pesos = (v: number | null | undefined) => (v == null ? "—" : `${v < 0 ? "−" : ""}$${Math.abs(Math.round(v)).toLocaleString("es-CL")}`);

export const rutaProductos = (categoria?: string | null) =>
  `/utilities/falabella/productos${categoria ? `?${new URLSearchParams({ categoria }).toString()}` : ""}`;

/** Avisos: comparación con historia parcial y cómo se estiman los costos. */
export function AvisosFal({ contexto, calidad }: { contexto?: ContextoFal | null; calidad?: ComparativoFal["calidad"] }) {
  if (!contexto) return null;
  const e = contexto.estimaciones;
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
      {contexto.comparacionParcial && (
        <Aviso tono="mal" icono={<IconAlertTriangle size={16} />}>
          El período de comparación empieza antes del {fecha(contexto.datosDesde)}, primer día con órdenes de Falabella guardadas: sus cifras están incompletas.
        </Aviso>
      )}
      {e && (
        <Aviso tono="neutro" icono={<IconInfoCircle size={16} />}>
          {e.margen} {e.despacho} No incluye: {e.noIncluye}
          {calidad && calidad.lineasConComisionEstimada > 0 ? ` ${unidades(calidad.lineasConComisionEstimada)} unidades son de categorías sin comisión en la planilla (se usa 15 %).` : ""}
        </Aviso>
      )}
    </Box>
  );
}

/** Barra con la parte de la venta que salió por Full y por despacho normal. */
export function BarraTiposFal({ porTipo }: { porTipo: Record<TipoFal, Par> }) {
  const total = TIPOS_FAL.reduce((s, t) => s + n(porTipo?.[t.clave]?.neto), 0);
  if (!total) return <Box component="span" sx={{ color: tinta.tenue }}>—</Box>;
  const detalle = TIPOS_FAL.map((t) => `${t.nombre} ${formatoPorcentaje((n(porTipo[t.clave]?.neto) / total) * 100)} (${formatoMonto(porTipo[t.clave]?.neto)})`).join(" · ");
  return (
    <Tooltip title={detalle} arrow placement="top">
      <Box sx={{ display: "flex", height: 8, borderRadius: 99, overflow: "hidden", bgcolor: tinta.fondoSuave, minWidth: 60 }}>
        {TIPOS_FAL.map((t) => (
          <Box key={t.clave} sx={{ width: `${(n(porTipo[t.clave]?.neto) / total) * 100}%`, bgcolor: t.color }} />
        ))}
      </Box>
    </Tooltip>
  );
}

export function LeyendaTiposFal() {
  return (
    <Box sx={{ display: "flex", gap: 1.5, fontSize: 12, color: tinta.secundaria }}>
      {TIPOS_FAL.map((t) => (
        <Box key={t.clave} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: 99, bgcolor: t.color }} />
          {t.nombre}
        </Box>
      ))}
    </Box>
  );
}

const enlaceSx = { color: tinta.acento, textDecoration: "none", fontWeight: 600, "&:hover": { textDecoration: "underline" } } as const;

/** Parte de la venta (con IVA) que se va en un costo; «—» sin venta. */
const parte = (costo: Par, venta: Par) => (n(venta.conIva) > 0 && costo.conIva != null ? (n(costo.conIva) / n(venta.conIva)) * 100 : null);
const CeldaParte = ({ costo, venta }: { costo: Par; venta: Par }) => {
  const p = parte(costo, venta);
  if (p == null) return <Box component="span" sx={{ color: tinta.tenue }}>—</Box>;
  return (
    <Tooltip title={`${formatoMonto(costo.neto)} sin IVA`} arrow placement="top">
      <Box component="span" sx={cifraSx}>{formatoPorcentaje(p)}</Box>
    </Tooltip>
  );
};

function Crecimiento({ valor, nueva, sinVentas }: { valor: number | null; nueva?: boolean; sinVentas?: boolean }) {
  if (nueva) return <Box component="span" sx={{ fontSize: 11.5, fontWeight: 700, color: "#067647" }}>Nueva</Box>;
  if (sinVentas) return <Box component="span" sx={{ fontSize: 11.5, fontWeight: 700, color: "#b42318" }}>Sin ventas</Box>;
  return <ChipVariacion valor={pct(valor)} />;
}


/** Categorías de Falabella en un nivel: período actual contra comparación, con sus costos. */
export function TablaCategoriasFal({ filas, cargando, onEntrar, nombreExcel }: { filas: FilaCategoriaFal[]; cargando: boolean; onEntrar?: (f: FilaCategoriaFal) => void; nombreExcel: string }) {
  const columnas: ColumnaInforme<FilaCategoriaFal>[] = [
    {
      clave: "nombre",
      titulo: "Categoría",
      ancho: 22,
      valor: (f) => f.nombre,
      celda: (f) => (
        <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          {f.id && f.tieneHijos && onEntrar ? (
            <Box component="button" type="button" onClick={() => onEntrar(f)} sx={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 0.25, fontWeight: 700, color: tinta.primaria, "&:hover": { color: tinta.acento } }}>
              <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.nombre}</Box>
              <IconChevronRight size={14} />
            </Box>
          ) : (
            <TextoCelda texto={f.nombre} />
          )}
          {f.id && (
            <Box component={Link} href={rutaProductos(f.id)} sx={{ ...enlaceSx, fontSize: 11.5 }}>
              Ver productos
            </Box>
          )}
        </Box>
      ),
    },
    { clave: "venta", titulo: "Venta", ancho: 9, alinear: "right", valor: (f) => n(f.actual.venta.neto), excel: "Venta neta", celda: (f) => <MontoCorto par={f.actual.venta} fuerte /> },
    { clave: "ventaComp", titulo: "Comparación", ancho: 9, alinear: "right", valor: (f) => n(f.comparacion.venta.neto), excel: "Venta neta comparación", celda: (f) => <MontoCorto par={f.comparacion.venta} color={tinta.secundaria} /> },
    { clave: "crec", titulo: "Crecimiento", ancho: 8, alinear: "right", valor: (f) => (f.nueva ? 9999 : pct(f.variacion.venta)), excel: "Crecimiento %", celda: (f) => <Crecimiento valor={f.variacion.venta} nueva={f.nueva} /> },
    { clave: "part", titulo: "Particip.", ancho: 6, alinear: "right", valor: (f) => (f.participacion.actual == null ? null : f.participacion.actual * 100), excel: "Participación %", celda: (f) => (f.participacion.actual == null ? "—" : formatoPorcentaje(f.participacion.actual * 100)) },
    { clave: "unid", titulo: "Unidades", ancho: 6, alinear: "right", valor: (f) => f.actual.unidades, celda: (f) => <Box sx={cifraSx}>{unidades(f.actual.unidades)}</Box> },
    { clave: "com", titulo: "Comisión", ancho: 7, alinear: "right", valor: (f) => parte(f.actual.comision, f.actual.venta), excel: "Comisión % de la venta", celda: (f) => <CeldaParte costo={f.actual.comision} venta={f.actual.venta} /> },
    { clave: "desp", titulo: "Despacho", ancho: 7, alinear: "right", valor: (f) => parte(f.actual.envio, f.actual.venta), excel: "Despacho % de la venta", celda: (f) => <CeldaParte costo={f.actual.envio} venta={f.actual.venta} /> },
    { clave: "margenPct", titulo: "Margen %", ancho: 10, alinear: "right", valor: (f) => (f.actual.margenPct == null ? null : f.actual.margenPct * 100), excel: "Margen %", celda: (f) => <MargenCelda actual={f.actual.margenPct} puntos={f.variacion.margenPuntos} anterior={f.comparacion.margenPct} /> },
    { clave: "tipos", titulo: "Full · Normal", ancho: 8, celda: (f) => <BarraTiposFal porTipo={f.actual.porTipo} /> },
  ];
  return (
    <TablaInforme<FilaCategoriaFal>
      filas={filas}
      cargando={cargando}
      columnas={columnas}
      clave={(f) => f.id ?? `sin-${f.nombre}`}
      textoBusqueda={(f) => f.nombre}
      ordenInicial={{ clave: "venta", direccion: "desc" }}
      nombreExcel={nombreExcel}
      extraExcel={[
        { titulo: "Ruta categoría", valor: (f) => f.id },
        { titulo: "Órdenes", valor: (f) => f.actual.ordenes },
        { titulo: "Productos", valor: (f) => f.actual.productos },
        { titulo: "Comisión neta", valor: (f) => f.actual.comision.neto },
        { titulo: "Despacho neto", valor: (f) => f.actual.envio.neto },
        { titulo: "Costo SAP", valor: (f) => f.actual.costo },
        { titulo: "Margen % comparación", valor: (f) => (f.comparacion.margenPct == null ? null : f.comparacion.margenPct * 100) },
        { titulo: "Full neto", valor: (f) => f.actual.porTipo.full?.neto },
        { titulo: "Normal neto", valor: (f) => f.actual.porTipo.normal?.neto },
        { titulo: "Unidades canceladas", valor: (f) => f.actual.canceladas },
        { titulo: "Unidades devueltas", valor: (f) => f.actual.devueltas },
      ]}
      nota="Venta sin IVA; margen estimado, en % de la venta. Pulsa una categoría para bajar de nivel."
      anchoMinimo={1150}
    />
  );
}

export type OrdenProductos = "venta" | "margenPct" | "dif" | "unid";

/** Productos de Falabella: venta, costos y margen del período contra la comparación. */
export function TablaProductosFal({ filas, cargando, nombreExcel, orden = "venta", invertido = false }: { filas: FilaProductoFal[]; cargando: boolean; nombreExcel: string; orden?: OrdenProductos; invertido?: boolean }) {
  const columnas: ColumnaInforme<FilaProductoFal>[] = [
    {
      clave: "sku",
      titulo: "Producto",
      ancho: 26,
      valor: (f) => f.sku,
      celda: (f) => (
        <ConMiniatura imagen={f.imagen} titulo={f.nombre || f.sku}>
          <TextoCelda texto={f.nombre || f.sku} secundario={f.categoria ?? "Sin categoría"} />
          <Box component={Link} href={`/utilities/analisis-producto1.1?itemCode=${encodeURIComponent(f.sku)}`} sx={{ ...enlaceSx, fontSize: 11.5 }}>
            {f.sku}
          </Box>
        </ConMiniatura>
      ),
    },
    { clave: "venta", titulo: "Venta", ancho: 9, alinear: "right", valor: (f) => n(f.actual.venta.neto), excel: "Venta neta", celda: (f) => <MontoCorto par={f.actual.venta} fuerte /> },
    { clave: "crec", titulo: "Crecimiento", ancho: 8, alinear: "right", valor: (f) => (f.nuevo ? 9999 : f.sinVentas ? -100 : pct(f.variacion.venta)), excel: "Crecimiento %", celda: (f) => <Crecimiento valor={f.variacion.venta} nueva={f.nuevo} sinVentas={f.sinVentas} /> },
    { clave: "dif", titulo: "Diferencia", ancho: 8, alinear: "right", valor: (f) => n(f.diferencia.neto), excel: "Diferencia neta", celda: (f) => <MontoCorto par={f.diferencia} color={n(f.diferencia.neto) < 0 ? "#b42318" : "#067647"} /> },
    { clave: "unid", titulo: "Unidades", ancho: 6, alinear: "right", valor: (f) => f.actual.unidades, celda: (f) => <Box sx={cifraSx}>{unidades(f.actual.unidades)}</Box> },
    { clave: "com", titulo: "Comisión", ancho: 7, alinear: "right", valor: (f) => (f.comisionPct == null ? null : f.comisionPct * 100), excel: "Comisión %", celda: (f) => (f.comisionPct == null ? <Tooltip title="Categoría sin comisión en la planilla: se estima con 15 %" arrow><Box component="span" sx={{ color: "#b54708" }}>15 % est.</Box></Tooltip> : formatoPorcentaje(f.comisionPct * 100)) },
    {
      clave: "desp",
      titulo: "Despacho",
      ancho: 8,
      alinear: "right",
      valor: (f) => (f.actual.unidades ? n(f.actual.envio.neto) / f.actual.unidades : null),
      excel: "Despacho neto por unidad",
      celda: (f) =>
        f.actual.unidades ? (
          <Tooltip title={f.pesoFacturable == null ? "Falabella no tiene el peso del paquete: se usa el tramo más liviano" : `Se cobra por ${f.pesoFacturable.toLocaleString("es-CL", { maximumFractionDigits: 1 })} kg (el mayor entre peso y volumen)`} arrow placement="top">
            <Box component="span" sx={cifraSx}>{pesos(n(f.actual.envio.neto) / f.actual.unidades)}</Box>
          </Tooltip>
        ) : (
          "—"
        ),
    },
    { clave: "margenPct", titulo: "Margen %", ancho: 10, alinear: "right", valor: (f) => (f.actual.margenPct == null ? null : f.actual.margenPct * 100), excel: "Margen %", celda: (f) => <MargenCelda actual={f.actual.margenPct} puntos={f.variacion.margenPuntos} anterior={f.comparacion.margenPct} /> },
    { clave: "tipos", titulo: "Full · Normal", ancho: 7, celda: (f) => <BarraTiposFal porTipo={n(f.actual.venta.neto) > 0 ? f.actual.porTipo : f.comparacion.porTipo} /> },
  ];
  return (
    <TablaInforme<FilaProductoFal>
      filas={filas}
      cargando={cargando}
      columnas={columnas}
      clave={(f) => f.sku}
      textoBusqueda={(f) => `${f.sku} ${f.nombre ?? ""} ${f.categoriaId ?? ""}`}
      ordenInicial={{ clave: orden, direccion: invertido ? "asc" : "desc" }}
      nombreExcel={nombreExcel}
      extraExcel={[
        { titulo: "Nombre", valor: (f) => f.nombre },
        { titulo: "Ruta categoría", valor: (f) => f.categoriaId },
        { titulo: "Venta neta comparación", valor: (f) => f.comparacion.venta.neto },
        { titulo: "Unidades comparación", valor: (f) => f.comparacion.unidades },
        { titulo: "Órdenes", valor: (f) => f.actual.ordenes },
        { titulo: "Comisión neta", valor: (f) => f.actual.comision.neto },
        { titulo: "Despacho neto", valor: (f) => f.actual.envio.neto },
        { titulo: "Peso facturable kg", valor: (f) => f.pesoFacturable },
        { titulo: "Costo SAP unitario", valor: (f) => f.costoUnitario },
        { titulo: "Full neto", valor: (f) => f.actual.porTipo.full?.neto },
        { titulo: "Normal neto", valor: (f) => f.actual.porTipo.normal?.neto },
        { titulo: "Unidades canceladas", valor: (f) => f.actual.canceladas },
        { titulo: "Unidades devueltas", valor: (f) => f.actual.devueltas },
      ]}
      nota="Venta sin IVA; comisión, despacho y margen estimados."
      anchoMinimo={1150}
    />
  );
}
