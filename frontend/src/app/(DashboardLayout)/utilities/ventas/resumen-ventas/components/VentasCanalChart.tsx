"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { apiJson } from "@/utils/apiClient";
import { useCargaDatos } from "@/utils/useCargaDatos";
import { BACKEND_URL } from "@/config";
import { CANALES, Panel, formatoMonto, formatoPesos, formatoPorcentaje, tinta } from "../../components/estilo";
import ListaBarras from "../../components/ListaBarras";
import { Box } from "@mui/material";

interface Props {
  filters: {
    temporada: string;
    fechaInicio: string;
    fechaFin: string;
    sku?: string;
    familia?: string;
    subfamilia?: string;
  };
}

/** Participación de cada canal en la venta del período. Barras ordenadas en
 *  vez de donut: con 6 canales se compara mejor el tamaño, y nombre, monto y
 *  porcentaje quedan escritos junto a cada barra. */
const VentasCanalChart: React.FC<Props> = ({ filters }) => {
  const router = useRouter();

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (filters.fechaInicio) params.append("fechaInicio", filters.fechaInicio);
    if (filters.fechaFin) params.append("fechaFin", filters.fechaFin);
    if (filters.sku) params.append("sku", filters.sku);
    if (filters.familia) params.append("familia", filters.familia);
    if (filters.subfamilia) params.append("subfamilia", filters.subfamilia);
    if (filters.temporada) params.append("temporada", filters.temporada);
    return params.toString();
  };

  // Al cambiar un filtro se limpia al instante y solo queda la última respuesta.
  const url = `${BACKEND_URL}/api/ventas-canal?${buildQuery()}`;
  const { datos: filas, cargando } = useCargaDatos(
    url,
    async (signal) => {
      const data: Record<string, number> = (await apiJson(url, { signal }))?.[0] || {};
      return CANALES.map((c) => ({ ...c, venta: Number(data[c.clave]) || 0 })).sort((a, b) => b.venta - a.venta);
    },
    [] as { clave: string; nombre: string; color: string; venta: number }[]
  );

  const total = filas.reduce((s, f) => s + f.venta, 0);
  const irAlCanal = (clave: string) =>
    router.push(`/utilities/ventas/ventas-por-canal?canal=${encodeURIComponent(clave)}`);

  return (
    <Panel titulo="Ventas por canal" descripcion={cargando ? "Cargando…" : `Total del período: ${formatoMonto(total)}`}>
      <ListaBarras
        cargando={cargando}
        onSeleccionar={(item) => irAlCanal(item.clave)}
        items={filas.map((f) => ({
          clave: f.clave,
          etiqueta: f.nombre,
          valor: f.venta,
          texto: formatoMonto(f.venta),
          color: f.color,
          detalle: (
            <Box component="span" sx={{ color: tinta.tenue, fontSize: 13, minWidth: 44, textAlign: "right" }}>
              {formatoPorcentaje(total ? (f.venta / total) * 100 : 0)}
            </Box>
          ),
          tooltip: `${f.nombre}: ${formatoPesos(f.venta)} · clic para ver el detalle del canal`,
        }))}
      />
    </Panel>
  );
};

export default VentasCanalChart;
