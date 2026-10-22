"use client";

import React from "react";
import { Box, Drawer, IconButton, Skeleton, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { IconMail, IconPhone, IconTruck, IconX } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { apiJson } from "@/utils/apiClient";
import { useCargaDatos } from "@/utils/useCargaDatos";
import { BACKEND_URL } from "@/config";
import { ChipMargen, Columnas, TextoCelda, canalPorClave, cifraSx, formatoPesos, tablaSx, tinta } from "../estilo";
import { FiltrosDetalle, consulta, fechaCorta, horaSap } from "./comun";
import ChipMotivo from "./ChipMotivo";

interface Linea {
  linea: number;
  sku: string;
  nombre: string;
  cantidad: number;
  precio: number;
  total: number;
  margen?: number;
  bodega: string;
  vendedor?: string;
  canal?: string | null;
  esFlete: boolean;
}

interface Documento {
  tipo: "venta" | "nc";
  docNum: number;
  folio: string | number | null;
  fecha: string;
  hora: number;
  clienteCodigo: string;
  cliente: string;
  rut?: string;
  telefono?: string;
  correo?: string;
  totalDocumento: number;
  comentario?: string | null;
  motivoCodigo?: string | null;
  motivo?: string;
  razon?: string | null;
  folioReferencia?: string | null;
  tipoDocumentoReferencia?: string | null;
  lineas: Linea[];
}

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontSize: 11, fontWeight: 700, color: tinta.tenue, textTransform: "uppercase", letterSpacing: "0.05em" }}>{etiqueta}</Typography>
      <Box sx={{ fontSize: 13.5, color: tinta.primaria, fontWeight: 600, mt: 0.25, ...cifraSx }}>{children}</Box>
    </Box>
  );
}

/** Un documento (venta o nota de crédito) con sus ítems, en un panel a la
 *  derecha. Al pulsar un ítem se abre su Análisis de producto. */
