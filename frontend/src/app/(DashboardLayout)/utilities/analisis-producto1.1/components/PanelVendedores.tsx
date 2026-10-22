"use client";

import React from "react";
import { Avatar, Box, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, Typography } from "@mui/material";
import { apiJson } from "@/utils/apiClient";
import { useCargaDatos } from "@/utils/useCargaDatos";
import { useEstadoVista } from "@/utils/estadoVista";
import { BACKEND_URL } from "@/config";
import {
  BarraParticipacion,
  ChipMargen,
  Columnas,
  Panel,
  TextoCelda,
  formatoMonto,
  formatoPorcentaje,
  tablaSx,
  tinta,
} from "@/app/(DashboardLayout)/utilities/ventas/components/estilo";

interface Vendedor {
  codigo: number;
  nombre: string;
  imagen?: string;
  unidades: number;
  venta: number;
  margen: number;
  margenPorcentaje: number;
  participacion: number;
}

type Orden = "venta" | "unidades" | "margen" | "margenPorcentaje";

/** Quién vende el producto: venta, unidades y margen por vendedor en el
 *  período, con su participación. */
export default function PanelVendedores({ query }: { query: string }) {
  const [vista, setVista] = useEstadoVista<{ orden: Orden; direccion: "asc" | "desc" }>("producto:vendedores", () => ({
    orden: "venta",
    direccion: "desc",
  }));

  const url = `${BACKEND_URL}/api/canal-vendedor?${query}`;
  const { datos, cargando } = useCargaDatos<Vendedor[]>(
    url,
    async (signal) => {
      const json = await apiJson(url, { signal });
      return (Array.isArray(json) ? json : []).map((v: any) => ({
        codigo: v.Codigo_Vendedor,
        nombre: v.Nombre_Vendedor || `Vendedor ${v.Codigo_Vendedor}`,
        imagen: v.Imagen || undefined,
        unidades: Number(v.CantidadVendida) || 0,
        venta: Number(v.TotalVentas) || 0,
        margen: Number(v.MargenBruto) || 0,
        margenPorcentaje: Number(v.MargenPorcentaje) || 0,
        participacion: Number(v.Porcentaje) || 0,
      }));
    },
    []
  );

  const filas = [...datos].sort((a, b) => (vista.direccion === "asc" ? 1 : -1) * (a[vista.orden] - b[vista.orden]));
  const maximo = Math.max(0, ...datos.map((v) => v.venta));

  const encabezado = (o: Orden, texto: string) => (
    <TableCell align="right" sortDirection={vista.orden === o ? vista.direccion : false}>
      <TableSortLabel
        active={vista.orden === o}
        direction={vista.orden === o ? vista.direccion : "desc"}
        onClick={() => setVista((v) => ({ orden: o, direccion: v.orden === o && v.direccion === "desc" ? "asc" : "desc" }))}
      >
        {texto}
      </TableSortLabel>
    </TableCell>
  );

  return (
    <Panel titulo="Vendedores del producto" descripcion={cargando ? "Cargando…" : `${datos.length} vendedores con venta en el período`}>
      {cargando ? (
        Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={48} />)
      ) : filas.length === 0 ? (
        <Typography sx={{ color: tinta.tenue, fontSize: 13, py: 6, textAlign: "center" }}>Sin ventas en el período.</Typography>
      ) : (
        <TableContainer sx={{ maxHeight: 560, mx: -2.5, width: "auto", overflowX: "hidden" }}>
          <Table size="small" stickyHeader sx={tablaSx}>
            <Columnas anchos={[34, 24, 14, 14, 14]} />
            <TableHead>
              <TableRow>
                <TableCell>Vendedor</TableCell>
                {encabezado("venta", "Venta")}
                {encabezado("unidades", "Unidades")}
                {encabezado("margen", "Margen $")}
                {encabezado("margenPorcentaje", "% Margen")}
              </TableRow>
            </TableHead>
            <TableBody>
              {filas.map((v) => (
                <TableRow key={v.codigo}>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                      <Avatar src={v.imagen} alt="" sx={{ width: 28, height: 28, fontSize: 12, bgcolor: "#eff4ff", color: tinta.acento }}>
                        {v.nombre.charAt(0)}
                      </Avatar>
                      <TextoCelda texto={v.nombre} secundario={`Código ${v.codigo}`} />
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.75, alignItems: "baseline" }}>
                      {formatoMonto(v.venta)}
                      <Typography component="span" sx={{ fontSize: 11, color: tinta.tenue }}>
                        {formatoPorcentaje(v.participacion)}
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 0.5 }}>
                      <BarraParticipacion valor={v.venta} maximo={maximo} />
                    </Box>
                  </TableCell>
                  <TableCell align="right">{v.unidades.toLocaleString("es-CL", { maximumFractionDigits: 2 })}</TableCell>
                  <TableCell align="right">{formatoMonto(v.margen)}</TableCell>
                  <TableCell align="right">
                    <ChipMargen valor={v.margenPorcentaje} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Panel>
  );
}
