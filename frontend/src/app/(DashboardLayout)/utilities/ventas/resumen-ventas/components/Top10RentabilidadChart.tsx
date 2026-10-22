"use client";

import React from "react";
import { Box } from "@mui/material";
import { ChipMargen, Panel, cifraSx, formatoMonto, formatoPesos, formatoPorcentaje } from "../../components/estilo";
import ListaBarras from "../../components/ListaBarras";

interface Producto {
  Nombre_Producto: string;
  Rentabilidad_Total: number;
  Cantidad_Vendida: number;
  Margen_Porcentaje: number;
  Precio_Venta_Promedio: number;
  Costo_Promedio: number;
}

interface Props {
  data: Producto[];
}

/** Los 10 productos que más margen dejaron. Barras horizontales con el nombre
 *  completo y el monto escrito; el detalle va en el tooltip de cada fila. */
const RentabilidadChart: React.FC<Props> = ({ data }) => {
  const productos = (Array.isArray(data) ? data : []).slice(0, 10);

  return (
    <Panel titulo="Top 10 productos más rentables" descripcion="Margen bruto total en el período">
      <ListaBarras
        numerado
        items={productos.map((p, i) => ({
          clave: `${p.Nombre_Producto}-${i}`,
          etiqueta: p.Nombre_Producto,
          valor: p.Rentabilidad_Total,
          texto: formatoMonto(p.Rentabilidad_Total),
          detalle: <ChipMargen valor={p.Margen_Porcentaje} />,
          tooltip: (
            <Box sx={{ fontSize: 12, lineHeight: 1.6, ...cifraSx }}>
              <strong>{p.Nombre_Producto}</strong>
              <br />
              Rentabilidad: {formatoPesos(p.Rentabilidad_Total)}
              <br />
              Cantidad vendida: {(p.Cantidad_Vendida ?? 0).toLocaleString("es-CL")}
              <br />
              Margen: {formatoPorcentaje(p.Margen_Porcentaje, 2)}
              <br />
              Precio venta promedio: {formatoPesos(p.Precio_Venta_Promedio)}
              <br />
              Costo promedio: {formatoPesos(p.Costo_Promedio)}
            </Box>
          ),
        }))}
      />
    </Panel>
  );
};

export default RentabilidadChart;
