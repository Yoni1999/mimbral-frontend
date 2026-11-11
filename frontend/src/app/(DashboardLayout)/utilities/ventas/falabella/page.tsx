"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Box, Button, Grid, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { IconArrowRight, IconCurrencyDollar, IconInfoCircle, IconPackages, IconPigMoney } from "@tabler/icons-react";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { useApiDatos } from "@/utils/useCargaDatos";
import { useEstadoVista } from "@/utils/estadoVista";
import MetricCard from "../components/MetricCard";
import SeccionTitulo from "../components/SeccionTitulo";
import ListaBarras from "../components/ListaBarras";
import { conPeriodoRapido, etiquetaRango, rangoInicial, resolverPeriodoRapido } from "../components/RangosRapidos";
import { Panel, Pildoras, cifraSx, formatoMonto, formatoPesos, formatoPorcentaje, tinta } from "../components/estilo";
import HeaderMl, { RangoMl } from "../mercado-libre/components/HeaderMl";
import { Miniatura } from "../mercado-libre/components/TablaInforme";
import { variacion } from "../mercado-libre/components/comun";
import { Aviso, n, unidades } from "../../categorias/mercado-libre/components/comun";
import { BarraTiposFal, ComparativoFal, FiltroTipo, OPCIONES_TIPO, ProductosFal, TIPOS_FAL, pesos, rutaProductos, urlFal } from "../../falabella/components/comun";
import { DesgloseFal, ResumenFal, TendenciaFal, VistaDesgloseFal } from "../../falabella/components/ventas";

const DESCRIPCION_TIPO = { full: "Despacha Falabella desde su bodega", normal: "Despacho desde nuestra bodega" } as const;
const porcentaje = (v: number | null | undefined) => (v == null ? "—" : formatoPorcentaje(v * 100));

/** Ventas → Falabella: cuánto se vende, cuánto cobra Falabella, cuánto queda y
 *  el margen después de todo (tarjetas pulsables con su detalle); reparto y
 *  tendencia por Full y despacho normal, categorías y productos más vendidos. */
