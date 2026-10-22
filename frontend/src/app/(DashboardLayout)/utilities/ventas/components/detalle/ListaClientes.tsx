"use client";

import React from "react";
import { Box, Button, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { IconDownload } from "@tabler/icons-react";
import { BarraParticipacion, ChipMargen, Columnas, Panel, TextoCelda, formatoMonto, formatoPesos, formatoPorcentaje, tablaSx, tinta } from "../estilo";
import { FiltrosDetalle, descargarExcel, fechaCorta, todasLasFilas, useListaDetalle } from "./comun";
import { Buscador, Encabezado, FilasCargando, FranjaResumen, Paginador, SinResultados } from "./piezas";
import PanelCliente from "./PanelCliente";

export interface FilaCliente {
  codigo: string;
  nombre: string;
  rut?: string;
  telefono?: string;
  correo?: string;
  ciudad?: string;
  venta: number;
  documentos: number;
  unidades: number;
  productos: number;
  margen?: number;
  ticket: number;
  primeraCompra: string;
  ultimaCompra: string;
  notas: number;
  montoNotas: number;
}

interface ResumenClientes {
  clientes: number;
  venta: number;
  documentos: number;
  unidades: number;
  margen?: number;
  montoNotas: number;
}

const ENDPOINT_CLIENTES = "/api/detalle/clientes";

/** A quién se le vendió: cada cliente con su venta, documentos, productos,
 *  ticket y notas de crédito. Al pulsar uno se abre su detalle (productos,
 *  documentos y notas). Se descarga en Excel. */
export default function ListaClientes({ filtros, etiquetas }: { filtros: FiltrosDetalle; etiquetas: string[] }) {
  const l = useListaDetalle<FilaCliente, ResumenClientes>(ENDPOINT_CLIENTES, filtros, { orden: "venta", direccion: "desc" });
  const r = l.resumen;
  const filas = l.datos?.filas ?? [];
  const conMargen = r?.margen !== undefined;
  const maxVenta = Math.max(0, ...filas.map((f) => f.venta));
  const [cliente, setCliente] = React.useState<FilaCliente | null>(null);
  const [descargando, setDescargando] = React.useState(false);

  const descargar = async () => {
    setDescargando(true);
    try {
      const todas = await todasLasFilas<FilaCliente>(ENDPOINT_CLIENTES, filtros);
      const total = todas.reduce((s, f) => s + (Number(f.venta) || 0), 0);
      await descargarExcel(`clientes_${filtros.fechaInicio}_${filtros.fechaFin}`, [
        {
          nombre: "Clientes",
          filas: todas.map((f) => ({
            "Código cliente": f.codigo,
            RUT: f.rut,
            Cliente: f.nombre,
            Ciudad: f.ciudad,
            Teléfono: f.telefono,
            Correo: f.correo,
            "Venta neta": Number(f.venta),
            "% del total": total ? Math.round((f.venta / total) * 10000) / 100 : null,
            Documentos: f.documentos,
            "Ticket promedio": Math.round(Number(f.ticket) || 0),
            Unidades: Number(f.unidades),
            "Productos distintos": f.productos,
            ...(f.margen !== undefined ? { "Margen bruto": Number(f.margen), "% Margen": f.venta ? Math.round((Number(f.margen) / f.venta) * 10000) / 100 : null } : {}),
            "Notas de crédito": f.notas,
            "Monto NC": Number(f.montoNotas),
            "Primera compra": fechaCorta(f.primeraCompra),
            "Última compra": fechaCorta(f.ultimaCompra),
          })),
        },
        { nombre: "Filtros", filas: [...etiquetas.map((e) => ({ Filtro: e })), { Filtro: `Generado ${new Date().toLocaleString("es-CL")} · montos netos sin IVA` }] },
      ]);
    } finally {
      setDescargando(false);
    }
  };

  return (
    <>
      <FranjaResumen
        cargando={l.cargando && !r}
        cifras={[
          { etiqueta: "Clientes", valor: (r?.clientes ?? 0).toLocaleString("es-CL") },
          { etiqueta: "Venta neta", valor: formatoMonto(r?.venta) },
          { etiqueta: "Venta por cliente", valor: formatoMonto(r && r.clientes ? r.venta / r.clientes : 0), ayuda: "Venta neta ÷ clientes" },
          { etiqueta: "Documentos", valor: (r?.documentos ?? 0).toLocaleString("es-CL") },
          { etiqueta: "Notas de crédito", valor: formatoMonto(r?.montoNotas), ayuda: "Monto devuelto o rebajado" },
        ]}
      />
      <Panel
        titulo="Clientes"
        descripcion="Pulsa un cliente para ver qué compró, sus documentos y sus notas de crédito."
        accion={
          <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Buscador valor={l.buscar} onCambiar={l.setBuscar} placeholder="Buscar cliente, código o RUT" />
            <Button
              variant="outlined"
              onClick={descargar}
              disabled={descargando || !r?.clientes}
              startIcon={descargando ? <CircularProgress size={14} /> : <IconDownload size={16} />}
              sx={{ textTransform: "none", borderRadius: "10px", height: 34, fontWeight: 600, color: "#067647", borderColor: "#abefc6", "&:hover": { borderColor: "#067647", bgcolor: "#ecfdf3" } }}
            >
              {descargando ? "Preparando…" : "Excel"}
            </Button>
          </Box>
        }
      >
        {l.cargando ? (
          <FilasCargando />
        ) : filas.length === 0 ? (
          <SinResultados buscando={!!l.buscarDemorado} />
        ) : (
          <TableContainer sx={{ mx: -2.5, width: "auto", overflowX: "hidden" }}>
            <Table size="small" sx={tablaSx}>
              <Columnas anchos={conMargen ? [27, 17, 8, 8, 8, 10, 10, 6, 6] : [30, 19, 9, 9, 9, 10, 8, 6]} />
              <TableHead>
                <TableRow>
                  <Encabezado columna="cliente" texto="Cliente" orden={l.orden} onOrdenar={l.ordenarPor} />
                  <Encabezado columna="venta" texto="Venta · % del total" orden={l.orden} onOrdenar={l.ordenarPor} align="right" />
                  <Encabezado columna="documentos" texto="Docs." orden={l.orden} onOrdenar={l.ordenarPor} align="right" />
                  <Encabezado columna="productos" texto="Productos" orden={l.orden} onOrdenar={l.ordenarPor} align="right" />
                  <Encabezado columna="unidades" texto="Unid." orden={l.orden} onOrdenar={l.ordenarPor} align="right" />
                  <Encabezado columna="ticket" texto="Ticket" orden={l.orden} onOrdenar={l.ordenarPor} align="right" />
                  <Encabezado columna="ultima" texto="Última compra" orden={l.orden} onOrdenar={l.ordenarPor} />
                  <Encabezado columna="notas" texto="NC" orden={l.orden} onOrdenar={l.ordenarPor} align="right" />
                  {conMargen && <Encabezado columna="margen" texto="% Mg." orden={l.orden} onOrdenar={l.ordenarPor} align="right" />}
                </TableRow>
              </TableHead>
              <TableBody>
                {filas.map((f) => (
                  <TableRow key={f.codigo} hover onClick={() => setCliente(f)} sx={{ cursor: "pointer" }} title="Ver el detalle del cliente">
                    <TableCell>
                      <TextoCelda texto={f.nombre} secundario={[f.rut || f.codigo, f.ciudad].filter(Boolean).join(" · ")} />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "baseline", gap: 0.75 }} title={formatoPesos(f.venta)}>
                        <strong>{formatoMonto(f.venta)}</strong>
                        <Typography component="span" sx={{ fontSize: 11, color: tinta.tenue }}>
                          {r?.venta ? formatoPorcentaje((f.venta / r.venta) * 100) : ""}
                        </Typography>
                      </Box>
                      <Box sx={{ mt: 0.5 }}>
                        <BarraParticipacion valor={f.venta} maximo={maxVenta} />
                      </Box>
                    </TableCell>
                    <TableCell align="right">{f.documentos}</TableCell>
                    <TableCell align="right">{f.productos}</TableCell>
                    <TableCell align="right">{Math.round(f.unidades).toLocaleString("es-CL")}</TableCell>
                    <TableCell align="right">{formatoMonto(f.ticket)}</TableCell>
                    <TableCell>
                      <TextoCelda texto={fechaCorta(f.ultimaCompra)} secundario={f.primeraCompra !== f.ultimaCompra ? `desde ${fechaCorta(f.primeraCompra)}` : undefined} fuerte={false} />
                    </TableCell>
                    <TableCell align="right" title={f.notas ? `${f.notas} NC por ${formatoPesos(f.montoNotas)}` : "Sin notas de crédito"}>
                      {f.notas ? <Box sx={{ color: "#c4320a", fontWeight: 700 }}>{f.notas}</Box> : <Box sx={{ color: tinta.tenue }}>—</Box>}
                    </TableCell>
                    {conMargen && <TableCell align="right">{f.venta ? <ChipMargen valor={((f.margen ?? 0) / f.venta) * 100} /> : "—"}</TableCell>}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <Paginador total={l.datos?.total ?? 0} pagina={l.pagina} tamano={l.tamano} onPagina={l.setPagina} />
      </Panel>

      <PanelCliente cliente={cliente} filtros={filtros} etiquetas={etiquetas} onClose={() => setCliente(null)} />
    </>
  );
}
