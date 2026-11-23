"use client";

import React from "react";
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { BarraParticipacion, ChipMargen, Columnas, Panel, Pildoras, TextoCelda, estado, formatoMonto, formatoPesos, formatoPorcentaje, tablaSx, tinta } from "../estilo";
import { ENDPOINT, FiltrosDetalle, useListaDetalle } from "./comun";
import { Buscador, Encabezado, FilasCargando, FranjaResumen, Paginador, SinResultados } from "./piezas";
import { BarraListaMovil, TarjetasMovil, useEsCelular } from "../movil";

export interface FilaProducto {
  sku: string;
  nombre: string;
  imagen?: string;
  unidades: number;
  venta: number;
  costo?: number;
  margen?: number;
  margenPorcentaje?: number;
  documentos: number;
}

interface ResumenProductos {
  productos: number;
  venta: number;
  unidades: number;
  margen?: number;
}

const SIN_IMAGEN = "https://res.cloudinary.com/dhzahos7u/image/upload/v1748960388/producto_sin_imagen_vqaps4.jpg";

/** Lo vendido por producto: unidades, venta (con su peso en el total),
 *  margen y en cuántos documentos aparece. `enfoque="margen"` lo ordena por
 *  margen y permite ver primero los que pierden. */
export default function ListaProductos({ filtros, enfoque = "venta" }: { filtros: FiltrosDetalle; enfoque?: "venta" | "margen" }) {
  const router = useRouter();
  const esCelular = useEsCelular();
  const l = useListaDetalle<FilaProducto, ResumenProductos>(ENDPOINT.productos, filtros, {
    orden: enfoque === "margen" ? "margen" : "venta",
    direccion: "desc",
  });
  const r = l.resumen;
  const filas = l.datos?.filas ?? [];
  const conMargen = r?.margen !== undefined;
  const totalVenta = r?.venta ?? 0;
  const maxVenta = Math.max(0, ...filas.map((f) => f.venta));

  const vistaMargen = l.orden.orden === "margenPorcentaje" && l.orden.direccion === "asc" ? "peor" : l.orden.orden === "margen" ? "mejor" : "";

  return (
    <>
      <FranjaResumen
        cargando={l.cargando && !r}
        cifras={[
          { etiqueta: "Productos distintos", valor: (r?.productos ?? 0).toLocaleString("es-CL") },
          { etiqueta: "Unidades", valor: Math.round(r?.unidades ?? 0).toLocaleString("es-CL") },
          { etiqueta: "Venta neta", valor: formatoMonto(r?.venta) },
          ...(conMargen
            ? [
                { etiqueta: "Margen bruto", valor: formatoMonto(r?.margen) },
                { etiqueta: "% Margen", valor: formatoPorcentaje(r && r.venta ? ((r.margen ?? 0) / r.venta) * 100 : 0, 2), ayuda: "Margen bruto ÷ venta neta" },
              ]
            : []),
        ]}
      />
      <Panel
        titulo="Productos vendidos"
        descripcion="Cuánto generó cada producto en el período. Pulsa uno para ver su análisis."
        accion={
          <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
            {conMargen && enfoque === "margen" && (
              <Pildoras
                etiqueta="Margen"
                opciones={[
                  { valor: "mejor", texto: "Mayor margen" },
                  { valor: "peor", texto: "Peor % margen" },
                ]}
                valor={vistaMargen || "mejor"}
                onCambiar={(v) => {
                  l.setPagina(1);
                  l.setOrden(v === "peor" ? { orden: "margenPorcentaje", direccion: "asc" } : { orden: "margen", direccion: "desc" });
                }}
              />
            )}
            {/* En celular el buscador va en la barra de la lista. */}
            {!esCelular && <Buscador valor={l.buscar} onCambiar={l.setBuscar} placeholder="Buscar SKU o nombre" />}
          </Box>
        }
        sx={{ p: { xs: 1.5, sm: 2.5 } }}
      >
        {esCelular && (
          <Box sx={{ mb: 1.25 }}>
            <BarraListaMovil
              buscar={{ valor: l.buscar, onCambiar: l.setBuscar, placeholder: "Buscar SKU o nombre" }}
              orden={{
              opciones: [
              { clave: "venta", titulo: "Venta" },
              { clave: "unidades", titulo: "Unidades" },
              ...(conMargen
                ? [
                    { clave: "margen", titulo: "Margen" },
                    { clave: "margenPorcentaje", titulo: "% Margen" },
                  ]
                : []),
              { clave: "documentos", titulo: "Documentos" },
              { clave: "nombre", titulo: "Producto" },
              ],
              clave: l.orden.orden,
              direccion: l.orden.direccion,
              onCambiar: (orden, direccion) => {
                l.setPagina(1);
                l.setOrden({ orden, direccion });
              },
              }}
            />
          </Box>
        )}
        {l.cargando ? (
          <FilasCargando />
        ) : filas.length === 0 ? (
          <SinResultados buscando={!!l.buscarDemorado} />
        ) : esCelular ? (
          <TarjetasMovil
            filas={filas.map((f, i) => ({
              clave: f.sku,
              titulo: f.nombre,
              meta: f.sku,
              imagen: f.imagen || null,
              // Posición al ordenar de mayor a menor por una cifra, contando las páginas anteriores.
              rango: l.orden.direccion === "desc" && l.orden.orden !== "nombre" && !l.buscarDemorado ? (l.pagina - 1) * l.tamano + i + 1 : undefined,
              onAbrir: () => router.push(`/utilities/analisis-producto1.1?itemCode=${encodeURIComponent(f.sku)}`),
              principales: [
                { titulo: "Unidades", valor: Number(f.unidades).toLocaleString("es-CL", { maximumFractionDigits: 2 }), unidad: "un." },
                { titulo: "Venta", valor: formatoMonto(f.venta) },
                conMargen
                  ? { titulo: "% Margen", valor: "", chip: f.margenPorcentaje ?? null }
                  : { titulo: "Documentos", valor: f.documentos.toLocaleString("es-CL"), unidad: "docs." },
              ],
              detalle: [
                { titulo: "% del total", valor: totalVenta ? formatoPorcentaje((f.venta / totalVenta) * 100) : "—" },
                ...(conMargen
                  ? [
                      {
                        titulo: "Margen $",
                        valor: (
                          <Box component="span" sx={{ color: (f.margen ?? 0) < 0 ? estado.mal.color : undefined }}>
                            {formatoMonto(f.margen)}
                          </Box>
                        ),
                      },
                      { titulo: "Documentos", valor: f.documentos.toLocaleString("es-CL") },
                    ]
                  : []),
              ],
            }))}
          />
        ) : (
          <TableContainer sx={{ mx: -2.5, width: "auto", overflowX: "hidden" }}>
            <Table size="small" sx={tablaSx}>
              <Columnas anchos={conMargen ? [36, 10, 20, 12, 11, 11] : [48, 12, 26, 14]} />
              <TableHead>
                <TableRow>
                  <Encabezado columna="nombre" texto="Producto" orden={l.orden} onOrdenar={l.ordenarPor} />
                  <Encabezado columna="unidades" texto="Unidades" orden={l.orden} onOrdenar={l.ordenarPor} align="right" />
                  <Encabezado columna="venta" texto="Venta · % del total" orden={l.orden} onOrdenar={l.ordenarPor} align="right" />
                  {conMargen && <Encabezado columna="margen" texto="Margen" orden={l.orden} onOrdenar={l.ordenarPor} align="right" />}
                  {conMargen && <Encabezado columna="margenPorcentaje" texto="% Margen" orden={l.orden} onOrdenar={l.ordenarPor} align="right" />}
                  <Encabezado columna="documentos" texto="Documentos" orden={l.orden} onOrdenar={l.ordenarPor} align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {filas.map((f) => (
                  <TableRow
                    key={f.sku}
                    hover
                    onClick={() => router.push(`/utilities/analisis-producto1.1?itemCode=${encodeURIComponent(f.sku)}`)}
                    sx={{ cursor: "pointer" }}
                    title="Ver análisis del producto"
                  >
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
                        <Box
                          component="img"
                          src={f.imagen || SIN_IMAGEN}
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.onerror = null;
                            img.src = SIN_IMAGEN;
                          }}
                          alt=""
                          sx={{ width: 30, height: 30, objectFit: "contain", borderRadius: "8px", border: `1px solid ${tinta.borde}`, bgcolor: "#fff", flexShrink: 0 }}
                        />
                        <TextoCelda texto={f.nombre} secundario={`SKU ${f.sku}`} />
                      </Box>
                    </TableCell>
                    <TableCell align="right">{Number(f.unidades).toLocaleString("es-CL", { maximumFractionDigits: 2 })}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "baseline", gap: 0.75 }} title={formatoPesos(f.venta)}>
                        <strong>{formatoMonto(f.venta)}</strong>
                        <Typography component="span" sx={{ fontSize: 11, color: tinta.tenue }}>
                          {totalVenta ? formatoPorcentaje((f.venta / totalVenta) * 100) : ""}
                        </Typography>
                      </Box>
                      <Box sx={{ mt: 0.5 }}>
                        <BarraParticipacion valor={f.venta} maximo={maxVenta} />
                      </Box>
                    </TableCell>
                    {conMargen && (
                      <TableCell align="right" sx={{ color: (f.margen ?? 0) < 0 ? `${estado.mal.color} !important` : undefined, fontWeight: 600 }}>
                        {formatoMonto(f.margen)}
                      </TableCell>
                    )}
                    {conMargen && (
                      <TableCell align="right">
                        <ChipMargen valor={f.margenPorcentaje} />
                      </TableCell>
                    )}
                    <TableCell align="right">{f.documentos.toLocaleString("es-CL")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <Paginador total={l.datos?.total ?? 0} pagina={l.pagina} tamano={l.tamano} onPagina={l.setPagina} />
      </Panel>
    </>
  );
}
