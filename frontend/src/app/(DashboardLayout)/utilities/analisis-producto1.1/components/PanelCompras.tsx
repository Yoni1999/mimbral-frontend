"use client";

import React from "react";
import { Box, Grid, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { useApiDatos } from "@/utils/useCargaDatos";
import { BACKEND_URL } from "@/config";
import { Columnas, Panel, TextoCelda, estado, formatoMonto, formatoPesos, tablaSx, tinta } from "@/app/(DashboardLayout)/utilities/ventas/components/estilo";
import { CeldaOrden, useOrdenTabla } from "../../ventas/components/ordenTabla";
import { OrdenMovil, TarjetasMovil, useEsCelular } from "@/app/(DashboardLayout)/utilities/ventas/components/movil";

const fecha = (iso?: string | null) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "—");
const unidades = (v: number) => v.toLocaleString("es-CL", { maximumFractionDigits: 2 });

function Estado({ abierta, cancelada }: { abierta: boolean; cancelada: boolean }) {
  const tono = cancelada ? estado.mal : abierta ? { color: "#175cd3", fondo: "#eff8ff" } : estado.neutro;
  return (
    <Box component="span" sx={{ px: 0.75, py: 0.25, borderRadius: 999, bgcolor: tono.fondo, color: tono.color, fontSize: 11.5, fontWeight: 700 }}>
      {cancelada ? "Cancelada" : abierta ? "Abierta" : "Cerrada"}
    </Box>
  );
}

/** Abastecimiento del producto: con qué proveedores se compra y cuánto
 *  tardan en entregar, y las órdenes de compra de los últimos 12 meses. */
