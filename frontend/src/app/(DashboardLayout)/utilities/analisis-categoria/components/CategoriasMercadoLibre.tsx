"use client";

import React from "react";
import { Box, Grid, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { IconBuildingWarehouse, IconChevronRight, IconCurrencyDollar, IconPigMoney, IconReceiptTax, IconTruck, IconTruckDelivery } from "@tabler/icons-react";
import { useApiDatos } from "@/utils/useCargaDatos";
import MetricCard from "@/app/(DashboardLayout)/utilities/ventas/components/MetricCard";
import SeccionTitulo from "@/app/(DashboardLayout)/utilities/ventas/components/SeccionTitulo";
import { Columnas, Panel, Pildoras, TextoCelda, formatoMonto, formatoPesos, formatoPorcentaje, tablaSx, tinta } from "@/app/(DashboardLayout)/utilities/ventas/components/estilo";
import TablaProductosMl from "@/app/(DashboardLayout)/utilities/ventas/mercado-libre/components/TablaProductosMl";
import {
  AvisoEstimaciones,
  BarraTipos,
  CategoriaMl,
  CategoriasMl,
  LeyendaTipos,
  ProductosMl,
  TIPOS_ENVIO,
  TipoEnvio,
  cobros,
  n,
  sumaPar,
  unidades,
  urlMl,
  variacion,
} from "@/app/(DashboardLayout)/utilities/ventas/mercado-libre/components/comun";
import type { PasoMl } from "./HeaderCategorias";

const DIA = 86_400_000;

/** Período anterior del mismo largo, justo antes (igual que el back). */
const anterior = (desde: string, hasta: string) => {
  const dias = Math.round((Date.parse(hasta) - Date.parse(desde)) / DIA) + 1;
  const fin = new Date(Date.parse(desde) - DIA);
  const inicio = new Date(fin.getTime() - (dias - 1) * DIA);
  return { fechaInicio: inicio.toISOString().slice(0, 10), fechaFin: fin.toISOString().slice(0, 10) };
};

/** Totales de una lista de categorías: venta, por tipo de envío y cobros. */
const totales = (filas: CategoriaMl[]) => ({
  venta: sumaPar(...filas.map((f) => f.venta)),
  unidades: filas.reduce((s, f) => s + n(f.unidades), 0),
  porTipo: Object.fromEntries(TIPOS_ENVIO.map((t) => [t.clave, sumaPar(...filas.map((f) => f.porTipo[t.clave]?.venta))])) as Record<TipoEnvio, ReturnType<typeof sumaPar>>,
  unidadesPorTipo: Object.fromEntries(TIPOS_ENVIO.map((t) => [t.clave, filas.reduce((s, f) => s + n(f.porTipo[t.clave]?.unidades), 0)])) as Record<TipoEnvio, number>,
  cobra: sumaPar(...filas.map((f) => cobros(f))),
});

const OPCIONES_TIPO: { valor: TipoEnvio | "todos"; texto: string }[] = [
  { valor: "todos", texto: "Todos" },
  { valor: "full", texto: "Full" },
  { valor: "colecta", texto: "Colecta" },
  { valor: "flex", texto: "Flex" },
];

interface Props {
  fechaInicio: string;
  fechaFin: string;
  rutaMl: PasoMl[];
  onEntrar: (paso: PasoMl) => void;
}

/**
 * Categorías con el árbol de Mercado Libre: la venta de ML de la categoría
 * elegida separada en Full, Colecta y Flex, con lo que cobra ML; el desglose
 * de sus subcategorías (pulsar una entra) y sus productos más vendidos.
 */
export default function CategoriasMercadoLibre({ fechaInicio, fechaFin, rutaMl, onEntrar }: Props) {
  const [tipo, setTipo] = React.useState<TipoEnvio | "">("");
  const actual = rutaMl[rutaMl.length - 1];
  const filtroNivel = { nivel: rutaMl.length, padre: actual?.id };
  const previo = anterior(fechaInicio, fechaFin);

  const cats = useApiDatos<CategoriasMl | null>(urlMl("categorias", { fechaInicio, fechaFin, ...filtroNivel }), null);
  const catsAnt = useApiDatos<CategoriasMl | null>(urlMl("categorias", { ...previo, ...filtroNivel }), null);
  const productos = useApiDatos<ProductosMl | null>(urlMl("productos", { fechaInicio, fechaFin, tipo, categoria: actual?.id, limite: 25 }), null);

  const filas = (cats.datos?.filas ?? []).filter((f) => n(f.venta.neto) !== 0);
  const t = totales(filas);
  const ta = totales((catsAnt.datos?.filas ?? []).filter((f) => n(f.venta.neto) !== 0));
  // En la última categoría del árbol no hay hijos: el back la devuelve como una fila sin id.
  const esHoja = !!actual && filas.every((f) => !f.id);
  // Sin id: productos publicados en la categoría misma (no en una hija) o sin categoría de ML.
  const hijos = filas.map((f) => (f.id ? f : { ...f, nombre: actual ? `Publicados en ${actual.nombre}` : "Sin categoría de ML" }));
  const queda = n(t.venta.neto) - n(t.cobra.neto);
  const quedaAnt = n(ta.venta.neto) - n(ta.cobra.neto);
  const pct = (parte: number, todo: number) => (todo ? (parte / todo) * 100 : null);
  const cargando = cats.cargando;

  const tarjetaTipo = (clave: TipoEnvio, icon: React.ReactNode) => {
    const info = TIPOS_ENVIO.find((x) => x.clave === clave)!;
    return {
      title: info.nombre,
      value: formatoMonto(t.porTipo[clave].neto),
      subtitle: `${unidades(t.unidadesPorTipo[clave])} u. · ${formatoPorcentaje(pct(n(t.porTipo[clave].neto), n(t.venta.neto)))} · vs ${formatoMonto(ta.porTipo[clave].neto)}`,
      percentageChange: variacion(n(t.porTipo[clave].neto), n(ta.porTipo[clave].neto)) ?? undefined,
      nota: `Sin IVA. Con IVA: ${formatoPesos(t.porTipo[clave].conIva)}. ${info.descripcion}.`,
      icon,
    };
  };

  const tarjetas = [
    {
      title: "Venta Mercado Libre",
      value: formatoMonto(t.venta.neto),
      subtitle: `${unidades(t.unidades)} u. · vs ${formatoMonto(ta.venta.neto)}`,
      percentageChange: variacion(n(t.venta.neto), n(ta.venta.neto)) ?? undefined,
      nota: `Sin IVA. Con IVA: ${formatoPesos(t.venta.conIva)}. Solo ventas con producto identificado (las que ML informa sin detalle no tienen categoría).`,
      icon: <IconCurrencyDollar />,
    },
    tarjetaTipo("full", <IconBuildingWarehouse />),
    tarjetaTipo("colecta", <IconTruck />),
    tarjetaTipo("flex", <IconTruckDelivery />),
    {
      title: "Cobra Mercado Libre",
      value: formatoMonto(t.cobra.neto),
      subtitle: `${formatoPorcentaje(pct(n(t.cobra.neto), n(t.venta.neto)))} de la venta · vs ${formatoMonto(ta.cobra.neto)}`,
      percentageChange: variacion(n(t.cobra.neto), n(ta.cobra.neto)) ?? undefined,
      masEsMejor: false,
      nota: "Comisión + envío, sin IVA. Full: comisión estimada con la publicación. Envío estimado con la publicación (Full y Colecta).",
      icon: <IconReceiptTax />,
    },
    {
      title: "Queda después de ML",
      value: formatoMonto(queda),
      subtitle: `${formatoPorcentaje(pct(queda, n(t.venta.neto)))} de la venta · vs ${formatoMonto(quedaAnt)}`,
      percentageChange: variacion(queda, quedaAnt) ?? undefined,
      nota: "Venta sin IVA menos comisión y envío. No descuenta el costo del producto.",
      icon: <IconPigMoney />,
    },
  ];

  return (
    <>
      <AvisoEstimaciones estimaciones={cats.datos?.estimaciones} />
      <Grid container spacing={2}>
        {tarjetas.map((c) => (
          <Grid item xs={6} sm={6} md={4} lg={2} key={c.title}>
            <MetricCard {...c} cargando={cargando || catsAnt.cargando} />
          </Grid>
        ))}
      </Grid>

      {!esHoja && (
        <>
          <SeccionTitulo title="Composición" infoRight="Categorías según Mercado Libre. Pulsa una fila para bajar de nivel." />
          <Panel
            titulo={actual ? `Dentro de ${actual.nombre}` : "Primer nivel de Mercado Libre"}
            descripcion={cargando ? "Cargando…" : `${hijos.length} con venta en el período · montos sin IVA`}
            accion={<LeyendaTipos tipos={TIPOS_ENVIO.slice(0, 3)} />}
            sx={{ px: 0, "& > :first-of-type": { px: 2.5 } }}
          >
            <TableContainer sx={{ overflowX: { xs: "auto", md: "hidden" } }}>
              <Table size="small" sx={{ ...tablaSx, minWidth: { xs: 760, md: 0 } }}>
                <Columnas anchos={[27, 13, 12, 12, 10, 12, 9, 5]} />
                <TableHead>
                  <TableRow>
                    <TableCell>Categoría</TableCell>
                    <TableCell align="right">Venta</TableCell>
                    <TableCell align="right">Full</TableCell>
                    <TableCell align="right">Colecta</TableCell>
                    <TableCell align="right">Flex</TableCell>
                    <TableCell align="right">Cobra ML</TableCell>
                    <TableCell align="right">Prod.</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cargando ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={8}>
                          <Skeleton height={30} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : hijos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <Typography sx={{ color: tinta.tenue, fontSize: 13, py: 4, textAlign: "center" }}>Sin ventas de Mercado Libre en el período.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    hijos.map((f) => {
                      const entra = !!f.id;
                      const tipoCelda = (clave: TipoEnvio) => {
                        const v = f.porTipo[clave];
                        return n(v?.venta.neto) ? (
                          <Box title={`${unidades(v.unidades)} u. · con IVA ${formatoPesos(v.venta.conIva)}`}>
                            {formatoMonto(v.venta.neto)}
                            <Box sx={{ fontSize: 10.5, color: tinta.tenue }}>{formatoPorcentaje(pct(n(v.venta.neto), n(f.venta.neto)), 0)}</Box>
                          </Box>
                        ) : (
                          <Box component="span" sx={{ color: tinta.tenue }}>—</Box>
                        );
                      };
                      return (
                        <TableRow
                          key={f.id ?? "sin"}
                          hover={entra}
                          onClick={entra ? () => onEntrar({ id: f.id!, nombre: f.nombre }) : undefined}
                          tabIndex={entra ? 0 : undefined}
                          onKeyDown={entra ? (e) => e.key === "Enter" && onEntrar({ id: f.id!, nombre: f.nombre }) : undefined}
                          sx={{ cursor: entra ? "pointer" : "default" }}
                        >
                          <TableCell>
                            <TextoCelda texto={f.nombre} secundario={`${formatoPorcentaje(n(f.participacion) * 100)} del total · ${unidades(f.unidades)} u.`} />
                            <Box sx={{ mt: 0.5 }}>
                              <BarraTipos porTipo={f.porTipo} alto={5} />
                            </Box>
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>
                            <Box title={`Con IVA ${formatoPesos(f.venta.conIva)}`}>{formatoMonto(f.venta.neto)}</Box>
                          </TableCell>
                          <TableCell align="right">{tipoCelda("full")}</TableCell>
                          <TableCell align="right">{tipoCelda("colecta")}</TableCell>
                          <TableCell align="right">{tipoCelda("flex")}</TableCell>
                          <TableCell align="right">
                            {n(cobros(f).neto) ? (
                              <Box>
                                {formatoMonto(cobros(f).neto)}
                                <Box sx={{ fontSize: 10.5, color: tinta.tenue }}>{formatoPorcentaje(pct(n(cobros(f).neto), n(f.venta.neto)))}</Box>
                              </Box>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell align="right">{unidades(f.productos)}</TableCell>
                          <TableCell align="right">{entra && f.tieneHijos && <IconChevronRight size={16} color={tinta.tenue} />}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Panel>
        </>
      )}

      <SeccionTitulo title="Productos" infoRight="Los más vendidos en ML de la categoría · el stock abre todas las bodegas." />
      <Panel
        titulo={actual ? `Más vendidos en ${actual.nombre}` : "Más vendidos en Mercado Libre"}
        descripcion={productos.datos ? `Top 25 de ${unidades(productos.datos.cantidad)} productos con venta` : "Cargando…"}
        accion={<Pildoras etiqueta="Tipo de envío" opciones={OPCIONES_TIPO} valor={tipo || "todos"} onCambiar={(v) => setTipo(v === "todos" ? "" : (v as TipoEnvio))} />}
        sx={{ px: 0, "& > :first-of-type": { px: 2.5 } }}
      >
        <TablaProductosMl filas={productos.datos?.filas ?? []} cargando={productos.cargando} tipo={tipo} filasCargando={10} />
      </Panel>
    </>
  );
}
