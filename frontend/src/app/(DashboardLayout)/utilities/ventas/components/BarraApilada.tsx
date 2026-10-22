"use client";

import React from "react";
import { Box, Tooltip, Typography } from "@mui/material";
import { cifraSx, formatoMonto, formatoPorcentaje, tinta } from "./estilo";

export interface Tramo {
  clave: string;
  nombre: string;
  valor: number;
  color: string;
  /** Segunda línea bajo el porcentaje (p. ej. "12 facturas"). */
  detalle?: string;
}

/** Composición de un total: una barra apilada (2 px entre tramos, extremos
 *  redondeados) y la leyenda en columnas con monto y porcentaje. Si
 *  `onSeleccionar` viene, cada tramo de la leyenda se puede pulsar. */
export default function BarraApilada({
  tramos,
  columnas = 2,
  seleccionado = null,
  onSeleccionar,
}: {
  tramos: Tramo[];
  columnas?: number;
  seleccionado?: string | null;
  onSeleccionar?: (clave: string) => void;
}) {
  const total = tramos.reduce((s, t) => s + Math.max(t.valor, 0), 0);
  const pct = (v: number) => (total > 0 ? (Math.max(v, 0) / total) * 100 : 0);

  return (
    <>
      <Box sx={{ display: "flex", gap: "2px", height: 14, my: 1.5, borderRadius: 999, overflow: "hidden", bgcolor: "#eef2f6" }}>
        {tramos
          .filter((t) => t.valor > 0)
          .map((t) => (
            <Tooltip key={t.clave} arrow placement="top" title={`${t.nombre}: ${formatoMonto(t.valor)} · ${formatoPorcentaje(pct(t.valor))}${t.detalle ? ` · ${t.detalle}` : ""}`}>
              <Box
                sx={{
                  flex: `${t.valor} 0 0`,
                  minWidth: 4,
                  bgcolor: t.color,
                  opacity: seleccionado && seleccionado !== t.clave ? 0.35 : 1,
                  transition: "opacity 120ms ease",
                }}
              />
            </Tooltip>
          ))}
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: `repeat(${columnas}, 1fr)` }, columnGap: 3, rowGap: 1.5 }}>
        {tramos.map((t) => {
          const activo = seleccionado === t.clave;
          return (
            <Box
              key={t.clave}
              component={onSeleccionar ? "button" : "div"}
              type={onSeleccionar ? "button" : undefined}
              onClick={onSeleccionar ? () => onSeleccionar(t.clave) : undefined}
              aria-pressed={onSeleccionar ? activo : undefined}
              sx={{
                display: "flex",
                gap: 1,
                minWidth: 0,
                textAlign: "left",
                border: 0,
                borderRadius: "10px",
                p: onSeleccionar ? 0.75 : 0,
                m: onSeleccionar ? -0.75 : 0,
                fontFamily: "inherit",
                bgcolor: activo ? "#eff4ff" : "transparent",
                cursor: onSeleccionar ? "pointer" : "default",
                opacity: seleccionado && !activo ? 0.55 : 1,
                "&:hover": onSeleccionar ? { bgcolor: activo ? "#eff4ff" : tinta.fondoSuave } : undefined,
              }}
            >
              <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: t.color, mt: "5px", flexShrink: 0 }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography noWrap sx={{ fontSize: 12.5, color: tinta.secundaria }}>
                  {t.nombre}
                </Typography>
                <Typography sx={{ fontSize: 16, fontWeight: 700, color: tinta.primaria, lineHeight: 1.3, ...cifraSx }}>
                  {formatoMonto(t.valor)}
                </Typography>
                <Typography sx={{ fontSize: 11.5, color: tinta.tenue, ...cifraSx }}>
                  {formatoPorcentaje(pct(t.valor))}
                  {t.detalle ? ` · ${t.detalle}` : ""}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
    </>
  );
}
