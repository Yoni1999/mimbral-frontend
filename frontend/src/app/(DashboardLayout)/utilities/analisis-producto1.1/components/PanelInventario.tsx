"use client";

import React from "react";
import { Box, Grid, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { IconAlertTriangle, IconCalendarTime, IconCash, IconCircleCheck, IconPackages, IconTruckDelivery } from "@tabler/icons-react";
import { useApiDatos } from "@/utils/useCargaDatos";
import { BACKEND_URL } from "@/config";
import MetricCard from "@/app/(DashboardLayout)/utilities/ventas/components/MetricCard";
import { BarraParticipacion, Columnas, Panel, estado, formatoPesos, tablaSx, tinta } from "@/app/(DashboardLayout)/utilities/ventas/components/estilo";

const n = (v: unknown) => Number(v) || 0;
const unidades = (v: number, decimales = 0) => v.toLocaleString("es-CL", { maximumFractionDigits: decimales });
const fecha = (iso?: string | null) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : "—");

/** Días desde la última venta y cómo se lee: reciente, en alerta o detenido. */
function estadoUltimaVenta(iso?: string | null) {
  if (!iso) return { texto: "Sin ventas registradas", tono: estado.neutro, Icono: IconAlertTriangle };
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const dias = Math.floor((Date.now() - new Date(y, m - 1, d).getTime()) / 86_400_000);
  if (dias <= 7) return { texto: dias <= 1 ? "Venta reciente" : `Hace ${dias} días`, tono: estado.bien, Icono: IconCircleCheck };
  if (dias <= 20) return { texto: `Sin venta hace ${dias} días`, tono: { color: "#b54708", fondo: "#fffaeb" }, Icono: IconAlertTriangle };
  return { texto: `${dias} días sin vender`, tono: estado.mal, Icono: IconAlertTriangle };
}

/** Hora de SAP (941 → 09:41). */
const hora = (h?: number | null) => {
  if (h == null) return "";
  const s = String(h).padStart(4, "0");
  return `${s.slice(0, 2)}:${s.slice(2)}`;
};

/** Stock del producto: total, cobertura, tránsito, costo de compra y última
 *  venta; y el detalle por bodega. No depende del período. */
export default function PanelInventario({ sku }: { sku: string }) {
  const q = `itemCode=${encodeURIComponent(sku)}`;
  const resumen = useApiDatos<any>(`${BACKEND_URL}/api/resumen-producto?${q}`, null);
  const bodegas = useApiDatos<Record<string, { Stock?: number; NC?: number; OC?: number }> | null>(`${BACKEND_URL}/api/stock-por-almacen?${q}`, null);

  const r = resumen.datos;
  const costo = n(r?.costos?.UltimoCosto);
  const costoAnterior = n(r?.costos?.CostoAnterior);
  const ultima = estadoUltimaVenta(r?.ultimaVenta?.FechaUltimaVenta);

  const tarjetas = [
    // Stock de venta: bodegas 01, 03, 05, 07, 08 y 13 (el back deja fuera 04,
    // 10 y 12); la tabla de abajo muestra todas.
    { title: "Stock de venta", value: unidades(n(r?.stockTotal?.StockTotal)), subtitle: "Bodegas 01, 03, 05, 07, 08 y 13", icon: <IconPackages /> },
    {
      title: "Cobertura",
      value: `${unidades(n(r?.cobertura?.CoberturaEnDias), 1)} días`,
      subtitle: `Vende ${unidades(n(r?.cobertura?.PromedioDiario), 1)} por día (últimas 2 semanas)`,
      icon: <IconCalendarTime />,
    },
    { title: "En tránsito", value: unidades(n(r?.stockTransito)), subtitle: "Unidades en órdenes de compra abiertas", icon: <IconTruckDelivery /> },
    {
      title: "Último costo de compra",
      value: formatoPesos(costo),
      subtitle: `OC del ${fecha(r?.costos?.FechaUltimaOC)}${r?.costos?.MonedaUltima && r.costos.MonedaUltima !== "CLP" ? ` · ${r.costos.MonedaUltima}` : ""}`,
      percentageChange: costoAnterior ? ((costo - costoAnterior) / costoAnterior) * 100 : undefined,
      masEsMejor: false,
      icon: <IconCash />,
    },
  ];

  const filas = Object.entries(bodegas.datos ?? {})
    .map(([codigo, b]) => ({ codigo, stock: n(b.Stock), comprometido: n(b.NC), oc: n(b.OC), disponible: n(b.Stock) - n(b.NC) }))
    .filter((b) => b.stock || b.comprometido || b.oc)
    .sort((a, b) => b.stock - a.stock);
  const maxStock = Math.max(0, ...filas.map((b) => b.stock));
  const total = filas.reduce(
    (t, b) => ({ stock: t.stock + b.stock, comprometido: t.comprometido + b.comprometido, oc: t.oc + b.oc, disponible: t.disponible + b.disponible }),
    { stock: 0, comprometido: 0, oc: 0, disponible: 0 }
  );

  return (
    <>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {tarjetas.map((t) => (
          <Grid item xs={12} sm={6} lg={2.4} key={t.title}>
            <MetricCard {...t} cargando={resumen.cargando} />
          </Grid>
        ))}
        <Grid item xs={12} sm={6} lg={2.4}>
          <MetricCard
            title="Última venta"
            value={resumen.cargando ? "" : `${fecha(r?.ultimaVenta?.FechaUltimaVenta)} ${hora(r?.ultimaVenta?.HoraUltimaVenta)}`}
            subtitle={ultima.texto}
            icon={<ultima.Icono />}
            cargando={resumen.cargando}
          />
        </Grid>
      </Grid>

      <Panel titulo="Stock por bodega" descripcion="Disponible = stock − comprometido en notas de venta.">
        {bodegas.cargando ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={44} />)
        ) : filas.length === 0 ? (
          <Typography sx={{ color: tinta.tenue, fontSize: 13, py: 4, textAlign: "center" }}>Sin stock en ninguna bodega.</Typography>
        ) : (
          <TableContainer sx={{ mx: -2.5, width: "auto", overflowX: "hidden" }}>
            <Table size="small" sx={tablaSx}>
              <Columnas anchos={[22, 26, 17, 17, 18]} />
              <TableHead>
                <TableRow>
                  <TableCell>Bodega</TableCell>
                  <TableCell align="right">Stock</TableCell>
                  <TableCell align="right">Comprometido</TableCell>
                  <TableCell align="right">En OC</TableCell>
                  <TableCell align="right">Disponible</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filas.map((b) => (
                  <TableRow key={b.codigo}>
                    <TableCell sx={{ fontWeight: 600 }}>Bodega {b.codigo}</TableCell>
                    <TableCell align="right">
                      {unidades(b.stock)}
                      <Box sx={{ mt: 0.5 }}>
                        <BarraParticipacion valor={b.stock} maximo={maxStock} />
                      </Box>
                    </TableCell>
                    <TableCell align="right">{unidades(b.comprometido)}</TableCell>
                    <TableCell align="right">{unidades(b.oc)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: b.disponible < 0 ? `${estado.mal.color} !important` : undefined }}>
                      {unidades(b.disponible)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{unidades(total.stock)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{unidades(total.comprometido)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{unidades(total.oc)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{unidades(total.disponible)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Panel>
    </>
  );
}
