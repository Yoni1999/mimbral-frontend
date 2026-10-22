"use client";

import React from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Box, Grid, Skeleton, Typography } from "@mui/material";
import { useApiDatos } from "@/utils/useCargaDatos";
import { BACKEND_URL } from "@/config";
import { CANALES, Panel, cifraSx, formatoMonto, formatoPesos, tarjetaSx, tinta } from "@/app/(DashboardLayout)/utilities/ventas/components/estilo";

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const NOMBRE_MES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// Años con los colores de la paleta validada, en orden de año; el más
// reciente va con la línea más gruesa.
const COLORES_ANIO = CANALES.map((c) => c.color);

function TooltipCaja({ active, payload, label, formato }: any) {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ ...tarjetaSx, p: 1.5, minWidth: 180, boxShadow: "0 12px 30px rgba(15,23,42,0.14)" }}>
      <Typography sx={{ fontSize: 12, fontWeight: 700, color: tinta.secundaria, mb: 0.75 }}>{label}</Typography>
      {[...payload]
        .sort((a: any, b: any) => String(b.dataKey).localeCompare(String(a.dataKey)))
        .map((f: any) => (
          <Box key={f.dataKey} sx={{ display: "flex", justifyContent: "space-between", gap: 2, fontSize: 12.5, py: 0.2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: "2px", bgcolor: f.color || f.fill }} />
              {f.name}
            </Box>
            <Box sx={{ fontWeight: 600, ...cifraSx }}>{formato(f.value)}</Box>
          </Box>
        ))}
    </Box>
  );
}

/** Historia del producto, sin depender del período: unidades por mes año
 *  contra año (estacionalidad) y venta de los últimos 12 meses. */
export default function PanelHistoria({ sku }: { sku: string }) {
  const q = `itemCode=${encodeURIComponent(sku)}`;
  const porAnio = useApiDatos<any[]>(`${BACKEND_URL}/api/unidades-vendidas?${q}`, []);
  const mensual = useApiDatos<any[]>(`${BACKEND_URL}/api/ventas-mensuales?${q}`, []);

  const anios = [...new Set(porAnio.datos.map((f) => String(f.Año)))].sort();
  const serieAnios = MESES.map((mes, i) => {
    const punto: Record<string, string | number> = { mes };
    porAnio.datos.filter((f) => Number(f.NumeroMes) === i + 1).forEach((f) => (punto[String(f.Año)] = Number(f.UnidadesVendidas) || 0));
    return punto;
  });

  const ultimos12 = (Array.isArray(mensual.datos) ? mensual.datos : []).map((f) => {
    const [y, m] = String(f.Mes).split("-");
    return { mes: `${MESES[Number(m) - 1]} ${y.slice(2)}`, nombre: `${NOMBRE_MES[Number(m) - 1]} ${y}`, venta: Number(f.TotalVentas) || 0, unidades: Number(f.UnidadesVendidas) || 0 };
  });
  const totalVenta = ultimos12.reduce((s, f) => s + f.venta, 0);
  const totalUnidades = ultimos12.reduce((s, f) => s + f.unidades, 0);

  const ejes = {
    tick: { fontSize: 11.5, fill: tinta.tenue },
    axisLine: false,
    tickLine: false,
  } as const;

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} lg={7}>
        <Panel titulo="Unidades por mes, año contra año" descripcion="Muestra la estacionalidad del producto.">
          {porAnio.cargando ? (
            <Skeleton variant="rounded" height={320} />
          ) : anios.length === 0 ? (
            <Typography sx={{ color: tinta.tenue, fontSize: 13, py: 8, textAlign: "center" }}>Sin ventas registradas.</Typography>
          ) : (
            <>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 1 }}>
                {anios.map((a, i) => (
                  <Box key={a} sx={{ display: "flex", alignItems: "center", gap: 0.75, fontSize: 12.5, color: tinta.secundaria }}>
                    <Box sx={{ width: 14, height: 3, borderRadius: 2, bgcolor: COLORES_ANIO[i % COLORES_ANIO.length] }} />
                    {a}
                  </Box>
                ))}
              </Box>
              <ResponsiveContainer width="100%" height={310}>
                <LineChart data={serieAnios} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#eef2f6" />
                  <XAxis dataKey="mes" {...ejes} axisLine={{ stroke: tinta.borde }} />
                  <YAxis {...ejes} width={60} tickFormatter={(v) => Number(v).toLocaleString("es-CL")} />
                  <Tooltip content={<TooltipCaja formato={(v: number) => `${Number(v).toLocaleString("es-CL")} u.`} />} cursor={{ stroke: "#cbd5e1", strokeDasharray: "3 3" }} />
                  {anios.map((a, i) => (
                    <Line
                      key={a}
                      type="monotone"
                      dataKey={a}
                      name={a}
                      stroke={COLORES_ANIO[i % COLORES_ANIO.length]}
                      strokeWidth={i === anios.length - 1 ? 2.5 : 2}
                      dot={false}
                      connectNulls={false}
                      activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </>
          )}
        </Panel>
      </Grid>
      <Grid item xs={12} lg={5}>
        <Panel
          titulo="Venta de los últimos 12 meses"
          descripcion={mensual.cargando ? "Cargando…" : `${formatoMonto(totalVenta)} · ${totalUnidades.toLocaleString("es-CL")} unidades`}
        >
          {mensual.cargando ? (
            <Skeleton variant="rounded" height={320} />
          ) : ultimos12.length === 0 ? (
            <Typography sx={{ color: tinta.tenue, fontSize: 13, py: 8, textAlign: "center" }}>Sin ventas en los últimos 12 meses.</Typography>
          ) : (
            <ResponsiveContainer width="100%" height={330}>
              <BarChart data={ultimos12} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#eef2f6" />
                <XAxis dataKey="mes" {...ejes} axisLine={{ stroke: tinta.borde }} interval={0} angle={-35} textAnchor="end" height={44} />
                <YAxis {...ejes} width={70} tickFormatter={(v) => formatoMonto(v)} />
                <Tooltip
                  cursor={{ fill: "#f1f5f9" }}
                  content={({ active, payload }: any) =>
                    active && payload?.length ? (
                      <Box sx={{ ...tarjetaSx, p: 1.5, boxShadow: "0 12px 30px rgba(15,23,42,0.14)" }}>
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: tinta.secundaria, mb: 0.5 }}>{payload[0].payload.nombre}</Typography>
                        <Typography sx={{ fontSize: 13, fontWeight: 700, ...cifraSx }}>{formatoPesos(payload[0].payload.venta)}</Typography>
                        <Typography sx={{ fontSize: 12, color: tinta.secundaria, ...cifraSx }}>
                          {payload[0].payload.unidades.toLocaleString("es-CL")} unidades
                        </Typography>
                      </Box>
                    ) : null
                  }
                />
                <Bar dataKey="venta" name="Venta" fill={tinta.acento} radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </Grid>
    </Grid>
  );
}
