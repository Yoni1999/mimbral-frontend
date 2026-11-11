"use client";
// Tablas de Categorías → Mercado Libre, sobre la tabla común de los informes
// de ML (buscador, orden, paginación y Excel).
import React from "react";
import Link from "next/link";
import { Box } from "@mui/material";
import { IconChevronRight } from "@tabler/icons-react";
import TablaInforme, { ColumnaInforme, ConMiniatura } from "../../../ventas/mercado-libre/components/TablaInforme";
import { ChipVariacion, TextoCelda, cifraSx, formatoPorcentaje, tinta } from "../../../ventas/components/estilo";
import { BarraTiposCat, FilaCategoria, FilaProducto, MargenCelda, MontoCorto, n, pct, unidades } from "./comun";

export const rutaFicha = (id: string, nombre: string) =>
  `/utilities/categorias/mercado-libre/categoria?${new URLSearchParams({ id, nombre }).toString()}`;

const enlaceSx = { color: tinta.acento, textDecoration: "none", fontWeight: 600, "&:hover": { textDecoration: "underline" } } as const;

/** "Nueva" cuando no había venta en la comparación; si no, el chip de variación. */
function Crecimiento({ valor, nueva, sinVentas }: { valor: number | null; nueva?: boolean; sinVentas?: boolean }) {
  if (nueva) return <Box component="span" sx={{ fontSize: 11.5, fontWeight: 700, color: "#067647" }}>Nueva</Box>;
  if (sinVentas) return <Box component="span" sx={{ fontSize: 11.5, fontWeight: 700, color: "#b42318" }}>Sin ventas</Box>;
  return <ChipVariacion valor={pct(valor)} />;
}

