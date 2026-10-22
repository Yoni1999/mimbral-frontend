"use client";

import React from "react";
import { Box, Button, CircularProgress, Dialog, IconButton, Typography } from "@mui/material";
import { IconDownload, IconX } from "@tabler/icons-react";
import { canalPorClave, tinta } from "../estilo";
import { ENDPOINT, FiltrosDetalle, TipoDetalle, descargarExcel, fechaCorta, horaSap, todasLasFilas } from "./comun";
import ListaVentas, { FilaVenta } from "./ListaVentas";
import ListaNotas, { FilaNota } from "./ListaNotas";
import ListaProductos, { FilaProducto } from "./ListaProductos";
import PanelDocumento from "./PanelDocumento";

export interface DetalleAbierto {
  tipo: TipoDetalle;
  /** Título de la tarjeta pulsada ("Ventas", "Notas de crédito"…). */
  titulo: string;
}

const QUE_MUESTRA: Record<TipoDetalle, string> = {
  ventas: "Cada documento de venta del período, con su cliente, vendedor y monto.",
  notas: "Cada nota de crédito del período, su motivo y el documento que corrige.",
  productos: "Cada producto vendido en el período, con sus unidades, venta y margen.",
  margen: "El margen de cada producto vendido en el período: de dónde sale y dónde se pierde.",
};

const n = (v: unknown) => (v == null ? null : Number(v));
const canal = (clave: string) => canalPorClave(clave ?? "")?.nombre ?? clave;

/** Filas del Excel con títulos en español; los montos van como números. */
async function filasExcel(tipo: TipoDetalle, filtros: FiltrosDetalle) {
  if (tipo === "ventas") {
    const filas = await todasLasFilas<FilaVenta>(ENDPOINT.ventas, filtros);
    return filas.map((f) => ({
      Fecha: fechaCorta(f.fecha),
      Hora: horaSap(f.hora),
      Folio: f.folio,
      "N° interno": f.docNum,
      "Código cliente": f.clienteCodigo,
      Cliente: f.cliente,
      Vendedor: f.vendedor,
      Canal: canal(f.canal),
      Unidades: n(f.unidades),
      "Monto neto": n(f.monto),
      ...(f.margen !== undefined ? { "Margen bruto": n(f.margen), "% Margen": f.monto ? Math.round(((f.margen ?? 0) / f.monto) * 10000) / 100 : null } : {}),
    }));
  }
  if (tipo === "notas") {
    const filas = await todasLasFilas<FilaNota>(ENDPOINT.notas, filtros);
    return filas.map((f) => ({
      Fecha: fechaCorta(f.fecha),
      Hora: horaSap(f.hora),
      Folio: f.folio,
      "N° interno": f.docNum,
      "Código cliente": f.clienteCodigo,
      Cliente: f.cliente,
      Vendedor: f.vendedor,
      Canal: canal(f.canal),
      Motivo: f.motivo,
      Razón: f.razon,
      "Documento corregido": f.tipoDocumentoReferencia,
      "Folio corregido": f.folioReferencia,
      Unidades: n(f.unidades),
      "Monto neto": n(f.monto),
      Comentario: f.comentario,
    }));
  }
  const filas = await todasLasFilas<FilaProducto>(ENDPOINT.productos, filtros, { orden: tipo === "margen" ? "margen" : "venta" });
  const total = filas.reduce((s, f) => s + (Number(f.venta) || 0), 0);
  return filas.map((f) => ({
    SKU: f.sku,
    Producto: f.nombre,
    Unidades: n(f.unidades),
    "Venta neta": n(f.venta),
    "% del total": total ? Math.round((f.venta / total) * 10000) / 100 : null,
    ...(f.margen !== undefined ? { Costo: n(f.costo), "Margen bruto": n(f.margen), "% Margen": n(f.margenPorcentaje) } : {}),
    Documentos: f.documentos,
  }));
}

