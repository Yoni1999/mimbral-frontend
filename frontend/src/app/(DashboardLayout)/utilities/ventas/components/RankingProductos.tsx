"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Box, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { apiJson } from "@/utils/apiClient";
import { useCargaDatos } from "@/utils/useCargaDatos";
import { useEstadoVista } from "@/utils/estadoVista";
import { BACKEND_URL } from "@/config";
import {
  BarraParticipacion,
  ChipMargen,
  ChipVariacion,
  Columnas,
  Panel,
  Pildoras,
  TextoCelda,
  cifraSx,
  formatoMonto,
  tablaSx,
  tinta,
} from "./estilo";

type Medida = "totalVentas" | "cantidadVendida" | "margenBruto" | "margenPorcentaje";
type Orden = "desc" | "asc";

const MEDIDAS: { valor: Medida; texto: string }[] = [
  { valor: "totalVentas", texto: "Venta" },
  { valor: "cantidadVendida", texto: "Unidades" },
  { valor: "margenBruto", texto: "Margen $" },
  { valor: "margenPorcentaje", texto: "% Margen" },
];

const ORDENES: { valor: Orden; texto: string }[] = [
  { valor: "desc", texto: "Más" },
  { valor: "asc", texto: "Menos" },
];

const CANTIDADES = [
  { valor: "10", texto: "10" },
  { valor: "25", texto: "25" },
  { valor: "50", texto: "50" },
];

const SIN_IMAGEN = "https://res.cloudinary.com/dhzahos7u/image/upload/v1748960388/producto_sin_imagen_vqaps4.jpg";

/** El back entrega algunas cifras con su apertura por canal: se usa el total. */
const cifra = (v: unknown): number => (typeof v === "number" ? v : Number((v as { total?: number } | null)?.total) || 0);

interface Producto {
  sku: string;
  nombre: string;
  imagen?: string;
  venta: number;
  unidades: number;
  margen: number;
  margenPorcentaje: number;
}

const valorDe = (p: Producto, m: Medida) =>
  m === "totalVentas" ? p.venta : m === "cantidadVendida" ? p.unidades : m === "margenBruto" ? p.margen : p.margenPorcentaje;

interface Props {
  /** Filtros de /api/obtener-productos-detallado: fechaInicio, fechaFin,
   *  canal, vendedor, primerNivel, categoria, subcategoria (códigos). */
  parametros: Record<string, string | undefined>;
  /** Clave con que se recuerdan orden, medida y cantidad elegidos. */
  claveVista: string;
  /** Variación de la venta: endpoint con [{ItemCode, PorcentajeCambio,
   *  Total_Ventas_Anterior}] y el texto de contra qué se compara. */
  comparacion?: { url: string; texto: string };
  /** Al pulsar un producto. Por defecto abre su Análisis de producto. */
  onElegir?: (producto: { sku: string; nombre: string; imagen?: string }) => void;
}

/** Ranking de productos: más o menos vendidos, medidos por venta, unidades o
 *  margen, con foto y SKU. La venta trae su variación cuando hay
 *  `comparacion` y el producto aparece en ella. */
