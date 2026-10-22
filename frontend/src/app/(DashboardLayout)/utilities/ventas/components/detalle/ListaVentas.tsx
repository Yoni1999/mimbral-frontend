"use client";

import React from "react";
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { ChipMargen, Columnas, Panel, TextoCelda, canalPorClave, formatoMonto, formatoPesos, tablaSx, tinta } from "../estilo";
import { ENDPOINT, FiltrosDetalle, fechaCorta, horaSap, useListaDetalle } from "./comun";
import { Buscador, Encabezado, FilasCargando, FranjaResumen, Paginador, SinResultados } from "./piezas";

export interface FilaVenta {
  docEntry: number;
  docNum: number;
  folio: string | null;
  fecha: string;
  hora: number;
  clienteCodigo: string;
  cliente: string;
  vendedorCodigo: number;
  vendedor: string;
  variosVendedores: boolean;
  canal: string;
  monto: number;
  unidades: number;
  lineas: number;
  margen?: number;
}

interface ResumenVentas {
  documentos: number;
  monto: number;
  unidades: number;
  clientes: number;
  margen?: number;
}

/** Nombre y color del canal de un documento ("Varios" si mezcla canales). */
export function Canal({ clave }: { clave: string }) {
  const c = canalPorClave(clave ?? "");
  return (
    <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, whiteSpace: "nowrap" }}>
      <Box component="span" sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: c?.color ?? "#cbd5e1" }} />
      {c?.nombre ?? clave ?? "—"}
    </Box>
  );
}

/** Documentos de venta del período: cada uno con su cliente, vendedor, canal
 *  y monto. Al pulsar uno se abren sus ítems. */
export default function ListaVentas({
  filtros,
  onAbrir,
}: {
  filtros: FiltrosDetalle;
  onAbrir: (docEntry: number) => void;
}) {
  const l = useListaDetalle<FilaVenta, ResumenVentas>(ENDPOINT.ventas, filtros, { orden: "fecha", direccion: "desc" });
  const r = l.resumen;
  const filas = l.datos?.filas ?? [];
  const conMargen = r?.margen !== undefined;

  return (
    <>
      <FranjaResumen
        cargando={l.cargando && !r}
        cifras={[
          { etiqueta: "Venta neta", valor: formatoMonto(r?.monto), ayuda: "Suma de los documentos (sin IVA)" },
          { etiqueta: "Documentos", valor: (r?.documentos ?? 0).toLocaleString("es-CL"), ayuda: "Boletas y facturas" },
          { etiqueta: "Ticket promedio", valor: formatoMonto(r && r.documentos ? r.monto / r.documentos : 0), ayuda: "Venta neta ÷ documentos" },
          { etiqueta: "Clientes distintos", valor: (r?.clientes ?? 0).toLocaleString("es-CL") },
          { etiqueta: "Unidades", valor: Math.round(r?.unidades ?? 0).toLocaleString("es-CL") },
        ]}
      />
      <Panel
        titulo="Documentos de venta"
        descripcion="Pulsa un documento para ver sus ítems."
        accion={<Buscador valor={l.buscar} onCambiar={l.setBuscar} placeholder="Buscar folio, cliente, RUT o vendedor" />}
      >
        {l.cargando ? (
          <FilasCargando />
        ) : filas.length === 0 ? (
          <SinResultados buscando={!!l.buscarDemorado} />
        ) : (
          <TableContainer sx={{ mx: -2.5, width: "auto", overflowX: "hidden" }}>
            <Table size="small" sx={tablaSx}>
              <Columnas anchos={conMargen ? [12, 10, 26, 17, 11, 8, 9, 7] : [12, 11, 29, 19, 12, 8, 9]} />
              <TableHead>
                <TableRow>
                  <Encabezado columna="fecha" texto="Fecha" orden={l.orden} onOrdenar={l.ordenarPor} />
                  <Encabezado columna="folio" texto="Folio" orden={l.orden} onOrdenar={l.ordenarPor} />
                  <Encabezado columna="cliente" texto="Cliente" orden={l.orden} onOrdenar={l.ordenarPor} />
                  <Encabezado columna="vendedor" texto="Vendedor" orden={l.orden} onOrdenar={l.ordenarPor} />
                  <Encabezado columna="canal" texto="Canal" orden={l.orden} onOrdenar={l.ordenarPor} />
                  <Encabezado columna="unidades" texto="Unid." orden={l.orden} onOrdenar={l.ordenarPor} align="right" />
                  <Encabezado columna="monto" texto="Monto" orden={l.orden} onOrdenar={l.ordenarPor} align="right" />
                  {conMargen && <Encabezado columna="margen" texto="Margen" orden={l.orden} onOrdenar={l.ordenarPor} align="right" />}
                </TableRow>
              </TableHead>
              <TableBody>
                {filas.map((f) => (
                  <TableRow key={f.docEntry} hover onClick={() => onAbrir(f.docEntry)} sx={{ cursor: "pointer" }} title="Ver ítems del documento">
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
                      <TextoCelda texto={f.vendedor} secundario={f.variosVendedores ? "y otros vendedores" : undefined} fuerte={false} />
                    </TableCell>
                    <TableCell>
                      <Canal clave={f.canal} />
                    </TableCell>
                    <TableCell align="right">{Math.round(f.unidades).toLocaleString("es-CL")}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }} title={formatoPesos(f.monto)}>
                      {formatoMonto(f.monto)}
                    </TableCell>
                    {conMargen && (
                      <TableCell align="right">{f.monto ? <ChipMargen valor={((f.margen ?? 0) / f.monto) * 100} /> : "—"}</TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <Paginador total={l.datos?.total ?? 0} pagina={l.pagina} tamano={l.tamano} onPagina={l.setPagina} />
        {!l.cargando && filas.length > 0 && (
          <Typography sx={{ fontSize: 11.5, color: tinta.tenue, mt: 1 }}>
            El monto de cada documento suma solo sus líneas que cumplen los filtros de la vista (sin IVA ni flete).
          </Typography>
        )}
      </Panel>
    </>
  );
}