export default function VentasFalabella() {
  const router = useRouter();
  const [vista, setVista] = useEstadoVista<RangoMl & { tipo: FiltroTipo }>("ventas-falabella", () => ({ tipo: "todos", ...rangoInicial() }), {
    serializar: conPeriodoRapido,
    restaurar: (g) => {
      const f = resolverPeriodoRapido<RangoMl & { tipo: FiltroTipo }>(g);
      return { tipo: f.tipo ?? "todos", ...(f.fechaInicio && f.fechaFin ? { fechaInicio: f.fechaInicio, fechaFin: f.fechaFin } : rangoInicial()) };
    },
  });
  const rango = { fechaInicio: vista.fechaInicio, fechaFin: vista.fechaFin };
  const params = { modo: "rango", ...rango };

  const resumen = useApiDatos<ResumenFal | null>(urlFal("resumen", params), null);
  const categorias = useApiDatos<ComparativoFal | null>(urlFal("comparativo", { ...params, nivel: 0 }), null);
  const productos = useApiDatos<ProductosFal | null>(urlFal("productos", { ...params, tipo: vista.tipo, limite: 10 }), null);
  const [desglose, setDesglose] = React.useState<VistaDesgloseFal | null>(null);

  const a = resumen.datos?.cifras.actual.total;
  const p = resumen.datos?.cifras.anterior.total;
  const cobra = n(a?.comision.neto) + n(a?.envio.neto);
  const queda = n(a?.venta.neto) - cobra;
  const pct = (parte: number, todo: number) => (todo ? (parte / todo) * 100 : null);
  const margenPct = a?.margenPct == null ? null : a.margenPct * 100;
  const margenPctAnterior = p?.margenPct == null ? null : p.margenPct * 100;

  // Tres tarjetas; cada una abre su detalle, igual que en Ventas → Mercado Libre.
  const tarjetas = [
    {
      title: "Venta Falabella",
      value: formatoMonto(a?.venta.neto),
      subtitle: `vs ${formatoMonto(p?.venta.neto)} · cobra Falabella ${formatoMonto(cobra)} · queda ${formatoMonto(queda)}${a?.pagadoClientes?.conIva != null ? ` · clientes pagaron ${formatoMonto(a.pagadoClientes.conIva)} con IVA` : ""}`,
      percentageChange: variacion(n(a?.venta.neto), n(p?.venta.neto)) ?? undefined,
      nota: `Sin IVA. Con IVA: ${formatoPesos(a?.venta.conIva)}. Falabella cobra ${formatoPesos(cobra)} (${formatoPorcentaje(pct(cobra, n(a?.venta.neto)))}) en comisión y despacho. ${a?.pagadoClientes?.conIva != null ? ` Los clientes pagaron ${formatoPesos(a.pagadoClientes.conIva)} con IVA: es la cifra comparable con «Ventas brutas» de Seller Center; la diferencia son descuentos que financia Falabella.` : ""} Pulsa para ver el cálculo.`,
      icon: <IconCurrencyDollar />,
      onClick: () => setDesglose("dinero"),
    },
    {
      title: "Unidades e ítems vendidos",
      value: `${unidades(a?.unidades)} u.`,
      subtitle: `${unidades(a?.productos)} ítems · vs ${unidades(p?.unidades)} u. y ${unidades(p?.productos)} ítems`,
      percentageChange: variacion(n(a?.unidades), n(p?.unidades)) ?? undefined,
      nota: "Unidades vendidas y productos distintos, sin canceladas ni devueltas. Pulsa para ver el detalle.",
      icon: <IconPackages />,
      onClick: () => setDesglose("unidades"),
    },
    {
      title: "Margen después de todo",
      value: formatoPorcentaje(margenPct),
      subtitle: `vs ${formatoPorcentaje(margenPctAnterior)} en el período anterior`,
      percentageChange: margenPct != null && margenPctAnterior != null ? margenPct - margenPctAnterior : undefined,
      unidadVariacion: "pp" as const,
      nota: "Margen sobre la venta: venta − comisión − despacho − costo de los productos (el que tenían en SAP el día de la venta), todo sin IVA. La variación es en puntos porcentuales. Pulsa para ver el cálculo.",
      icon: <IconPigMoney />,
      onClick: () => setDesglose("dinero"),
    },
  ];

  const filasTipo = TIPOS_FAL.map((t) => ({ ...t, totales: resumen.datos?.cifras.actual[t.clave] })).filter((f) => n(f.totales?.venta.neto) !== 0);
  const filasCategorias = (categorias.datos?.categorias ?? []).filter((c) => n(c.actual.venta.neto) !== 0).slice(0, 10);
  const filasProductos = (productos.datos?.filas ?? []).filter((f) => f.actual.unidades > 0);
  const celda = { fontSize: 13, py: 0.9, px: 1, borderColor: tinta.borde } as const;
  const cabecera = { ...celda, fontSize: 11, fontWeight: 700, color: tinta.secundaria, textTransform: "uppercase", letterSpacing: 0.3, whiteSpace: "nowrap" } as const;

  return (
    <PageContainer title="Ventas Falabella" description="Ventas de Falabella por tipo de envío: Full y despacho normal">
      <Box sx={{ maxWidth: 1680, mx: "auto" }}>
        <HeaderMl
          titulo="Ventas Falabella"
          contexto="Full y despacho normal"
          rango={rango}
          onRango={(r) => setVista((v) => ({ ...v, ...r }))}
          enEstadoInicial={vista.tipo === "todos" && etiquetaRango(rango.fechaInicio, rango.fechaFin) === "Ayer"}
          onLimpiar={() => setVista({ tipo: "todos", ...rangoInicial() })}
        />
        {resumen.error ? <Typography sx={{ color: "#b42318", fontSize: 13, mb: 2 }}>No se pudo cargar: {resumen.error instanceof Error ? resumen.error.message : String(resumen.error)}</Typography> : null}
        {resumen.datos?.estimaciones ? (
          <Box sx={{ mb: 2 }}>
            <Aviso tono="neutro" icono={<IconInfoCircle size={16} />}>
              {resumen.datos.estimaciones.margen} No incluye: {resumen.datos.estimaciones.noIncluye}
            </Aviso>
          </Box>
        ) : null}

        <Grid container spacing={2}>
          {tarjetas.map((t) => (
            <Grid item xs={12} sm={4} key={t.title}>
              <MetricCard {...t} cargando={resumen.cargando} onClick={resumen.datos ? t.onClick : undefined} />
            </Grid>
          ))}

          <Grid item xs={12}>
            <SeccionTitulo title="Por tipo de envío" infoRight="Montos sin IVA. Pasa el cursor para ver el con IVA y lo que cobra Falabella." />
          </Grid>
          <Grid item xs={12} lg={5}>
            <Panel titulo="Reparto de la venta" descripcion={resumen.cargando ? "Cargando…" : `Total del período: ${formatoMonto(a?.venta.neto)}`}>
              <ListaBarras
                cargando={resumen.cargando}
                filasCargando={2}
                vacio="Sin ventas en el período."
                items={filasTipo.map((f) => {
                  const c = n(f.totales?.comision.neto) + n(f.totales?.envio.neto);
                  return {
                    clave: f.clave,
                    etiqueta: f.nombre,
                    valor: n(f.totales?.venta.neto),
                    color: f.color,
                    texto: formatoMonto(f.totales?.venta.neto),
                    detalle: (
                      <Typography component="span" sx={{ fontSize: 12, color: tinta.tenue, minWidth: 44, textAlign: "right" }}>
                        {formatoPorcentaje(pct(n(f.totales?.venta.neto), n(a?.venta.neto)))}
                      </Typography>
                    ),
                    tooltip: [
                      DESCRIPCION_TIPO[f.clave],
                      `${unidades(f.totales?.unidades)} unidades`,
                      `${unidades(f.totales?.ordenes)} órdenes`,
                      `Con IVA ${formatoPesos(f.totales?.venta.conIva)}`,
                      `Cobra Falabella ${formatoPesos(c)} (${formatoPorcentaje(pct(c, n(f.totales?.venta.neto)))})`,
                      `Margen ${porcentaje(f.totales?.margenPct)}`,
                    ].join(" · "),
                  };
                })}
              />
            </Panel>
          </Grid>
          <Grid item xs={12} lg={7}>
            <TendenciaFal tendencia={resumen.datos?.tendencia ?? []} cargando={resumen.cargando} />
          </Grid>

          <Grid item xs={12}>
            <SeccionTitulo title="Categorías y productos" infoRight="Categorías según Falabella." />
          </Grid>
          <Grid item xs={12} lg={5}>
            <Panel
              titulo="Categorías de Falabella"
              descripcion="Primer nivel · pulsa una para ver sus productos"
              accion={
                <Button size="small" endIcon={<IconArrowRight size={14} />} onClick={() => router.push("/utilities/falabella/informe")} sx={{ textTransform: "none", fontWeight: 600 }}>
                  Ver informe
                </Button>
              }
            >
              <ListaBarras
                cargando={categorias.cargando}
                numerado
                vacio="Sin ventas en el período."
                items={filasCategorias.map((c) => ({
                  clave: c.id ?? "sin-categoria",
                  etiqueta: c.nombre,
                  valor: n(c.actual.venta.neto),
                  texto: formatoMonto(c.actual.venta.neto),
                  detalle: (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography component="span" sx={{ fontSize: 12, color: tinta.secundaria, minWidth: 46, textAlign: "right" }}>{porcentaje(c.actual.margenPct)}</Typography>
                      <Box sx={{ width: 56 }}>
                        <BarraTiposFal porTipo={c.actual.porTipo} />
                      </Box>
                    </Box>
                  ),
                  tooltip: `${porcentaje(c.participacion.actual)} del total · ${unidades(c.actual.unidades)} unidades · ${unidades(c.actual.productos)} productos · margen ${porcentaje(c.actual.margenPct)}`,
                }))}
                onSeleccionar={(item) => item.clave !== "sin-categoria" && router.push(rutaProductos(item.clave))}
              />
            </Panel>
          </Grid>
          <Grid item xs={12} lg={7}>
            <Panel
              titulo="Productos más vendidos"
              descripcion="Top 10 por venta del período"
              accion={
                <Button size="small" endIcon={<IconArrowRight size={14} />} onClick={() => router.push(rutaProductos())} sx={{ textTransform: "none", fontWeight: 600, whiteSpace: "nowrap" }}>
                  Informe completo
                </Button>
              }
            >
              <Box sx={{ mb: 1.5 }}>
                <Pildoras<FiltroTipo> etiqueta="Tipo de envío" opciones={OPCIONES_TIPO} valor={vista.tipo} onCambiar={(tipo) => setVista((v) => ({ ...v, tipo }))} />
              </Box>
              <Box sx={{ overflowX: "auto" }}>
                <Table size="small" sx={{ minWidth: 620 }}>
                  <TableHead>
                    <TableRow>
                      {["#", "Producto", "Venta", "Unid.", "Comisión", "Despacho/u", "Margen %", "Full · Normal"].map((h, i) => (
                        <TableCell key={h} align={i >= 2 && i <= 6 ? "right" : "left"} sx={cabecera}>
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filasProductos.map((f, i) => (
                      <TableRow key={f.sku}>
                        <TableCell sx={{ ...celda, color: tinta.tenue, width: 24 }}>{i + 1}</TableCell>
                        <TableCell sx={{ ...celda, maxWidth: 300 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
                            <Miniatura url={f.imagen} titulo={f.nombre ?? f.sku} />
                            <Box sx={{ minWidth: 0 }}>
                              <Box sx={{ fontWeight: 600, color: tinta.primaria, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.nombre ?? f.sku}</Box>
                              <Box component={Link} href={`/utilities/analisis-producto1.1?itemCode=${encodeURIComponent(f.sku)}`} sx={{ fontSize: 11.5, color: tinta.acento, textDecoration: "none" }}>
                                {f.sku}
                              </Box>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ ...celda, ...cifraSx, fontWeight: 700 }}>{formatoMonto(f.actual.venta.neto)}</TableCell>
                        <TableCell align="right" sx={{ ...celda, ...cifraSx }}>{unidades(f.actual.unidades)}</TableCell>
                        <TableCell align="right" sx={{ ...celda, ...cifraSx }}>{porcentaje(f.comisionPct)}</TableCell>
                        <TableCell align="right" sx={{ ...celda, ...cifraSx }}>{f.actual.unidades ? pesos(n(f.actual.envio.neto) / f.actual.unidades) : "—"}</TableCell>
                        <TableCell align="right" sx={{ ...celda, ...cifraSx, fontWeight: 700, color: f.actual.margenPct == null ? tinta.tenue : f.actual.margenPct < 0 ? "#b42318" : f.actual.margenPct < 0.1 ? "#b54708" : "#067647" }}>
                          {porcentaje(f.actual.margenPct)}
                        </TableCell>
                        <TableCell sx={{ ...celda, minWidth: 70 }}>
                          <BarraTiposFal porTipo={f.actual.porTipo} />
                        </TableCell>
                      </TableRow>
                    ))}
                    {!productos.cargando && filasProductos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} sx={{ ...celda, color: tinta.tenue, textAlign: "center", py: 4 }}>
                          Sin ventas en el período.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </Box>
            </Panel>
          </Grid>
        </Grid>
      </Box>
      {desglose && resumen.datos ? (
        <DesgloseFal vista={desglose} resumen={resumen.datos} etiquetaPeriodo={etiquetaRango(rango.fechaInicio, rango.fechaFin)} onCerrar={() => setDesglose(null)} />
      ) : (
        <></>
      )}
    </PageContainer>
  );
}
