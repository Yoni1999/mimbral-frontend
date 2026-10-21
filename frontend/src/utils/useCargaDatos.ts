"use client";

import { useEffect, useRef, useState } from "react";
import { apiJson } from "@/utils/apiClient";

type Estado<T> = {
  clave: string | null;
  datos: T;
  cargando: boolean;
  error: unknown;
};

/**
 * Carga datos que dependen de los filtros de una vista.
 *
 * - `clave` identifica lo que se pide (normalmente la URL con sus filtros).
 *   Cuando cambia, lo que había se limpia EN ESE MISMO RENDER y se muestra
 *   cargando: nunca queda en pantalla el dato del filtro anterior.
 * - La petición anterior se cancela: una respuesta vieja que llega tarde no
 *   pisa a la nueva (eso era lo que mostraba 2 o 3 resultados seguidos).
 * - Si el filtro se vuelve a emitir con los mismos valores, la clave no
 *   cambia y no se vuelve a pedir.
 * - `clave` en null: los filtros todavía no están listos; no se pide nada.
 */
export function useCargaDatos<T>(
  clave: string | null,
  cargar: (signal: AbortSignal) => Promise<T>,
  inicial: T
): { datos: T; cargando: boolean; error: unknown } {
  const inicialRef = useRef(inicial);
  const cargarRef = useRef(cargar);
  cargarRef.current = cargar;

  const [estado, setEstado] = useState<Estado<T>>({
    clave: null,
    datos: inicial,
    cargando: clave !== null,
    error: null,
  });

  useEffect(() => {
    if (clave === null) return;
    const controller = new AbortController();
    setEstado({ clave, datos: inicialRef.current, cargando: true, error: null });

    cargarRef
      .current(controller.signal)
      .then((datos) => {
        if (!controller.signal.aborted) {
          setEstado({ clave, datos, cargando: false, error: null });
        }
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error(`Error al cargar ${clave}:`, error);
        setEstado({ clave, datos: inicialRef.current, cargando: false, error });
      });

    return () => controller.abort();
  }, [clave]);

  // Entre el cambio de filtros y el efecto hay un render: en ese render el
  // estado todavía es del filtro anterior, así que se muestra vacío y cargando.
  if (estado.clave !== clave) {
    return { datos: inicialRef.current, cargando: clave !== null, error: null };
  }
  return estado;
}

/** `useCargaDatos` para el caso común: un GET que devuelve JSON. */
export function useApiDatos<T>(url: string | null, inicial: T) {
  return useCargaDatos<T>(url, (signal) => apiJson(url as string, { signal }), inicial);
}
