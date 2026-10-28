"use client";

import React from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Box, Avatar, Button, TableSortLabel
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { notifySuccess, notifyError } from "@/components/ui/toast/notify";

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
  detalles: DetalleVenta[];
}

export interface StockBodegaItem {
  bodega: string;
  stock: number;
}

export interface ProductoPorCanal {
  sku: string;
  nombre: string;
  imagen?: string;
  cantidadVendida: number;
  margenBruto: number;
  margenPorcentaje: number;
  costoTotal: number;
  stock?: StockBodegaItem[];
  porCanal: ResumenCanalItem[];
}

interface Props {
  data: ProductoPorCanal[];
  canales: string[];
  emptyMessage?: string;
  onSortChange: (campo: OrderBy) => void;
  ordenActual: Order;
  ordenPorActual: OrderBy;
  onOpenDetalle: (titulo: string, detalles: DetalleVenta[]) => void;
  onOpenStock: (titulo: string, stock: StockBodegaItem[]) => void;
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

const getStockTotalProducto = (stock?: StockBodegaItem[]) =>
  (stock || [])
    .filter((item) => item.bodega === "01" || item.bodega === "03")
    .reduce((sum, item) => sum + (item.stock || 0), 0);

const formatChannelLabel = (channel: string) =>
  channel?.toLowerCase() === "vitex" ? "VTEX" : channel;

/** Semáforo por producto: verde el canal que más vende, amarillo el segundo y
 *  rojo el que menos vende entre los que vendieron. Los empates repiten color;
 *  un canal sin venta del producto no se pinta. */
export type ColorSemaforo = "verde" | "amarillo" | "rojo";

export const SEMAFORO: Record<ColorSemaforo, { fondo: string; texto: string; etiqueta: string }> = {
  verde: { fondo: "#dcfce7", texto: "#166534", etiqueta: "Canal que más vende" },
  amarillo: { fondo: "#fef3c7", texto: "#92400e", etiqueta: "Segundo canal" },
  rojo: { fondo: "#fee2e2", texto: "#991b1b", etiqueta: "Canal que menos vende" },
};

export const semaforoPorCanal = (porCanal: ResumenCanalItem[] = [], canales: string[]) => {
  const cantidades = canales
    .map((canal) => ({ canal, cantidad: Number(porCanal.find((c) => c.canal === canal)?.cantidadVendida) || 0 }))
    .filter((c) => c.cantidad > 0);
  // Valores distintos de mayor a menor: así un empate comparte el color.
  const valores = Array.from(new Set(cantidades.map((c) => c.cantidad))).sort((a, b) => b - a);
  const colores = new Map<string, ColorSemaforo>();
  for (const { canal, cantidad } of cantidades) {
    if (cantidad === valores[0]) colores.set(canal, "verde");
    else if (cantidad === valores[valores.length - 1]) colores.set(canal, "rojo");
    else if (cantidad === valores[1]) colores.set(canal, "amarillo");
  }
  return colores;
};

const semaforoSx = (color?: ColorSemaforo) =>
  color
    ? {
        backgroundColor: SEMAFORO[color].fondo,
        color: SEMAFORO[color].texto,
        borderRadius: 1,
        px: 0.75,
        py: 0.25,
        display: "inline-flex",
        alignItems: "center",
        fontWeight: 700,
      }
    : undefined;

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
  emptyMessage = "No hay datos",
  onSortChange,
  ordenActual,
  ordenPorActual,
  onOpenDetalle,
  onOpenStock,
}) => {
  const safe = Array.isArray(data) ? data : [];

  const handleCopySku = async (sku: string) => {
    const ok = await copyToClipboard(sku);
    if (ok) {
      notifySuccess(`SKU ${sku} copiado`);
    } else {
      notifyError("No se pudo copiar el SKU. Prueba manualmente con Ctrl/Cmd + C.");
    }
  };

  return (
    <TableContainer
      component={Paper}
      sx={{
        borderRadius: 2,
        maxHeight: "calc(100vh - 240px)",
        overflow: "auto",
      }}
    >
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

            <StyledTableCell>Stock</StyledTableCell>

            {canales.map((c) => (
              <StyledTableCell key={`head-${c}`}>{formatChannelLabel(c)}</StyledTableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {safe.map((row) => (
            <StyledTableRow key={row.sku}>
              {(() => {
                const semaforo = semaforoPorCanal(row.porCanal, canales);
                return (
                  <>
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
                <Typography fontWeight={600}>{formatNumber(row.cantidadVendida)}</Typography>
              </StyledTableCell>

              <StyledTableCell>
                {(row.stock || []).length > 0 ? (
                  <Button
                    variant="text"
                    onClick={() => onOpenStock(`${row.nombre} · Stock por bodega`, row.stock || [])}
                    sx={{ p: 0, minWidth: 0, textAlign: "left" }}
                  >
                    <Typography sx={{ textDecoration: "underline" }}>
                      {formatNumber(getStockTotalProducto(row.stock))}
                    </Typography>
                  </Button>
                ) : (
                  <Typography>{formatNumber(getStockTotalProducto(row.stock))}</Typography>
                )}
              </StyledTableCell>

              {canales.map((canalNombre) => {
                const canal = row.porCanal?.find((c) => c.canal === canalNombre);
                const cantidad = canal?.cantidadVendida || 0;
                const tieneDetalle = (canal?.detalles || []).length > 0;
                const color = semaforo.get(canalNombre);

                return (
                  <StyledTableCell key={`${row.sku}-${canalNombre}`}>
                    {tieneDetalle ? (
                      <Button
                        variant="text"
                        onClick={() => onOpenDetalle(`${row.nombre} · ${canalNombre}`, canal!.detalles)}
                        sx={{
                          p: 0,
                          minWidth: 0,
                          textAlign: "left",
                          ...semaforoSx(color),
                        }}
                        title={color ? SEMAFORO[color].etiqueta : undefined}
                      >
                        <Box textAlign="left">
                          <Typography sx={{ textDecoration: "underline", fontWeight: "inherit" }}>{formatNumber(cantidad)}</Typography>
                        </Box>
                      </Button>
                    ) : (
                      <Box sx={semaforoSx(color)} title={color ? SEMAFORO[color].etiqueta : undefined}>
                        <Typography sx={{ fontWeight: "inherit" }}>{formatNumber(cantidad)}</Typography>
                      </Box>
                    )}
                  </StyledTableCell>
                );
              })}
                  </>
                );
              })()}
            </StyledTableRow>
          ))}

          {safe.length === 0 && (
            <StyledTableRow>
              <StyledTableCell colSpan={3 + canales.length} align="center">
                <Typography variant="body2" color="text.secondary">
                  {emptyMessage}
                </Typography>
              </StyledTableCell>
            </StyledTableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default VentasPorCanalTable;
