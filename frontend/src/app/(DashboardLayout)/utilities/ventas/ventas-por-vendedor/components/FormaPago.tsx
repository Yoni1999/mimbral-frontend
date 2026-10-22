"use client";

import React from "react";
import { Skeleton, Typography } from "@mui/material";
import BarraApilada, { Tramo } from "../../components/BarraApilada";
import { CANALES, Panel, cifraSx, formatoMonto, tinta } from "../../components/estilo";

export interface FormaPagoItem {
  PayDueMonth: string;
  CantidadFacturas: number;
  TotalVentas: number;
}

/** Hasta 5 formas de pago con color propio; el resto se agrupa en "Otras".
 *  Colores en orden fijo de la paleta validada de canales. */
const MAXIMO = 5;
const COLORES = CANALES.map((c) => c.color);
const COLOR_OTRAS = "#94a3b8";

const facturas = (n: number) => `${n.toLocaleString("es-CL")} facturas`;

/** Distribución de la venta por condición de pago (contado, 30 días…): una
 *  barra apilada con el total arriba y la leyenda con monto y porcentaje. */
const FormasPago: React.FC<{ data: FormaPagoItem[]; cargando: boolean }> = ({ data, cargando }) => {
  const ordenadas = data
    .map((f) => ({ nombre: f.PayDueMonth || "Sin condición", venta: Number(f.TotalVentas) || 0, facturas: Number(f.CantidadFacturas) || 0 }))
    .filter((f) => f.venta > 0)
    .sort((a, b) => b.venta - a.venta);

  const resto = ordenadas.slice(MAXIMO);
  const tramos: Tramo[] = [
    ...ordenadas.slice(0, MAXIMO).map((f, i) => ({ clave: f.nombre, nombre: f.nombre, valor: f.venta, color: COLORES[i], detalle: facturas(f.facturas) })),
    ...(resto.length
      ? [
          {
            clave: "otras",
            nombre: `Otras (${resto.length})`,
            valor: resto.reduce((s, f) => s + f.venta, 0),
            color: COLOR_OTRAS,
            detalle: facturas(resto.reduce((s, f) => s + f.facturas, 0)),
          },
        ]
      : []),
  ];
  const total = tramos.reduce((s, t) => s + t.valor, 0);

  return (
    <Panel titulo="Distribución por forma de pago" descripcion="Ventas del período">
      {cargando ? (
        <>
          <Skeleton width={140} height={40} />
          <Skeleton variant="rounded" height={14} sx={{ my: 2, borderRadius: 999 }} />
          <Skeleton height={90} />
        </>
      ) : tramos.length === 0 ? (
        <Typography sx={{ color: tinta.tenue, fontSize: 13, py: 4, textAlign: "center" }}>Sin ventas en el período.</Typography>
      ) : (
        <>
          <Typography sx={{ fontSize: 26, fontWeight: 750, color: tinta.primaria, lineHeight: 1.1, ...cifraSx }}>{formatoMonto(total)}</Typography>
          <BarraApilada tramos={tramos} />
        </>
      )}
    </Panel>
  );
};

export default FormasPago;
