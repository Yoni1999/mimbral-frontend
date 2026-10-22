"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

// Lo que el usuario buscó en cada vista (filtros, período, página, orden) se
// guarda en el navegador: al cambiar de vista y volver, o al cerrar y abrir
// la pestaña, sigue ahí. Se borra al cerrar sesión (ver clearStoredToken).
const PREFIJO = "vista:";

// Claves que algunas vistas guardaban antes por su cuenta.
const CLAVES_ANTIGUAS = ["filtrosVentasCanal"];

export function leerEstadoVista<T>(clave: string, inicial: T): T {
  if (typeof window === "undefined") return inicial;
  try {
    const guardado = localStorage.getItem(PREFIJO + clave);
    return guardado ? { ...inicial, ...JSON.parse(guardado) } : inicial;
  } catch {
    return inicial;
  }
}

export function guardarEstadoVista<T>(clave: string, valor: T) {
  try {
    localStorage.setItem(PREFIJO + clave, JSON.stringify(valor));
  } catch {
    // Sin almacenamiento disponible (modo privado, cuota): la vista sigue
    // funcionando, solo no recuerda lo buscado.
  }
}

export function limpiarEstadosVista() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIJO) || CLAVES_ANTIGUAS.includes(k))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // Igual que arriba: nada que limpiar si no hay almacenamiento.
  }
}

/** useState que recuerda su valor por vista. `clave` identifica la vista
 *  (p. ej. "resumen-ventas"); el valor debe ser un objeto serializable.
 *  `serializar` y `restaurar` permiten ajustar lo que se guarda y lo que se
 *  lee (p. ej. guardar "Ayer" en vez de la fecha, y recalcularla al volver). */
export function useEstadoVista<T extends object>(
  clave: string,
  inicial: () => T,
  opciones: { serializar?: (valor: T) => object; restaurar?: (guardado: any) => T } = {}
): [T, Dispatch<SetStateAction<T>>] {
  const { serializar = (v: T) => v, restaurar = (g: any) => g as T } = opciones;
  const [valor, setValor] = useState<T>(() => restaurar(leerEstadoVista(clave, inicial())));
  useEffect(() => {
    guardarEstadoVista(clave, serializar(valor));
    // serializar es una función pura por vista: no hace falta como dependencia.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, valor]);
  return [valor, setValor];
}
