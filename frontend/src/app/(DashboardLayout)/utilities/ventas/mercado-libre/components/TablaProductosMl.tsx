"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Box, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from "@mui/material";
import { Columnas, TextoCelda, cifraSx, formatoPorcentaje, formatoPesos, tablaSx, tinta } from "../../components/estilo";
import { CeldaStock } from "./StockBodegas";
import PublicacionesMl, { estadoPublicacion } from "./PublicacionesMl";
import { BarraTipos, Monto, ProductoMl, TipoEnvio, cobros, n, unidades } from "./comun";

interface Props {
  filas: ProductoMl[];
  cargando: boolean;
  /** Tipo de envío filtrado ("" = todos): decide qué stock se muestra. */
  tipo: TipoEnvio | "";
  /** Posición del primero (para numerar al paginar). */
  desde?: number;
  filasCargando?: number;
  vacio?: string;
}

/**
 * Productos de Mercado Libre: venta neta (con IVA debajo), reparto por tipo
 * de envío, lo que cobra ML (comisión + envío), lo que queda y el stock que
 * corresponde (Full o bodega 03), que al pulsarlo abre todas las bodegas.
 * El nombre lleva a la ficha del producto.
 */
export default function TablaProductosMl({ filas, cargando, tipo, desde = 0, filasCargando = 8, vacio = "Sin ventas de Mercado Libre en el período." }: Props) {
  const router = useRouter();

  return (
    <TableContainer sx={{ overflowX: { xs: "auto", lg: "hidden" } }}>
      <Table size="small" sx={{ ...tablaSx, minWidth: { xs: 980, lg: 0 } }}>
        <Columnas anchos={[4, 26, 11, 7, 12, 10, 10, 10, 10]} />
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell>Producto</TableCell>
            <TableCell>Publicación</TableCell>
            <TableCell align="right">Unid.</TableCell>
            <TableCell align="right">Venta</TableCell>
            <TableCell>Envío</TableCell>
            <TableCell align="right">Cobra ML</TableCell>
            <TableCell align="right">Queda</TableCell>
            <TableCell align="right">Stock</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {cargando ? (
            Array.from({ length: filasCargando }).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={9}>
                  <Skeleton height={30} />
                </TableCell>
              </TableRow>
            ))
          ) : filas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9}>
                <Typography sx={{ color: tinta.tenue, fontSize: 13, py: 4, textAlign: "center" }}>{vacio}</Typography>
              </TableCell>
            </TableRow>
          ) : (
            filas.map((p, i) => {
              const cobra = cobros(p);
              const pctCobra = n(p.venta.neto) ? (n(cobra.neto) / n(p.venta.neto)) * 100 : null;
              return (
                <TableRow key={p.sku}>
                  <TableCell sx={{ color: `${tinta.tenue} !important`, ...cifraSx }}>{desde + i + 1}</TableCell>
                  <TableCell>
                    <Box
                      role="link"
                      tabIndex={0}
                      onClick={() => router.push(`/utilities/analisis-producto1.1?itemCode=${encodeURIComponent(p.sku)}`)}
                      onKeyDown={(e) => e.key === "Enter" && router.push(`/utilities/analisis-producto1.1?itemCode=${encodeURIComponent(p.sku)}`)}
                      sx={{ cursor: "pointer", "&:hover p:first-of-type": { color: tinta.acento } }}
                    >
                      <TextoCelda
                        texto={p.nombre ?? "Sin nombre en SAP"}
                        secundario={[p.sku, p.rutaCategoria.length ? p.rutaCategoria.map((c) => c.nombre).join(" › ") : "Sin categoría ML"].join(" · ")}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <PublicacionesMl publicaciones={p.publicaciones} />
                  </TableCell>
                  <TableCell align="right">{unidades(p.unidades)}</TableCell>
                  <TableCell align="right">
                    <Monto par={p.venta} />
                    {p.participacion != null && (
                      <Box sx={{ fontSize: 10.5, color: tinta.tenue }}>{formatoPorcentaje(p.participacion * 100)} del total</Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <BarraTipos porTipo={p.porTipo} />
                  </TableCell>
                  <TableCell align="right">
                    {cobra.neto ? (
                      <Tooltip
                        placement="top"
                        arrow
                        title={
                          <>
                            <div>Comisión: {formatoPesos(p.comision.neto)}{p.comisionEstimada ? " (Full estimada por la publicación)" : ""}</div>
                            <div>Envío: {p.envio.neto == null ? "sin dato" : `${formatoPesos(p.envio.neto)} (estimado por la publicación)`}</div>
                            <div>Sin IVA. Con IVA: {formatoPesos(cobra.conIva)}</div>
                          </>
                        }
                      >
                        <Box component="span" sx={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end" }}>
                          <Box component="span" sx={{ fontWeight: 600 }}>
                            {formatoPesos(cobra.neto)}
                            {p.comisionEstimada && <Box component="span" sx={{ color: tinta.tenue }}>*</Box>}
                          </Box>
                          {pctCobra != null && <Box component="span" sx={{ fontSize: 10.5, color: tinta.tenue }}>{formatoPorcentaje(pctCobra)} de la venta</Box>}
                        </Box>
                      </Tooltip>
                    ) : (
                      <Box component="span" sx={{ color: tinta.tenue }}>—</Box>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Monto par={p.queda} />
                  </TableCell>
                  <TableCell align="right">
                    <CeldaStock producto={p} tipo={tipo} />
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

/** Filas del Excel de productos de Mercado Libre (montos como números). */
export const filasExcelProductos = (filas: ProductoMl[]) =>
  filas.map((p, i) => ({
    "#": i + 1,
    SKU: p.sku,
    Producto: p.nombre ?? "",
    "Categoría ML": p.rutaCategoria.map((c) => c.nombre).join(" > "),
    Publicación: p.publicaciones?.[0]?.itemId ?? "",
    "Estado publicación": p.publicaciones?.[0] ? estadoPublicacion(p.publicaciones[0].estado).texto : "",
    "Catálogo": p.publicaciones?.[0] ? (p.publicaciones[0].catalogo ? "Sí" : "No") : "",
    "Enlace": p.publicaciones?.[0]?.url ?? "",
    "Otras publicaciones": (p.publicaciones ?? []).slice(1).map((x) => `${x.itemId} (${estadoPublicacion(x.estado).texto})`).join(", "),
    Unidades: n(p.unidades),
    "Venta sin IVA": Math.round(n(p.venta.neto)),
    "Venta con IVA": Math.round(n(p.venta.conIva)),
    "Participación %": p.participacion != null ? Math.round(p.participacion * 10000) / 100 : "",
    "Unidades Full": n(p.porTipo.full?.unidades),
    "Venta Full sin IVA": Math.round(n(p.porTipo.full?.venta.neto)),
    "Unidades Colecta": n(p.porTipo.colecta?.unidades),
    "Venta Colecta sin IVA": Math.round(n(p.porTipo.colecta?.venta.neto)),
    "Unidades Flex": n(p.porTipo.flex?.unidades),
    "Venta Flex sin IVA": Math.round(n(p.porTipo.flex?.venta.neto)),
    "Comisión sin IVA": Math.round(n(p.comision.neto)),
    "Comisión estimada (Full)": p.comisionEstimada ? "Sí" : "No",
    "Envío sin IVA (estimado)": p.envio.neto == null ? "" : Math.round(n(p.envio.neto)),
    "Queda sin IVA": Math.round(n(p.queda.neto)),
    "Stock Full (ML)": p.stockFull ?? "",
    "Stock Full al": p.stockFullAl ? p.stockFullAl.slice(0, 10) : "",
    "Stock bodega 03": p.stock03 ?? "",
  }));
