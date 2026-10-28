"use client";
// Piezas que comparten los informes de Informes → Mercado Libre.
import { useEstadoVista } from "@/utils/estadoVista";
import { conPeriodoRapido, presetsDeHoy, resolverPeriodoRapido } from "@/app/(DashboardLayout)/utilities/ventas/components/RangosRapidos";
import { formatoPesos, formatoPorcentaje } from "@/app/(DashboardLayout)/utilities/ventas/components/estilo";
import type { RangoMl } from "@/app/(DashboardLayout)/utilities/ventas/mercado-libre/components/HeaderMl";

/** Últimos 30 días: los informes miden sobre un mes. */
export const rangoInforme = (): RangoMl => {
  const p = presetsDeHoy().find((x) => x.label === "Últimos 30 días")!;
  return { fechaInicio: p.inicio, fechaFin: p.fin };
};

/** Filtros de un informe con rango de fechas, recordados por vista (el rango rápido se recalcula al volver). */
export function useFiltrosInforme<F extends object>(clave: string, extra: F) {
  const inicial = () => ({ ...extra, ...rangoInforme() });
  const [filtros, setFiltros] = useEstadoVista<F & RangoMl>(clave, inicial, {
    serializar: conPeriodoRapido,
    restaurar: (g) => ({ ...inicial(), ...resolverPeriodoRapido<F & RangoMl>(g) }),
  });
  return { filtros, setFiltros, inicial };
}

export const pesos = (v: number | null | undefined) => (v == null ? "—" : formatoPesos(Math.round(v)));
export const porcentaje = (v: number | null | undefined, d = 1) => (v == null ? "—" : formatoPorcentaje(v, d));
export const entero = (v: number | null | undefined) => (v == null ? "—" : Math.round(v).toLocaleString("es-CL"));
export const fecha = (iso?: string | null) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "—");
export const redondo = (v: number | null | undefined, d = 0) => (v == null ? null : Math.round(v * 10 ** d) / 10 ** d);
