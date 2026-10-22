"use client";

import React from "react";
import { apiJson } from "@/utils/apiClient";
import { useCargaDatos } from "@/utils/useCargaDatos";
import { BACKEND_URL } from "@/config";

/** Qué se abre al pulsar una tarjeta. */
export type TipoDetalle = "ventas" | "notas" | "productos" | "margen";

/** Filtros del detalle (los mismos de las tarjetas, por código). */
export type FiltrosDetalle = Record<string, string | number | null | undefined>;

export const ENDPOINT: Record<TipoDetalle, string> = {
  ventas: "/api/detalle/ventas",
  notas: "/api/detalle/notas-credito",
  productos: "/api/detalle/productos",
  margen: "/api/detalle/productos",
};

export const consulta = (filtros: FiltrosDetalle, extra: Record<string, string> = {}) => {
  const p = new URLSearchParams();
  Object.entries({ ...filtros, ...extra }).forEach(([k, v]) => v != null && v !== "" && p.set(k, String(v)));
  return p.toString();
};

/** Fecha ISO → 20/10/2026; hora de SAP (941) → 09:41. */
export const fechaCorta = (iso?: string | null) => (iso ? String(iso).slice(0, 10).split("-").reverse().join("/") : "—");
export const horaSap = (h?: number | null) => {
  if (h == null) return "";
  const s = String(h).padStart(4, "0");
  return `${s.slice(0, 2)}:${s.slice(2)}`;
};

/** Espera a que se deje de escribir antes de buscar. */
export function useDemorado<T>(valor: T, ms = 350) {
  const [demorado, setDemorado] = React.useState(valor);
  React.useEffect(() => {
    const t = setTimeout(() => setDemorado(valor), ms);
    return () => clearTimeout(t);
  }, [valor, ms]);
  return demorado;
}

export interface RespuestaLista<F, R> {
  total: number;
  pagina: number;
  tamano: number;
  resumen: R;
  filas: F[];
}

/** Lista paginada del servidor con orden y búsqueda. Al cambiar el orden o
 *  la búsqueda se vuelve a la página 1. */
export function useListaDetalle<F, R>(
  endpoint: string,
  filtros: FiltrosDetalle,
  ordenInicial: { orden: string; direccion: "asc" | "desc" },
  tamano = 50,
  /** Filtros que acotan solo la lista, no el resumen (p. ej. el motivo). */
  soloLista: Record<string, string> = {}
) {
  const [pagina, setPagina] = React.useState(1);
  const [orden, setOrdenEstado] = React.useState(ordenInicial);
  const [buscar, setBuscarEstado] = React.useState("");
  const buscarDemorado = useDemorado(buscar.trim());

  const url = `${BACKEND_URL}${endpoint}?${consulta(filtros, {
    pagina: String(pagina),
    tamano: String(tamano),
    orden: orden.orden,
    direccion: orden.direccion,
    ...(buscarDemorado ? { buscar: buscarDemorado } : {}),
    ...soloLista,
  })}`;
  const carga = useCargaDatos<RespuestaLista<F, R> | null>(url, (signal) => apiJson(url, { signal }), null);

  // El resumen no depende de la página ni de la búsqueda: se conserva el
  // último de estos filtros mientras se pide otra página.
  const claveFiltros = consulta(filtros);
  const [guardado, setGuardado] = React.useState<{ clave: string; resumen: R } | null>(null);
  const resumenActual = carga.datos?.resumen;
  React.useEffect(() => {
    if (resumenActual) setGuardado({ clave: claveFiltros, resumen: resumenActual });
  }, [resumenActual, claveFiltros]);
  const resumen = resumenActual ?? (guardado?.clave === claveFiltros ? guardado.resumen : undefined);

  const ordenarPor = (columna: string) => {
    setPagina(1);
    setOrdenEstado((o) => ({ orden: columna, direccion: o.orden === columna && o.direccion === "desc" ? "asc" : "desc" }));
  };
  const setBuscar = (v: string) => {
    setPagina(1);
    setBuscarEstado(v);
  };

  return { ...carga, resumen, pagina, setPagina, orden, ordenarPor, setOrden: setOrdenEstado, buscar, setBuscar, buscarDemorado, tamano };
}

/** Pide todas las filas (todo=1) para el Excel. */
export async function todasLasFilas<F>(endpoint: string, filtros: FiltrosDetalle, extra: Record<string, string> = {}): Promise<F[]> {
  const r = await apiJson(`${BACKEND_URL}${endpoint}?${consulta(filtros, { todo: "1", ...extra })}`);
  return Array.isArray(r?.filas) ? r.filas : [];
}

/** Descarga un Excel con una o más hojas. Las columnas toman el orden y los
 *  nombres de la primera fila de cada hoja; los montos van como números. */
export async function descargarExcel(nombreArchivo: string, hojas: { nombre: string; filas: Record<string, unknown>[] }[]) {
  const XLSX = await import("xlsx");
  const libro = XLSX.utils.book_new();
  hojas.forEach(({ nombre, filas }) => {
    const hoja = XLSX.utils.json_to_sheet(filas.length ? filas : [{ "Sin datos": "" }]);
    // Ancho de columna según el contenido (tope 50 caracteres).
    const columnas = Object.keys(filas[0] ?? { "Sin datos": "" });
    hoja["!cols"] = columnas.map((c) => ({
      wch: Math.min(50, Math.max(c.length, ...filas.slice(0, 500).map((f) => String(f[c] ?? "").length)) + 2),
    }));
    XLSX.utils.book_append_sheet(libro, hoja, nombre.slice(0, 31));
  });
  XLSX.writeFile(libro, `${nombreArchivo}.xlsx`);
}

/** Qué detalle abre cada tarjeta, por su título. Las que no están (stock,
 *  cobertura…) no abren detalle. */
const DETALLE_DE_TARJETA: Record<string, TipoDetalle> = {
  Ventas: "ventas",
  "Cantidad de ventas": "ventas",
  "Ticket promedio": "ventas",
  "Notas de crédito": "notas",
  "Ítems vendidos": "productos",
  "Unidades vendidas": "productos",
  "Margen de ventas": "margen",
};

export const tipoDeTarjeta = (titulo: string): TipoDetalle | undefined => DETALLE_DE_TARJETA[titulo];
