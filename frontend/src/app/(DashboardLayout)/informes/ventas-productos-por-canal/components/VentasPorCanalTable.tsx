"use client";

import React, { useState } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Box, Avatar, Button, TableSortLabel, Snackbar, Alert
} from "@mui/material";
import { styled } from "@mui/material/styles";

export type Order = "asc" | "desc";
export type OrderBy = "cantidadVendida" | "margenPorcentaje" | "nombre";

export interface DetalleVenta {
  folioNum: string;
  fecha: string;
  vendedorCodigo: number;
  vendedor: string;
  cantidad: number;
  venta: number;
  margenBrutoLinea: number;
  costoLinea: number;
}

export interface ResumenCanalItem {
  canal: string;
  cantidadVendida: number;
  margenBruto: number;
  margenPorcentaje: number;
  costoTotal: number;
  stock?: number; // si viene
  detalles: DetalleVenta[];
}

export interface ProductoPorCanal {
  sku: string;
  nombre: string;
  imagen?: string;
  cantidadVendida: number;
  margenBruto: number;
  margenPorcentaje: number;
  costoTotal: number;
  porCanal: ResumenCanalItem[];
}

interface Props {
  data: ProductoPorCanal[];
  canales: string[];
  onSortChange: (campo: OrderBy) => void;
  ordenActual: Order;
  ordenPorActual: OrderBy;
  onOpenDetalle: (titulo: string, detalles: DetalleVenta[]) => void;
}

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  "&.MuiTableCell-head": {
    backgroundColor: theme.palette.primary.dark,
    color: theme.palette.common.white,
    fontWeight: "bold",
  },
  "&.MuiTableCell-body": {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
}));

const formatNumber = (n?: number) =>
  typeof n === "number" ? n.toLocaleString("es-CL") : "-";

/* ===== Copiado robusto al portapapeles (mismo patrón del informe original) ===== */
/* Basado en ProductosVendidos.tsx: usa Clipboard API y fallback con textarea:contentReference[oaicite:1]{index=1} */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (typeof navigator !== "undefined" && (navigator as any).clipboard && window.isSecureContext) {
      await (navigator as any).clipboard.writeText(text);
      return true;
    }
  } catch (_e) { /* fallback */ }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, ta.value.length);
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch (_e) {
    return false;
  }
};

const VentasPorCanalTable: React.FC<Props> = ({
  data,
  canales,
  onSortChange,
  ordenActual,
  ordenPorActual,
  onOpenDetalle,
}) => {
  const safe = Array.isArray(data) ? data : [];

  // Snackbars para copiado de SKU (mismo UX que informe original):contentReference[oaicite:2]{index=2}
  const [copiedSku, setCopiedSku] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);
  const handleCopySku = async (sku: string) => {
    const ok = await copyToClipboard(sku);
    if (ok) {
      setCopyError(null);
      setCopiedSku(sku);
    } else {
      setCopiedSku(null);
      setCopyError("No se pudo copiar el SKU. Prueba manualmente con Ctrl/Cmd + C.");
    }
  };

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <StyledTableCell>Producto (SKU)</StyledTableCell>

            <StyledTableCell sortDirection={ordenPorActual === "cantidadVendida" ? ordenActual : false}>
              <TableSortLabel
                active={ordenPorActual === "cantidadVendida"}
                direction={ordenPorActual === "cantidadVendida" ? ordenActual : "asc"}
                onClick={() => onSortChange("cantidadVendida")}
              >
                Cantidad Total
              </TableSortLabel>
            </StyledTableCell>

            {/* OJO: Se QUITÓ la columna de Margen Bruto/% solicitada */}

            {canales.map((c) => (
              <StyledTableCell key={`head-${c}`}>{c}</StyledTableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {safe.map((row) => (
            <StyledTableRow key={row.sku}>
              <StyledTableCell>
                <Box
                  onClick={() => handleCopySku(row.sku)}
                  sx={{
                    cursor: "pointer",
                    userSelect: "none",
                    "&:hover .skuCopy": { textDecoration: "underline" },
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                  title="Copiar SKU"
                  role="button"
                >
                  <Avatar
                    src={
                      row.imagen?.startsWith("http")
                        ? row.imagen
                        : "https://res.cloudinary.com/dhzahos7u/image/upload/v1748960388/producto_sin_imagen_vqaps4.jpg"
                    }
                    alt={row.nombre}
                    sx={{ width: 40, height: 40 }}
                    variant="rounded"
                  />
                  <Box>
                    <Typography fontWeight={600}>{row.nombre}</Typography>
                    <Typography className="skuCopy" variant="caption" color="text.secondary">
                      {row.sku}
                    </Typography>
                  </Box>
                </Box>
              </StyledTableCell>

              <StyledTableCell>
                {/* valor + % margen al lado, en pequeño */}
                <Box display="flex" alignItems="baseline" gap={1}>
                  <Typography fontWeight={600}>{formatNumber(row.cantidadVendida)}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(row.margenPorcentaje ?? 0).toFixed(2)}%
                  </Typography>
                </Box>
              </StyledTableCell>

              {canales.map((canalNombre) => {
                const canal = row.porCanal?.find((c) => c.canal === canalNombre);
                const cantidad = canal?.cantidadVendida || 0;
                const tieneDetalle = (canal?.detalles || []).length > 0;

                return (
                  <StyledTableCell key={`${row.sku}-${canalNombre}`}>
                    {tieneDetalle ? (
                      <Button
                        variant="text"
                        onClick={() => onOpenDetalle(`${row.nombre} · ${canalNombre}`, canal!.detalles)}
                        sx={{ p: 0, minWidth: 0, textAlign: "left" }}
                      >
                        <Box textAlign="left">
                          <Typography sx={{ textDecoration: "underline" }}>
                            {formatNumber(cantidad)}
                          </Typography>
                          {typeof canal?.stock === "number" && (
                            <Typography variant="caption" color="text.secondary">
                              stock: {formatNumber(canal.stock)}
                            </Typography>
                          )}
                        </Box>
                      </Button>
                    ) : (
                      <Box>
                        <Typography>{formatNumber(cantidad)}</Typography>
                        {typeof canal?.stock === "number" && (
                          <Typography variant="caption" color="text.secondary">
                            stock: {formatNumber(canal.stock)}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </StyledTableCell>
                );
              })}
            </StyledTableRow>
          ))}

          {safe.length === 0 && (
            <StyledTableRow>
              <StyledTableCell colSpan={2 + canales.length} align="center">
                <Typography variant="body2" color="text.secondary">
                  No hay datos
                </Typography>
              </StyledTableCell>
            </StyledTableRow>
          )}
        </TableBody>
      </Table>

      {/* Snackbars de copiado (mismo feedback del informe original):contentReference[oaicite:3]{index=3} */}
      <Snackbar
        open={Boolean(copiedSku)}
        autoHideDuration={1500}
        onClose={() => setCopiedSku(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setCopiedSku(null)} severity="success" variant="filled">
          SKU {copiedSku} copiado
        </Alert>
      </Snackbar>

      <Snackbar
        open={Boolean(copyError)}
        autoHideDuration={2500}
        onClose={() => setCopyError(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setCopyError(null)} severity="error" variant="filled">
          {copyError}
        </Alert>
      </Snackbar>
    </TableContainer>
  );
};

export default VentasPorCanalTable;
