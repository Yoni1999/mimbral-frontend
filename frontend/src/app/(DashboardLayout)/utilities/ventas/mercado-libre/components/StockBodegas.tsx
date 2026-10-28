"use client";

import React from "react";
import { Box, Dialog, IconButton, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from "@mui/material";
import { IconX } from "@tabler/icons-react";
import { useApiDatos } from "@/utils/useCargaDatos";
import { BACKEND_URL } from "@/config";
import { BarraParticipacion, Columnas, cifraSx, estado, tablaSx, tinta } from "../../components/estilo";
import { ProductoMl, TipoEnvio, fechaCorta, n, tipoEnvio, unidades } from "./comun";

/**
 * Stock que importa según el tipo de envío: en Full, el de la bodega de ML
 * (con la fecha en que ML lo informó); en Colecta y Flex, el de la bodega 03.
 * Al pulsarlo abre el stock del producto en todas las bodegas de SAP.
 */
export function CeldaStock({ producto, tipo }: { producto: ProductoMl; tipo: TipoEnvio | "" }) {
  const [abierto, setAbierto] = React.useState(false);
  const verFull = tipo === "full" || tipo === "";
  const ver03 = tipo !== "full";

  const cifra = (valor: number | null, etiqueta: string, ayuda: string) => (
    <Tooltip title={ayuda} placement="top" arrow>
      <Box component="span" sx={{ display: "flex", justifyContent: "flex-end", alignItems: "baseline", gap: 0.5, whiteSpace: "nowrap" }}>
        <Box component="span" sx={{ fontSize: 10.5, color: tinta.tenue }}>{etiqueta}</Box>
        <Box component="span" sx={{ fontWeight: 700, color: valor == null ? tinta.tenue : n(valor) <= 0 ? estado.mal.color : tinta.primaria }}>
          {valor == null ? "—" : unidades(valor)}
        </Box>
      </Box>
    </Tooltip>
  );

  return (
    <>
      <Box
        component="button"
        type="button"
        onClick={() => setAbierto(true)}
        aria-label={`Ver stock por bodega de ${producto.sku}`}
        sx={{
          width: "100%",
          border: `1px solid transparent`,
          bgcolor: "transparent",
          borderRadius: "8px",
          px: 0.75,
          py: 0.25,
          fontFamily: "inherit",
          fontSize: 12.5,
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          gap: 0.25,
          ...cifraSx,
          "&:hover": { borderColor: tinta.acento, bgcolor: "#eff4ff" },
          "&:focus-visible": { outline: `2px solid ${tinta.acento}` },
        }}
      >
        {verFull &&
          cifra(
            producto.stockFull,
            "Full",
            producto.stockFullAl ? `Stock en la bodega Full de ML, informado el ${fechaCorta(producto.stockFullAl)}` : "Sin stock Full informado por ML"
          )}
        {ver03 && cifra(producto.stock03, "B03", "Stock en la bodega 03 (Colecta), según SAP")}
      </Box>
      {abierto && <DialogoStock producto={producto} tipo={tipo} onCerrar={() => setAbierto(false)} />}
    </>
  );
}

function DialogoStock({ producto, tipo, onCerrar }: { producto: ProductoMl; tipo: TipoEnvio | ""; onCerrar: () => void }) {
  const bodegas = useApiDatos<Record<string, { Stock?: number; NC?: number; OC?: number }> | null>(
    `${BACKEND_URL}/api/stock-por-almacen?itemCode=${encodeURIComponent(producto.sku)}`,
    null
  );
  const filas = Object.entries(bodegas.datos ?? {})
    .map(([codigo, b]) => ({ codigo, stock: n(b.Stock), comprometido: n(b.NC), oc: n(b.OC), disponible: n(b.Stock) - n(b.NC) }))
    .filter((b) => b.stock || b.comprometido || b.oc)
    .sort((a, b) => (a.codigo === "03" ? -1 : b.codigo === "03" ? 1 : b.stock - a.stock));
  const maximo = Math.max(0, ...filas.map((b) => b.stock));

  const caja = (titulo: string, valor: number | null, pie: string, color: string) => (
    <Box sx={{ flex: 1, minWidth: 150, border: `1px solid ${tinta.borde}`, borderRadius: "12px", p: 1.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, fontSize: 12.5, fontWeight: 600, color: tinta.secundaria }}>
        <Box sx={{ width: 8, height: 8, borderRadius: "2px", bgcolor: color }} />
        {titulo}
      </Box>
      <Typography sx={{ fontSize: 22, fontWeight: 750, color: tinta.primaria, ...cifraSx }}>{valor == null ? "—" : unidades(valor)}</Typography>
      <Typography sx={{ fontSize: 11.5, color: tinta.tenue }}>{pie}</Typography>
    </Box>
  );

  return (
    <Dialog open onClose={onCerrar} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: "16px" } }}>
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, px: 2.5, pt: 2.25, pb: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 17, fontWeight: 750, color: tinta.primaria }}>Stock por bodega</Typography>
          <Typography noWrap sx={{ fontSize: 12.5, color: tinta.secundaria }} title={producto.nombre ?? ""}>
            {producto.sku} · {producto.nombre ?? "Sin nombre en SAP"}
          </Typography>
        </Box>
        <IconButton aria-label="Cerrar" onClick={onCerrar} size="small">
          <IconX size={18} />
        </IconButton>
      </Box>

      <Box sx={{ px: 2.5, pb: 2.5 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 2 }}>
          {caja(
            "Full (bodega de ML)",
            producto.stockFull,
            producto.stockFullAl ? `Según ML al ${fechaCorta(producto.stockFullAl)}` : "ML no informa stock Full",
            tipoEnvio("full")!.color
          )}
          {caja("Colecta (bodega 03)", producto.stock03, "Según la copia de SAP", tipoEnvio("colecta")!.color)}
        </Box>

        <Typography sx={{ fontSize: 13, fontWeight: 700, color: tinta.primaria, mb: 0.5 }}>Todas las bodegas de SAP</Typography>
        <Typography sx={{ fontSize: 12, color: tinta.secundaria, mb: 1 }}>
          Disponible = stock − comprometido en notas de venta.{tipo === "full" ? " El stock Full no está en SAP: lo informa ML." : ""}
        </Typography>
        {bodegas.cargando ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={40} />)
        ) : filas.length === 0 ? (
          <Typography sx={{ color: tinta.tenue, fontSize: 13, py: 3, textAlign: "center" }}>Sin stock en ninguna bodega de SAP.</Typography>
        ) : (
          <TableContainer sx={{ border: `1px solid ${tinta.borde}`, borderRadius: "12px", overflowX: "hidden" }}>
            <Table size="small" sx={tablaSx}>
              <Columnas anchos={[22, 30, 16, 14, 18]} />
              <TableHead>
                <TableRow>
                  <TableCell>Bodega</TableCell>
                  <TableCell align="right">Stock</TableCell>
                  <TableCell align="right">Comprom.</TableCell>
                  <TableCell align="right">En OC</TableCell>
                  <TableCell align="right">Disponible</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filas.map((b) => (
                  <TableRow key={b.codigo} sx={b.codigo === "03" ? { "& .MuiTableCell-body": { bgcolor: "#fffaeb" } } : undefined}>
                    <TableCell sx={{ fontWeight: 600 }}>
                      Bodega {b.codigo}
                      {b.codigo === "03" && <Box component="span" sx={{ ml: 0.5, fontSize: 10.5, color: "#b54708" }}>Colecta</Box>}
                    </TableCell>
                    <TableCell align="right">
                      {unidades(b.stock)}
                      <Box sx={{ mt: 0.5 }}>
                        <BarraParticipacion valor={b.stock} maximo={maximo} />
                      </Box>
                    </TableCell>
                    <TableCell align="right">{unidades(b.comprometido)}</TableCell>
                    <TableCell align="right">{unidades(b.oc)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: b.disponible < 0 ? `${estado.mal.color} !important` : undefined }}>
                      {unidades(b.disponible)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Dialog>
  );
}
