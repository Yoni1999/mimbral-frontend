"use client";

import React from "react";
import { Box } from "@mui/material";
import { IconArrowBackUp, IconCircleX, IconPercentage, IconReceiptRefund } from "@tabler/icons-react";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { useApiDatos } from "@/utils/useCargaDatos";
import MetricCard from "@/app/(DashboardLayout)/utilities/ventas/components/MetricCard";
import { etiquetaRango } from "@/app/(DashboardLayout)/utilities/ventas/components/RangosRapidos";
import { Pildoras, formatoMonto, tinta } from "@/app/(DashboardLayout)/utilities/ventas/components/estilo";
import HeaderMl from "@/app/(DashboardLayout)/utilities/ventas/mercado-libre/components/HeaderMl";
import TablaInforme, { CeldaProducto, ColumnaInforme } from "@/app/(DashboardLayout)/utilities/ventas/mercado-libre/components/TablaInforme";
import { urlMl } from "@/app/(DashboardLayout)/utilities/ventas/mercado-libre/components/comun";
import { entero, pesos, porcentaje, redondo, useFiltrosInforme } from "../comun";

interface Fila {
  sku: string;
  nombre: string | null;
  vendidas: number;
  canceladas: number;
  ordenesCanceladas: number;
  montoCancelado: number;
  motivo: string | null;
  porComprador: number;
  devueltas: number;
  devueltasFull: number;
  montoNc: number;
  notas: number;
  tasaPct: number | null;
}

/** Motivos de cancelación de ML más comunes, en palabras. */
const MOTIVOS: Record<string, string> = {
  buyer_cancel_express: "El comprador canceló",
  buyer_cancel: "El comprador canceló",
  seller_cancel: "Cancelamos nosotros",
  out_of_stock: "Sin stock",
  fraud: "Fraude",
  shipment_not_delivered: "Envío no entregado",
};

type Ver = "todos" | "nc" | "canceladas" | "altaTasa";
const VER: { valor: Ver; texto: string }[] = [
  { valor: "todos", texto: "Todos" },
  { valor: "nc", texto: "Con nota de crédito" },
  { valor: "canceladas", texto: "Con cancelaciones" },
  { valor: "altaTasa", texto: "Tasa > 10 %" },
];
const cumple = (f: Fila, v: Ver) =>
  v === "todos" ? true : v === "nc" ? f.devueltas > 0 : v === "canceladas" ? f.canceladas > 0 : (f.tasaPct ?? 0) > 10 && f.vendidas + f.canceladas >= 3;

