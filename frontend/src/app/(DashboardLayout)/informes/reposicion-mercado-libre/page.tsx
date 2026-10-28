"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Box, Button, InputAdornment, Pagination, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography } from "@mui/material";
import { IconAlertTriangle, IconCircleX, IconDownload, IconHelpCircle, IconPackageImport, IconSearch, IconTrendingDown, IconClockExclamation } from "@tabler/icons-react";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { useApiDatos } from "@/utils/useCargaDatos";
import { useEstadoVista } from "@/utils/estadoVista";
import MetricCard from "@/app/(DashboardLayout)/utilities/ventas/components/MetricCard";
import { conPeriodoRapido, etiquetaRango, presetsDeHoy, resolverPeriodoRapido } from "@/app/(DashboardLayout)/utilities/ventas/components/RangosRapidos";
import { Columnas, Pildoras, TextoCelda, cifraSx, controlSx, etiquetaControlSx, formatoMonto, formatoPesos, tablaSx, tarjetaSx, tinta } from "@/app/(DashboardLayout)/utilities/ventas/components/estilo";
import { descargarExcel } from "@/app/(DashboardLayout)/utilities/ventas/components/detalle/comun";
import HeaderMl, { RangoMl } from "@/app/(DashboardLayout)/utilities/ventas/mercado-libre/components/HeaderMl";
import { CeldaStock } from "@/app/(DashboardLayout)/utilities/ventas/mercado-libre/components/StockBodegas";
import { Par, fechaCorta, tipoEnvio, unidades, urlMl } from "@/app/(DashboardLayout)/utilities/ventas/mercado-libre/components/comun";

type Lado = "full" | "colecta";
type Estado = "sin_stock" | "critico" | "bajo" | "sin_dato";

interface FilaReposicion {
  sku: string;
  nombre: string | null;
  categoria: string | null;
  lado: Lado;
  unidades: number;
  venta: Par;
  ventaDiaria: number;
  stock: number | null;
  stockAl: string | null;
  stockFull: number | null;
  stockFullAl: string | null;
  stock03: number | null;
  stockOtras: number;
  diasStock: number | null;
  estado: Estado;
  sugerido: number | null;
}

interface Reposicion {
  periodo: { desde: string; hasta: string };
  datosAl: string | null;
  dias: number;
  criterio: { umbral: number; cubrir: number; minUnidades: number; critico: number };
  resumen: { analizados: number; sinStock: number; critico: number; bajo: number; sinDato: number; sugeridoUnidades: number; ventaEnRiesgo: Par };
  filas: FilaReposicion[];
}

const ESTADOS: Record<Estado, { texto: string; color: string; fondo: string }> = {
  sin_stock: { texto: "Sin stock", color: "#b42318", fondo: "#fef3f2" },
  critico: { texto: "Crítico", color: "#c4320a", fondo: "#fff4ed" },
  bajo: { texto: "Bajo", color: "#b54708", fondo: "#fffaeb" },
  sin_dato: { texto: "Sin dato", color: "#475569", fondo: "#f1f5f9" },
};

const OPCIONES_LADO: { valor: Lado | "ambos"; texto: string }[] = [
  { valor: "ambos", texto: "Full y Colecta" },
  { valor: "full", texto: "Full" },
  { valor: "colecta", texto: "Colecta" },
];
const UMBRALES = [
  { valor: "7", texto: "7 días" },
  { valor: "15", texto: "15 días" },
  { valor: "30", texto: "30 días" },
];
const CUBRIR = [
  { valor: "15", texto: "15 días" },
  { valor: "30", texto: "30 días" },
  { valor: "60", texto: "60 días" },
];
const MINIMOS = [
  { valor: "1", texto: "1+" },
  { valor: "3", texto: "3+" },
  { valor: "5", texto: "5+" },
  { valor: "10", texto: "10+" },
];
const POR_PAGINA = 50;

/** Últimos 30 días: la venta diaria se mide sobre un mes. */
const rangoInforme = (): RangoMl => {
  const p = presetsDeHoy().find((x) => x.label === "Últimos 30 días")!;
  return { fechaInicio: p.inicio, fechaFin: p.fin };
};

type Filtros = RangoMl & { lado: Lado | ""; umbral: string; cubrir: string; minUnidades: string; estado: Estado | "" };
const inicial = (): Filtros => ({ lado: "", umbral: "15", cubrir: "30", minUnidades: "3", estado: "", ...rangoInforme() });

const dec = (v: number, d = 1) => v.toLocaleString("es-CL", { maximumFractionDigits: d, minimumFractionDigits: v < 10 && v % 1 ? d : 0 });