const RankingProductos: React.FC<Props> = ({ parametros, claveVista, comparacion: fuenteComparacion, onElegir }) => {
  const router = useRouter();
  const elegir =
    onElegir ?? ((p: { sku: string }) => router.push(`/utilities/analisis-producto1.1?itemCode=${encodeURIComponent(p.sku)}`));
  const [vista, setVista] = useEstadoVista<{ medida: Medida; orden: Orden; cantidad: string }>(claveVista, () => ({
    medida: "totalVentas",
    orden: "desc",
    cantidad: "10",
  }));
  const { medida, orden, cantidad } = vista;

  const params = new URLSearchParams({ orderBy: medida, order: orden, limit: cantidad, offset: "0" });
  Object.entries(parametros).forEach(([k, v]) => v && params.set(k, v));
  const url = `${BACKEND_URL}/api/obtener-productos-detallado?${params.toString()}`;

  const { datos, cargando } = useCargaDatos<{ productos: Producto[]; total: number }>(
    url,
    async (signal) => {
      const r = await apiJson(url, { signal });
      return {
        productos: (Array.isArray(r?.data) ? r.data : []).map((p: any) => ({
          sku: p.sku,
          nombre: p.nombre,
          imagen: p.imagen || undefined,
          venta: Number(p.totalVentas) || 0,
          unidades: cifra(p.cantidadVendida),
          margen: cifra(p.margenBruto),
          margenPorcentaje: Number(p.margenPorcentaje) || 0,
        })),
        total: Number(r?.total) || 0,
      };
    },
    { productos: [], total: 0 }
  );

  // Variación de la venta (solo los productos que trae la comparación).
  const urlComparacion = fuenteComparacion?.url ?? null;
  const { datos: comparacion } = useCargaDatos<Record<string, { cambio: number | null; anterior: number }>>(
    urlComparacion,
    async (signal) => {
      const json = await apiJson(urlComparacion!, { signal });
      return Object.fromEntries(
        (Array.isArray(json) ? json : []).map((p: any) => [
          p.ItemCode,
          { cambio: p.PorcentajeCambio ?? null, anterior: Number(p.Total_Ventas_Anterior) || 0 },
        ])
      );
    },
    {}
  );

  const { productos, total } = datos;
  const maximo = Math.max(0, ...productos.map((p) => Math.abs(valorDe(p, medida))));
  const nombreMedida = MEDIDAS.find((m) => m.valor === medida)!.texto.toLowerCase();

  const barra = (p: Producto, m: Medida) =>
    m === medida && (
      <Box sx={{ mt: 0.5 }}>
        <BarraParticipacion valor={Math.abs(valorDe(p, m))} maximo={maximo} color={valorDe(p, m) < 0 ? "#b42318" : tinta.acento} />
      </Box>
    );

  const encabezado = (m: Medida, texto: string) => (
    <TableCell align="right" sx={m === medida ? { color: `${tinta.acento} !important` } : undefined}>
      {texto}
    </TableCell>
  );

  return (
    <Panel
      titulo={`${orden === "desc" ? "Más" : "Menos"} vendidos por ${nombreMedida}`}
      descripcion={
        cargando
          ? "Cargando…"
          : `${total.toLocaleString("es-CL")} productos con venta en el período${fuenteComparacion ? ` · variación de la venta ${fuenteComparacion.texto}` : ""}`
      }
      accion={
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap justifyContent="flex-end">
          <Pildoras etiqueta="Orden" opciones={ORDENES} valor={orden} onCambiar={(o) => setVista((v) => ({ ...v, orden: o }))} />
          <Pildoras etiqueta="Medir por" opciones={MEDIDAS} valor={medida} onCambiar={(m) => setVista((v) => ({ ...v, medida: m }))} />
          <Pildoras etiqueta="Cantidad" opciones={CANTIDADES} valor={cantidad} onCambiar={(c) => setVista((v) => ({ ...v, cantidad: c }))} />
        </Stack>
      }
    >
      {cargando ? (
        Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} height={48} />)
      ) : productos.length === 0 ? (
        <Typography sx={{ color: tinta.tenue, fontSize: 13, py: 6, textAlign: "center" }}>Sin ventas en el período.</Typography>
      ) : (
        <TableContainer sx={{ maxHeight: 640, mx: -2.5, width: "auto", overflowX: "hidden" }}>
          <Table size="small" stickyHeader sx={tablaSx}>
            <Columnas anchos={[5, 39, 20, 12, 13, 11]} />
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Producto</TableCell>
                {encabezado("totalVentas", "Venta")}
                {encabezado("cantidadVendida", "Unidades")}
                {encabezado("margenBruto", "Margen $")}
                {encabezado("margenPorcentaje", "% Margen")}
              </TableRow>
            </TableHead>
            <TableBody>
              {productos.map((p, i) => {
                const comp = comparacion[p.sku];
                return (
                  <TableRow
                    key={p.sku}
                    hover
                    onClick={() => elegir(p)}
                    title="Ver análisis del producto"
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell sx={{ color: `${tinta.tenue} !important`, ...cifraSx }}>{i + 1}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
                        <Box
                          component="img"
                          src={p.imagen || SIN_IMAGEN}
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.onerror = null;
                            img.src = SIN_IMAGEN;
                          }}
                          alt=""
                          sx={{ width: 34, height: 34, objectFit: "contain", borderRadius: "8px", border: `1px solid ${tinta.borde}`, bgcolor: "#fff", flexShrink: 0 }}
                        />
                        <TextoCelda texto={p.nombre} secundario={`SKU ${p.sku}`} />
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box
                        sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.75 }}
                        title={comp ? `Antes: ${formatoMonto(comp.anterior)}` : undefined}
                      >
                        {formatoMonto(p.venta)}
                        {comp && <ChipVariacion valor={comp.cambio} />}
                      </Box>
                      {barra(p, "totalVentas")}
                    </TableCell>
                    <TableCell align="right">
                      {p.unidades.toLocaleString("es-CL", { maximumFractionDigits: 2 })}
                      {barra(p, "cantidadVendida")}
                    </TableCell>
                    <TableCell align="right">
                      {formatoMonto(p.margen)}
                      {barra(p, "margenBruto")}
                    </TableCell>
                    <TableCell align="right">
                      <ChipMargen valor={p.margenPorcentaje} />
                      {barra(p, "margenPorcentaje")}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Panel>
  );
};

export default RankingProductos;
