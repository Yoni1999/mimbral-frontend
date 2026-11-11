"use client";

import React from "react";
import { Box, Grid, Typography } from "@mui/material";
import { IconAlertTriangle, IconBuildingWarehouse, IconClockDollar, IconPackageImport } from "@tabler/icons-react";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { useApiDatos } from "@/utils/useCargaDatos";
import { useEstadoVista } from "@/utils/estadoVista";
import MetricCard from "../../../utilities/ventas/components/MetricCard";
import { Pildoras, cifraSx, formatoMonto, tinta } from "../../../utilities/ventas/components/estilo";
import TablaInforme, { CeldaProducto, ColumnaInforme, EncabezadoInforme, Etiqueta } from "../../../utilities/ventas/mercado-libre/components/TablaInforme";
import { Par } from "../../../utilities/ventas/mercado-libre/components/comun";
import { mensajeError, n, unidades } from "../../../utilities/categorias/mercado-libre/components/comun";
import { urlFal } from "../../../utilities/falabella/components/comun";

type Estado = "quiebre" | "critico" | "bajo" | "ok" | "sobrestock" | "sin_venta";
interface Fila {
  sku: string;
  nombre: string | null;
  imagen: string | null;
  categoria: string | null;
  stockFull: number;
  stockBodegas: number;
  ventaFull30: number;
  ventaNormal30: number;
  porDia: number;
  diasStock: number | null;
  estado: Estado;
  reponer: number;
  puedeReponer: number;
  pesoFacturable: number | null;
  almacenajeMes: Par;
  valorStock: number | null;
}
interface Respuesta {
  cobertura: number;
  nota: string;
  resumen: { productos: number; unidades: number; valorStock: number; almacenajeMes: Par; quiebres: number; criticos: number; sinVenta: number; sobrestock: number; aReponer: number };
  filas: Fila[];
}

const ESTADOS: Record<Estado, { texto: string; color: string; fondo: string; orden: number }> = {
  quiebre: { texto: "Sin stock", color: "#b42318", fondo: "#fef3f2", orden: 0 },
  critico: { texto: "Menos de 7 días", color: "#b42318", fondo: "#fef3f2", orden: 1 },
  bajo: { texto: "Menos de 15 días", color: "#b54708", fondo: "#fffaeb", orden: 2 },
  ok: { texto: "Bien", color: "#067647", fondo: "#ecfdf3", orden: 3 },
  sobrestock: { texto: "Más de 90 días", color: "#1d4ed8", fondo: "#eff6ff", orden: 4 },
  sin_venta: { texto: "Sin venta en 30 días", color: "#475467", fondo: "#f2f4f7", orden: 5 },
};
type Vista = "todos" | "reponer" | "sobra";

const COLUMNAS: ColumnaInforme<Fila>[] = [
  { clave: "sku", titulo: "Producto", ancho: 28, valor: (f) => f.sku, celda: (f) => <CeldaProducto sku={f.sku} nombre={f.nombre} imagen={f.imagen} secundario={f.categoria ?? undefined} /> },
  { clave: "estado", titulo: "Estado", ancho: 11, valor: (f) => ESTADOS[f.estado].orden, excel: "Estado", celda: (f) => <Etiqueta {...ESTADOS[f.estado]} /> },
  { clave: "full", titulo: "Stock Full", ancho: 8, alinear: "right", valor: (f) => f.stockFull, celda: (f) => <Box sx={{ ...cifraSx, fontWeight: 700 }}>{unidades(f.stockFull)}</Box> },
  { clave: "venta", titulo: "Venta Full 30 días", ancho: 10, alinear: "right", valor: (f) => f.ventaFull30, celda: (f) => <Box sx={cifraSx}>{unidades(f.ventaFull30)}</Box> },
  { clave: "dias", titulo: "Alcanza", ancho: 8, alinear: "right", valor: (f) => (f.stockFull <= 0 ? 0 : f.diasStock ?? 99999), excel: "Días de stock", celda: (f) => (f.stockFull <= 0 ? "0 días" : f.diasStock == null ? "—" : `${Math.round(f.diasStock)} días`) },
  { clave: "bodegas", titulo: "Bodegas 01 y 03", ancho: 9, alinear: "right", valor: (f) => f.stockBodegas, celda: (f) => <Box sx={cifraSx}>{unidades(f.stockBodegas)}</Box> },
  {
    clave: "reponer",
    titulo: "Enviar a Full",
    ancho: 10,
    alinear: "right",
    valor: (f) => f.reponer,
    celda: (f) =>
      f.reponer ? (
        <Box>
          <Box component="span" sx={{ ...cifraSx, fontWeight: 700, color: tinta.acento }}>{unidades(f.reponer)} u.</Box>
          {f.puedeReponer < f.reponer ? <Box sx={{ fontSize: 11, color: "#b54708" }}>solo hay {unidades(f.stockBodegas)} en bodegas</Box> : null}
        </Box>
      ) : (
        "—"
      ),
  },
  { clave: "alm", titulo: "Almacenaje/mes", ancho: 9, alinear: "right", valor: (f) => n(f.almacenajeMes.neto), excel: "Almacenaje neto al mes (estimado)", celda: (f) => (n(f.almacenajeMes.neto) ? formatoMonto(f.almacenajeMes.neto) : "$0") },
  { clave: "valor", titulo: "Valor a costo", ancho: 9, alinear: "right", valor: (f) => f.valorStock, celda: (f) => (f.valorStock == null ? "—" : formatoMonto(f.valorStock)) },
];