export default function PanelDocumento({
  documento,
  filtros,
  onClose,
}: {
  documento: { tipo: "venta" | "nc"; docEntry: number } | null;
  /** Solo se usa vendedorEmpresa (el guardia lo pone con alcance propio). */
  filtros: FiltrosDetalle;
  onClose: () => void;
}) {
  const router = useRouter();
  const url = documento
    ? `${BACKEND_URL}/api/detalle/documento?${consulta({ vendedorEmpresa: filtros.vendedorEmpresa }, { tipo: documento.tipo, docEntry: String(documento.docEntry) })}`
    : null;
  const { datos: d, cargando, error } = useCargaDatos<Documento | null>(url, (signal) => apiJson(url!, { signal }), null);

  const lineas = d?.lineas ?? [];
  const neto = lineas.reduce((s, l) => s + (Number(l.total) || 0), 0);
  const margen = lineas.reduce((s, l) => s + (Number(l.margen) || 0), 0);
  const conMargen = lineas.some((l) => l.margen != null);
  const esNota = documento?.tipo === "nc";

  return (
    <Drawer anchor="right" open={!!documento} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", md: 720 } } }} sx={{ zIndex: 1500 }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, px: 3, py: 2.25, borderBottom: `1px solid ${tinta.borde}` }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: tinta.tenue, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {esNota ? "Nota de crédito" : "Documento de venta"}
          </Typography>
          <Typography sx={{ fontSize: 20, fontWeight: 800, color: tinta.primaria, ...cifraSx }}>
            {cargando || !d ? <Skeleton width={180} /> : `Folio ${d.folio ?? "—"}`}
          </Typography>
          {d && (
            <Typography sx={{ fontSize: 12.5, color: tinta.secundaria, ...cifraSx }}>
              N° interno {d.docNum} · {fechaCorta(d.fecha)} {horaSap(d.hora)}
            </Typography>
          )}
        </Box>
        <IconButton aria-label="Cerrar" onClick={onClose}>
          <IconX size={20} />
        </IconButton>
      </Box>

      <Box sx={{ p: 3, overflowY: "auto" }}>
        {error ? (
          <Typography sx={{ color: tinta.tenue, fontSize: 13 }}>No se pudo cargar el documento.</Typography>
        ) : cargando || !d ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={40} />)
        ) : (
          <>
            {esNota && (
              <Box sx={{ border: `1px solid ${tinta.borde}`, borderRadius: "12px", p: 2, mb: 2.5, bgcolor: tinta.fondoSuave }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                  <ChipMotivo codigo={d.motivoCodigo ?? null} texto={d.motivo ?? ""} />
                  {d.folioReferencia && (
                    <Typography sx={{ fontSize: 13, color: tinta.secundaria }}>
                      sobre {d.tipoDocumentoReferencia ?? "documento"} folio <strong>{d.folioReferencia}</strong>
                    </Typography>
                  )}
                </Box>
                {d.razon && <Typography sx={{ fontSize: 13, color: tinta.primaria, mt: 1 }}>Razón: {d.razon}</Typography>}
                {d.comentario && <Typography sx={{ fontSize: 12.5, color: tinta.secundaria, mt: 0.75 }}>{d.comentario}</Typography>}
              </Box>
            )}

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr 1fr" }, gap: 2, mb: 2.5 }}>
              <Dato etiqueta="Cliente">
                <Box sx={{ overflow: "hidden", textOverflow: "ellipsis" }} title={d.cliente}>
                  {d.cliente}
                </Box>
                <Typography sx={{ fontSize: 12, color: tinta.secundaria, fontWeight: 500 }}>RUT {d.rut || d.clienteCodigo}</Typography>
                {(d.telefono || d.correo) && (
                  <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mt: 0.25, fontSize: 12, color: tinta.secundaria, fontWeight: 500 }}>
                    {d.telefono && (
                      <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                        <IconPhone size={13} /> {d.telefono}
                      </Box>
                    )}
                    {d.correo && (
                      <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                        <IconMail size={13} /> {d.correo}
                      </Box>
                    )}
                  </Box>
                )}
              </Dato>
              <Dato etiqueta="Neto de las líneas">{formatoPesos(neto)}</Dato>
              <Dato etiqueta="Total con IVA">{formatoPesos(d.totalDocumento)}</Dato>
            </Box>

            <Typography sx={{ fontSize: 14, fontWeight: 700, color: tinta.primaria, mb: 1 }}>
              {lineas.length} {lineas.length === 1 ? "ítem" : "ítems"}
              {conMargen && (
                <Typography component="span" sx={{ fontSize: 12.5, color: tinta.secundaria, fontWeight: 500, ml: 1 }}>
                  · margen {formatoPesos(margen)}
                </Typography>
              )}
            </Typography>
            <Box sx={{ mx: -3 }}>
              <Table size="small" sx={tablaSx}>
                <Columnas anchos={conMargen ? [44, 12, 15, 17, 12] : [52, 14, 16, 18]} />
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ pl: "24px !important" }}>Producto</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                    <TableCell align="right">Precio neto</TableCell>
                    <TableCell align="right">Total neto</TableCell>
                    {conMargen && <TableCell align="right" sx={{ pr: "24px !important" }}>% Margen</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lineas.map((l) => {
                    const canal = l.canal ? canalPorClave(l.canal) : undefined;
                    return (
                      <TableRow
                        key={l.linea}
                        hover={!l.esFlete}
                        onClick={l.esFlete ? undefined : () => router.push(`/utilities/analisis-producto1.1?itemCode=${encodeURIComponent(l.sku)}`)}
                        sx={{ cursor: l.esFlete ? "default" : "pointer" }}
                        title={l.esFlete ? undefined : "Ver análisis del producto"}
                      >
                        <TableCell sx={{ pl: "24px !important" }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                            {l.esFlete && <IconTruck size={16} color={tinta.tenue} style={{ flexShrink: 0 }} />}
                            <TextoCelda
                              texto={l.nombre}
                              secundario={[`SKU ${l.sku}`, `bodega ${l.bodega}`, canal?.nombre, l.vendedor].filter(Boolean).join(" · ")}
                            />
                          </Box>
                        </TableCell>
                        <TableCell align="right">{Number(l.cantidad).toLocaleString("es-CL", { maximumFractionDigits: 2 })}</TableCell>
                        <TableCell align="right">{formatoPesos(l.precio)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          {formatoPesos(l.total)}
                        </TableCell>
                        {conMargen && (
                          <TableCell align="right" sx={{ pr: "24px !important" }}>
                            {l.total ? <ChipMargen valor={((Number(l.margen) || 0) / l.total) * 100} /> : "—"}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
            <Typography sx={{ fontSize: 11.5, color: tinta.tenue, mt: 1.5 }}>
              Montos netos (sin IVA). Pulsa un ítem para ver su análisis de producto.
            </Typography>
          </>
        )}
      </Box>
    </Drawer>
  );
}
