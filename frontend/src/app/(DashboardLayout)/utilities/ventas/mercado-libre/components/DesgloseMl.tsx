"use client";

import React from "react";
import { Box, Dialog, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { IconX } from "@tabler/icons-react";
import { Columnas, cifraSx, formatoPesos, formatoPorcentaje, tablaSx, tinta } from "../../components/estilo";
import { ResumenMl, TIPOS_ENVIO, Totales, n, unidades } from "./comun";

export type VistaDesglose = "dinero" | "unidades";

interface Props {
  vista: VistaDesglose;
  resumen: ResumenMl;
  /** Totales de todos los tipos (sin "sin detalle"). */
  total: Totales;
  etiquetaPeriodo: string;
  onCerrar: () => void;
}

/** Tipos con venta en el período, en su orden fijo. */
const tiposConVenta = (r: ResumenMl) => TIPOS_ENVIO.filter((t) => n(r.actual[t.clave]?.venta.neto) !== 0 || n(r.actual[t.clave]?.unidades) !== 0);

/**
 * Detalle de las tarjetas de Ventas → Mercado Libre.
 *  · dinero: de la venta al margen, paso a paso (venta − comisión − envío =
 *    queda después de ML − costo = margen), en total y por tipo de envío.
 *  · unidades: unidades, productos distintos y órdenes por tipo de envío.
 * Montos sin IVA.
 */
export default function DesgloseMl({ vista, resumen, total, etiquetaPeriodo, onCerrar }: Props) {
  const tipos = tiposConVenta(resumen);
  const columnas: { clave: string; nombre: string; color?: string; t: Totales }[] = [
    { clave: "total", nombre: "Total", t: total },
    ...tipos.map((x) => ({ clave: x.clave, nombre: x.nombre, color: x.color, t: resumen.actual[x.clave] })),
  ];
  const sinDato = resumen.actual.sin_dato;
  const anchos = [26, ...columnas.map(() => 74 / columnas.length)];

  const encabezado = (
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
  );

  /** Una fila de la cascada: el monto y su % de la venta. */
  const fila = (texto: string, valor: (t: Totales) => number | null, { signo = "", fuerte = false, ayuda = "" } = {}) => (
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
            ) : (
              <Box component="span" sx={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end" }}>
                <span>{formatoPesos(v)}</span>
                {texto !== "Venta" && venta > 0 && (
                  <Box component="span" sx={{ fontSize: 10.5, color: tinta.tenue, fontWeight: 500 }}>{formatoPorcentaje((v / venta) * 100)}</Box>
                )}
              </Box>
            )}
          </TableCell>
        );
      })}
    </TableRow>
  );

  const queda = (t: Totales) => n(t?.venta.neto) - n(t?.comision.neto) - n(t?.envio.neto);
  const cobertura = n(total.ventaConCosto?.neto) / (n(total.venta.neto) || 1);

  return (
    <Dialog open onClose={onCerrar} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: "16px" } }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, px: 2.5, pt: 2.25, pb: 1 }}>
        <Box>
          <Typography sx={{ fontSize: 17, fontWeight: 750, color: tinta.primaria }}>
            {vista === "dinero" ? "De la venta al margen" : "Unidades y productos vendidos"}
          </Typography>
          <Typography sx={{ fontSize: 12.5, color: tinta.secundaria }}>
            Mercado Libre · {etiquetaPeriodo}
            {vista === "dinero" ? " · montos sin IVA" : ""}
          </Typography>
        </Box>
        <IconButton aria-label="Cerrar" onClick={onCerrar} size="small">
          <IconX size={18} />
        </IconButton>
      </Box>

      <Box sx={{ px: 2.5, pb: 2.5 }}>
        <TableContainer sx={{ border: `1px solid ${tinta.borde}`, borderRadius: "12px", overflowX: "auto" }}>
          <Table size="small" sx={{ ...tablaSx, minWidth: 560, "& .MuiTableCell-body": { ...tablaSx["& .MuiTableCell-body"], ...cifraSx } }}>
            <Columnas anchos={anchos} />
            {encabezado}
            <TableBody>
              {vista === "dinero" ? (
                <>
                  {fila("Venta", (t) => n(t?.venta.neto))}
                  {fila("Comisión de ML", (t) => n(t?.comision.neto), { signo: "−", ayuda: "Colecta y Flex: comisión real de cada orden. Full: estimada con la publicación." })}
                  {fila("Envío", (t) => (t?.envio.neto == null ? null : n(t.envio.neto)), {
                    signo: "−",
                    ayuda: "Estimado con la publicación (Full y Colecta). En Flex y otros no se estima.",
                  })}
                  {fila("Queda después de ML", queda, { signo: "=", fuerte: true })}
                  {fila("Costo de los productos", (t) => (t?.costo?.neto == null ? null : n(t.costo.neto)), {
                    signo: "−",
                    ayuda: "Costo promedio de SAP × unidades.",
                  })}
                  {fila("Margen", (t) => (t?.margen?.neto == null ? null : n(t.margen.neto)), { signo: "=", fuerte: true })}
                </>
              ) : (
                <>
                  {[
                    { texto: "Unidades", v: (t: Totales) => t?.unidades },
                    { texto: "Productos distintos", v: (t: Totales, total?: boolean) => (total ? resumen.items?.actual ?? t?.items : t?.items) },
                    { texto: "Órdenes", v: (t: Totales) => t?.ordenes },
                  ].map((r) => (
                    <TableRow key={r.texto}>
                      <TableCell sx={{ fontWeight: 600 }}>{r.texto}</TableCell>
                      {columnas.map((c) => (
                        <TableCell key={c.clave} align="right">
                          {r.v(c.t, c.clave === "total") == null ? "—" : unidades(r.v(c.t, c.clave === "total"))}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography component="div" sx={{ fontSize: 11.5, color: tinta.tenue, mt: 1.25, lineHeight: 1.5 }}>
          {vista === "dinero" ? (
            <>
              Margen = venta − comisión − envío − costo, sin IVA.
              {cobertura < 0.995 ? ` Solo el ${formatoPorcentaje(cobertura * 100)} de la venta tiene costo en SAP; el resto no entra en el margen.` : ""}
              {n(sinDato?.venta.neto) ? ` No incluye ${formatoPesos(sinDato.venta.neto)} que ML informa sin detalle de producto.` : ""}
            </>
          ) : (
            <>
              Un producto que vende por Full y por Colecta cuenta una vez en el total. En Full, las órdenes son por producto y día.
              {n(sinDato?.unidades) ? ` No incluye ${unidades(sinDato.unidades)} unidades que ML informa sin detalle de producto.` : ""}
            </>
          )}
        </Typography>
      </Box>
    </Dialog>
  );
}
