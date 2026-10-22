"use client";

import React from "react";
import DetalleTarjeta, { DetalleAbierto } from "./DetalleTarjeta";
import { FiltrosDetalle, tipoDeTarjeta } from "./comun";

/**
 * Detalle de las tarjetas de una vista. Uso:
 *
 *   const detalle = useDetalleTarjetas(filtrosDetalle, ["Este mes", "Canal: Empresas"]);
 *   <MetricCard {...card} onClick={detalle.alPulsar(card.title)} />
 *   {detalle.ventana}
 *
 * `filtros` son los del detalle (fechaInicio, fechaFin y los de la vista,
 * por código); `etiquetas`, los mismos en palabras para el encabezado y el
 * Excel.
 */
export function useDetalleTarjetas(filtros: FiltrosDetalle, etiquetas: string[]) {
  const [abierto, setAbierto] = React.useState<DetalleAbierto | null>(null);

  const alPulsar = (titulo: string) => {
    const tipo = tipoDeTarjeta(titulo);
    return tipo ? () => setAbierto({ tipo, titulo }) : undefined;
  };

  const ventana = <DetalleTarjeta abierto={abierto} filtros={filtros} etiquetasFiltros={etiquetas} onClose={() => setAbierto(null)} />;

  return { alPulsar, ventana };
}
