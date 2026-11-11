"use client";

import React from "react";
import Link from "next/link";
import { Box, Grid, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { IconCash, IconPackages, IconPercentage, IconReceipt, IconShoppingCart, IconTruckDelivery } from "@tabler/icons-react";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { useApiDatos } from "@/utils/useCargaDatos";
import { useEstadoVista } from "@/utils/estadoVista";
import MetricCard from "../../ventas/components/MetricCard";
import SeccionTitulo from "../../ventas/components/SeccionTitulo";
import { Panel, Pildoras, cifraSx, formatoMonto, formatoPorcentaje, tinta } from "../../ventas/components/estilo";
import { SelectorPeriodo, mensajeError, n, nombreMes, parametrosPeriodo, pct, pp, unidades } from "../../categorias/mercado-libre/components/comun";
import { AvisosFal, BarraTiposFal, BloqueFal, ComparativoFal, EvolucionFal, FiltroTipo, LeyendaTiposFal, OPCIONES_TIPO, TablaCategoriasFal, pesos, rutaProductos, urlFal, usePeriodoFal, useTipoFal } from "../components/comun";

type Paso = { id: string; nombre: string };

const porcentaje = (v: number | null | undefined) => (v == null ? "—" : formatoPorcentaje(v * 100));
/** Parte de la venta que se va en un costo. */
const parte = (b: BloqueFal | undefined, campo: "comision" | "envio") => (b && n(b.venta.conIva) > 0 ? n(b[campo].conIva) / n(b.venta.conIva) : null);

/** Falabella: venta, costos y margen por categoría, un período contra otro, con Full y despacho normal. */
export default function InformeFalabella() {
  const [periodo, setPeriodo] = usePeriodoFal();
  const [filtro, setFiltro] = useTipoFal();
  const [nav, setNav] = useEstadoVista<{ ruta: Paso[] }>("falabella:informe", () => ({ ruta: [] }));
  const ruta = nav.ruta;
  const padre = ruta[ruta.length - 1];
  const params = { ...parametrosPeriodo(periodo), tipo: filtro.tipo };

  const { datos, cargando, error } = useApiDatos<ComparativoFal | null>(urlFal("comparativo", { ...params, nivel: ruta.length, padre: padre?.id }), null);
  // Full contra normal del mismo período (sin filtro de tipo) y la evolución mensual.
  const full = useApiDatos<ComparativoFal | null>(urlFal("comparativo", { ...parametrosPeriodo(periodo), tipo: "full" }), null);
  const normal = useApiDatos<ComparativoFal | null>(urlFal("comparativo", { ...parametrosPeriodo(periodo), tipo: "normal" }), null);
  const evolucion = useApiDatos<EvolucionFal | null>(urlFal("evolucion", {}), null);

  const t = datos?.total;
  const a = t?.actual;
  const c = t?.comparacion;
  const tarjetas = [
    { title: "Venta neta", value: formatoMonto(a?.venta.neto), subtitle: `Comparación: ${formatoMonto(c?.venta.neto)}`, percentageChange: pct(t?.variacion.venta) ?? undefined, icon: <IconCash size={18} /> },
    { title: "Unidades", value: unidades(a?.unidades), subtitle: `${unidades(a?.ordenes)} órdenes · ${unidades(a?.canceladas)} canceladas · ${unidades(a?.devueltas)} devueltas`, percentageChange: pct(t?.variacion.unidades) ?? undefined, icon: <IconPackages size={18} /> },
    { title: "Comisión Falabella", value: formatoMonto(a?.comision.neto), subtitle: `${porcentaje(parte(a, "comision"))} de la venta`, icon: <IconShoppingCart size={18} /> },
    { title: "Despacho", value: formatoMonto(a?.envio.neto), subtitle: `${porcentaje(parte(a, "envio"))} de la venta · ${a?.unidades ? pesos(n(a.envio.neto) / a.unidades) : "—"} por unidad`, icon: <IconTruckDelivery size={18} /> },
    { title: "Margen estimado", value: formatoMonto(a?.margen), subtitle: `Comparación: ${formatoMonto(c?.margen)}`, percentageChange: pct(t?.variacion.margen) ?? undefined, icon: <IconReceipt size={18} /> },
    { title: "Margen %", value: porcentaje(a?.margenPct), subtitle: `Comparación: ${porcentaje(c?.margenPct)}`, percentageChange: pp(t?.variacion.margenPuntos) ?? undefined, unidadVariacion: "pp" as const, icon: <IconPercentage size={18} /> },
  ];

  const celda = { fontSize: 13, py: 1, px: 1, borderColor: tinta.borde, whiteSpace: "nowrap" } as const;
  const cabecera = { ...celda, fontSize: 11, fontWeight: 700, color: tinta.secundaria, textTransform: "uppercase", letterSpacing: 0.3 } as const;
  const filaTipo = (nombre: string, b: BloqueFal | undefined, enlace: string) => (
    <TableRow key={nombre}>
      <TableCell sx={{ ...celda, fontWeight: 700 }}>
        <Box component={Link} href={enlace} sx={{ color: tinta.primaria, textDecoration: "none", "&:hover": { color: tinta.acento } }}>{nombre}</Box>
      </TableCell>
      <TableCell align="right" sx={{ ...celda, ...cifraSx, fontWeight: 700 }}>{formatoMonto(b?.venta.neto)}</TableCell>
      <TableCell align="right" sx={{ ...celda, ...cifraSx }}>{unidades(b?.unidades)}</TableCell>
      <TableCell align="right" sx={{ ...celda, ...cifraSx }}>{porcentaje(parte(b, "comision"))}</TableCell>
      <TableCell align="right" sx={{ ...celda, ...cifraSx }}>{b?.unidades ? pesos(n(b.envio.neto) / b.unidades) : "—"}</TableCell>
      <TableCell align="right" sx={{ ...celda, ...cifraSx, fontWeight: 700 }}>
        {porcentaje(b?.margenPct)}
        <Box component="span" sx={{ display: "block", fontSize: 11.5, fontWeight: 500, color: tinta.secundaria }}>{formatoMonto(b?.margen)}</Box>
      </TableCell>
    </TableRow>
  );

  const miga = (texto: string, indice: number, activa: boolean) => (
    <Box
      key={indice}
      component={activa ? "span" : "button"}
      type={activa ? undefined : "button"}
      onClick={activa ? undefined : () => setNav({ ruta: ruta.slice(0, indice) })}
      sx={{ all: "unset", cursor: activa ? "default" : "pointer", fontSize: 13, fontWeight: activa ? 700 : 600, color: activa ? tinta.primaria : tinta.acento }}
    >
      {texto}
    </Box>
  );

  return (
    <PageContainer title="Falabella · Categorías" description="Venta, comisión, despacho y margen de Falabella por categoría, con Full y despacho normal">
      <Box sx={{ maxWidth: 1680, mx: "auto" }}>
        <SelectorPeriodo filtros={periodo} setFiltros={setPeriodo} contexto={datos} />
        <Box sx={{ mb: 2 }}>
          <Pildoras<FiltroTipo> etiqueta="Tipo de envío" valor={filtro.tipo} onCambiar={(tipo) => setFiltro({ tipo })} opciones={OPCIONES_TIPO} />
        </Box>
        {error ? <Typography sx={{ color: "#b42318", fontSize: 13, mb: 2 }}>No se pudo cargar el informe: {mensajeError(error)}</Typography> : null}
        <AvisosFal contexto={datos} calidad={datos?.calidad} />

        <Grid container spacing={2}>
          {tarjetas.map((x) => (
            <Grid item xs={6} md={4} lg={2} key={x.title}>
              <MetricCard {...x} cargando={cargando} />
            </Grid>
          ))}
        </Grid>

        <SeccionTitulo title="Full contra normal y mes a mes" infoRight="Full paga 10 % menos de despacho. La evolución muestra todos los meses con órdenes guardadas (desde julio de 2026)." />
        <Grid container spacing={2}>
          <Grid item xs={12} lg={5}>
            <Panel titulo="Por tipo de envío" descripcion="Full = bodega de Falabella · Normal = despacho desde nuestra bodega">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {["Tipo", "Venta", "Unid.", "Comisión", "Despacho/u", "Margen %"].map((h, i) => (
                      <TableCell key={h} align={i ? "right" : "left"} sx={cabecera}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filaTipo("Full", full.datos?.total.actual, "/utilities/falabella/productos")}
                  {filaTipo("Normal", normal.datos?.total.actual, "/utilities/falabella/productos")}
                </TableBody>
              </Table>
            </Panel>
          </Grid>
          <Grid item xs={12} lg={7}>
            <Panel titulo="Evolución mensual" descripcion="Venta sin IVA, costos y margen estimado de todo Falabella">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {["Mes", "Venta", "Unid.", "Comisión", "Despacho", "Margen $", "Margen %", "Full · Normal"].map((h, i) => (
                      <TableCell key={h} align={i && i < 7 ? "right" : "left"} sx={cabecera}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(evolucion.datos?.meses ?? []).map((m) => (
                    <TableRow key={m.mes}>
                      <TableCell sx={{ ...celda, fontWeight: 700, textTransform: "capitalize" }}>{nombreMes(m.mes)}</TableCell>
                      <TableCell align="right" sx={{ ...celda, ...cifraSx, fontWeight: 700 }}>{formatoMonto(m.venta.neto)}</TableCell>
                      <TableCell align="right" sx={{ ...celda, ...cifraSx }}>{unidades(m.unidades)}</TableCell>
                      <TableCell align="right" sx={{ ...celda, ...cifraSx }}>{formatoMonto(m.comision.neto)}</TableCell>
                      <TableCell align="right" sx={{ ...celda, ...cifraSx }}>{formatoMonto(m.envio.neto)}</TableCell>
                      <TableCell align="right" sx={{ ...celda, ...cifraSx }}>{formatoMonto(m.margen)}</TableCell>
                      <TableCell align="right" sx={{ ...celda, ...cifraSx, fontWeight: 700 }}>{porcentaje(m.margenPct)}</TableCell>
                      <TableCell sx={{ ...celda, minWidth: 90 }}><BarraTiposFal porTipo={m.porTipo} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Panel>
          </Grid>
        </Grid>

        <SeccionTitulo title="Categorías" infoRight="Pulsa una categoría para ver sus subcategorías; «Ver productos» abre sus productos." />
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.75, mb: 1 }}>
          {miga("Todo Falabella", 0, ruta.length === 0)}
          {ruta.map((p, i) => (
            <React.Fragment key={p.id}>
              <Box component="span" sx={{ color: tinta.tenue }}>›</Box>
              {miga(p.nombre, i + 1, i === ruta.length - 1)}
            </React.Fragment>
          ))}
          {padre ? (
            <Box component={Link} href={rutaProductos(padre.id)} sx={{ ml: 1, fontSize: 12.5, fontWeight: 600, color: tinta.acento, textDecoration: "none" }}>
              Ver productos de {padre.nombre}
            </Box>
          ) : null}
          <Box sx={{ flex: 1 }} />
          <LeyendaTiposFal />
        </Box>
        <TablaCategoriasFal
          filas={datos?.categorias ?? []}
          cargando={cargando}
          onEntrar={(f) => f.id && setNav({ ruta: [...ruta, { id: f.id, nombre: f.nombre }] })}
          nombreExcel={`falabella-categorias${padre ? `-${padre.nombre}` : ""}`}
        />
      </Box>
    </PageContainer>
  );
}
