"use client";

import React from "react";
import { Box, Grid, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { useApiDatos } from "@/utils/useCargaDatos";
import { BACKEND_URL } from "@/config";
import { Columnas, Panel, TextoCelda, estado, formatoMonto, formatoPesos, tablaSx, tinta } from "@/app/(DashboardLayout)/utilities/ventas/components/estilo";

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
            <TableContainer sx={{ mx: -2.5, width: "auto", overflowX: "hidden" }}>
              <Table size="small" sx={tablaSx}>
                <Columnas anchos={[56, 20, 24]} />
                <TableHead>
                  <TableRow>
                    <TableCell>Proveedor</TableCell>
                    <TableCell align="right">OC</TableCell>
                    <TableCell align="right">Días de entrega</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {provs.map((p) => (
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
          ) : (
            <TableContainer sx={{ maxHeight: 520, mx: -2.5, width: "auto", overflowX: "hidden" }}>
              <Table size="small" stickyHeader sx={tablaSx}>
                <Columnas anchos={[15, 15, 15, 15, 16, 24]} />
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>OC</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                    <TableCell align="right">Precio unit.</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell>Comprador · estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ocs.map((o, i) => (
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