export default function PanelCompras({ sku }: { sku: string }) {
  const q = `itemCode=${encodeURIComponent(sku)}`;
  const proveedores = useApiDatos<any[]>(`${BACKEND_URL}/api/tiempo-entrega-proveedores?${q}`, []);
  const ordenes = useApiDatos<any[]>(`${BACKEND_URL}/api/historico-ordenes-compra?${q}`, []);

  const provs = (Array.isArray(proveedores.datos) ? proveedores.datos : [])
    .map((p) => ({ codigo: p.Proveedor_Codigo, nombre: p.Proveedor_Nombre, ordenes: Number(p.Total_Ordenes_Validas) || 0, dias: Number(p.Promedio_Dias_Entrega) || 0 }))
    .sort((a, b) => b.ordenes - a.ordenes);
  const promedioDias = provs.length ? provs.reduce((s, p) => s + p.dias, 0) / provs.length : 0;

  const ocs = (Array.isArray(ordenes.datos) ? ordenes.datos : []).sort((a, b) => String(b.FechaOrden).localeCompare(String(a.FechaOrden)));
  const ordenProvs = useOrdenTabla(provs, { proveedor: (p) => p.nombre, ordenes: (p) => p.ordenes, dias: (p) => p.dias });
  const ordenOcs = useOrdenTabla(ocs, {
    fecha: (o) => String(o.FechaOrden ?? ""),
    oc: (o) => Number(o.NumeroOrdenCompra) || o.NumeroOrdenCompra,
    cantidad: (o) => Number(o.CantidadComprada) || 0,
    precio: (o) => Number(o.PrecioUnitario),
    total: (o) => Number(o.TotalLinea),
    comprador: (o) => o.Vendedor,
  });
  const esCelular = useEsCelular();
  const comprado = ocs.filter((o) => o.EstaCancelado !== "Y").reduce((s, o) => s + (Number(o.CantidadComprada) || 0), 0);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} lg={5}>
        <Panel
          titulo="Proveedores y tiempos de entrega"
          descripcion={proveedores.cargando ? "Cargando…" : provs.length ? `Promedio entre proveedores: ${promedioDias.toLocaleString("es-CL", { maximumFractionDigits: 1 })} días` : undefined}
        >
          {proveedores.cargando ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={44} />)
          ) : provs.length === 0 ? (
            <Typography sx={{ color: tinta.tenue, fontSize: 13, py: 4, textAlign: "center" }}>Sin órdenes de compra con entrega registrada.</Typography>
          ) : (
            <TableContainer sx={{ mx: -2.5, width: "auto", overflowX: { xs: "auto", sm: "hidden" } }}>
              <Table size="small" sx={tablaSx}>
                <Columnas anchos={[56, 20, 24]} />
                <TableHead>
                  <TableRow>
                    <CeldaOrden clave="proveedor" orden={ordenProvs.orden} onOrdenar={ordenProvs.ordenarPor}>Proveedor</CeldaOrden>
                    <CeldaOrden clave="ordenes" orden={ordenProvs.orden} onOrdenar={ordenProvs.ordenarPor} align="right">OC</CeldaOrden>
                    <CeldaOrden clave="dias" orden={ordenProvs.orden} onOrdenar={ordenProvs.ordenarPor} align="right">Días de entrega</CeldaOrden>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ordenProvs.ordenadas.map((p) => (
                    <TableRow key={p.codigo}>
                      <TableCell>
                        <TextoCelda texto={p.nombre} secundario={p.codigo} />
                      </TableCell>
                      <TableCell align="right">{p.ordenes}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {p.dias.toLocaleString("es-CL", { maximumFractionDigits: 1 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Panel>
      </Grid>
      <Grid item xs={12} lg={7}>
        <Panel
          titulo="Órdenes de compra · últimos 12 meses"
          descripcion={ordenes.cargando ? "Cargando…" : `${ocs.length} líneas · ${unidades(comprado)} unidades compradas`}
        >
          {ordenes.cargando ? (
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={44} />)
          ) : ocs.length === 0 ? (
            <Typography sx={{ color: tinta.tenue, fontSize: 13, py: 4, textAlign: "center" }}>Sin órdenes de compra en los últimos 12 meses.</Typography>
          ) : esCelular ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
              <OrdenMovil
                opciones={[
                  { clave: "fecha", titulo: "Fecha" },
                  { clave: "total", titulo: "Total" },
                  { clave: "cantidad", titulo: "Cantidad" },
                  { clave: "precio", titulo: "Precio unit." },
                  { clave: "oc", titulo: "OC" },
                  { clave: "comprador", titulo: "Comprador" },
                ]}
                clave={ordenOcs.orden?.clave ?? ""}
                direccion={ordenOcs.orden?.direccion ?? "desc"}
                onCambiar={(clave, direccion) => ordenOcs.setOrden({ clave, direccion })}
              />
              <TarjetasMovil
                filas={ordenOcs.ordenadas.map((o, i) => ({
                  clave: `${o.NumeroOrdenCompra}-${i}`,
                  titulo: `OC ${o.NumeroOrdenCompra}`,
                  meta: `${fecha(o.FechaOrden)} · ${o.Vendedor || "—"}`,
                  principales: [
                    { titulo: "Cantidad", valor: unidades(Number(o.CantidadComprada) || 0), unidad: "un." },
                    { titulo: "Total", valor: formatoMonto(o.TotalLinea) },
                    { titulo: "Estado", valor: <Estado abierta={o.EstadoDocumento === "O"} cancelada={o.EstaCancelado === "Y"} /> },
                  ],
                  detalle: [
                    { titulo: "Precio unit.", valor: formatoPesos(o.PrecioUnitario) },
                    { titulo: "Comprador", valor: o.Vendedor || "—" },
                  ],
                }))}
              />
            </Box>
          ) : (
            <TableContainer sx={{ maxHeight: 520, mx: -2.5, width: "auto", overflowX: "hidden" }}>
              <Table size="small" stickyHeader sx={tablaSx}>
                <Columnas anchos={[15, 15, 15, 15, 16, 24]} />
                <TableHead>
                  <TableRow>
                    <CeldaOrden clave="fecha" orden={ordenOcs.orden} onOrdenar={ordenOcs.ordenarPor}>Fecha</CeldaOrden>
                    <CeldaOrden clave="oc" orden={ordenOcs.orden} onOrdenar={ordenOcs.ordenarPor}>OC</CeldaOrden>
                    <CeldaOrden clave="cantidad" orden={ordenOcs.orden} onOrdenar={ordenOcs.ordenarPor} align="right">Cantidad</CeldaOrden>
                    <CeldaOrden clave="precio" orden={ordenOcs.orden} onOrdenar={ordenOcs.ordenarPor} align="right">Precio unit.</CeldaOrden>
                    <CeldaOrden clave="total" orden={ordenOcs.orden} onOrdenar={ordenOcs.ordenarPor} align="right">Total</CeldaOrden>
                    <CeldaOrden clave="comprador" orden={ordenOcs.orden} onOrdenar={ordenOcs.ordenarPor}>Comprador · estado</CeldaOrden>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ordenOcs.ordenadas.map((o, i) => (
                    <TableRow key={`${o.NumeroOrdenCompra}-${i}`}>
                      <TableCell>{fecha(o.FechaOrden)}</TableCell>
                      <TableCell>{o.NumeroOrdenCompra}</TableCell>
                      <TableCell align="right">{unidades(Number(o.CantidadComprada) || 0)}</TableCell>
                      <TableCell align="right">{formatoPesos(o.PrecioUnitario)}</TableCell>
                      <TableCell align="right">{formatoMonto(o.TotalLinea)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
                          <Estado abierta={o.EstadoDocumento === "O"} cancelada={o.EstaCancelado === "Y"} />
                          <Typography noWrap sx={{ fontSize: 12, color: tinta.secundaria }} title={o.Vendedor}>
                            {o.Vendedor || "—"}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Panel>
      </Grid>
    </Grid>
  );
}
