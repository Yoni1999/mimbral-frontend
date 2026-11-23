"use client";
// Título y subtítulo de la barra de arriba en celular (< 600 px).
//
// La barra (Header.tsx) muestra el nombre de la vista en negrita y, debajo,
// una línea gris con el contexto ("Ayer · Todos los canales"). Cada vista
// puede fijar los dos textos con `useBarraMovil({ titulo, subtitulo })`; si no
// lo hace, el título sale del menú (MODULOS: la página cuya ruta calza más
// largo) y no hay subtítulo. Al salir de la vista se borra lo que fijó.
//
// Dos contextos: el de fijar (estable, no vuelve a dibujar las vistas) y el
// del valor (solo lo lee la barra).
import React, { createContext, useContext, useLayoutEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { MODULOS, esRutaActiva, paginasDe } from "../sidebar/MenuItems";

/** Alto de la barra de arriba en celular: la barra de período de las vistas se pega justo debajo. */
export const ALTO_BARRA_MOVIL = 56;

export interface ValorBarraMovil {
  titulo?: string;
  subtitulo?: string;
}

type Fijar = (valor: ValorBarraMovil | null) => void;

const FijarContext = createContext<Fijar>(() => {});
const ValorContext = createContext<ValorBarraMovil | null>(null);

export function BarraMovilProvider({ children }: { children: React.ReactNode }) {
  const [valor, setValor] = useState<ValorBarraMovil | null>(null);
  return (
    <FijarContext.Provider value={setValor}>
      <ValorContext.Provider value={valor}>{children}</ValorContext.Provider>
    </FijarContext.Provider>
  );
}

/** Fija el título y/o subtítulo de la barra de celular mientras la vista está montada.
 *  Un campo sin valor deja el de la ruta (título) o ninguno (subtítulo). */
export function useBarraMovil({ titulo, subtitulo }: ValorBarraMovil) {
  const fijar = useContext(FijarContext);
  // useLayoutEffect: la barra cambia en el mismo cuadro en que aparece la
  // vista, sin mostrar un instante el título del menú. Las vistas se dibujan
  // solo en el navegador (layout.tsx), así que no corre en el servidor.
  useLayoutEffect(() => {
    fijar({ titulo, subtitulo });
    // Al desmontar (cambio de vista) se borra; al cambiar, el nuevo valor lo reemplaza en el mismo paso.
    return () => fijar(null);
  }, [fijar, titulo, subtitulo]);
}

/** Nombre de la vista según el menú: la página cuya ruta calza más largo. */
export function tituloDeRuta(path: string): string {
  let mejor: { titulo: string; largo: number } | undefined;
  for (const m of MODULOS) {
    const candidatas = [...(m.href ? [{ titulo: m.titulo, href: m.href }] : []), ...paginasDe(m)];
    for (const p of candidatas) {
      const href = p.href.split("?")[0];
      if (esRutaActiva(href, path) && (!mejor || href.length > mejor.largo)) mejor = { titulo: p.titulo, largo: href.length };
    }
  }
  if (mejor) return mejor.titulo;
  if (esRutaActiva("/perfil", path)) return "Mi perfil";
  return "Análisis 360";
}

/** Lo que muestra la barra: lo fijado por la vista o, si no, el título de la ruta. */
export function useValorBarraMovil(): Required<Pick<ValorBarraMovil, "titulo">> & ValorBarraMovil {
  const path = usePathname() ?? "";
  const valor = useContext(ValorContext);
  return useMemo(
    () => ({ titulo: valor?.titulo || tituloDeRuta(path), subtitulo: valor?.subtitulo }),
    [valor, path]
  );
}
