"use client";

import React from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Box, Skeleton, Typography } from "@mui/material";
import { EncabezadoPanel, cifraSx, formatoMonto, formatoPesos, tarjetaSx, tinta } from "../../components/estilo";
import { LeyendaTipos, ResumenMl, TIPOS_ENVIO, n } from "./comun";

type Punto = { date: string } & Record<string, number | string>;

const fechaEje = (iso: string) => {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
};

function TooltipDia({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const filas = [...payload].sort((a: any, b: any) => (b.value ?? 0) - (a.value ?? 0));
  const total = filas.reduce((s: number, f: any) => s + (Number(f.value) || 0), 0);
  return (
    <Box sx={{ ...tarjetaSx, p: 1.5, minWidth: 200, boxShadow: "0 12px 30px rgba(15,23,42,0.14)" }}>
      <Typography sx={{ fontSize: 12, fontWeight: 700, color: tinta.secundaria, mb: 1 }}>{String(label).split("-").reverse().join("/")}</Typography>
      {filas.map((f: any) => (
        <Box key={f.dataKey} sx={{ display: "flex", justifyContent: "space-between", gap: 2, fontSize: 12.5, py: 0.25 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: "2px", bgcolor: f.color }} />
            {f.name}
          </Box>
          <Box sx={{ fontWeight: 600, ...cifraSx }}>{formatoPesos(f.value)}</Box>
        </Box>
      ))}
      <Box sx={{ display: "flex", justifyContent: "space-between", borderTop: `1px solid ${tinta.borde}`, mt: 1, pt: 1, fontSize: 12.5, fontWeight: 700, ...cifraSx }}>
        <span>Total</span>
        <span>{formatoPesos(total)}</span>
      </Box>
    </Box>
  );
}

/** Venta neta por día de Full, Colecta y Flex (y otros, si hubo). */
export default function TendenciaTipos({ tendencia, cargando }: { tendencia: ResumenMl["tendencia"]; cargando: boolean }) {
  const porDia = new Map<string, Punto>();
  for (const t of tendencia) {
    const p = porDia.get(t.fecha) ?? ({ date: t.fecha } as Punto);
    p[t.tipo] = n(p[t.tipo]) + n(t.venta.neto);
    porDia.set(t.fecha, p);
  }
  const puntos = [...porDia.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const tipos = TIPOS_ENVIO.filter((t) => tendencia.some((x) => x.tipo === t.clave && n(x.venta.neto) !== 0));
  puntos.forEach((p) => tipos.forEach((t) => (p[t.clave] = n(p[t.clave]))));

  return (
    <Box sx={{ ...tarjetaSx, p: 2.5, height: "100%", display: "flex", flexDirection: "column" }}>
      <EncabezadoPanel titulo="Tendencia diaria por tipo de envío" descripcion="Venta neta por día, sin IVA" accion={!cargando && tipos.length > 0 ? <LeyendaTipos tipos={tipos} /> : undefined} />
      {cargando ? (
        <Skeleton variant="rounded" height={300} />
      ) : puntos.length === 0 ? (
        <Typography sx={{ color: tinta.tenue, fontSize: 13, py: 8, textAlign: "center" }}>Sin ventas en el período seleccionado.</Typography>
      ) : puntos.length === 1 ? (
        <Typography sx={{ fontSize: 13, color: tinta.secundaria, py: 4 }}>
          El período es de un solo día ({fechaEje(String(puntos[0].date))}). Elige un rango de varios días para ver la tendencia.
        </Typography>
      ) : (
        <Box sx={{ flex: 1, minHeight: 300 }}>
          <ResponsiveContainer width="100%" height={310}>
            <LineChart data={puntos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#eef2f6" />
              <XAxis dataKey="date" tickFormatter={fechaEje} tick={{ fontSize: 11.5, fill: tinta.tenue }} axisLine={{ stroke: tinta.borde }} tickLine={false} minTickGap={16} />
              <YAxis tickFormatter={(v) => formatoMonto(v)} tick={{ fontSize: 11.5, fill: tinta.tenue }} axisLine={false} tickLine={false} width={78} />
              <Tooltip content={<TooltipDia />} cursor={{ stroke: "#cbd5e1", strokeDasharray: "3 3" }} />
              {tipos.map((t) => (
                <Line key={t.clave} type="monotone" dataKey={t.clave} name={t.nombre} stroke={t.color} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Box>
  );
}
