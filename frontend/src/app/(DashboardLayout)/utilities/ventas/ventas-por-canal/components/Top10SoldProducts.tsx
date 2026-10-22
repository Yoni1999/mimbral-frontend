"use client";

import React from "react";
import { Box } from "@mui/material";
import ListaBarras from "../../components/ListaBarras";
import { ChipMargen, Panel, cifraSx, formatoPesos, formatoPorcentaje } from "../../components/estilo";

interface Producto {
  Codigo_Producto?: string;
  Nombre_Producto: string;
  Cantidad_Vendida: number;
  Total_Ventas?: number;
  Margen_Porcentaje?: number;
}

interface Props {
  data: Producto[];
  cargando?: boolean;
}

/** Los 10 productos con más unidades vendidas en el canal. */
const TopProductosChart: React.FC<Props> = ({ data, cargando = false }) => {
  const productos = (Array.isArray(data) ? data : []).slice(0, 10);
  return (
    <Panel titulo="Top 10 productos más vendidos" descripcion="Por unidades vendidas en el período">
      <ListaBarras
        cargando={cargando}
        filasCargando={10}
        numerado
        items={productos.map((p, i) => ({
          clave: p.Codigo_Producto || `${p.Nombre_Producto}-${i}`,
          etiqueta: p.Nombre_Producto,
          valor: p.Cantidad_Vendida,
          texto: `${(p.Cantidad_Vendida ?? 0).toLocaleString("es-CL")} u.`,
          detalle: p.Margen_Porcentaje != null ? <ChipMargen valor={p.Margen_Porcentaje} /> : undefined,
          tooltip: (
            <Box sx={{ fontSize: 12, lineHeight: 1.6, ...cifraSx }}>
              <strong>{p.Nombre_Producto}</strong>
              {p.Codigo_Producto && (
                <>
                  <br />
                  SKU {p.Codigo_Producto}
                </>
              )}
              <br />
              Unidades: {(p.Cantidad_Vendida ?? 0).toLocaleString("es-CL")}
              {p.Total_Ventas != null && (
                <>
                  <br />
                  Ventas: {formatoPesos(p.Total_Ventas)}
                </>
              )}
              {p.Margen_Porcentaje != null && (
                <>
                  <br />
                  Margen: {formatoPorcentaje(p.Margen_Porcentaje)}
                </>
              )}
            </Box>
          ),
        }))}
      />
    </Panel>
  );
};

export default TopProductosChart;
