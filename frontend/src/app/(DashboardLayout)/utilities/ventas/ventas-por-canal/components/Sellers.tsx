"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { apiJson } from "@/utils/apiClient";
import { useCargaDatos } from "@/utils/useCargaDatos";
import { BACKEND_URL } from "@/config";
import ListaBarras from "../../components/ListaBarras";
import { ChipMargen, Panel, cifraSx, formatoMonto, formatoPesos, formatoPorcentaje, tinta } from "../../components/estilo";

interface Vendedor {
  Codigo_Vendedor: number;
  Nombre_Vendedor: string;
  CantidadVendida?: number;
  TotalVentas?: number;
  MargenBruto?: number;
  MargenPorcentaje?: number;
  Porcentaje: number;
}

interface VentasCanalChartProps {
  canal: string;
  fechaInicio?: string;
  fechaFin?: string;
  /** Vendedor marcado (acota el resto de la vista); null = todos. */
  seleccionado?: number | null;
  onVendedorSeleccionado: (vendedor: { codigo: number; nombre: string } | null) => void;
}

/** Vendedores del canal y su participación. Clic en uno acota tarjetas y
 *  tablas a ese vendedor; clic de nuevo lo quita. */
const VentasCanalChart: React.FC<VentasCanalChartProps> = ({
  canal,
  fechaInicio,
  fechaFin,
  seleccionado = null,
  onVendedorSeleccionado,
}) => {
  // Sin canal no se pide nada (clave null). Al cambiar canal o fechas se
  // limpia al instante y solo queda la última respuesta.
  const params = new URLSearchParams();
  if (canal) params.append("canal", canal);
  if (fechaInicio && fechaFin) {
    params.append("fechaInicio", fechaInicio);
    params.append("fechaFin", fechaFin);
  }
  const url = canal ? `${BACKEND_URL}/api/canal-vendedor?${params.toString()}` : null;
  const { datos: vendedores, cargando } = useCargaDatos<Vendedor[]>(
    url,
    async (signal) => {
      const data = await apiJson(url as string, { signal });
      return (Array.isArray(data) ? data : []).sort((a: Vendedor, b: Vendedor) => (b.TotalVentas ?? 0) - (a.TotalVentas ?? 0));
    },
    []
  );

  return (
    <Panel
      titulo="Vendedores del canal"
      descripcion={canal ? "Clic en un vendedor para acotar la vista a sus ventas" : undefined}
    >
      {!canal ? (
        <Typography sx={{ color: tinta.tenue, fontSize: 13, py: 6, textAlign: "center" }}>
          Elige un canal para ver sus vendedores.
        </Typography>
      ) : (
        <ListaBarras
          cargando={cargando}
          filasCargando={7}
          vacio="El canal no tiene ventas en el período."
          seleccionada={seleccionado != null ? String(seleccionado) : null}
          onSeleccionar={(item) => {
            const codigo = Number(item.clave);
            onVendedorSeleccionado(codigo === seleccionado ? null : { codigo, nombre: item.etiqueta });
          }}
          items={vendedores.map((v) => ({
            clave: String(v.Codigo_Vendedor),
            etiqueta: v.Nombre_Vendedor,
            valor: v.TotalVentas ?? v.Porcentaje,
            texto: v.TotalVentas != null ? formatoMonto(v.TotalVentas) : undefined,
            detalle: (
              <Box component="span" sx={{ color: tinta.tenue, fontSize: 13, minWidth: 44, textAlign: "right", ...cifraSx }}>
                {formatoPorcentaje(v.Porcentaje)}
              </Box>
            ),
            tooltip: (
              <Box sx={{ fontSize: 12, lineHeight: 1.6, ...cifraSx }}>
                <strong>{v.Nombre_Vendedor}</strong>
                <br />
                Ventas: {formatoPesos(v.TotalVentas)} ({formatoPorcentaje(v.Porcentaje)} del canal)
                {v.CantidadVendida != null && (
                  <>
                    <br />
                    Unidades: {v.CantidadVendida.toLocaleString("es-CL")}
                  </>
                )}
                {v.MargenBruto != null && (
                  <>
                    <br />
                    Margen bruto: {formatoPesos(v.MargenBruto)} <ChipMargen valor={v.MargenPorcentaje} />
                  </>
                )}
              </Box>
            ),
          }))}
        />
      )}
    </Panel>
  );
};

export default VentasCanalChart;