/** Informe: devoluciones (notas de crédito) y cancelaciones de Mercado Libre por producto. */
export default function DevolucionesYCancelaciones() {
  const { filtros, setFiltros, inicial } = useFiltrosInforme<{ ver: Ver }>("informe-ml-devoluciones", { ver: "todos" });
  const datos = useApiDatos<{ filas: Fila[] } | null>(urlMl("informes/devoluciones", { fechaInicio: filtros.fechaInicio, fechaFin: filtros.fechaFin }), null);
  const todas = datos.datos?.filas ?? [];
  const filas = todas.filter((f) => cumple(f, filtros.ver));

  const elegir = (v: Ver) => () => setFiltros((x) => ({ ...x, ver: x.ver === v ? "todos" : v }));
  const devueltas = todas.reduce((s, f) => s + f.devueltas, 0);
  const canceladas = todas.reduce((s, f) => s + f.canceladas, 0);
  const tarjetas = [
    {
      title: "Notas de crédito",
      value: formatoMonto(todas.reduce((s, f) => s + f.montoNc, 0)),
      subtitle: `${entero(devueltas)} u. en ${entero(todas.reduce((s, f) => s + f.notas, 0))} notas · sin IVA`,
      icon: <IconReceiptRefund />,
      onClick: elegir("nc"),
      nota: "Notas de crédito de SAP del canal Mercado Libre (incluye las devoluciones del Full). Clic para ver los productos.",
    },
    {
      title: "Cancelaciones",
      value: entero(todas.reduce((s, f) => s + f.ordenesCanceladas, 0)),
      subtitle: `${entero(canceladas)} u. · ${formatoMonto(todas.reduce((s, f) => s + f.montoCancelado, 0))}`,
      icon: <IconCircleX />,
      onClick: elegir("canceladas"),
      nota: "Órdenes de ML canceladas (no incluye Full, que no pasa por nuestro registro de pedidos). Clic para ver los productos.",
    },
    {
      title: "Productos con tasa > 10 %",
      value: entero(todas.filter((f) => cumple(f, "altaTasa")).length),
      subtitle: "Devueltas + canceladas sobre lo vendido",
      icon: <IconPercentage />,
      onClick: elegir("altaTasa"),
      nota: "Solo productos con al menos 3 unidades entre vendidas y canceladas. Clic para verlos.",
    },
    {
      title: "Productos afectados",
      value: entero(todas.length),
      subtitle: `${etiquetaRango(filtros.fechaInicio, filtros.fechaFin)}`,
      icon: <IconArrowBackUp />,
    },
  ];

  const columnas: ColumnaInforme<Fila>[] = [
    { clave: "producto", titulo: "Producto", ancho: 30, valor: (f) => f.nombre ?? "", celda: (f) => <CeldaProducto sku={f.sku} nombre={f.nombre} /> },
    { clave: "vendidas", titulo: "Vendidas", ancho: 9, alinear: "right", valor: (f) => f.vendidas, celda: (f) => entero(f.vendidas) },
    {
      clave: "devueltas",
      titulo: "Con NC",
      ancho: 12,
      alinear: "right",
      valor: (f) => f.devueltas,
      excel: "Unidades con NC",
      celda: (f) =>
        f.devueltas ? (
          <Box>
            <Box component="span" sx={{ fontWeight: 700 }}>{entero(f.devueltas)} u.</Box>
            <Box sx={{ fontSize: 10.5, color: tinta.tenue }}>
              {pesos(f.montoNc)}
              {f.devueltasFull ? ` · ${entero(f.devueltasFull)} Full` : ""}
            </Box>
          </Box>
        ) : (
          "—"
        ),
    },
    {
      clave: "canceladas",
      titulo: "Canceladas",
      ancho: 12,
      alinear: "right",
      valor: (f) => f.canceladas,
      celda: (f) =>
        f.canceladas ? (
          <Box>
            <Box component="span" sx={{ fontWeight: 700 }}>{entero(f.canceladas)} u.</Box>
            <Box sx={{ fontSize: 10.5, color: tinta.tenue }}>{pesos(f.montoCancelado)}</Box>
          </Box>
        ) : (
          "—"
        ),
    },
    {
      clave: "motivo",
      titulo: "Motivo de cancelación",
      ancho: 18,
      valor: (f) => (f.motivo ? MOTIVOS[f.motivo] ?? f.motivo : ""),
      celda: (f) =>
        f.motivo ? (
          <Box>
            {MOTIVOS[f.motivo] ?? f.motivo}
            {f.ordenesCanceladas > 1 && <Box sx={{ fontSize: 10.5, color: tinta.tenue }}>{entero(f.porComprador)} de {entero(f.ordenesCanceladas)} por el comprador</Box>}
          </Box>
        ) : (
          "—"
        ),
    },
    {
      clave: "tasa",
      titulo: "Tasa",
      ancho: 9,
      alinear: "right",
      valor: (f) => redondo(f.tasaPct, 1),
      excel: "Tasa %",
      celda: (f) => <Box component="span" sx={{ fontWeight: 700, color: (f.tasaPct ?? 0) > 10 ? "#b42318" : tinta.secundaria }}>{porcentaje(f.tasaPct)}</Box>,
    },
    { clave: "monto", titulo: "Monto total", ancho: 10, alinear: "right", valor: (f) => redondo(f.montoNc + f.montoCancelado), excel: "NC + cancelado sin IVA", celda: (f) => pesos(f.montoNc + f.montoCancelado) },
  ];

  return (
    <PageContainer title="Devoluciones y cancelaciones" description="Notas de crédito y cancelaciones de Mercado Libre por producto">
      <Box sx={{ maxWidth: 1680, mx: "auto" }}>
        <HeaderMl
          titulo="Devoluciones y cancelaciones"
          contexto="Mercado Libre"
          rango={filtros}
          onRango={(r) => setFiltros((f) => ({ ...f, ...r }))}
          enEstadoInicial={filtros.ver === "todos" && etiquetaRango(filtros.fechaInicio, filtros.fechaFin) === "Últimos 30 días"}
          onLimpiar={() => setFiltros(inicial())}
        >
          <Pildoras etiqueta="Mostrar" opciones={VER} valor={filtros.ver} onCambiar={(v) => setFiltros((f) => ({ ...f, ver: v }))} />
        </HeaderMl>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2, mb: 2 }}>
          {tarjetas.map((t) => (
            <MetricCard key={t.title} {...t} cargando={datos.cargando} />
          ))}
        </Box>

        <TablaInforme
          key={filtros.ver}
          filas={filas}
          cargando={datos.cargando}
          columnas={columnas}
          clave={(f) => f.sku}
          textoBusqueda={(f) => `${f.sku} ${f.nombre ?? ""}`}
          ordenInicial={filtros.ver === "altaTasa" ? { clave: "tasa", direccion: "desc" } : { clave: "monto", direccion: "desc" }}
          nombreExcel={`devoluciones_ml_${filtros.fechaInicio}_${filtros.fechaFin}`}
          nota="NC: notas de crédito de SAP del canal ML. Cancelaciones: órdenes canceladas de ML sin Full. Tasa = (con NC + canceladas) ÷ (vendidas + canceladas)."
          extraExcel={[
            { titulo: "SKU", valor: (f) => f.sku },
            { titulo: "Monto NC sin IVA", valor: (f) => redondo(f.montoNc) },
            { titulo: "Unidades con NC de Full", valor: (f) => f.devueltasFull },
            { titulo: "Órdenes canceladas", valor: (f) => f.ordenesCanceladas },
            { titulo: "Monto cancelado sin IVA", valor: (f) => redondo(f.montoCancelado) },
          ]}
        />
      </Box>
    </PageContainer>
  );
}
