"use client";

import React from "react";
import { Box, Button, InputAdornment, Pagination, Skeleton, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { IconArrowLeft, IconDownload, IconSearch } from "@tabler/icons-react";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { BACKEND_URL } from "@/config";
import { useApiDatos } from "@/utils/useCargaDatos";
import { useEstadoVista } from "@/utils/estadoVista";
import { conPeriodoRapido, etiquetaRango, presetsDeHoy, resolverPeriodoRapido } from "@/app/(DashboardLayout)/utilities/ventas/components/RangosRapidos";
import {
  BarraParticipacion,
  ChipVariacion,
  Columnas,
  Panel,
  Pildoras,
  TextoCelda,
  cifraSx,
  controlSx,
  estado,
  etiquetaControlSx,
  formatoMonto,
  formatoPesos,
  formatoPorcentaje,
  tablaSx,
  tarjetaSx,
  tinta,
} from "@/app/(DashboardLayout)/utilities/ventas/components/estilo";
import { descargarExcel } from "@/app/(DashboardLayout)/utilities/ventas/components/detalle/comun";
import HeaderMl, { RangoMl } from "@/app/(DashboardLayout)/utilities/ventas/mercado-libre/components/HeaderMl";
import { CeldaOrden, useOrdenTabla, OrdenTabla } from "@/app/(DashboardLayout)/utilities/ventas/components/ordenTabla";
import { BarraListaMovil, OrdenMovil, TarjetasMovil, useEsCelular } from "@/app/(DashboardLayout)/utilities/ventas/components/movil";

// ── Tipos de la respuesta (analysis-service /api/marcas) ─────────────────────

type Par = { neto: number | null; conIva: number | null };
type Canal = "ml" | "falabella" | "todos";
type Comparar = "mes" | "anterior" | "anio";

interface MarcaFila {
  marca: string;
  venta: Par;
  ventaAnterior: Par;
  diferencia: Par;
  variacion: number | null;
  unidades: number;
  unidadesAnterior: number;
  variacionUnidades: number | null;
  productos: number;
  productosAnterior: number;
  participacion: number;
  participacionAnterior: number;
  suben: number;
  bajan: number;
}
interface Periodo {
  desde: string;
  hasta: string;
}
interface ResumenMarcas {
  canal: Canal;
  periodo: Periodo;
  comparacion: Periodo;
  total: { venta: Par; ventaAnterior: Par; variacion: number | null };
  marcas: MarcaFila[];
}
interface ProductoMarca {
  sku: string;
  nombre: string | null;
  venta: Par;
  ventaAnterior: Par;
  diferencia: Par;
  variacion: number | null;
  unidades: number;
  unidadesAnterior: number;
  tipos: Record<string, number>;
}
interface DetalleMarca {
  marca: string;
  periodo: Periodo;
  comparacion: Periodo;
  totales: {
    venta: Par;
    ventaAnterior: Par;
    diferencia: Par;
    variacion: number | null;
    unidades: number;
    unidadesAnterior: number;
    variacionUnidades: number | null;
    productos: number;
    productosAnterior: number;
    tipos: Record<string, number>;
  };
  masVendidos: ProductoMarca[];
  suben: ProductoMarca[];
  bajan: ProductoMarca[];
  nuevos: ProductoMarca[];
  sinVentas: ProductoMarca[];
  productos: ProductoMarca[];
}

// ── Opciones ─────────────────────────────────────────────────────────────────

const CANALES: { valor: Canal; texto: string }[] = [
  { valor: "ml", texto: "Mercado Libre" },
  { valor: "falabella", texto: "Falabella" },
  { valor: "todos", texto: "Ambos" },
];
const COMPARAR: { valor: Comparar; texto: string }[] = [
  { valor: "mes", texto: "Mismos días del mes anterior" },
  { valor: "anterior", texto: "Período anterior" },
  { valor: "anio", texto: "Mismo período del año anterior" },
];
type Orden = "venta" | "sube" | "baja" | "variacion" | "unidades";
const ORDENES: { valor: Orden; texto: string }[] = [
  { valor: "venta", texto: "Venta" },
  { valor: "sube", texto: "Más sube" },
  { valor: "baja", texto: "Más baja" },
  { valor: "variacion", texto: "Variación %" },
  { valor: "unidades", texto: "Unidades" },
];
type Lista = "masVendidos" | "suben" | "bajan" | "nuevos" | "sinVentas" | "productos";
const LISTAS: { valor: Lista; texto: string; descripcion: string }[] = [
  { valor: "masVendidos", texto: "Más vendidos", descripcion: "Productos de la marca con más venta en el período." },
  { valor: "suben", texto: "Suben", descripcion: "Los que más venta ganaron contra la comparación." },
  { valor: "bajan", texto: "Bajan", descripcion: "Los que más venta perdieron contra la comparación." },
  { valor: "nuevos", texto: "Nuevos", descripcion: "Vendieron en el período y no en la comparación." },
  { valor: "sinVentas", texto: "Dejaron de venderse", descripcion: "Vendieron en la comparación y no en el período." },
  { valor: "productos", texto: "Todos", descripcion: "Todos los productos de la marca con venta en alguno de los dos períodos." },
];
const NOMBRE_TIPO: Record<string, string> = {
  full: "Full",
  colecta: "Colecta",
  flex: "Flex",
  otro: "Otros envíos",
  normal: "Despacho normal",
  "ml:full": "ML Full",
  "ml:colecta": "ML Colecta",
  "ml:flex": "ML Flex",
  "ml:otro": "ML otros envíos",
  "falabella:full": "Falabella Full",
  "falabella:normal": "Falabella normal",
};
const POR_PAGINA = 50;

// ── Fechas ───────────────────────────────────────────────────────────────────

const DIA = 86_400_000;
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const restarMeses = (fecha: string, meses: number) => {
  const [y, m, d] = fecha.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1 - meses, 1));
  const ultimo = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)).getUTCDate();
  return iso(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), Math.min(d, ultimo)));
};
/** Período de comparación según la opción elegida. */
function comparacionDe(r: RangoMl, c: Comparar): { compInicio: string; compFin: string } {
  if (c === "mes") return { compInicio: restarMeses(r.fechaInicio, 1), compFin: restarMeses(r.fechaFin, 1) };
  if (c === "anio") return { compInicio: restarMeses(r.fechaInicio, 12), compFin: restarMeses(r.fechaFin, 12) };
  const dias = Math.round((Date.parse(r.fechaFin) - Date.parse(r.fechaInicio)) / DIA) + 1;
  const fin = Date.parse(r.fechaInicio) - DIA;
  return { compInicio: iso(fin - (dias - 1) * DIA), compFin: iso(fin) };
}
const fechaCorta = (f: string) => f.split("-").reverse().join("-");
const textoPeriodo = (p?: Periodo) => (p ? `${fechaCorta(p.desde)} al ${fechaCorta(p.hasta)}` : "");

