"use client";

import React from "react";
import { Box, Dialog, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { IconX } from "@tabler/icons-react";
import { Columnas, cifraSx, formatoPesos, formatoPorcentaje, tablaSx, tinta } from "../../components/estilo";
import { ResumenMl, TIPOS_ENVIO, Totales, n, unidades } from "./comun";
import { TarjetasMovil, useEsCelular } from "../../components/movil";

export type VistaDesglose = "dinero" | "unidades";

interface OpcionesFila {
  signo?: string;
  fuerte?: boolean;
  ayuda?: string;
  sinPct?: boolean;
}

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
  const esCelular = useEsCelular();
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
  const fila = (texto: string, valor: (t: Totales) => number | null, { signo = "", fuerte = false, ayuda = "", sinPct = false }: OpcionesFila = {}) => (
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
                {!sinPct && venta > 0 && (
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

  // Pasos de la cascada (vista dinero), los mismos en la tabla y en las tarjetas de celular.
  const cascada: { texto: string; valor: (t: Totales) => number | null; op: OpcionesFila }[] = [
    // Lo que ML informa sin producto: suma a la venta total pero no tiene comisión, envío ni costo.
    ...(n(sinDato?.venta.neto) !== 0
      ? [
          {
            texto: "Venta total Mercado Libre",
            valor: (t: Totales) => (t === total ? n(total.venta.neto) + n(sinDato.venta.neto) : n(t?.venta.neto)),
            op: { fuerte: true, sinPct: true, ayuda: "La cifra de la tarjeta: todo lo que informa ML." },
          },
          {
            texto: "Sin detalle de producto",
            valor: (t: Totales) => (t === total ? n(sinDato.venta.neto) : null),
            op: {
              signo: "−",
              sinPct: true,
              ayuda: "Ventas que ML informa sin Full y que no están en mercadolibre-oms: sin producto ni tipo de envío, no se les puede calcular comisión, envío ni costo.",
            },
          },
        ]
      : []),
    { texto: n(sinDato?.venta.neto) !== 0 ? "Venta con producto" : "Venta", valor: (t) => n(t?.venta.neto), op: { signo: n(sinDato?.venta.neto) !== 0 ? "=" : "", sinPct: true } },
    { texto: "Comisión de ML", valor: (t) => n(t?.comision.neto), op: { signo: "−", ayuda: "Colecta y Flex: comisión real de cada orden. Full: estimada con la publicación." } },
    {
      texto: "Envío",
      valor: (t) => (t?.envio.neto == null ? null : n(t.envio.neto)),
      op: { signo: "−", ayuda: "Estimado con la publicación (Full y Colecta). En Flex y otros no se estima." },
    },
    { texto: "Queda después de ML", valor: queda, op: { signo: "=", fuerte: true } },
    { texto: "Costo de los productos", valor: (t) => (t?.costo?.neto == null ? null : n(t.costo.neto)), op: { signo: "−", ayuda: "Costo promedio de SAP × unidades." } },
    { texto: "Margen", valor: (t) => (t?.margen?.neto == null ? null : n(t.margen.neto)), op: { signo: "=", fuerte: true } },
  ];

  // Filas de la vista unidades.
  const conteos: { texto: string; v: (t: Totales, total?: boolean) => number | null | undefined }[] = [
    ...(n(sinDato?.unidades)
      ? [
          { texto: "Unidades totales Mercado Libre", v: (t: Totales) => (t === total ? n(total.unidades) + n(sinDato.unidades) : t?.unidades) },
          { texto: "Unidades sin detalle de producto", v: (t: Totales) => (t === total ? sinDato.unidades : null) },
        ]
      : []),
    { texto: n(sinDato?.unidades) ? "Unidades con producto" : "Unidades", v: (t: Totales) => t?.unidades },
    { texto: "Productos distintos", v: (t: Totales, total?: boolean) => (total ? resumen.items?.actual ?? t?.items : t?.items) },
    { texto: "Órdenes", v: (t: Totales) => t?.ordenes },
  ];

  /** Monto de un paso con su % de la venta, para la tarjeta de celular. */
  const montoMovil = (r: (typeof cascada)[number], t: Totales) => {
    const v = r.valor(t);
    const venta = n(t?.venta.neto);
    if (v == null) return "—";
    return `${formatoPesos(v)}${!r.op.sinPct && venta > 0 ? ` (${formatoPorcentaje((v / venta) * 100)})` : ""}`;
  };
  const conteoMovil = (r: (typeof conteos)[number], c: (typeof columnas)[number]) => {
    const v = r.v(c.t, c.clave === "total");
    return v == null ? "—" : unidades(v);
  };
  // En celular, una tarjeta por columna (total y cada tipo de envío) con la venta, lo que queda y el margen.
  const tarjetas = columnas.map((c) => {
    const nombre = (
      <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
        {c.color && <Box component="span" sx={{ width: 8, height: 8, borderRadius: "2px", bgcolor: c.color }} />}
        {c.nombre}
      </Box>
    );
    if (vista === "dinero") {
      const principal = (texto: string) => cascada.find((r) => r.texto === texto);
      const fijas = [principal(n(sinDato?.venta.neto) !== 0 ? "Venta con producto" : "Venta"), principal("Queda después de ML"), principal("Margen")].filter(
        (r): r is (typeof cascada)[number] => !!r
      );
      return {
        clave: c.clave,
        titulo: nombre,
        principales: fijas.map((r) => ({ titulo: r.texto === "Queda después de ML" ? "Queda" : r.texto === "Venta con producto" ? "Venta" : r.texto, valor: montoMovil(r, c.t) })),
        detalle: cascada.filter((r) => !fijas.includes(r)).map((r) => ({ titulo: `${r.op.signo ? `${r.op.signo} ` : ""}${r.texto}`, valor: montoMovil(r, c.t) })),
      };
    }
    const ultimas = conteos.slice(-3);
    return {
      clave: c.clave,
      titulo: nombre,
      principales: ultimas.map((r) => ({ titulo: r.texto === "Unidades con producto" ? "Unidades" : r.texto === "Productos distintos" ? "Productos" : r.texto, valor: conteoMovil(r, c) })),
      detalle: conteos.slice(0, -3).map((r) => ({ titulo: r.texto, valor: conteoMovil(r, c) })),
    };
  });
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

      <Box sx={{ px: { xs: 1.5, sm: 2.5 }, pb: 2.5 }}>
        {esCelular ? (
          <TarjetasMovil filas={tarjetas} />
        ) : (
        <TableContainer sx={{ border: `1px solid ${tinta.borde}`, borderRadius: "12px", overflowX: "auto" }}>
          <Table size="small" sx={{ ...tablaSx, minWidth: 560, "& .MuiTableCell-body": { ...tablaSx["& .MuiTableCell-body"], ...cifraSx } }}>
            <Columnas anchos={anchos} />
            {encabezado}
            <TableBody>
              {vista === "dinero"
                ? cascada.map((r) => <React.Fragment key={r.texto}>{fila(r.texto, r.valor, r.op)}</React.Fragment>)
                : conteos.map((r) => (
                    <TableRow key={r.texto}>
                      <TableCell sx={{ fontWeight: 600 }}>{r.texto}</TableCell>
                      {columnas.map((c) => (
                        <TableCell key={c.clave} align="right">
                          {r.v(c.t, c.clave === "total") == null ? "—" : unidades(r.v(c.t, c.clave === "total"))}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </TableContainer>
        )}

        <Typography component="div" sx={{ fontSize: 11.5, color: tinta.tenue, mt: 1.25, lineHeight: 1.5 }}>
          {vista === "dinero" ? (
            <>
              Margen = venta − comisión − envío − costo, sin IVA.
              {cobertura < 0.995 ? ` Solo el ${formatoPorcentaje(cobertura * 100)} de la venta tiene costo en SAP; el resto no entra en el margen.` : ""}
              {n(sinDato?.venta.neto) ? ` Comisión, envío, costo y margen son de la venta con producto: los ${formatoPesos(sinDato.venta.neto)} sin detalle no tienen producto ni tipo de envío.` : ""}
            </>
          ) : (
            <>
              Un producto que vende por Full y por Colecta cuenta una vez en el total. En Full, las órdenes son por producto y día.
              {n(sinDato?.unidades) ? ` Las unidades sin detalle no tienen producto ni tipo de envío.` : ""}
            </>
          )}
        </Typography>
      </Box>
    </Dialog>
  );
}
