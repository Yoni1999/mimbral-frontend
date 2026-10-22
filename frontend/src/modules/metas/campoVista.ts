import type { Dispatch, SetStateAction } from "react";

/** Setter de un solo campo de un estado objeto (p. ej. el de useEstadoVista):
 *  permite seguir usando setFiltros / setPaginationModel como con useState. */
export function campoDe<T, K extends keyof T>(set: Dispatch<SetStateAction<T>>, campo: K): Dispatch<SetStateAction<T[K]>> {
  return (cambio) =>
    set((v) => ({ ...v, [campo]: typeof cambio === "function" ? (cambio as (previo: T[K]) => T[K])(v[campo]) : cambio }));
}