/** Falabella: stock en su bodega (Full) contra la venta, qué enviar y cuánto cuesta tenerlo ahí. */
export default function StockFullFalabella() {
  const [estado, setEstado] = useEstadoVista<{ vista: Vista }>("falabella:stock-full", () => ({ vista: "todos" }));
  const { datos, cargando, error } = useApiDatos<Respuesta | null>(urlFal("stock-full", {}), null);
  const r = datos?.resumen;
  const todas = datos?.filas ?? [];
  const filas = estado.vista === "reponer" ? todas.filter((f) => f.reponer > 0) : estado.vista === "sobra" ? todas.filter((f) => f.estado === "sobrestock" || f.estado === "sin_venta") : todas;

  return (
    <PageContainer title="Falabella · Stock Full" description="Stock en la bodega de Falabella contra su venta: qué reponer y qué sobra">
      <Box sx={{ maxWidth: 1680, mx: "auto" }}>
        <EncabezadoInforme titulo="Stock Full y reposición · Falabella" descripcion={datos?.nota ?? "Stock en la bodega de Falabella contra la venta Full de los últimos 30 días."}>
          <Pildoras<Vista>
            etiqueta="Ver"
            valor={estado.vista}
            onCambiar={(vista) => setEstado({ vista })}
            opciones={[
              { valor: "todos", texto: "Todo" },
              { valor: "reponer", texto: "Hay que enviar" },
              { valor: "sobra", texto: "Sobra o no se vende" },
            ]}
          />
        </EncabezadoInforme>
        {error ? <Typography sx={{ color: "#b42318", fontSize: 13, mb: 2 }}>No se pudo cargar: {mensajeError(error)}</Typography> : null}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6} md={3}>
            <MetricCard title="En bodega de Falabella" value={`${unidades(r?.unidades)} u.`} subtitle={`${unidades(r?.productos)} productos · ${formatoMonto(r?.valorStock)} a costo`} cargando={cargando} icon={<IconBuildingWarehouse size={18} />} />
          </Grid>
          <Grid item xs={6} md={3}>
            <MetricCard title="Sin stock o por agotarse" value={unidades(n(r?.quiebres) + n(r?.criticos))} subtitle={`${unidades(r?.quiebres)} sin stock · ${unidades(r?.criticos)} con menos de 15 días`} cargando={cargando} masEsMejor={false} icon={<IconAlertTriangle size={18} />} />
          </Grid>
          <Grid item xs={6} md={3}>
            <MetricCard title={`Enviar para ${datos?.cobertura ?? 30} días`} value={`${unidades(r?.aReponer)} u.`} subtitle="Según la venta Full de 30 días" cargando={cargando} icon={<IconPackageImport size={18} />} />
          </Grid>
          <Grid item xs={6} md={3}>
            <MetricCard title="Almacenaje estimado al mes" value={formatoMonto(r?.almacenajeMes.neto)} subtitle={`${unidades(n(r?.sobrestock) + n(r?.sinVenta))} productos con más de 90 días o sin venta`} cargando={cargando} masEsMejor={false} icon={<IconClockDollar size={18} />} />
          </Grid>
        </Grid>
        <TablaInforme<Fila>
          key={estado.vista}
          filas={filas}
          cargando={cargando}
          columnas={COLUMNAS}
          clave={(f) => f.sku}
          textoBusqueda={(f) => `${f.sku} ${f.nombre ?? ""} ${f.categoria ?? ""}`}
          ordenInicial={estado.vista === "sobra" ? { clave: "alm", direccion: "desc" } : { clave: "venta", direccion: "desc" }}
          nombreExcel="falabella-stock-full"
          extraExcel={[
            { titulo: "Nombre", valor: (f) => f.nombre },
            { titulo: "Estado", valor: (f) => ESTADOS[f.estado].texto },
            { titulo: "Venta normal 30 días", valor: (f) => f.ventaNormal30 },
            { titulo: "Venta Full por día", valor: (f) => f.porDia },
            { titulo: "Peso facturable kg", valor: (f) => f.pesoFacturable },
          ]}
          nota="Almacenaje estimado sin IVA; valor del stock a costo promedio de SAP."
          anchoMinimo={1150}
        />
      </Box>
    </PageContainer>
  );
}