const rangoEsteMes = (): RangoMl => {
  const p = presetsDeHoy().find((x) => x.label === "Este mes")!;
  return { fechaInicio: p.inicio, fechaFin: p.fin };
};

type Filtros = RangoMl & { canal: Canal; comparar: Comparar; orden: Orden; marca: string; lista: Lista };
const inicial = (): Filtros => ({ canal: "ml", comparar: "mes", orden: "venta", marca: "", lista: "masVendidos", ...rangoEsteMes() });

const n = (v: number | null | undefined) => Number(v) || 0;
const unidades = (v: number) => v.toLocaleString("es-CL");
const urlMarcas = (endpoint: "resumen" | "detalle", q: Record<string, string>) => `${BACKEND_URL}/api/marcas/${endpoint}?${new URLSearchParams(q).toString()}`;

const valorOrden = (m: MarcaFila, o: Orden) =>
  o === "sube" ? n(m.diferencia.neto) : o === "baja" ? -n(m.diferencia.neto) : o === "variacion" ? (m.variacion ?? Number.POSITIVE_INFINITY) : o === "unidades" ? m.unidades : n(m.venta.neto);

/** Diferencia en pesos con signo y color (nunca solo color: lleva el signo). */
function Diferencia({ valor }: { valor: number | null }) {
  const v = n(valor);
  const tono = v > 0 ? estado.bien.color : v < 0 ? estado.mal.color : tinta.secundaria;
  return (
    <Typography component="span" sx={{ fontSize: 12.5, fontWeight: 650, color: tono, ...cifraSx }}>
      {v > 0 ? "+" : ""}
      {formatoMonto(v)}
    </Typography>
  );
}

/** Variación; sin venta en la comparación es "Nueva". */
function Variacion({ valor, actual }: { valor: number | null; actual: number }) {
  if (valor === null) return actual > 0 ? <Typography component="span" sx={{ fontSize: 12, fontWeight: 700, color: estado.bien.color }}>Nueva</Typography> : null;
  return <ChipVariacion valor={valor * 100} />;
}

