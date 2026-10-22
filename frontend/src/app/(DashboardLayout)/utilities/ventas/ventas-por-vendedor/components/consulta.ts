import type { Filters } from "./Header";

/** Query string común a todos los bloques de la vista. */
export const consultaVendedor = (f: Filters) => {
  const params = new URLSearchParams();
  if (f.fechaInicio) params.append("fechaInicio", f.fechaInicio);
  if (f.fechaFin) params.append("fechaFin", f.fechaFin);
  if (f.modoComparacion) params.append("modoComparacion", f.modoComparacion);
  if (f.vendedorEmpresa) params.append("vendedorEmpresa", f.vendedorEmpresa);
  if (f.canal) params.append("canal", f.canal);
  return params.toString();
};

export const textoComparacion = (modo: string) =>
  modo === "MismoPeriodoAnoAnterior" ? "contra el mismo período del año anterior" : "contra el período anterior";
