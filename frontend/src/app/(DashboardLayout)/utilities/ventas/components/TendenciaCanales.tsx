"use client";

import React from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Box, Skeleton, Typography } from "@mui/material";
import { CANALES, EncabezadoPanel, cifraSx, formatoMonto, formatoPesos, tarjetaSx, tinta } from "./estilo";

export type Punto = { date: string; orden: number } & Record<string, number | string>;

const fechaCorta = (iso: string) => {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
};

/** Tooltip: un día, los canales ordenados por venta, montos en pesos. */
function TooltipDia({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const filas = [...payload].sort((a: any, b: any) => (b.value ?? 0) - (a.value ?? 0));
  const total = filas.reduce((s: number, f: any) => s + (Number(f.value) || 0), 0);
  return (
    <Box sx={{ ...tarjetaSx, p: 1.5, minWidth: 220, boxShadow: "0 12px 30px rgba(15,23,42,0.14)" }}>
      <Typography sx={{ fontSize: 12, fontWeight: 700, color: tinta.secundaria, mb: 1 }}>
        {String(label).split("-").reverse().join("/")}
      </Typography>
      {filas.map((f: any) => (
        <Box key={f.dataKey} sx={{ display: "flex", justifyContent: "space-between", gap: 2, fontSize: 12.5, py: 0.25 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, color: tinta.primaria }}>
            <Box sx={{ width: 8, height: 8, borderRadius: "2px", bgcolor: f.color }} />
            {f.name}
          </Box>
          <Box sx={{ color: tinta.primaria, fontWeight: 600, ...cifraSx }}>{formatoPesos(f.value)}</Box>
        </Box>
      ))}
      <Box sx={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${tinta.borde}`, mt: 1, pt: 1, fontSize: 12.5, fontWeight: 700, ...cifraSx }}>
        <span>Total</span>
        <span>{formatoPesos(total)}</span>
      </Box>
    </Box>
  );
}

/** Respuesta de los endpoints de venta diaria por canal
 *  ([{Fecha, Meli, Falabella, …}]) en puntos ordenados por día. */
export const puntosDeTendencia = (raw: unknown): Punto[] =>
  (Array.isArray(raw) ? raw : [])
    .map((item: any) => {
      const punto: Punto = { date: String(item.Fecha).slice(0, 10), orden: new Date(item.Fecha).getTime() };
      CANALES.forEach((c) => (punto[c.clave] = Number(item[c.clave]) || 0));
      return punto;
    })
    .sort((a, b) => a.orden - b.orden);

/** Total del período por canal, sumando la tendencia diaria. */
export const totalesPorCanal = (puntos: Punto[]) =>
  CANALES.map((c) => ({ ...c, venta: puntos.reduce((s, p) => s + (Number(p[c.clave]) || 0), 0) }));

/** Tendencia diaria de la venta por canal (líneas). Con un solo día muestra
 *  el monto de cada canal, porque un punto no forma una línea. */
export default function TendenciaCanales({ datos: data, cargando }: { datos: Punto[]; cargando: boolean }) {
  const unSoloDia = data.length === 1;

  return (
    <Box sx={{ ...tarjetaSx, p: 2.5, height: "100%", display: "flex", flexDirection: "column" }}>
      <EncabezadoPanel titulo="Tendencia diaria por canal" descripcion="Venta neta por día, sin IVA" />

      {!cargando && !unSoloDia && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 1 }}>
          {CANALES.map((c) => (
            <Box key={c.clave} sx={{ display: "flex", alignItems: "center", gap: 0.75, fontSize: 12.5, color: tinta.secundaria }}>
              <Box sx={{ width: 14, height: 3, borderRadius: 2, bgcolor: c.color }} />
              {c.nombre}
            </Box>
          ))}
        </Box>
      )}

      {cargando ? (
        <Skeleton variant="rounded" height={300} />
      ) : data.length === 0 ? (
        <Typography sx={{ color: tinta.tenue, fontSize: 13, py: 8, textAlign: "center" }}>
          Sin ventas en el período seleccionado.
        </Typography>
      ) : unSoloDia ? (
        // Un solo día no forma una línea: se dice y se muestra el día por canal.
        <Box sx={{ py: 2 }}>
          <Typography sx={{ fontSize: 13, color: tinta.secundaria, mb: 2 }}>
            El período es de un solo día ({data[0].date.split("-").reverse().join("/")}). Elige un rango de varios
            días para ver la tendencia.
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(3, 1fr)" }, gap: 1.5 }}>
            {CANALES.map((c) => (
              <Box key={c.clave} sx={{ border: `1px solid ${tinta.borde}`, borderRadius: "10px", p: 1.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, fontSize: 12.5, color: tinta.secundaria }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "2px", bgcolor: c.color }} />
                  {c.nombre}
                </Box>
                <Typography sx={{ fontSize: 18, fontWeight: 700, color: tinta.primaria, mt: 0.5, ...cifraSx }}>
                  {formatoMonto(Number(data[0][c.clave]))}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      ) : (
        <Box sx={{ flex: 1, minHeight: 300 }}>
          <ResponsiveContainer width="100%" height={310}>
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#eef2f6" />
              <XAxis
                dataKey="date"
                tickFormatter={fechaCorta}
                tick={{ fontSize: 11.5, fill: tinta.tenue }}
                axisLine={{ stroke: tinta.borde }}
                tickLine={false}
                minTickGap={16}
              />
              <YAxis
                tickFormatter={(v) => formatoMonto(v)}
                tick={{ fontSize: 11.5, fill: tinta.tenue }}
                axisLine={false}
                tickLine={false}
                width={78}
              />
              <Tooltip content={<TooltipDia />} cursor={{ stroke: "#cbd5e1", strokeDasharray: "3 3" }} />
              {CANALES.map((c) => (
                <Line
                  key={c.clave}
                  type="monotone"
                  dataKey={c.clave}
                  name={c.nombre}
                  stroke={c.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Box>
  );
}