function ChipEstado({ estado, dias }: { estado: Estado; dias: number | null }) {
  const e = ESTADOS[estado];
  return (
    <Box sx={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end", gap: 0.25 }}>
      <Box component="span" sx={{ px: 0.85, py: 0.2, borderRadius: 999, bgcolor: e.fondo, color: e.color, fontSize: 11.5, fontWeight: 700, whiteSpace: "nowrap" }}>
        {e.texto}
      </Box>
      {dias != null && estado !== "sin_stock" && (
        <Box component="span" sx={{ fontSize: 11, color: tinta.secundaria, ...cifraSx }}>
          {dias < 1 ? "menos de 1 día" : `${dec(dias)} días`}
        </Box>
      )}
    </Box>
  );
}

/**
 * Informe: reposición de Mercado Libre. Productos que se venden y a los que
 * les quedan pocos días de stock en el lado por donde se venden (Full: bodega
 * de ML; Colecta: bodega 03), ordenados por urgencia, con cuánto reponer y
 * cuánto hay en las otras bodegas. El stock se pulsa para verlo en vivo.
 */
export default function InformeReposicionMercadoLibre() {
  const router = useRouter();
  const [filtros, setFiltros] = useEstadoVista<Filtros>("informe-reposicion-ml", inicial, {
    serializar: conPeriodoRapido,
    restaurar: (g) => ({ ...inicial(), ...resolverPeriodoRapido<Filtros>(g) }),
  });
  const cambiar = (c: Partial<Filtros>) => setFiltros((f) => ({ ...f, ...c }));

  const [buscar, setBuscar] = React.useState("");
  const [pagina, setPagina] = React.useState(1);
  const [descargando, setDescargando] = React.useState(false);
  React.useEffect(() => setPagina(1), [filtros, buscar]);

  const datos = useApiDatos<Reposicion | null>(
    urlMl("reposicion", {
      fechaInicio: filtros.fechaInicio,
      fechaFin: filtros.fechaFin,
      lado: filtros.lado,
      umbral: filtros.umbral,
      cubrir: filtros.cubrir,
      minUnidades: filtros.minUnidades,
    }),
    null
  );
  const r = datos.datos;

  const q = buscar.trim().toLowerCase();
  const filas = (r?.filas ?? [])
    .filter((f) => !filtros.estado || f.estado === filtros.estado)
    .filter((f) => !q || f.sku.toLowerCase().includes(q) || (f.nombre ?? "").toLowerCase().includes(q) || (f.categoria ?? "").toLowerCase().includes(q));
  const paginas = Math.max(1, Math.ceil(filas.length / POR_PAGINA));
  const visibles = filas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  const nombreLado = filtros.lado ? tipoEnvio(filtros.lado)!.nombre : "Full y Colecta";

  const elegirEstado = (e: Estado) => cambiar({ estado: filtros.estado === e ? "" : e });
  const tarjeta = (estado: Estado, title: string, valor: number | undefined, subtitle: string, icon: React.ReactNode, nota: string) => ({
    title,
    value: unidades(valor),
    subtitle: filtros.estado === estado ? "Filtrando · clic para quitar" : subtitle,
    icon,
    nota,
    onClick: () => elegirEstado(estado),
  });
  const tarjetas = [
    tarjeta("sin_stock", "Sin stock", r?.resumen.sinStock, "Se venden y no queda nada", <IconCircleX />, "Productos con venta en el período y stock 0 en su lado. Clic para ver solo estos."),
    tarjeta(
      "critico",
      "Crítico",
      r?.resumen.critico,
      `Menos de ${dec(r?.criterio.critico ?? 7, 1)} días`,
      <IconAlertTriangle />,
      "Les alcanza el stock para menos de 7 días (o la mitad del umbral). Clic para ver solo estos."
    ),
    tarjeta("bajo", "Bajo", r?.resumen.bajo, `Menos de ${filtros.umbral} días`, <IconTrendingDown />, "Les alcanza el stock para menos del umbral elegido. Clic para ver solo estos."),
    tarjeta(
      "sin_dato",
      "Full sin dato",
      r?.resumen.sinDato,
      "Revisar en ML",
      <IconHelpCircle />,
      "Venden por Full pero no hay stock Full guardado. Pulsa el stock de la fila para consultarlo a ML en vivo."
    ),
    {
      title: "Unidades a reponer",
      value: unidades(r?.resumen.sugeridoUnidades),
      subtitle: `Para cubrir ${filtros.cubrir} días`,
      icon: <IconPackageImport />,
      nota: "Suma del sugerido: venta diaria × días a cubrir − stock actual. No incluye los Full sin dato.",
    },
    {
      title: "Venta en riesgo",
      value: formatoMonto(r?.resumen.ventaEnRiesgo.neto),
      subtitle: "Del período, sin IVA",
      icon: <IconClockExclamation />,
      nota: `Lo que vendieron en el período los productos de esta lista. Con IVA: ${formatoPesos(r?.resumen.ventaEnRiesgo.conIva)}.`,
    },
  ];

  const exportar = async () => {
    setDescargando(true);
    try {
      await descargarExcel(`reposicion_ml_${filtros.lado || "full_y_colecta"}_${filtros.fechaInicio}_${filtros.fechaFin}`, [
        {
          nombre: "Reposición ML",
          filas: filas.map((f, i) => ({
            "#": i + 1,
            Estado: ESTADOS[f.estado].texto,
            SKU: f.sku,
            Producto: f.nombre ?? "",
            "Categoría ML": f.categoria ?? "",
            Envío: tipoEnvio(f.lado)!.nombre,
            [`Unidades vendidas (${r?.dias ?? ""} días)`]: f.unidades,
            "Venta diaria": Math.round(f.ventaDiaria * 100) / 100,
            Stock: f.stock ?? "",
            "Stock al": f.lado === "full" ? (f.stockAl ? f.stockAl.slice(0, 10) : "sin dato") : "SAP",
            "Días de stock": f.diasStock == null ? "" : Math.round(f.diasStock * 10) / 10,
            "Otras bodegas (01, 07, 08, 13)": f.stockOtras,
            [`Sugerido (${filtros.cubrir} días)`]: f.sugerido ?? "",
            "Venta sin IVA": Math.round(f.venta.neto ?? 0),
          })),
        },
      ]);
    } finally {
      setDescargando(false);
    }
  };

  return (
    <PageContainer title="Reposición Mercado Libre" description="Productos de Mercado Libre que se venden y les queda poco stock">
      <Box sx={{ maxWidth: 1680, mx: "auto" }}>
        <HeaderMl
          titulo="Reposición Mercado Libre"
          contexto={nombreLado}
          rango={filtros}
          onRango={(x) => cambiar(x)}
          datosAl={datos.cargando ? undefined : r?.datosAl ?? null}
          enEstadoInicial={
            !filtros.lado && !filtros.estado && filtros.umbral === "15" && filtros.cubrir === "30" && filtros.minUnidades === "3" && etiquetaRango(filtros.fechaInicio, filtros.fechaFin) === "Últimos 30 días"
          }
          onLimpiar={() => {
            setFiltros(inicial());
            setBuscar("");
          }}
          acciones={
            <Button
              variant="contained"
              disableElevation
              startIcon={<IconDownload size={16} />}
              disabled={descargando || datos.cargando || filas.length === 0}
              onClick={exportar}
              sx={{ textTransform: "none", borderRadius: "10px", height: 34, fontWeight: 700, whiteSpace: "nowrap" }}
            >
              <span className="boton-texto">{descargando ? "Generando…" : "Excel"}</span>
            </Button>
          }
        >
          <Pildoras etiqueta="Envío" opciones={OPCIONES_LADO} valor={filtros.lado || "ambos"} onCambiar={(v) => cambiar({ lado: v === "ambos" ? "" : (v as Lado) })} />
        </HeaderMl>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(3, 1fr)", xl: "repeat(6, 1fr)" }, gap: 2, mb: 2 }}>
          {tarjetas.map((t) => (
            <MetricCard key={t.title} {...t} cargando={datos.cargando} />
          ))}
        </Box>

        <Box sx={{ ...tarjetaSx, pt: 2, pb: 1 }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 2, px: 2.5, mb: 1.5 }}>
            <TextField
              size="small"
              placeholder="Buscar SKU, producto o categoría"
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              InputProps={{
                sx: controlSx,
                startAdornment: (
                  <InputAdornment position="start">
                    <IconSearch size={16} color={tinta.tenue} />
                  </InputAdornment>
                ),
              }}
              sx={{ width: { xs: "100%", sm: 280 } }}
            />
            <Box>
              <Typography sx={etiquetaControlSx}>Poco stock = menos de</Typography>
              <Pildoras etiqueta="Umbral de días" opciones={UMBRALES} valor={filtros.umbral} onCambiar={(v) => cambiar({ umbral: v })} />
            </Box>
            <Box>
              <Typography sx={etiquetaControlSx}>Reponer para cubrir</Typography>
              <Pildoras etiqueta="Días a cubrir" opciones={CUBRIR} valor={filtros.cubrir} onCambiar={(v) => cambiar({ cubrir: v })} />
            </Box>
            <Box>
              <Typography sx={etiquetaControlSx}>Vendió al menos (unidades)</Typography>
              <Pildoras etiqueta="Mínimo vendido" opciones={MINIMOS} valor={filtros.minUnidades} onCambiar={(v) => cambiar({ minUnidades: v })} />
            </Box>
          </Box>
          <Typography sx={{ fontSize: 12, color: tinta.tenue, px: 2.5, mb: 1 }}>
            {datos.cargando
              ? "Cargando…"
              : `${unidades(filas.length)} de ${unidades(r?.resumen.analizados)} productos con venta están bajo ${filtros.umbral} días de stock${filtros.estado ? ` · solo «${ESTADOS[filtros.estado].texto}»` : ""}. Días de stock = stock ÷ venta diaria de los últimos ${r?.dias ?? ""} días. Full: stock guardado de ML (pulsa para verlo en vivo); Colecta: bodega 03.`}
          </Typography>

          <TableContainer sx={{ overflowX: { xs: "auto", lg: "hidden" } }}>
            <Table size="small" sx={{ ...tablaSx, minWidth: { xs: 900, lg: 0 } }}>
              <Columnas anchos={[4, 31, 8, 10, 12, 12, 10, 13]} />
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Producto</TableCell>
                  <TableCell>Envío</TableCell>
                  <TableCell align="right">Vende/día</TableCell>
                  <TableCell align="right">Stock</TableCell>
                  <TableCell align="right">Alcanza</TableCell>
                  <TableCell align="right">Otras bod.</TableCell>
                  <TableCell align="right">Reponer</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {datos.cargando ? (
                  Array.from({ length: 12 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={8}>
                        <Skeleton height={30} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : visibles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <Typography sx={{ color: tinta.tenue, fontSize: 13, py: 4, textAlign: "center" }}>
                        {q || filtros.estado ? "Ningún producto coincide con el filtro." : "Ningún producto con venta está bajo el umbral de stock."}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  visibles.map((f, i) => {
                    const lado = tipoEnvio(f.lado)!;
                    return (
                      <TableRow key={`${f.sku}-${f.lado}`}>
                        <TableCell sx={{ color: `${tinta.tenue} !important` }}>{(pagina - 1) * POR_PAGINA + i + 1}</TableCell>
                        <TableCell>
                          <Box
                            role="link"
                            tabIndex={0}
                            onClick={() => router.push(`/utilities/analisis-producto1.1?itemCode=${encodeURIComponent(f.sku)}`)}
                            onKeyDown={(e) => e.key === "Enter" && router.push(`/utilities/analisis-producto1.1?itemCode=${encodeURIComponent(f.sku)}`)}
                            sx={{ cursor: "pointer", "&:hover p:first-of-type": { color: tinta.acento } }}
                          >
                            <TextoCelda texto={f.nombre ?? "Sin nombre en SAP"} secundario={[f.sku, f.categoria ?? "Sin categoría ML"].join(" · ")} />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.6, fontSize: 12, fontWeight: 600 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: "2px", bgcolor: lado.color }} />
                            {lado.nombre}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title={`${unidades(f.unidades)} unidades en ${r?.dias ?? ""} días · ${formatoPesos(f.venta.neto)} sin IVA`} placement="top" arrow>
                            <Box component="span" sx={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end" }}>
                              <Box component="span" sx={{ fontWeight: 700 }}>{dec(f.ventaDiaria, 2)}</Box>
                              <Box component="span" sx={{ fontSize: 10.5, color: tinta.tenue }}>{unidades(f.unidades)} u. en el período</Box>
                            </Box>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="right">
                          <CeldaStock producto={f} tipo={f.lado} />
                          {f.lado === "full" && f.stockAl && <Box sx={{ fontSize: 10, color: tinta.tenue }}>al {fechaCorta(f.stockAl)}</Box>}
                        </TableCell>
                        <TableCell align="right">
                          <ChipEstado estado={f.estado} dias={f.diasStock} />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Stock en las bodegas de venta 01, 07, 08 y 13 de SAP: de donde se puede reponer." placement="top" arrow>
                            <Box component="span" sx={{ fontWeight: 600, color: f.stockOtras > 0 ? tinta.primaria : tinta.tenue }}>{unidades(f.stockOtras)}</Box>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="right">
                          {f.sugerido == null ? (
                            <Box component="span" sx={{ fontSize: 11.5, color: tinta.tenue }}>ver stock en ML</Box>
                          ) : (
                            <Box component="span" sx={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end" }}>
                              <Box component="span" sx={{ fontWeight: 750, color: tinta.acento }}>{unidades(f.sugerido)} u.</Box>
                              {f.sugerido > f.stockOtras && (
                                <Box component="span" sx={{ fontSize: 10.5, color: "#b54708" }}>
                                  {f.stockOtras > 0 ? `solo hay ${unidades(f.stockOtras)} en bodegas` : "sin stock en bodegas"}
                                </Box>
                              )}
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {paginas > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 1.5 }}>
              <Pagination count={paginas} page={pagina} onChange={(_, p) => setPagina(p)} shape="rounded" size="small" />
            </Box>
          )}
        </Box>
      </Box>
    </PageContainer>
  );
}