function Tarjetas({ items, cargando }: { items: { titulo: string; valor: React.ReactNode; pie: React.ReactNode }[]; cargando: boolean }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: `repeat(${items.length}, 1fr)` }, gap: 1.5, mb: 2 }}>
      {items.map((r) => (
        <Box key={r.titulo} sx={{ ...tarjetaSx, px: 1.5, py: 1.25, minWidth: 0 }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: tinta.secundaria }}>{r.titulo}</Typography>
          <Typography component="div" sx={{ fontSize: 20, fontWeight: 750, color: tinta.primaria, ...cifraSx }}>
            {cargando ? "…" : r.valor}
          </Typography>
          <Typography component="div" noWrap sx={{ fontSize: 11.5, color: tinta.tenue }}>
            {r.pie}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

function FilasCargando({ columnas, filas = 10 }: { columnas: number; filas?: number }) {
  return (
    <>
      {Array.from({ length: filas }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: columnas }).map((__, j) => (
            <TableCell key={j}>
              <Skeleton width="80%" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

// ── Tabla de marcas ──────────────────────────────────────────────────────────

function TablaMarcas({
  filas,
  desde,
  cargando,
  maximo,
  onElegir,
  orden,
  onOrdenar,
}: {
  filas: MarcaFila[];
  desde: number;
  cargando: boolean;
  maximo: number;
  onElegir: (m: string) => void;
  orden: OrdenTabla | null;
  onOrdenar: (clave: string) => void;
}) {
  const o = { orden, ordenarPor: onOrdenar };
  const esCelular = useEsCelular();
  // En celular cada marca es una tarjeta; el orden lo dan las píldoras "Ordenar por".
  if (esCelular) {
    return (
      <Box sx={{ pb: 1 }}>
        <TarjetasMovil
          cargando={cargando}
          vacio="Sin ventas en el período."
          filas={filas.map((m, i) => ({
            clave: m.marca,
            titulo: m.marca,
            meta: `${unidades(m.productos)} productos con venta`,
            rango: desde + i + 1,
            onAbrir: () => onElegir(m.marca),
            accionLabel: "Ver productos de la marca",
            principales: [
              { titulo: "Venta", valor: formatoMonto(m.venta.neto) },
              { titulo: "Unidades", valor: unidades(m.unidades), unidad: "un." },
              { titulo: "Variación", valor: <Variacion valor={m.variacion} actual={n(m.venta.neto)} />, prefijo: false },
            ],
            detalle: [
              { titulo: "Venta sin IVA", valor: formatoPesos(m.venta.neto) },
              { titulo: "Venta con IVA", valor: formatoPesos(m.venta.conIva) },
              { titulo: "Comparación", valor: formatoPesos(m.ventaAnterior.neto) },
              { titulo: "Diferencia", valor: <Diferencia valor={m.diferencia.neto} /> },
              { titulo: "Unidades antes", valor: unidades(m.unidadesAnterior) },
              { titulo: "Productos ↑ / ↓", valor: `↑ ${m.suben} / ↓ ${m.bajan}` },
              { titulo: "Participación", valor: formatoPorcentaje(m.participacion * 100) },
            ],
          }))}
        />
      </Box>
    );
  }
  return (
    <Box sx={{ overflowX: "auto" }}>
      <Table size="small" sx={{ ...tablaSx, minWidth: 900 }}>
        <Columnas anchos={[4, 20, 12, 12, 9, 10, 10, 11, 12]} />
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            <CeldaOrden clave="marca" orden={o.orden} onOrdenar={o.ordenarPor}>Marca</CeldaOrden>
            <CeldaOrden clave="venta" orden={o.orden} onOrdenar={o.ordenarPor} align="right">Venta</CeldaOrden>
            <CeldaOrden clave="comparacion" orden={o.orden} onOrdenar={o.ordenarPor} align="right">Comparación</CeldaOrden>
            <CeldaOrden clave="variacion" orden={o.orden} onOrdenar={o.ordenarPor} align="right">Variación</CeldaOrden>
            <CeldaOrden clave="diferencia" orden={o.orden} onOrdenar={o.ordenarPor} align="right">Diferencia</CeldaOrden>
            <CeldaOrden clave="unidades" orden={o.orden} onOrdenar={o.ordenarPor} align="right">Unidades</CeldaOrden>
            <CeldaOrden clave="suben" orden={o.orden} onOrdenar={o.ordenarPor} align="right">Productos ↑ / ↓</CeldaOrden>
            <CeldaOrden clave="participacion" orden={o.orden} onOrdenar={o.ordenarPor}>Participación</CeldaOrden>
          </TableRow>
        </TableHead>
        <TableBody>
          {cargando ? (
            <FilasCargando columnas={9} />
          ) : filas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} sx={{ textAlign: "center", color: tinta.tenue, py: 4 }}>
                Sin ventas en el período.
              </TableCell>
            </TableRow>
          ) : (
            filas.map((m, i) => (
              <TableRow key={m.marca} hover onClick={() => onElegir(m.marca)} sx={{ cursor: "pointer" }}>
                <TableCell sx={{ color: tinta.tenue }}>{desde + i + 1}</TableCell>
                <TableCell>
                  <TextoCelda texto={m.marca} secundario={`${unidades(m.productos)} productos con venta`} />
                </TableCell>
                <TableCell align="right">
                  <Typography sx={{ fontSize: 12.5, fontWeight: 700, ...cifraSx }}>{formatoPesos(m.venta.neto)}</Typography>
                  <Typography sx={{ fontSize: 11, color: tinta.tenue, ...cifraSx }}>{formatoPesos(m.venta.conIva)} c/IVA</Typography>
                </TableCell>
                <TableCell align="right" sx={{ color: tinta.secundaria }}>
                  {formatoPesos(m.ventaAnterior.neto)}
                </TableCell>
                <TableCell align="right">
                  <Variacion valor={m.variacion} actual={n(m.venta.neto)} />
                </TableCell>
                <TableCell align="right">
                  <Diferencia valor={m.diferencia.neto} />
                </TableCell>
                <TableCell align="right">
                  <Typography sx={{ fontSize: 12.5, ...cifraSx }}>{unidades(m.unidades)}</Typography>
                  <Typography sx={{ fontSize: 11, color: tinta.tenue, ...cifraSx }}>antes {unidades(m.unidadesAnterior)}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography component="span" sx={{ fontSize: 12.5, color: estado.bien.color, fontWeight: 650 }}>↑ {m.suben}</Typography>
                  <Typography component="span" sx={{ fontSize: 12.5, color: tinta.tenue }}> / </Typography>
                  <Typography component="span" sx={{ fontSize: 12.5, color: estado.mal.color, fontWeight: 650 }}>↓ {m.bajan}</Typography>
                </TableCell>
                <TableCell>
                  <Typography sx={{ fontSize: 11.5, color: tinta.secundaria, mb: 0.4, ...cifraSx }}>
                    {(m.participacion * 100).toFixed(1).replace(".", ",")}%
                  </Typography>
                  <BarraParticipacion valor={n(m.venta.neto)} maximo={maximo} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Box>
  );
}

// ── Tabla de productos de una marca ──────────────────────────────────────────

function TablaProductos({ filas, cargando, vacio }: { filas: ProductoMarca[]; cargando: boolean; vacio: string }) {
  const o = useOrdenTabla(filas, {
    producto: (p) => p.nombre ?? p.sku,
    venta: (p) => n(p.venta.neto),
    comparacion: (p) => n(p.ventaAnterior.neto),
    variacion: (p) => p.variacion,
    diferencia: (p) => n(p.diferencia.neto),
    unidades: (p) => p.unidades,
  });
  const esCelular = useEsCelular();
  if (esCelular) {
    return (
      <Box sx={{ px: 1.5, pb: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
        <OrdenMovil
          opciones={[
            { clave: "venta", titulo: "Venta" },
            { clave: "comparacion", titulo: "Comparación" },
            { clave: "variacion", titulo: "Variación" },
            { clave: "diferencia", titulo: "Diferencia" },
            { clave: "unidades", titulo: "Unidades" },
            { clave: "producto", titulo: "Producto" },
          ]}
          clave={o.orden?.clave ?? ""}
          direccion={o.orden?.direccion ?? "desc"}
          onCambiar={(clave, direccion) => o.setOrden({ clave, direccion })}
        />
        <TarjetasMovil
          cargando={cargando}
          vacio={vacio}
          filas={o.ordenadas.map((p, i) => ({
            clave: p.sku,
            titulo: p.nombre || p.sku,
            meta: [p.sku, ...Object.entries(p.tipos).map(([t, u]) => `${NOMBRE_TIPO[t] ?? t} ${unidades(u)}`)].join(" · "),
            rango: i + 1,
            principales: [
              { titulo: "Venta", valor: formatoMonto(p.venta.neto) },
              { titulo: "Unidades", valor: unidades(p.unidades), unidad: "un." },
              { titulo: "Variación", valor: <Variacion valor={p.variacion} actual={n(p.venta.neto)} />, prefijo: false },
            ],
            detalle: [
              { titulo: "Venta sin IVA", valor: formatoPesos(p.venta.neto) },
              { titulo: "Venta con IVA", valor: formatoPesos(p.venta.conIva) },
              { titulo: "Comparación", valor: formatoPesos(p.ventaAnterior.neto) },
              { titulo: "Diferencia", valor: <Diferencia valor={p.diferencia.neto} /> },
              { titulo: "Unidades antes", valor: unidades(p.unidadesAnterior) },
            ],
          }))}
        />
      </Box>
    );
  }
  return (
    <Box sx={{ overflowX: "auto" }}>
      <Table size="small" sx={{ ...tablaSx, minWidth: 860 }}>
        <Columnas anchos={[4, 34, 13, 13, 10, 12, 14]} />
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            <CeldaOrden clave="producto" orden={o.orden} onOrdenar={o.ordenarPor}>Producto</CeldaOrden>
            <CeldaOrden clave="venta" orden={o.orden} onOrdenar={o.ordenarPor} align="right">Venta</CeldaOrden>
            <CeldaOrden clave="comparacion" orden={o.orden} onOrdenar={o.ordenarPor} align="right">Comparación</CeldaOrden>
            <CeldaOrden clave="variacion" orden={o.orden} onOrdenar={o.ordenarPor} align="right">Variación</CeldaOrden>
            <CeldaOrden clave="diferencia" orden={o.orden} onOrdenar={o.ordenarPor} align="right">Diferencia</CeldaOrden>
            <CeldaOrden clave="unidades" orden={o.orden} onOrdenar={o.ordenarPor} align="right">Unidades</CeldaOrden>
          </TableRow>
        </TableHead>
        <TableBody>
          {cargando ? (
            <FilasCargando columnas={7} filas={8} />
          ) : filas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} sx={{ textAlign: "center", color: tinta.tenue, py: 4 }}>
                {vacio}
              </TableCell>
            </TableRow>
          ) : (
            o.ordenadas.map((p, i) => (
              <TableRow key={p.sku}>
                <TableCell sx={{ color: tinta.tenue }}>{i + 1}</TableCell>
                <TableCell>
                  <TextoCelda
                    texto={p.nombre || p.sku}
                    secundario={[p.sku, ...Object.entries(p.tipos).map(([t, u]) => `${NOMBRE_TIPO[t] ?? t} ${unidades(u)}`)].join(" · ")}
                  />
                </TableCell>
                <TableCell align="right">
                  <Typography sx={{ fontSize: 12.5, fontWeight: 700, ...cifraSx }}>{formatoPesos(p.venta.neto)}</Typography>
                  <Typography sx={{ fontSize: 11, color: tinta.tenue, ...cifraSx }}>{formatoPesos(p.venta.conIva)} c/IVA</Typography>
                </TableCell>
                <TableCell align="right" sx={{ color: tinta.secundaria }}>
                  {formatoPesos(p.ventaAnterior.neto)}
                </TableCell>
                <TableCell align="right">
                  <Variacion valor={p.variacion} actual={n(p.venta.neto)} />
                </TableCell>
                <TableCell align="right">
                  <Diferencia valor={p.diferencia.neto} />
                </TableCell>
                <TableCell align="right">
                  <Typography sx={{ fontSize: 12.5, ...cifraSx }}>{unidades(p.unidades)}</Typography>
                  <Typography sx={{ fontSize: 11, color: tinta.tenue, ...cifraSx }}>antes {unidades(p.unidadesAnterior)}</Typography>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Box>
  );
}

const filasExcelMarcas = (filas: MarcaFila[]) =>
  filas.map((m) => ({
    Marca: m.marca,
    "Venta sin IVA": Math.round(n(m.venta.neto)),
    "Venta con IVA": Math.round(n(m.venta.conIva)),
    "Comparación sin IVA": Math.round(n(m.ventaAnterior.neto)),
    "Diferencia sin IVA": Math.round(n(m.diferencia.neto)),
    "Variación %": m.variacion === null ? "Nueva" : Math.round(m.variacion * 1000) / 10,
    Unidades: m.unidades,
    "Unidades comparación": m.unidadesAnterior,
    "Productos con venta": m.productos,
    "Productos que suben": m.suben,
    "Productos que bajan": m.bajan,
    "Participación %": Math.round(m.participacion * 1000) / 10,
  }));
const filasExcelProductos = (filas: ProductoMarca[]) =>
  filas.map((p) => ({
    SKU: p.sku,
    Producto: p.nombre ?? "",
    "Venta sin IVA": Math.round(n(p.venta.neto)),
    "Comparación sin IVA": Math.round(n(p.ventaAnterior.neto)),
    "Diferencia sin IVA": Math.round(n(p.diferencia.neto)),
    "Variación %": p.variacion === null ? (n(p.venta.neto) > 0 ? "Nueva" : "") : Math.round(p.variacion * 1000) / 10,
    Unidades: p.unidades,
    "Unidades comparación": p.unidadesAnterior,
    "Tipo de envío": Object.entries(p.tipos)
      .map(([t, u]) => `${NOMBRE_TIPO[t] ?? t} ${u}`)
      .join(" · "),
  }));

/**
 * Informe de marcas en Mercado Libre y Falabella: cómo le fue a cada marca en
 * el período contra la comparación elegida (por defecto los mismos días del
 * mes anterior) y, al elegir una, qué productos la hicieron subir o bajar, los
 * más vendidos, los nuevos y los que dejaron de venderse.
 */
export default function InformeMarcas() {
  const [filtros, setFiltros] = useEstadoVista<Filtros>("informe-marcas", inicial, {
    serializar: conPeriodoRapido,
    restaurar: (g) => ({ ...inicial(), ...resolverPeriodoRapido<Filtros>(g) }),
  });
  const [buscar, setBuscar] = React.useState("");
  const esCelularPagina = useEsCelular();
  const [pagina, setPagina] = React.useState(1);
  const [descargando, setDescargando] = React.useState(false);
  React.useEffect(() => setPagina(1), [filtros.canal, filtros.fechaInicio, filtros.fechaFin, filtros.comparar, filtros.orden, buscar]);

  const comp = comparacionDe(filtros, filtros.comparar);
  const consulta = { canal: filtros.canal, fechaInicio: filtros.fechaInicio, fechaFin: filtros.fechaFin, ...comp };
  const resumen = useApiDatos<ResumenMarcas | null>(filtros.fechaInicio && filtros.fechaFin ? urlMarcas("resumen", consulta) : null, null);
  const detalle = useApiDatos<DetalleMarca | null>(filtros.marca ? urlMarcas("detalle", { ...consulta, marca: filtros.marca, limite: "50" }) : null, null);

  const todas = resumen.datos?.marcas ?? [];
  const q = buscar.trim().toLowerCase();
  const filas = todas
    .filter((m) => n(m.venta.neto) > 0 || n(m.ventaAnterior.neto) > 0)
    .filter((m) => !q || m.marca.toLowerCase().includes(q))
    .sort((a, b) => (filtros.orden === "variacion" ? valorOrden(b, "variacion") - valorOrden(a, "variacion") : valorOrden(b, filtros.orden) - valorOrden(a, filtros.orden)));
  // Pulsar un encabezado ordena por esa columna (por encima de "Ordenar por").
  const ordenMarcas = useOrdenTabla(filas, {
    marca: (m) => m.marca,
    venta: (m) => n(m.venta.neto),
    comparacion: (m) => n(m.ventaAnterior.neto),
    variacion: (m) => m.variacion,
    diferencia: (m) => n(m.diferencia.neto),
    unidades: (m) => m.unidades,
    suben: (m) => m.suben - m.bajan,
    participacion: (m) => m.participacion,
  });
  React.useEffect(() => setPagina(1), [ordenMarcas.orden]);
  const paginas = Math.max(1, Math.ceil(filas.length / POR_PAGINA));
  const visibles = ordenMarcas.ordenadas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  const maximo = Math.max(0, ...todas.map((m) => n(m.venta.neto)));

  const canalNombre = CANALES.find((c) => c.valor === filtros.canal)!.texto;
  const conVenta = todas.filter((m) => n(m.venta.neto) > 0);
  const suben = todas.filter((m) => n(m.diferencia.neto) > 0).length;
  const bajan = todas.filter((m) => n(m.diferencia.neto) < 0).length;
  const total = resumen.datos?.total;

  const tarjetasResumen = [
    {
      titulo: "Venta sin IVA",
      valor: formatoMonto(total?.venta.neto),
      pie: (
        <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
          <ChipVariacion valor={total?.variacion == null ? null : total.variacion * 100} /> contra {formatoMonto(total?.ventaAnterior.neto)}
        </Box>
      ),
    },
    { titulo: "Marcas con venta", valor: unidades(conVenta.length), pie: canalNombre },
    { titulo: "Marcas que suben", valor: unidades(suben), pie: "venden más que en la comparación" },
    { titulo: "Marcas que bajan", valor: unidades(bajan), pie: "venden menos que en la comparación" },
    { titulo: "Marca líder", valor: conVenta[0]?.marca ?? "—", pie: conVenta[0] ? `${(conVenta[0].participacion * 100).toFixed(1).replace(".", ",")}% de la venta` : "" },
  ];

  const d = detalle.datos;
  const listaActual = LISTAS.find((l) => l.valor === filtros.lista)!;
  const tiposMarca = d ? Object.entries(d.totales.tipos).sort((a, b) => b[1] - a[1]) : [];

  const exportar = async () => {
    setDescargando(true);
    try {
      const hojas = [{ nombre: "Marcas", filas: filasExcelMarcas(filas) }];
      if (d) {
        hojas.push({ nombre: `${d.marca} productos`.slice(0, 31), filas: filasExcelProductos(d.productos) as never });
      }
      await descargarExcel(`marcas_${filtros.canal}_${filtros.fechaInicio}_${filtros.fechaFin}${d ? `_${d.marca}` : ""}`, hojas);
    } finally {
      setDescargando(false);
    }
  };

  const enEstadoInicial =
    filtros.canal === "ml" && filtros.comparar === "mes" && filtros.orden === "venta" && !filtros.marca && etiquetaRango(filtros.fechaInicio, filtros.fechaFin) === "Este mes";

  return (
    <PageContainer title="Marcas en marketplaces" description="Rendimiento de cada marca en Mercado Libre y Falabella">
      <Box sx={{ maxWidth: 1680, mx: "auto" }}>
        <HeaderMl
          titulo="Marcas en marketplaces"
          contexto={canalNombre}
          rango={filtros}
          onRango={(r) => setFiltros((f) => ({ ...f, ...r }))}
          enEstadoInicial={enEstadoInicial}
          onLimpiar={() => {
            setFiltros(inicial());
            setBuscar("");
          }}
          acciones={
            <Button
              variant="contained"
              disableElevation
              startIcon={<IconDownload size={16} />}
              disabled={descargando || resumen.cargando || filas.length === 0}
              onClick={exportar}
              sx={{ textTransform: "none", borderRadius: "10px", height: 34, fontWeight: 700, whiteSpace: "nowrap" }}
            >
              <span className="boton-texto">{descargando ? "Generando…" : "Excel"}</span>
            </Button>
          }
        >
          <Pildoras etiqueta="Canal" opciones={CANALES} valor={filtros.canal} onCambiar={(c) => setFiltros((f) => ({ ...f, canal: c }))} />
        </HeaderMl>

        <Box sx={{ ...tarjetaSx, px: { xs: 1.5, sm: 2.5 }, py: 1.5, mb: 2, display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 2 }}>
          <Box>
            <Typography sx={etiquetaControlSx}>Comparar contra</Typography>
            <Pildoras etiqueta="Comparar contra" opciones={COMPARAR} valor={filtros.comparar} onCambiar={(c) => setFiltros((f) => ({ ...f, comparar: c }))} />
          </Box>
          <Typography sx={{ fontSize: 12, color: tinta.secundaria, ml: { md: "auto" } }}>
            Período <strong>{textoPeriodo(resumen.datos?.periodo)}</strong> contra <strong>{textoPeriodo(resumen.datos?.comparacion)}</strong>. Montos sin IVA. Marca según el catálogo.
          </Typography>
        </Box>

        {!filtros.marca ? (
          <>
            <Tarjetas items={tarjetasResumen} cargando={resumen.cargando} />
            <Box sx={esCelularPagina ? { pb: 1 } : { ...tarjetaSx, pt: 2, pb: 1 }}>
              {esCelularPagina ? (
                // En celular: buscador y orden en una sola barra; las filas ya son tarjetas.
                <Box sx={{ mb: 1 }}>
                  <BarraListaMovil
                    buscar={{ valor: buscar, onCambiar: setBuscar, placeholder: "Buscar marca" }}
                    orden={{
                      opciones: ORDENES.map((o) => ({ clave: o.valor, titulo: o.texto })),
                      clave: filtros.orden,
                      direccion: "desc",
                      // Cada orden ya trae su sentido (más sube, más baja…): solo cambia el campo.
                      onCambiar: (clave) => {
                        if (clave === filtros.orden) return;
                        ordenMarcas.setOrden(null);
                        setFiltros((f) => ({ ...f, orden: clave as Orden }));
                      },
                    }}
                    chips={<Typography component="span" sx={{ fontSize: 12, color: tinta.tenue }}>Toca una marca para ver sus productos.</Typography>}
                  />
                </Box>
              ) : (
              <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 2, px: { xs: 1.5, sm: 2.5 }, mb: 1.5 }}>
                <TextField
                  size="small"
                  placeholder="Buscar marca"
                  value={buscar}
                  onChange={(e) => setBuscar(e.target.value)}
                  InputProps={{
                    sx: controlSx,
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconSearch size={16} color={tinta.tenue} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ width: { xs: "100%", sm: 260 } }}
                />
                <Box>
                  <Typography sx={etiquetaControlSx}>Ordenar por</Typography>
                  <Pildoras
                    etiqueta="Ordenar por"
                    opciones={ORDENES}
                    valor={filtros.orden}
                    onCambiar={(o) => {
                      ordenMarcas.setOrden(null);
                      setFiltros((f) => ({ ...f, orden: o }));
                    }}
                  />
                </Box>
                <Typography sx={{ fontSize: 12, color: tinta.tenue, ml: "auto" }}>Pulsa una marca para ver sus productos.</Typography>
              </Box>
              )}
              <TablaMarcas
                filas={visibles}
                desde={(pagina - 1) * POR_PAGINA}
                cargando={resumen.cargando}
                maximo={maximo}
                onElegir={(m) => setFiltros((f) => ({ ...f, marca: m, lista: "masVendidos" }))}
                orden={ordenMarcas.orden}
                onOrdenar={ordenMarcas.ordenarPor}
              />
              {paginas > 1 && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 1.5 }}>
                  <Pagination count={paginas} page={pagina} onChange={(_, p) => setPagina(p)} shape="rounded" size="small" />
                </Box>
              )}
            </Box>
          </>
        ) : (
          <>
            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5, mb: 1.5 }}>
              <Button
                size="small"
                startIcon={<IconArrowLeft size={16} />}
                onClick={() => setFiltros((f) => ({ ...f, marca: "" }))}
                sx={{ textTransform: "none", fontWeight: 650, color: tinta.secundaria }}
              >
                Todas las marcas
              </Button>
              <Typography sx={{ fontSize: 18, fontWeight: 800, color: tinta.primaria }}>{filtros.marca}</Typography>
              <Typography sx={{ fontSize: 13, color: tinta.secundaria }}>en {canalNombre}</Typography>
            </Box>
            <Tarjetas
              cargando={detalle.cargando}
              items={[
                {
                  titulo: "Venta sin IVA",
                  valor: formatoMonto(d?.totales.venta.neto),
                  pie: (
                    <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
                      <Variacion valor={d?.totales.variacion ?? null} actual={n(d?.totales.venta.neto)} /> contra {formatoMonto(d?.totales.ventaAnterior.neto)}
                    </Box>
                  ),
                },
                { titulo: "Diferencia", valor: <Diferencia valor={d?.totales.diferencia.neto ?? 0} />, pie: "venta del período − comparación" },
                {
                  titulo: "Unidades",
                  valor: unidades(d?.totales.unidades ?? 0),
                  pie: (
                    <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
                      <Variacion valor={d?.totales.variacionUnidades ?? null} actual={d?.totales.unidades ?? 0} /> antes {unidades(d?.totales.unidadesAnterior ?? 0)}
                    </Box>
                  ),
                },
                { titulo: "Productos con venta", valor: unidades(d?.totales.productos ?? 0), pie: `antes ${unidades(d?.totales.productosAnterior ?? 0)}` },
                {
                  titulo: "Por tipo de envío",
                  valor: tiposMarca[0] ? NOMBRE_TIPO[tiposMarca[0][0]] ?? tiposMarca[0][0] : "—",
                  pie: tiposMarca.map(([t, u]) => `${NOMBRE_TIPO[t] ?? t} ${unidades(u)}`).join(" · ") || "unidades del período",
                },
              ]}
            />
            <Panel
              titulo={listaActual.texto}
              descripcion={listaActual.descripcion}
              sx={{ p: 0, pt: 2.5, "& > div:first-of-type": { px: { xs: 1.5, sm: 2.5 } } }}
              accion={<Pildoras etiqueta="Lista de productos" opciones={LISTAS} valor={filtros.lista} onCambiar={(l) => setFiltros((f) => ({ ...f, lista: l }))} />}
            >
              <TablaProductos filas={d ? d[filtros.lista] : []} cargando={detalle.cargando} vacio="No hay productos en esta lista para el período." />
            </Panel>
          </>
        )}
      </Box>
    </PageContainer>
  );
}
