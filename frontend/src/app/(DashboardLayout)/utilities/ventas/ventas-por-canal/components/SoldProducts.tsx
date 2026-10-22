"use client";

import React, { useState } from "react";
import { Box, Pagination, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { apiJson } from "@/utils/apiClient";
import { useCargaDatos } from "@/utils/useCargaDatos";
import { BACKEND_URL } from "@/config";
import { BarraParticipacion, ChipMargen, Panel, formatoPesos, tablaSx, tinta, Columnas, TextoCelda } from "../../components/estilo";

interface Filtros {
  canal: string;
  fechaInicio: string;
  fechaFin: string;
  vendedor?: number | null;
}

/** El back entrega algunas cifras con su apertura por canal. */
type PorCanal = { total: number | null; porCanal?: { canal: string; valor: number }[] };

interface ProductoDetallado {
  sku: string;
  nombre: string;
  imagen: string;
  primerNivel: string;
  categoria: string;
  cantidadVendida: number | PorCanal;
  totalVentas: number;
  precioPromedio: number | PorCanal;
  margenBruto: number | PorCanal;
  margenPorcentaje: number;
  stockCanal: number | PorCanal | null;
}

const cifra = (v: number | PorCanal | null | undefined): number | null =>
  v == null ? null : typeof v === "number" ? v : v.total ?? null;

interface Props {
  filters: Filtros;
}

const SIN_IMAGEN = "https://res.cloudinary.com/dhzahos7u/image/upload/v1748960388/producto_sin_imagen_vqaps4.jpg";

/** Todos los productos vendidos en el canal, de 100 en 100. */
const ProductosVendidos: React.FC<Props> = ({ filters }) => {
  const [page, setPage] = useState(1);
  const rowsPerPage = 100;

  // Filtros sin paginación: si cambian se vuelve a la página 1 en el mismo
  // render (antes un efecto pedía primero con la página vieja y luego con la 1).
  const filtrosClave = new URLSearchParams(
    Object.entries({
      ...filters,
      vendedor: filters.vendedor != null ? String(filters.vendedor) : undefined,
    })
      .filter(([_, v]) => v != null && v !== "")
      .map(([k, v]) => [k, String(v)])
  ).toString();
  const [filtrosPrevios, setFiltrosPrevios] = useState(filtrosClave);
  let paginaActual = page;
  if (filtrosPrevios !== filtrosClave) {
    setFiltrosPrevios(filtrosClave);
    setPage(1);
    paginaActual = 1;
  }

  const offset = (paginaActual - 1) * rowsPerPage;
  const params = new URLSearchParams(filtrosClave);
  params.append("limit", String(rowsPerPage));
  params.append("offset", String(offset));
  const url = `${BACKEND_URL}/api/obtener-productos-detallado?${params.toString()}`;

  const {
    datos: { productos, totalProductos },
    cargando,
  } = useCargaDatos(
    url,
    async (signal) => {
      const result = await apiJson(url, { signal });
      return {
        productos: (result.data || []) as ProductoDetallado[],
        totalProductos: (result.total || 0) as number,
      };
    },
    { productos: [] as ProductoDetallado[], totalProductos: 0 }
  );

  const maxVenta = Math.max(0, ...productos.map((p) => p.totalVentas || 0));
  const paginas = Math.ceil(totalProductos / rowsPerPage);

  return (
    <Panel
      titulo="Productos vendidos"
      descripcion={
        cargando
          ? "Cargando…"
          : `${totalProductos.toLocaleString("es-CL")} productos · mostrando ${(offset + 1).toLocaleString("es-CL")}–${(offset + productos.length).toLocaleString("es-CL")}`
      }
    >
      {cargando ? (
        Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} height={52} />)
      ) : productos.length === 0 ? (
        <Typography sx={{ color: tinta.tenue, fontSize: 13, py: 6, textAlign: "center" }}>No se encontraron productos.</Typography>
      ) : (
        <>
          <TableContainer sx={{ maxHeight: 640, mx: -2.5, width: "auto", overflowX: "hidden" }}>
            <Table size="small" stickyHeader sx={tablaSx}>
          <Columnas anchos={[26, 16, 9, 13, 10, 11, 8, 7]} />
              <TableHead>
                <TableRow>
                  <TableCell sx={{ pl: 2.5 }}>Producto</TableCell>
                  <TableCell>Primer nivel / Categoría</TableCell>
                  <TableCell align="right">Cantidad</TableCell>
                  <TableCell align="right">Total ventas</TableCell>
                  <TableCell align="right">Precio prom.</TableCell>
                  <TableCell align="right">Margen bruto</TableCell>
                  <TableCell align="right">% Margen</TableCell>
                  <TableCell align="right" sx={{ pr: 2.5 }}>Stock</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {productos.map((row) => (
                  <TableRow key={row.sku}>
                    <TableCell sx={{ pl: 2.5 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                        <Box
                          component="img"
                          src={row.imagen || SIN_IMAGEN}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = SIN_IMAGEN;
                          }}
                          alt=""
                          sx={{ width: 30, height: 30, objectFit: "contain", borderRadius: "8px", border: `1px solid ${tinta.borde}`, bgcolor: "#fff", flexShrink: 0 }}
                        />
                        <TextoCelda texto={row.nombre} secundario={row.sku} />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <TextoCelda texto={row.primerNivel || "—"} secundario={row.categoria || "—"} fuerte={false} />
                    </TableCell>
                    <TableCell align="right">{(cifra(row.cantidadVendida) ?? 0).toLocaleString("es-CL")}</TableCell>
                    <TableCell align="right">
                      {formatoPesos(row.totalVentas)}
                      <Box sx={{ mt: 0.5 }}>
                        <BarraParticipacion valor={row.totalVentas || 0} maximo={maxVenta} />
                      </Box>
                    </TableCell>
                    <TableCell align="right">{formatoPesos(cifra(row.precioPromedio) ?? 0)}</TableCell>
                    <TableCell align="right">{formatoPesos(cifra(row.margenBruto) ?? 0)}</TableCell>
                    <TableCell align="right">
                      <ChipMargen valor={row.margenPorcentaje} />
                    </TableCell>
                    <TableCell align="right" sx={{ pr: 2.5 }}>
                      {cifra(row.stockCanal) != null ? cifra(row.stockCanal)!.toLocaleString("es-CL") : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {paginas > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <Pagination count={paginas} page={paginaActual} onChange={(_, p) => setPage(p)} color="primary" shape="rounded" />
            </Box>
          )}
        </>
      )}
    </Panel>
  );
};

export default ProductosVendidos;