/** Categorías de un nivel: período actual contra comparación. */
export function TablaCategorias({
  filas,
  cargando,
  onEntrar,
  nombreExcel = "categorias-mercado-libre",
}: {
  filas: FilaCategoria[];
  cargando: boolean;
  /** Bajar al siguiente nivel del árbol. */
  onEntrar?: (f: FilaCategoria) => void;
  nombreExcel?: string;
}) {
  const columnas: ColumnaInforme<FilaCategoria>[] = [
    {
      clave: "nombre",
      titulo: "Categoría",
      ancho: 21,
      valor: (f) => f.nombre,
      celda: (f) => (
        <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          {f.id && f.tieneHijos && onEntrar ? (
            <Box
              component="button"
              type="button"
              onClick={() => onEntrar(f)}
              sx={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: 0.25, fontWeight: 700, color: tinta.primaria, "&:hover": { color: tinta.acento } }}
            >
              <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.nombre}</Box>
              <IconChevronRight size={14} />
            </Box>
          ) : (
            <TextoCelda texto={f.nombre} />
          )}
          {f.id && (
            <Box component={Link} href={rutaFicha(f.id, f.nombre)} sx={{ ...enlaceSx, fontSize: 11.5 }}>
              Ver ficha
            </Box>
          )}
        </Box>
      ),
    },
    { clave: "venta", titulo: "Venta", ancho: 9, alinear: "right", valor: (f) => n(f.actual.venta.neto), excel: "Venta neta", celda: (f) => <MontoCorto par={f.actual.venta} fuerte /> },
    { clave: "ventaComp", titulo: "Comparación", ancho: 9, alinear: "right", valor: (f) => n(f.comparacion.venta.neto), excel: "Venta neta comparación", celda: (f) => <MontoCorto par={f.comparacion.venta} color={tinta.secundaria} /> },
    { clave: "crec", titulo: "Crecimiento", ancho: 9, alinear: "right", valor: (f) => (f.nueva ? 9999 : pct(f.variacion.venta)), excel: "Crecimiento %", celda: (f) => <Crecimiento valor={f.variacion.venta} nueva={f.nueva} /> },
    { clave: "dif", titulo: "Diferencia", ancho: 8, alinear: "right", valor: (f) => n(f.diferencia.neto), excel: "Diferencia neta", celda: (f) => <MontoCorto par={f.diferencia} color={n(f.diferencia.neto) < 0 ? "#b42318" : "#067647"} /> },
    { clave: "part", titulo: "Particip.", ancho: 6, alinear: "right", valor: (f) => (f.participacion.actual == null ? null : f.participacion.actual * 100), excel: "Participación %", celda: (f) => (f.participacion.actual == null ? "—" : formatoPorcentaje(f.participacion.actual * 100)) },
    { clave: "aporte", titulo: "Aporte", ancho: 6, alinear: "right", valor: (f) => (f.aporte == null ? null : f.aporte * 100), excel: "Aporte al crecimiento %", celda: (f) => (f.aporte == null ? "—" : formatoPorcentaje(f.aporte * 100)) },
    { clave: "unid", titulo: "Unidades", ancho: 7, alinear: "right", valor: (f) => f.actual.unidades, celda: (f) => <Box sx={cifraSx}>{unidades(f.actual.unidades)}</Box> },
    { clave: "margen", titulo: "Margen $", ancho: 8, alinear: "right", valor: (f) => f.actual.margen, excel: "Margen neto estimado", celda: (f) => (f.actual.margen == null ? "—" : <MontoCorto par={{ neto: f.actual.margen, conIva: f.actual.margen }} />) },
    { clave: "margenPct", titulo: "Margen %", ancho: 10, alinear: "right", valor: (f) => (f.actual.margenPct == null ? null : f.actual.margenPct * 100), excel: "Margen %", celda: (f) => <MargenCelda actual={f.actual.margenPct} puntos={f.variacion.margenPuntos} anterior={f.comparacion.margenPct} /> },
    { clave: "tipos", titulo: "Full · Colecta · Flex", ancho: 7, celda: (f) => <BarraTiposCat porTipo={f.actual.porTipo} /> },
  ];
  return (
    <TablaInforme<FilaCategoria>
      filas={filas}
      cargando={cargando}
      columnas={columnas}
      clave={(f) => f.id ?? "sin-categoria"}
      textoBusqueda={(f) => `${f.nombre} ${f.id ?? ""}`}
      ordenInicial={{ clave: "venta", direccion: "desc" }}
      nombreExcel={nombreExcel}
      extraExcel={[
        { titulo: "Id categoría", valor: (f) => f.id },
        { titulo: "Unidades comparación", valor: (f) => f.comparacion.unidades },
        { titulo: "Órdenes", valor: (f) => f.actual.ordenes },
        { titulo: "Productos", valor: (f) => f.actual.productos },
        { titulo: "Ticket neto", valor: (f) => f.actual.ticket.neto },
        { titulo: "Comisión neta", valor: (f) => f.actual.comision.neto },
        { titulo: "Envío neto", valor: (f) => f.actual.envio.neto },
        { titulo: "Margen % comparación", valor: (f) => (f.comparacion.margenPct == null ? null : f.comparacion.margenPct * 100) },
        { titulo: "Full neto", valor: (f) => f.actual.porTipo.full?.neto },
        { titulo: "Colecta neto", valor: (f) => f.actual.porTipo.colecta?.neto },
        { titulo: "Flex neto", valor: (f) => f.actual.porTipo.flex?.neto },
      ]}
      nota="Venta sin IVA. Pulsa una categoría para bajar de nivel."
      anchoMinimo={1100}
    />
  );
}

