"use client";

// Gráfico de tendencia para celular: en vez de 3–6 líneas enredadas y una
// leyenda de dos filas, chips deslizables para elegir la serie. La elegida se
// dibuja con su color y un área suave; las demás quedan en gris de referencia.
// Encima: el total de la serie en el período, su variación (si la vista la
// tiene) y su mejor día o mes. En escritorio no se usa.

import React, { useMemo, useState } from "react";
import { Area, ComposedChart, Line, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Box, ButtonBase, Typography } from "@mui/material";
import { ChipVariacion, cifraSx, formatoMonto, formatoPesos, tarjetaSx, tinta } from "./estilo";

export interface SerieTendencia {
  clave: string;
  nombre: string;
  color: string;
}

const GRIS = "#d5dbe3";

/** Fecha ISO (aaaa-mm-dd) como "jue 19". */
export const diaCorto = (iso: string) => {
  const [a, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  if (!a || !m || !d) return String(iso);
  const dia = new Date(a, m - 1, d).toLocaleDateString("es-CL", { weekday: "short" }).replace(".", "");
  return `${dia} ${d}`;
};

/** Fecha ISO como "19/11" para el eje y el tooltip. */
export const diaMes = (iso: string) => {
  const [, m, d] = String(iso).slice(0, 10).split("-");
  return d && m ? `${d}/${m}` : String(iso);
};

function TooltipSerie({ active, payload, label, serie, etiqueta }: any) {
  if (!active || !payload?.length) return null;
  const fila = payload.find((p: any) => p.dataKey === serie.clave);
  if (!fila) return null;
  return (
    <Box sx={{ ...tarjetaSx, px: 1.25, py: 0.75, boxShadow: "0 8px 20px rgba(15,23,42,0.14)" }}>
      <Typography sx={{ fontSize: 11, color: tinta.secundaria }}>{etiqueta(label)}</Typography>
      <Typography sx={{ fontSize: 13, fontWeight: 700, color: tinta.primaria, ...cifraSx }}>{formatoPesos(fila.value)}</Typography>
    </Box>
  );
}

export default function TendenciaMovil({
  series,
  puntos,
  claveX = "date",
  etiquetaEje = diaMes,
  etiquetaMejor = diaCorto,
  textoMejor = "mejor día",
  inicial,
  variaciones,
  notaVariacion,
  ordenarPorVenta = true,
}: {
  series: readonly SerieTendencia[];
  puntos: Record<string, number | string | null | undefined>[];
  /** Campo del eje X en cada punto ("date", "month"). */
  claveX?: string;
  etiquetaEje?: (x: string) => string;
  etiquetaMejor?: (x: string) => string;
  textoMejor?: string;
  /** Serie elegida al abrir; si no, la de mayor venta del período. */
  inicial?: string;
  /** Variación de cada serie contra el período anterior, si la vista la tiene. */
  variaciones?: Record<string, number | null | undefined>;
  /** Contra qué se compara la variación de la serie, en letra chica bajo la cifra. */
  notaVariacion?: (clave: string) => string;
  /** Chips de mayor a menor venta (por defecto); false deja el orden de `series`. */
  ordenarPorVenta?: boolean;
}) {
  const totales = useMemo(
    () =>
      series.map((s) => ({
        ...s,
        total: puntos.reduce((suma, p) => suma + (Number(p[s.clave]) || 0), 0),
      })),
    [series, puntos]
  );
  const mayor = useMemo(() => [...totales].sort((a, b) => b.total - a.total)[0]?.clave, [totales]);
  // La que tocó el usuario; mientras no toque, la inicial o la de más venta
  // (así, al llegar datos o cambiar el filtro, se sigue la de más venta).
  const [tocada, setTocada] = useState<string | null>(null);
  const elegida = tocada && series.some((s) => s.clave === tocada) ? tocada : inicial ?? mayor;

  const serie = totales.find((s) => s.clave === elegida) ?? totales[0];
  if (!serie) return null;

  const mejor = puntos.reduce<Record<string, any> | null>(
    (max, p) => (p[serie.clave] != null && (!max || (Number(p[serie.clave]) || 0) > (Number(max[serie.clave]) || 0)) ? p : max),
    null
  );
  const hayMejor = mejor && (Number(mejor[serie.clave]) || 0) > 0;
  const variacion = variaciones?.[serie.clave];
  const ultimo = puntos.length - 1;

  return (
    <Box>
      <Box
        role="tablist"
        aria-label="Elegir serie"
        sx={{
          display: "flex",
          gap: 0.75,
          overflowX: "auto",
          mx: -2,
          px: 2,
          pb: 0.5,
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {/* De mayor a menor venta: la elegida al abrir queda primera y a la vista. */}
        {(ordenarPorVenta ? [...totales].sort((a, b) => b.total - a.total) : totales).map((s) => {
          const activa = s.clave === serie.clave;
          return (
            <ButtonBase
              key={s.clave}
              role="tab"
              aria-selected={activa}
              onClick={() => setTocada(s.clave)}
              sx={{
                flexShrink: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: 0.75,
                height: 32,
                px: 1.5,
                borderRadius: 999,
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: activa ? 600 : 500,
                whiteSpace: "nowrap",
                color: activa ? "#fff" : tinta.secundaria,
                bgcolor: activa ? tinta.primaria : "#fff",
                border: `1px solid ${activa ? tinta.primaria : tinta.borde}`,
                transition: "background-color 160ms ease, color 160ms ease",
              }}
            >
              <Box component="span" sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: s.color, flexShrink: 0 }} />
              {s.nombre}
            </ButtonBase>
          );
        })}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1.5, minWidth: 0 }}>
        <Typography sx={{ fontSize: 24, fontWeight: 700, color: tinta.primaria, lineHeight: 1.1, whiteSpace: "nowrap", ...cifraSx }}>
          {formatoMonto(serie.total)}
        </Typography>
        <ChipVariacion valor={variacion} />
        {hayMejor && (
          <Typography sx={{ ml: "auto", fontSize: 12, color: tinta.tenue, whiteSpace: "nowrap", textAlign: "right" }}>
            {textoMejor}: {etiquetaMejor(String(mejor![claveX]))}
          </Typography>
        )}
      </Box>

      {notaVariacion && typeof variacion === "number" && (
        <Typography sx={{ fontSize: 11.5, color: tinta.tenue, mt: 0.25 }}>{notaVariacion(serie.clave)}</Typography>
      )}

      <Box sx={{ mt: 1, mx: -0.5 }}>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={puntos} margin={{ top: 10, right: 6, left: 6, bottom: 0 }}>
            <XAxis
              dataKey={claveX}
              tickFormatter={etiquetaEje}
              tick={{ fontSize: 11, fill: tinta.tenue }}
              axisLine={{ stroke: tinta.borde }}
              tickLine={false}
              interval="preserveStartEnd"
              ticks={puntos.length > 2 ? [puntos[0][claveX], puntos[Math.floor(ultimo / 2)][claveX], puntos[ultimo][claveX]] as any : undefined}
            />
            <YAxis hide domain={[0, "auto"]} />
            <Tooltip
              content={<TooltipSerie serie={serie} etiqueta={etiquetaEje} />}
              cursor={{ stroke: "#cbd5e1", strokeDasharray: "3 3" }}
            />
            {/* Las demás series en gris, detrás, como referencia. */}
            {totales
              .filter((s) => s.clave !== serie.clave)
              .map((s) => (
                <Line
                  key={s.clave}
                  type="monotone"
                  dataKey={s.clave}
                  stroke={GRIS}
                  strokeWidth={1.25}
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                  connectNulls={false}
                />
              ))}
            <Area
              key={serie.clave}
              type="monotone"
              dataKey={serie.clave}
              name={serie.nombre}
              stroke={serie.color}
              strokeWidth={2.5}
              fill={serie.color}
              fillOpacity={0.12}
              animationDuration={400}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff", fill: serie.color }}
              connectNulls={false}
            />
            {hayMejor && (
              <ReferenceDot x={mejor![claveX]} y={Number(mejor![serie.clave])} r={4} fill={serie.color} stroke="#fff" strokeWidth={2} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}