/**
 * Detalle de una tarjeta a pantalla completa: los documentos, notas de
 * crédito o productos que suman la cifra de la tarjeta, con los mismos
 * filtros de la vista. Se cierra con la X o Esc y se descarga en Excel.
 */
export default function DetalleTarjeta({
  abierto,
  filtros,
  etiquetasFiltros,
  onClose,
}: {
  abierto: DetalleAbierto | null;
  /** Filtros del detalle: fechaInicio, fechaFin y los que tenga la vista. */
  filtros: FiltrosDetalle;
  /** Los filtros en palabras ("Este mes", "Canal: Empresas"…). */
  etiquetasFiltros: string[];
  onClose: () => void;
}) {
  const [documento, setDocumento] = React.useState<{ tipo: "venta" | "nc"; docEntry: number } | null>(null);
  const [descargando, setDescargando] = React.useState(false);
  const [errorExcel, setErrorExcel] = React.useState(false);

  React.useEffect(() => {
    if (!abierto) setDocumento(null);
  }, [abierto]);

  const descargar = async () => {
    if (!abierto) return;
    setDescargando(true);
    setErrorExcel(false);
    try {
      const filas = await filasExcel(abierto.tipo, filtros);
      const hojaFiltros = [
        { Filtro: "Detalle de", Valor: abierto.titulo },
        ...etiquetasFiltros.map((e, i) => ({ Filtro: i === 0 ? "Período y filtros" : "", Valor: e })),
        { Filtro: "Generado", Valor: new Date().toLocaleString("es-CL") },
        { Filtro: "Montos", Valor: "Netos, sin IVA" },
      ];
      const nombre = `${abierto.titulo.toLowerCase().replace(/[^a-z0-9áéíóúñ]+/gi, "-")}_${filtros.fechaInicio}_${filtros.fechaFin}`;
      await descargarExcel(nombre, [
        { nombre: abierto.titulo, filas },
        { nombre: "Filtros", filas: hojaFiltros },
      ]);
    } catch (e) {
      console.error("No se pudo generar el Excel:", e);
      setErrorExcel(true);
    } finally {
      setDescargando(false);
    }
  };

  return (
    <Dialog fullScreen open={!!abierto} onClose={onClose} PaperProps={{ sx: { bgcolor: "#f6f8fb" } }}>
      {abierto && (
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
              <Typography sx={{ fontSize: 19, fontWeight: 800, color: tinta.primaria, letterSpacing: "-0.01em" }}>Detalle de {abierto.titulo.toLowerCase()}</Typography>
              <Typography sx={{ fontSize: 12.5, color: tinta.secundaria }}>{QUE_MUESTRA[abierto.tipo]}</Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 0.75 }}>
                {etiquetasFiltros.map((e) => (
                  <Box key={e} component="span" sx={{ px: 1, py: 0.25, borderRadius: 999, bgcolor: "#f1f5f9", color: tinta.primaria, fontSize: 12, fontWeight: 600 }}>
                    {e}
                  </Box>
                ))}
              </Box>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
              {errorExcel && <Typography sx={{ fontSize: 12, color: "#b42318" }}>No se pudo descargar.</Typography>}
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

          <Box sx={{ px: { xs: 2, md: 4 }, py: 3, maxWidth: 1680, width: "100%", mx: "auto" }}>
            {abierto.tipo === "ventas" && <ListaVentas filtros={filtros} onAbrir={(docEntry) => setDocumento({ tipo: "venta", docEntry })} />}
            {abierto.tipo === "notas" && <ListaNotas filtros={filtros} onAbrir={(docEntry) => setDocumento({ tipo: "nc", docEntry })} />}
            {(abierto.tipo === "productos" || abierto.tipo === "margen") && <ListaProductos filtros={filtros} enfoque={abierto.tipo === "margen" ? "margen" : "venta"} />}
          </Box>

          <PanelDocumento documento={documento} filtros={filtros} onClose={() => setDocumento(null)} />
        </>
      )}
    </Dialog>
  );
}