/** Productos: período actual contra comparación. */
export function TablaProductosCat({
  filas,
  cargando,
  nombreExcel,
  orden = "venta",
  conCategoria = true,
  invertido = false,
}: {
  filas: FilaProducto[];
  cargando: boolean;
  nombreExcel: string;
  orden?: "venta" | "dif";
  conCategoria?: boolean;
  /** Orden inicial de menor a mayor (los que más bajan primero). */
  invertido?: boolean;
}) {
  const columnas: ColumnaInforme<FilaProducto>[] = [
    {
      clave: "sku",
      titulo: "Producto",
      ancho: conCategoria ? 26 : 38,
      valor: (f) => f.sku,
      celda: (f) => (
        <ConMiniatura imagen={f.imagen} titulo={f.nombre || f.sku}>
          <TextoCelda texto={f.nombre || f.sku} />
          <Box component={Link} href={`/utilities/analisis-producto1.1?itemCode=${encodeURIComponent(f.sku)}`} sx={{ ...enlaceSx, fontSize: 11.5 }}>
            {f.sku}
          </Box>
        </ConMiniatura>
      ),
    },
    ...(conCategoria
      ? ([
          {
            clave: "cat",
            titulo: "Categoría",
            ancho: 14,
            valor: (f) => f.categoria,
            celda: (f) =>
              f.categoriaId ? (
                <Box component={Link} href={rutaFicha(f.categoriaId, f.categoria || f.categoriaId)} sx={{ ...enlaceSx, fontWeight: 500, color: tinta.secundaria, fontSize: 12 }}>
                  {f.categoria}
                </Box>
              ) : (
                "—"
              ),
          },
        ] as ColumnaInforme<FilaProducto>[])
      : []),
    { clave: "venta", titulo: "Venta", ancho: 9, alinear: "right", valor: (f) => n(f.actual.venta.neto), excel: "Venta neta", celda: (f) => <MontoCorto par={f.actual.venta} fuerte /> },
    { clave: "ventaComp", titulo: "Comparación", ancho: 9, alinear: "right", valor: (f) => n(f.comparacion.venta.neto), excel: "Venta neta comparación", celda: (f) => <MontoCorto par={f.comparacion.venta} color={tinta.secundaria} /> },
    { clave: "crec", titulo: "Crecimiento", ancho: 9, alinear: "right", valor: (f) => (f.nuevo ? 9999 : f.sinVentas ? -100 : pct(f.variacion.venta)), excel: "Crecimiento %", celda: (f) => <Crecimiento valor={f.variacion.venta} nueva={f.nuevo} sinVentas={f.sinVentas} /> },
    { clave: "dif", titulo: "Diferencia", ancho: 9, alinear: "right", valor: (f) => n(f.diferencia.neto), excel: "Diferencia neta", celda: (f) => <MontoCorto par={f.diferencia} color={n(f.diferencia.neto) < 0 ? "#b42318" : "#067647"} /> },
    { clave: "unid", titulo: "Unidades", ancho: 7, alinear: "right", valor: (f) => f.actual.unidades, celda: (f) => <Box sx={cifraSx}>{unidades(f.actual.unidades)}</Box> },
    { clave: "margenPct", titulo: "Margen %", ancho: 10, alinear: "right", valor: (f) => (f.actual.margenPct == null ? null : f.actual.margenPct * 100), excel: "Margen %", celda: (f) => <MargenCelda actual={f.actual.margenPct} puntos={f.variacion.margenPuntos} anterior={f.comparacion.margenPct} /> },
    { clave: "tipos", titulo: "Envío", ancho: 7, celda: (f) => <BarraTiposCat porTipo={n(f.actual.venta.neto) > 0 ? f.actual.porTipo : f.comparacion.porTipo} /> },
  ];
  return (
    <TablaInforme<FilaProducto>
      filas={filas}
      cargando={cargando}
      columnas={columnas}
      clave={(f) => f.sku}
      textoBusqueda={(f) => `${f.sku} ${f.nombre ?? ""} ${f.categoria ?? ""}`}
      ordenInicial={{ clave: orden, direccion: invertido ? "asc" : "desc" }}
      nombreExcel={nombreExcel}
      extraExcel={[
        { titulo: "Nombre", valor: (f) => f.nombre },
        { titulo: "Ruta categoría", valor: (f) => f.rutaCategoria.map((r) => r.nombre).join(" › ") },
        { titulo: "Unidades comparación", valor: (f) => f.comparacion.unidades },
        { titulo: "Órdenes", valor: (f) => f.actual.ordenes },
        { titulo: "Margen neto estimado", valor: (f) => f.actual.margen },
        { titulo: "Comisión neta", valor: (f) => f.actual.comision.neto },
        { titulo: "Envío neto", valor: (f) => f.actual.envio.neto },
      ]}
      nota="Venta sin IVA; margen estimado."
      anchoMinimo={1000}
    />
  );
}
