"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Box, Grid, Typography } from "@mui/material";
import { IconCash, IconPackages, IconPercentage, IconReceipt } from "@tabler/icons-react";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { useApiDatos } from "@/utils/useCargaDatos";
import { useEstadoVista } from "@/utils/estadoVista";
import MetricCard from "../../ventas/components/MetricCard";
import SeccionTitulo from "../../ventas/components/SeccionTitulo";
import { Pildoras, formatoMonto, formatoPorcentaje, tinta } from "../../ventas/components/estilo";
import { SelectorPeriodo, mensajeError, n, parametrosPeriodo, unidades } from "../../categorias/mercado-libre/components/comun";
import { AvisosFal, FiltroTipo, OPCIONES_TIPO, OrdenProductos, ProductosFal, TablaProductosFal, rutaProductos, urlFal, usePeriodoFal, useTipoFal } from "../components/comun";

type Vista = "vendidos" | "margen" | "menorMargen" | "suben" | "bajan";
const VISTAS: { valor: Vista; texto: string; orden: OrdenProductos; invertido?: boolean }[] = [
  { valor: "vendidos", texto: "Más vendidos", orden: "venta" },
  { valor: "margen", texto: "Mayor margen %", orden: "margenPct" },
  { valor: "menorMargen", texto: "Menor margen %", orden: "margenPct", invertido: true },
  { valor: "suben", texto: "Los que más suben", orden: "dif" },
  { valor: "bajan", texto: "Los que más bajan", orden: "dif", invertido: true },
];

function Contenido() {
  const categoria = useSearchParams().get("categoria");
  const [periodo, setPeriodo] = usePeriodoFal();
  const [filtro, setFiltro] = useTipoFal();
  const [estado, setEstado] = useEstadoVista<{ vista: Vista }>("falabella:productos", () => ({ vista: "vendidos" }));
  const vista = VISTAS.find((v) => v.valor === estado.vista) ?? VISTAS[0];

  const { datos, cargando, error } = useApiDatos<ProductosFal | null>(urlFal("productos", { ...parametrosPeriodo(periodo), tipo: filtro.tipo, categoria, limite: 5000 }), null);
  const todas = datos?.filas ?? [];
  // «Menor margen %» solo tiene sentido en productos que vendieron en el período.
  const filas = vista.valor === "menorMargen" || vista.valor === "margen" ? todas.filter((f) => f.actual.unidades > 0 && f.actual.margen != null) : todas;

  const conVenta = todas.filter((f) => f.actual.unidades > 0);
  const venta = conVenta.reduce((s, f) => s + n(f.actual.venta.neto), 0);
  const conCosto = conVenta.filter((f) => f.actual.margen != null);
  const margen = conCosto.reduce((s, f) => s + n(f.actual.margen), 0);
  const ventaConCosto = conCosto.reduce((s, f) => s + n(f.actual.venta.neto), 0);
  const bajoCero = conCosto.filter((f) => n(f.actual.margen) < 0);
  const migas = categoria ? categoria.split(" > ") : [];

  return (
    <PageContainer title="Falabella · Productos" description="Venta, comisión, despacho y margen de cada producto vendido en Falabella">
      <Box sx={{ maxWidth: 1680, mx: "auto" }}>
        <SelectorPeriodo filtros={periodo} setFiltros={setPeriodo} contexto={datos} />
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
          <Pildoras<FiltroTipo> etiqueta="Tipo de envío" valor={filtro.tipo} onCambiar={(tipo) => setFiltro({ tipo })} opciones={OPCIONES_TIPO} />
        </Box>
        {error ? <Typography sx={{ color: "#b42318", fontSize: 13, mb: 2 }}>No se pudo cargar: {mensajeError(error)}</Typography> : null}
        <AvisosFal contexto={datos} />

        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>
            <MetricCard title="Productos con venta" value={unidades(conVenta.length)} subtitle={`${unidades(conVenta.reduce((s, f) => s + f.actual.unidades, 0))} unidades`} cargando={cargando} icon={<IconPackages size={18} />} />
          </Grid>
          <Grid item xs={6} md={3}>
            <MetricCard title="Venta neta" value={formatoMonto(venta)} subtitle="Sin canceladas ni devueltas" cargando={cargando} icon={<IconCash size={18} />} />
          </Grid>
          <Grid item xs={6} md={3}>
            <MetricCard title="Margen estimado" value={ventaConCosto ? formatoPorcentaje((margen / ventaConCosto) * 100) : "—"} subtitle="Sobre la venta con costo en SAP" cargando={cargando} icon={<IconReceipt size={18} />} />
          </Grid>
          <Grid item xs={6} md={3}>
            <MetricCard title="Productos que pierden plata" value={unidades(bajoCero.length)} subtitle="Margen negativo en el período" cargando={cargando} masEsMejor={false} icon={<IconPercentage size={18} />} />
          </Grid>
        </Grid>

        <SeccionTitulo title="Productos" infoRight="Pulsa una columna para ordenar; el despacho muestra con qué peso cobra Falabella." />
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.75, mb: 1, fontSize: 13 }}>
          <Box component={Link} href={rutaProductos()} sx={{ fontWeight: categoria ? 600 : 700, color: categoria ? tinta.acento : tinta.primaria, textDecoration: "none" }}>
            Todo Falabella
          </Box>
          {migas.map((nombre, i) => (
            <React.Fragment key={i}>
              <Box component="span" sx={{ color: tinta.tenue }}>›</Box>
              <Box
                component={Link}
                href={rutaProductos(migas.slice(0, i + 1).join(" > "))}
                sx={{ fontWeight: i === migas.length - 1 ? 700 : 600, color: i === migas.length - 1 ? tinta.primaria : tinta.acento, textDecoration: "none" }}
              >
                {nombre}
              </Box>
            </React.Fragment>
          ))}
        </Box>
        <Box sx={{ mb: 1.5 }}>
          <Pildoras<Vista> etiqueta="Ver" valor={vista.valor} onCambiar={(v) => setEstado({ vista: v })} opciones={VISTAS.map(({ valor, texto }) => ({ valor, texto }))} />
        </Box>
        <TablaProductosFal key={vista.valor} filas={filas} cargando={cargando} nombreExcel={`falabella-productos-${vista.valor}`} orden={vista.orden} invertido={vista.invertido} />
      </Box>
    </PageContainer>
  );
}

/** Falabella: productos con su venta, costos y margen; filtrable por categoría (?categoria=) y tipo de envío. */
export default function ProductosFalabella() {
  return (
    <Suspense fallback={null}>
      <Contenido />
    </Suspense>
  );
}
