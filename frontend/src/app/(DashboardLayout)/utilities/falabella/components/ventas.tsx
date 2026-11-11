"use client";
// Piezas de Ventas → Falabella: la tendencia diaria por tipo de envío y el
// detalle de las tarjetas (de la venta al margen). Misma forma que las de
// Ventas → Mercado Libre, con Full y despacho normal.
import React from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Box, Dialog, IconButton, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { IconX } from "@tabler/icons-react";
import { Columnas, EncabezadoPanel, cifraSx, formatoMonto, formatoPesos, formatoPorcentaje, tablaSx, tarjetaSx, tinta } from "../../ventas/components/estilo";
import { Par } from "../../ventas/mercado-libre/components/comun";
import { n, unidades } from "../../categorias/mercado-libre/components/comun";
import { BloqueFal, ContextoFal, LeyendaTiposFal, TIPOS_FAL, TipoFal } from "./comun";

export interface ResumenFal extends ContextoFal {
  cifras: { actual: Record<"total" | TipoFal, BloqueFal>; anterior: Record<"total" | TipoFal, BloqueFal> };
  tendencia: { fecha: string; tipo: TipoFal; venta: Par; unidades: number }[];
}

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

/** Venta neta por día de Full y de despacho normal. */
export function TendenciaFal({ tendencia, cargando }: { tendencia: ResumenFal["tendencia"]; cargando: boolean }) {
  const porDia = new Map<string, Punto>();
  for (const t of tendencia) {
    const p = porDia.get(t.fecha) ?? ({ date: t.fecha } as Punto);
    p[t.tipo] = n(p[t.tipo]) + n(t.venta.neto);
    porDia.set(t.fecha, p);
  }
  const puntos = [...porDia.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const tipos = TIPOS_FAL.filter((t) => tendencia.some((x) => x.tipo === t.clave && n(x.venta.neto) !== 0));
  puntos.forEach((p) => tipos.forEach((t) => (p[t.clave] = n(p[t.clave]))));

  return (
    <Box sx={{ ...tarjetaSx, p: 2.5, height: "100%", display: "flex", flexDirection: "column" }}>
      <EncabezadoPanel titulo="Tendencia diaria por tipo de envío" descripcion="Venta neta por día, sin IVA" accion={!cargando && tipos.length > 0 ? <LeyendaTiposFal /> : undefined} />
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

export type VistaDesgloseFal = "dinero" | "unidades";

/**
 * Detalle de las tarjetas de Ventas → Falabella.
 *  · dinero: de la venta al margen, paso a paso (venta − comisión − despacho =
 *    queda después de Falabella − costo = margen), en total y por tipo de envío.
 *  · unidades: unidades, productos distintos, órdenes, canceladas y devueltas.
 * Montos sin IVA.
 */
export function DesgloseFal({ vista, resumen, etiquetaPeriodo, onCerrar }: { vista: VistaDesgloseFal; resumen: ResumenFal; etiquetaPeriodo: string; onCerrar: () => void }) {
  const total = resumen.cifras.actual.total;
  const tipos = TIPOS_FAL.filter((t) => n(resumen.cifras.actual[t.clave]?.venta.neto) !== 0 || n(resumen.cifras.actual[t.clave]?.unidades) !== 0);
  const columnas: { clave: string; nombre: string; color?: string; t: BloqueFal }[] = [
    { clave: "total", nombre: "Total", t: total },
    ...tipos.map((x) => ({ clave: x.clave, nombre: x.nombre, color: x.color, t: resumen.cifras.actual[x.clave] })),
  ];
  const anchos = [28, ...columnas.map(() => 72 / columnas.length)];

  /** Una fila de la cascada: el monto y su % de la venta. */
  const fila = (texto: string, valor: (t: BloqueFal) => number | null, { signo = "", fuerte = false, ayuda = "", sinPct = false, soloPct = false } = {}) => (
    <TableRow sx={fuerte ? { "& .MuiTableCell-body": { bgcolor: tinta.fondoSuave, fontWeight: 750 } } : undefined}>
      <TableCell sx={{ fontWeight: fuerte ? 750 : 600 }} title={ayuda}>
        {signo && <Box component="span" sx={{ color: tinta.tenue, mr: 0.5 }}>{signo}</Box>}
        {texto}
      </TableCell>
      {columnas.map((c) => {
        const v = valor(c.t);
        const venta = n(c.t?.venta.neto);
        return (
          <TableCell key={c.clave} align="right">
            {v == null ? (
              <Box component="span" sx={{ color: tinta.tenue }}>—</Box>
            ) : soloPct ? (
              <span>{formatoPorcentaje(v)}</span>
            ) : (
              <Box component="span" sx={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end" }}>
                <span>{formatoPesos(v)}</span>
                {!sinPct && venta > 0 && <Box component="span" sx={{ fontSize: 10.5, color: tinta.tenue, fontWeight: 500 }}>{formatoPorcentaje((v / venta) * 100)}</Box>}
              </Box>
            )}
          </TableCell>
        );
      })}
    </TableRow>
  );

  const queda = (t: BloqueFal) => n(t?.venta.neto) - n(t?.comision.neto) - n(t?.envio.neto);
  const cobertura = total.coberturaCosto ?? 1;
  const filasUnidades: { texto: string; v: (t: BloqueFal) => number | null | undefined }[] = [
    { texto: "Unidades vendidas", v: (t) => t?.unidades },
    { texto: "Productos distintos", v: (t) => t?.productos },
    { texto: "Órdenes", v: (t) => t?.ordenes },
    { texto: "Unidades canceladas", v: (t) => t?.canceladas },
    { texto: "Unidades devueltas", v: (t) => t?.devueltas },
  ];

  return (
    <Dialog open onClose={onCerrar} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: "16px" } }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, px: 2.5, pt: 2.25, pb: 1 }}>
        <Box>
          <Typography sx={{ fontSize: 17, fontWeight: 750, color: tinta.primaria }}>{vista === "dinero" ? "De la venta al margen" : "Unidades y productos vendidos"}</Typography>
          <Typography sx={{ fontSize: 12.5, color: tinta.secundaria }}>
            Falabella · {etiquetaPeriodo}
            {vista === "dinero" ? " · montos sin IVA" : ""}
          </Typography>
        </Box>
        <IconButton aria-label="Cerrar" onClick={onCerrar} size="small">
          <IconX size={18} />
        </IconButton>
      </Box>

      <Box sx={{ px: 2.5, pb: 2.5 }}>
        <TableContainer sx={{ border: `1px solid ${tinta.borde}`, borderRadius: "12px", overflowX: "auto" }}>
          <Table size="small" sx={{ ...tablaSx, minWidth: 520, "& .MuiTableCell-body": { ...tablaSx["& .MuiTableCell-body"], ...cifraSx } }}>
            <Columnas anchos={anchos} />
            <TableHead>
              <TableRow>
                <TableCell />
                {columnas.map((c) => (
                  <TableCell key={c.clave} align="right">
                    <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                      {c.color && <Box component="span" sx={{ width: 8, height: 8, borderRadius: "2px", bgcolor: c.color }} />}
                      {c.nombre}
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {vista === "dinero" ? (
                <>
                  {fila("Venta", (t) => n(t?.venta.neto), { sinPct: true, ayuda: "Precio de lista de las unidades vendidas, sin canceladas ni devueltas." })}
                  {fila("Comisión de Falabella", (t) => n(t?.comision.neto), { signo: "−", ayuda: "Precio de lista × comisión de la categoría." })}
                  {fila("Despacho", (t) => n(t?.envio.neto), { signo: "−", ayuda: "Cofinanciamiento logístico: tarifa por el peso del paquete, el precio y la nota del vendedor del mes. Full paga 10 % menos." })}
                  {fila("Queda después de Falabella", queda, { signo: "=", fuerte: true })}
                  {fila("Costo de los productos", (t) => (t?.costo == null ? null : n(t.costo)), { signo: "−", ayuda: "Costo promedio de SAP × unidades." })}
                  {fila("Margen %", (t) => (t?.margenPct == null ? null : t.margenPct * 100), { signo: "=", fuerte: true, soloPct: true, ayuda: "Lo que queda después de Falabella menos el costo, sobre la venta con costo." })}
                </>
              ) : (
                filasUnidades.map((r) => (
                  <TableRow key={r.texto}>
                    <TableCell sx={{ fontWeight: 600 }}>{r.texto}</TableCell>
                    {columnas.map((c) => (
                      <TableCell key={c.clave} align="right">
                        {r.v(c.t) == null ? "—" : unidades(r.v(c.t))}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography component="div" sx={{ fontSize: 11.5, color: tinta.tenue, mt: 1.25, lineHeight: 1.5 }}>
          {vista === "dinero" ? (
            <>
              Margen = venta − comisión − despacho − costo, sin IVA, como porcentaje de la venta.
              {cobertura < 0.995 ? ` Solo el ${formatoPorcentaje(cobertura * 100)} de la venta tiene costo en SAP; el resto no entra en el margen.` : ""}
              {resumen.estimaciones ? ` ${resumen.estimaciones.despacho} No incluye: ${resumen.estimaciones.noIncluye}` : ""}
            </>
          ) : (
            <>Un producto que vende por Full y por despacho normal cuenta una vez en el total. Las canceladas y devueltas no cuentan como venta.</>
          )}
        </Typography>
      </Box>
    </Dialog>
  );
}
