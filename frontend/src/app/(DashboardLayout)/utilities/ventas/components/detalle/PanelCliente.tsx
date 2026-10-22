"use client";

import React from "react";
import { Box, Button, CircularProgress, Dialog, IconButton, Tab, Tabs, Typography } from "@mui/material";
import { IconDownload, IconMail, IconMapPin, IconPhone, IconX } from "@tabler/icons-react";
import { canalPorClave, pestanasSx, tinta } from "../estilo";
import { ENDPOINT, FiltrosDetalle, descargarExcel, fechaCorta, horaSap, todasLasFilas } from "./comun";
import ListaProductos, { FilaProducto } from "./ListaProductos";
import ListaVentas, { FilaVenta } from "./ListaVentas";
import ListaNotas, { FilaNota } from "./ListaNotas";
import PanelDocumento from "./PanelDocumento";
import type { FilaCliente } from "./ListaClientes";

type Pestana = "productos" | "documentos" | "notas";

/** Un cliente con los filtros de la vista: qué productos compró, sus
 *  documentos y sus notas de crédito. Se descarga todo en un Excel. */
export default function PanelCliente({
  cliente,
  filtros,
  etiquetas,
  onClose,
}: {
  cliente: FilaCliente | null;
  filtros: FiltrosDetalle;
  etiquetas: string[];
  onClose: () => void;
}) {
  const [pestana, setPestana] = React.useState<Pestana>("productos");
  const [documento, setDocumento] = React.useState<{ tipo: "venta" | "nc"; docEntry: number } | null>(null);
  const [descargando, setDescargando] = React.useState(false);
  const filtrosCliente = { ...filtros, cliente: cliente?.codigo };

  React.useEffect(() => {
    if (cliente) {
      setPestana("productos");
      setDocumento(null);
    }
  }, [cliente]);

  const descargar = async () => {
    if (!cliente) return;
    setDescargando(true);
    try {
      const [productos, documentos, notas] = await Promise.all([
        todasLasFilas<FilaProducto>(ENDPOINT.productos, filtrosCliente),
        todasLasFilas<FilaVenta>(ENDPOINT.ventas, filtrosCliente),
        todasLasFilas<FilaNota>(ENDPOINT.notas, filtrosCliente),
      ]);
      await descargarExcel(`cliente_${cliente.codigo}_${filtros.fechaInicio}_${filtros.fechaFin}`, [
        {
          nombre: "Productos",
          filas: productos.map((p) => ({
            SKU: p.sku,
            Producto: p.nombre,
            Unidades: Number(p.unidades),
            "Venta neta": Number(p.venta),
            ...(p.margen !== undefined ? { "Margen bruto": Number(p.margen), "% Margen": p.margenPorcentaje } : {}),
            Documentos: p.documentos,
          })),
        },
        {
          nombre: "Documentos",
          filas: documentos.map((d) => ({
            Fecha: fechaCorta(d.fecha),
            Hora: horaSap(d.hora),
            Folio: d.folio,
            "N° interno": d.docNum,
            Vendedor: d.vendedor,
            Canal: canalPorClave(d.canal ?? "")?.nombre ?? d.canal,
            Unidades: Number(d.unidades),
            "Monto neto": Number(d.monto),
          })),
        },
        {
          nombre: "Notas de crédito",
          filas: notas.map((n) => ({
            Fecha: fechaCorta(n.fecha),
            Folio: n.folio,
            Motivo: n.motivo,
            "Documento corregido": n.tipoDocumentoReferencia,
            "Folio corregido": n.folioReferencia,
            "Monto neto": Number(n.monto),
            Comentario: n.comentario,
          })),
        },
        {
          nombre: "Cliente",
          filas: [
            { Dato: "Cliente", Valor: cliente.nombre },
            { Dato: "Código", Valor: cliente.codigo },
            { Dato: "RUT", Valor: cliente.rut ?? "" },
            { Dato: "Ciudad", Valor: cliente.ciudad ?? "" },
            { Dato: "Teléfono", Valor: cliente.telefono ?? "" },
            { Dato: "Correo", Valor: cliente.correo ?? "" },
            ...etiquetas.map((e) => ({ Dato: "Filtro", Valor: e })),
            { Dato: "Generado", Valor: new Date().toLocaleString("es-CL") },
          ],
        },
      ]);
    } finally {
      setDescargando(false);
    }
  };

  return (
    <Dialog fullScreen open={!!cliente} onClose={onClose} PaperProps={{ sx: { bgcolor: "#f6f8fb" } }} sx={{ zIndex: 1400 }}>
      {cliente && (
        <>
          <Box
            sx={{
              position: "sticky",
              top: 0,
              zIndex: 2,
              display: "flex",
              alignItems: "center",
              gap: 2,
              px: { xs: 2, md: 4 },
              py: 1.5,
              bgcolor: "#fff",
              borderBottom: `1px solid ${tinta.borde}`,
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: tinta.tenue, textTransform: "uppercase", letterSpacing: "0.06em" }}>Cliente</Typography>
              <Typography noWrap sx={{ fontSize: 19, fontWeight: 800, color: tinta.primaria }}>{cliente.nombre}</Typography>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", fontSize: 12.5, color: tinta.secundaria, mt: 0.25 }}>
                <span>RUT {cliente.rut || cliente.codigo}</span>
                {cliente.ciudad && (
                  <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                    <IconMapPin size={14} /> {cliente.ciudad}
                  </Box>
                )}
                {cliente.telefono && (
                  <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                    <IconPhone size={14} /> {cliente.telefono}
                  </Box>
                )}
                {cliente.correo && (
                  <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                    <IconMail size={14} /> {cliente.correo}
                  </Box>
                )}
              </Box>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 0.75 }}>
                {etiquetas.map((e) => (
                  <Box key={e} component="span" sx={{ px: 1, py: 0.25, borderRadius: 999, bgcolor: "#f1f5f9", color: tinta.primaria, fontSize: 12, fontWeight: 600 }}>
                    {e}
                  </Box>
                ))}
              </Box>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
              <Button
                variant="contained"
                disableElevation
                onClick={descargar}
                disabled={descargando}
                startIcon={descargando ? <CircularProgress size={14} color="inherit" /> : <IconDownload size={17} />}
                sx={{ textTransform: "none", borderRadius: "10px", fontWeight: 600, bgcolor: "#067647", "&:hover": { bgcolor: "#05603a" } }}
              >
                {descargando ? "Preparando Excel…" : "Descargar Excel"}
              </Button>
              <IconButton aria-label="Cerrar" onClick={onClose} sx={{ border: `1px solid ${tinta.borde}`, borderRadius: "10px" }}>
                <IconX size={20} />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ px: { xs: 2, md: 4 }, py: 2, maxWidth: 1680, width: "100%", mx: "auto" }}>
            <Tabs value={pestana} onChange={(_, v) => setPestana(v)} sx={pestanasSx}>
              <Tab value="productos" label={`Qué compró · ${cliente.productos} productos`} />
              <Tab value="documentos" label={`Documentos · ${cliente.documentos}`} />
              <Tab value="notas" label={`Notas de crédito · ${cliente.notas}`} />
            </Tabs>
            {pestana === "productos" && <ListaProductos filtros={filtrosCliente} />}
            {pestana === "documentos" && <ListaVentas filtros={filtrosCliente} onAbrir={(docEntry) => setDocumento({ tipo: "venta", docEntry })} />}
            {pestana === "notas" && <ListaNotas filtros={filtrosCliente} onAbrir={(docEntry) => setDocumento({ tipo: "nc", docEntry })} />}
          </Box>

          <PanelDocumento documento={documento} filtros={filtros} onClose={() => setDocumento(null)} />
        </>
      )}
    </Dialog>
  );
}
