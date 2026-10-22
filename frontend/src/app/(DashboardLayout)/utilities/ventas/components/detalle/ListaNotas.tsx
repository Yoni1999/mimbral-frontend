"use client";

import React from "react";
import { Box, Grid, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import BarraApilada from "../BarraApilada";
import { Columnas, Panel, TextoCelda, cifraSx, formatoMonto, formatoPesos, tablaSx, tinta } from "../estilo";
import { ENDPOINT, FiltrosDetalle, fechaCorta, horaSap, useListaDetalle } from "./comun";
import { Buscador, Encabezado, FilasCargando, Paginador, SinResultados } from "./piezas";
import ChipMotivo, { MOTIVOS_NC, motivoNc } from "./ChipMotivo";
import { Canal } from "./ListaVentas";

export interface FilaNota {
  docEntry: number;
  docNum: number;
  folio: number | null;
  fecha: string;
  hora: number;
  clienteCodigo: string;
  cliente: string;
  vendedor: string;
  canal: string;
  monto: number;
  unidades: number;
  lineas: number;
  motivoCodigo: string | null;
  motivo: string;
  razon: string | null;
  folioReferencia: string | null;
  tipoDocumentoReferencia: string | null;
  comentario: string | null;
}

interface ResumenNotas {
  documentos: number;
  monto: number;
  unidades: number;
  clientes: number;
  porMotivo: { codigo: string | null; motivo: string; documentos: number; monto: number }[];
}

/** Qué significa cada motivo, para quien no conoce los códigos del SII. */
const AYUDA_MOTIVO: Record<string, string> = {
  "1": "Deja sin efecto el documento completo (devolución total o anulación).",
  "3": "Rebaja parte del monto: devolución parcial, descuento o diferencia de precio.",
  "2": "Corrige datos del documento (nombre, dirección…) sin cambiar montos.",
  "": "SAP no tiene el código de referencia de estas notas.",
};

/** Notas de crédito del período: cuánto y por qué (anula, corrige montos,
 *  corrige texto), y la lista con el documento que corrige cada una. */
export default function ListaNotas({ filtros, onAbrir }: { filtros: FiltrosDetalle; onAbrir: (docEntry: number) => void }) {
  const [motivo, setMotivoEstado] = React.useState<string | null>(null);
  // El back usa "sin" para las notas sin código de motivo.
  const l = useListaDetalle<FilaNota, ResumenNotas>(ENDPOINT.notas, filtros, { orden: "fecha", direccion: "desc" }, 50, motivo === null ? {} : { motivo: motivo || "sin" });
  const r = l.resumen;
  const filas = l.datos?.filas ?? [];
  const setMotivo = (m: string | null) => {
    l.setPagina(1);
    setMotivoEstado(m);
  };

  const tramos = (r?.porMotivo ?? []).map((m) => {
    const clave = String(m.codigo ?? "");
    return {
      clave,
      nombre: motivoNc(clave).texto,
      valor: m.monto,
      color: motivoNc(clave).color,
      detalle: `${m.documentos.toLocaleString("es-CL")} notas`,
    };
  });

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} lg={4}>
        <Panel titulo="Notas de crédito del período" descripcion="Monto neto devuelto o rebajado, por motivo.">
          {!r ? (
            <>
              <Skeleton width={140} height={40} />
              <Skeleton variant="rounded" height={14} sx={{ my: 2, borderRadius: 999 }} />
              <Skeleton height={120} />
            </>
          ) : (
            <>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5, flexWrap: "wrap" }}>
                <Typography sx={{ fontSize: 26, fontWeight: 750, color: tinta.primaria, ...cifraSx }}>{formatoMonto(r.monto)}</Typography>
                <Typography sx={{ fontSize: 13, color: tinta.secundaria, ...cifraSx }}>
                  {r.documentos.toLocaleString("es-CL")} notas · {r.clientes.toLocaleString("es-CL")} clientes · {Math.round(r.unidades).toLocaleString("es-CL")} unidades
                </Typography>
              </Box>
              <BarraApilada tramos={tramos} columnas={1} seleccionado={motivo} onSeleccionar={(c) => setMotivo(motivo === c ? null : c)} />
              <Box sx={{ mt: 2, pt: 1.5, borderTop: `1px solid ${tinta.borde}` }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: tinta.tenue, textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.75 }}>
                  Qué significa cada motivo
                </Typography>
                {Object.entries(MOTIVOS_NC).map(([codigo, m]) => (
                  <Box key={codigo} sx={{ display: "flex", gap: 1, mb: 0.75, alignItems: "flex-start" }}>
                    <m.Icono size={15} color={m.color} style={{ marginTop: 2, flexShrink: 0 }} />
                    <Typography sx={{ fontSize: 12, color: tinta.secundaria }}>
                      <strong style={{ color: tinta.primaria }}>{m.texto}:</strong> {AYUDA_MOTIVO[codigo]}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </>
          )}
        </Panel>
      </Grid>
      <Grid item xs={12} lg={8}>
        <Panel
          titulo={motivo === null ? "Notas de crédito" : `Notas de crédito · ${motivoNc(motivo).texto}`}
          descripcion={motivo === null ? "Pulsa una nota para ver los ítems devueltos. Pulsa un motivo para filtrar." : "Pulsa el motivo de nuevo para ver todas."}
          accion={<Buscador valor={l.buscar} onCambiar={l.setBuscar} placeholder="Buscar folio, cliente, vendedor o folio corregido" />}
        >
          {l.cargando ? (
            <FilasCargando />
          ) : filas.length === 0 ? (
            <SinResultados buscando={!!l.buscarDemorado || motivo !== null} />
          ) : (
            <TableContainer sx={{ mx: -2.5, width: "auto", overflowX: "hidden" }}>
              <Table size="small" sx={tablaSx}>
                <Columnas anchos={[11, 10, 24, 15, 17, 13, 10]} />
                <TableHead>
                  <TableRow>
                    <Encabezado columna="fecha" texto="Fecha" orden={l.orden} onOrdenar={l.ordenarPor} />
                    <Encabezado columna="folio" texto="Folio" orden={l.orden} onOrdenar={l.ordenarPor} />
                    <Encabezado columna="cliente" texto="Cliente" orden={l.orden} onOrdenar={l.ordenarPor} />
                    <Encabezado columna="vendedor" texto="Vendedor" orden={l.orden} onOrdenar={l.ordenarPor} />
                    <Encabezado columna="motivo" texto="Motivo" orden={l.orden} onOrdenar={l.ordenarPor} />
                    <Encabezado texto="Corrige a" orden={l.orden} onOrdenar={l.ordenarPor} />
                    <Encabezado columna="monto" texto="Monto" orden={l.orden} onOrdenar={l.ordenarPor} align="right" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filas.map((f) => (
                    <TableRow key={f.docEntry} hover onClick={() => onAbrir(f.docEntry)} sx={{ cursor: "pointer" }} title={f.comentario ?? "Ver ítems de la nota"}>
                      <TableCell>
                        <TextoCelda texto={fechaCorta(f.fecha)} secundario={horaSap(f.hora)} fuerte={false} />
                      </TableCell>
                      <TableCell>
                        <TextoCelda texto={String(f.folio ?? "—")} secundario={`N° ${f.docNum}`} />
                      </TableCell>
                      <TableCell>
                        <TextoCelda texto={f.cliente} secundario={f.clienteCodigo} />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ minWidth: 0 }}>
                          <TextoCelda texto={f.vendedor} fuerte={false} />
                          <Box sx={{ fontSize: 11, color: tinta.tenue }}>
                            <Canal clave={f.canal} />
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <ChipMotivo codigo={f.motivoCodigo} />
                      </TableCell>
                      <TableCell>
                        <TextoCelda texto={f.folioReferencia ?? "—"} secundario={f.tipoDocumentoReferencia ?? undefined} fuerte={false} />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }} title={formatoPesos(f.monto)}>
                        {formatoMonto(f.monto)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          <Paginador total={l.datos?.total ?? 0} pagina={l.pagina} tamano={l.tamano} onPagina={l.setPagina} />
        </Panel>
      </Grid>
    </Grid>
  );
}
