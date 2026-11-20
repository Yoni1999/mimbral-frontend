"use client";

// Orden por columna de las tablas que ordenan en el navegador (las filas ya
// cargadas). Mismo comportamiento que TablaInforme y que las listas de detalle:
// el primer clic en una columna ordena de mayor a menor, el segundo invierte,
// y los vacíos van siempre al final.
import React from "react";
import { TableCell, TableSortLabel } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";

export type Direccion = "asc" | "desc";
export interface OrdenTabla {
  clave: string;
  direccion: Direccion;
}
export type ValorOrden = string | number | boolean | Date | null | undefined;

/** Compara dos valores; los vacíos quedan al final en cualquier dirección. */
export function compararValores(va: ValorOrden, vb: ValorOrden, direccion: Direccion): number {
  const vacio = (v: ValorOrden) => v === null || v === undefined || v === "" || (typeof v === "number" && Number.isNaN(v));
  if (vacio(va) && vacio(vb)) return 0;
  if (vacio(va)) return 1;
  if (vacio(vb)) return -1;
  const a = va instanceof Date ? va.getTime() : typeof va === "boolean" ? Number(va) : va;
  const b = vb instanceof Date ? vb.getTime() : typeof vb === "boolean" ? Number(vb) : vb;
  const r = typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b), "es", { numeric: true });
  return direccion === "asc" ? r : -r;
}

/**
 * Ordena `filas` por la columna elegida. `valores` dice, por clave de columna,
 * qué valor de la fila se compara. Sin orden elegido devuelve las filas tal
 * como llegaron (el orden del servidor).
 */
export function useOrdenTabla<F>(
  filas: F[],
  valores: Record<string, (f: F) => ValorOrden>,
  inicial: OrdenTabla | null = null
) {
  const [orden, setOrden] = React.useState<OrdenTabla | null>(inicial);
  const valoresRef = React.useRef(valores);
  valoresRef.current = valores;

  const ordenadas = React.useMemo(() => {
    const valor = orden ? valoresRef.current[orden.clave] : undefined;
    if (!orden || !valor) return filas;
    return [...filas].sort((a, b) => compararValores(valor(a), valor(b), orden.direccion));
  }, [filas, orden]);

  const ordenarPor = React.useCallback((clave: string) => {
    setOrden((o) => ({ clave, direccion: o?.clave === clave && o.direccion === "desc" ? "asc" : "desc" }));
  }, []);

  return { ordenadas, orden, ordenarPor, setOrden };
}

/** Encabezado de columna con la flecha de orden. */
export function CeldaOrden({
  clave,
  orden,
  onOrdenar,
  align = "left",
  children,
  sx,
  colSpan,
}: {
  clave: string;
  orden: OrdenTabla | null;
  onOrdenar: (clave: string) => void;
  align?: "left" | "right" | "center";
  children: React.ReactNode;
  sx?: SxProps<Theme>;
  colSpan?: number;
}) {
  const activa = orden?.clave === clave;
  return (
    <TableCell align={align} sortDirection={activa ? orden!.direccion : false} sx={sx} colSpan={colSpan}>
      <TableSortLabel active={activa} direction={activa ? orden!.direccion : "desc"} onClick={() => onOrdenar(clave)}>
        {children}
      </TableSortLabel>
    </TableCell>
  );
}
