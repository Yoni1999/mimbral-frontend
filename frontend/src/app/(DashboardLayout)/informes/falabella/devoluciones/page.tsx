"use client";

import React from "react";
import { Box, Grid, Typography } from "@mui/material";
import { IconArrowBackUp, IconBan, IconCash, IconPackages } from "@tabler/icons-react";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { useApiDatos } from "@/utils/useCargaDatos";
import MetricCard from "../../../utilities/ventas/components/MetricCard";
import SeccionTitulo from "../../../utilities/ventas/components/SeccionTitulo";
import ListaBarras from "../../../utilities/ventas/components/ListaBarras";
import { Panel, cifraSx, formatoMonto, formatoPorcentaje } from "../../../utilities/ventas/components/estilo";
import TablaInforme, { CeldaProducto, ColumnaInforme } from "../../../utilities/ventas/mercado-libre/components/TablaInforme";
import { Par } from "../../../utilities/ventas/mercado-libre/components/comun";
import { MontoCorto, SelectorPeriodo, mensajeError, n, parametrosPeriodo, unidades } from "../../../utilities/categorias/mercado-libre/components/comun";
import { ContextoFal, urlFal, usePeriodoFal } from "../../../utilities/falabella/components/comun";

interface Fila {
  sku: string;
  nombre: string | null;
  imagen: string | null;
  categoria: string | null;
  unidades: number;
  canceladas: number;
  cancelado: Par;
  tasaCancelacion: number | null;
  devueltas: number;
  devuelto: Par;
  tasaDevolucion: number | null;
  perdido: Par;
  motivoPrincipal: string | null;
  parteFull: number | null;
}
interface Motivo {
  codigo: string | null;
  nombre: string;
  origen: "cliente" | "nosotros" | "transporte" | "otro";
  unidades: number;
  monto: Par;
  parte: number | null;
}
interface Respuesta extends ContextoFal {
  resumen: { unidades: number; venta: Par; canceladas: number; cancelado: Par; tasaCancelacion: number | null; devueltas: number; devuelto: Par; tasaDevolucion: number | null };
  motivos: Motivo[];
  filas: Fila[];
}

const ORIGEN: Record<Motivo["origen"], { texto: string; color: string }> = {
  nosotros: { texto: "Nuestra operación", color: "#e5484d" },
  transporte: { texto: "Transporte", color: "#f59e0b" },
  cliente: { texto: "Cliente", color: "#2563eb" },
  otro: { texto: "Otro", color: "#98a2b3" },
};
const tasa = (v: number | null) => (v == null ? "—" : formatoPorcentaje(v * 100));

const COLUMNAS: ColumnaInforme<Fila>[] = [
  { clave: "sku", titulo: "Producto", ancho: 30, valor: (f) => f.sku, celda: (f) => <CeldaProducto sku={f.sku} nombre={f.nombre} imagen={f.imagen} secundario={f.categoria ?? undefined} /> },
  { clave: "unid", titulo: "Unidades pedidas", ancho: 9, alinear: "right", valor: (f) => f.unidades, celda: (f) => <Box sx={cifraSx}>{unidades(f.unidades)}</Box> },
  { clave: "canc", titulo: "Canceladas", ancho: 8, alinear: "right", valor: (f) => f.canceladas, celda: (f) => <Box sx={cifraSx}>{unidades(f.canceladas)}</Box> },
  { clave: "tasaC", titulo: "% cancelación", ancho: 9, alinear: "right", valor: (f) => (f.tasaCancelacion == null ? null : f.tasaCancelacion * 100), celda: (f) => tasa(f.tasaCancelacion) },
  { clave: "dev", titulo: "Devueltas", ancho: 8, alinear: "right", valor: (f) => f.devueltas, celda: (f) => <Box sx={cifraSx}>{unidades(f.devueltas)}</Box> },
  { clave: "tasaD", titulo: "% devolución", ancho: 9, alinear: "right", valor: (f) => (f.tasaDevolucion == null ? null : f.tasaDevolucion * 100), celda: (f) => tasa(f.tasaDevolucion) },
  { clave: "perdido", titulo: "Venta perdida", ancho: 10, alinear: "right", valor: (f) => n(f.perdido.neto), excel: "Venta perdida neta", celda: (f) => <MontoCorto par={f.perdido} fuerte color="#b42318" /> },
  { clave: "motivo", titulo: "Motivo principal", ancho: 17, valor: (f) => f.motivoPrincipal, celda: (f) => f.motivoPrincipal ?? (f.devueltas ? "Devolución" : "—") },
];

/** Falabella: unidades canceladas y devueltas del período, con sus motivos. */
export default function DevolucionesFalabella() {
  const [periodo, setPeriodo] = usePeriodoFal();
  const { datos, cargando, error } = useApiDatos<Respuesta | null>(urlFal("devoluciones", parametrosPeriodo(periodo)), null);
  const r = datos?.resumen;
  const motivos = datos?.motivos ?? [];
  const porOrigen = (Object.keys(ORIGEN) as Motivo["origen"][])
    .map((o) => ({ origen: o, unidades: motivos.filter((m) => m.origen === o).reduce((s, m) => s + m.unidades, 0) }))
    .filter((o) => o.unidades > 0);

  return (
    <PageContainer title="Falabella · Devoluciones y cancelaciones" description="Unidades canceladas y devueltas en Falabella, con sus motivos">
      <Box sx={{ maxWidth: 1680, mx: "auto" }}>
        <SelectorPeriodo filtros={periodo} setFiltros={setPeriodo} contexto={datos} />
        {error ? <Typography sx={{ color: "#b42318", fontSize: 13, mb: 2 }}>No se pudo cargar: {mensajeError(error)}</Typography> : null}
        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>
            <MetricCard title="Unidades pedidas" value={unidades(r?.unidades)} subtitle={`${formatoMonto(r?.venta.neto)} con canceladas y devueltas`} cargando={cargando} icon={<IconPackages size={18} />} />
          </Grid>
          <Grid item xs={6} md={3}>
            <MetricCard title="Canceladas" value={unidades(r?.canceladas)} subtitle={`${tasa(r?.tasaCancelacion ?? null)} de lo pedido`} cargando={cargando} masEsMejor={false} icon={<IconBan size={18} />} />
          </Grid>
          <Grid item xs={6} md={3}>
            <MetricCard title="Devueltas" value={unidades(r?.devueltas)} subtitle={`${tasa(r?.tasaDevolucion ?? null)} de lo pedido`} cargando={cargando} masEsMejor={false} icon={<IconArrowBackUp size={18} />} />
          </Grid>
          <Grid item xs={6} md={3}>
            <MetricCard title="Venta perdida" value={formatoMonto(n(r?.cancelado.neto) + n(r?.devuelto.neto))} subtitle={`${formatoMonto(r?.cancelado.neto)} cancelado · ${formatoMonto(r?.devuelto.neto)} devuelto`} cargando={cargando} masEsMejor={false} icon={<IconCash size={18} />} />
          </Grid>
        </Grid>

        <SeccionTitulo title="Por qué se cancela" infoRight="Motivo que informa Falabella en cada unidad cancelada. Las devoluciones no traen motivo." />
        <Grid container spacing={2}>
          <Grid item xs={12} md={7}>
            <Panel titulo="Motivos de cancelación" descripcion="Unidades canceladas por motivo; el color indica quién lo origina">
              <ListaBarras
                cargando={cargando}
                vacio="Sin cancelaciones en el período."
                items={motivos.map((m) => ({ clave: m.codigo ?? "sin", etiqueta: m.nombre, valor: m.unidades, texto: `${unidades(m.unidades)} · ${tasa(m.parte)}`, color: ORIGEN[m.origen].color }))}
              />
            </Panel>
          </Grid>
          <Grid item xs={12} md={5}>
            <Panel titulo="Quién lo origina" descripcion="Agrupación de los motivos">
              <ListaBarras
                cargando={cargando}
                vacio="Sin cancelaciones en el período."
                items={porOrigen.map((o) => ({ clave: o.origen, etiqueta: ORIGEN[o.origen].texto, valor: o.unidades, texto: `${unidades(o.unidades)} · ${tasa(r?.canceladas ? o.unidades / r.canceladas : null)}`, color: ORIGEN[o.origen].color }))}
              />
            </Panel>
          </Grid>
        </Grid>

        <SeccionTitulo title="Productos" infoRight="Productos con al menos una unidad cancelada o devuelta, por venta perdida." />
        <TablaInforme<Fila>
          filas={datos?.filas ?? []}
          cargando={cargando}
          columnas={COLUMNAS}
          clave={(f) => f.sku}
          textoBusqueda={(f) => `${f.sku} ${f.nombre ?? ""} ${f.categoria ?? ""}`}
          ordenInicial={{ clave: "perdido", direccion: "desc" }}
          nombreExcel="falabella-devoluciones-cancelaciones"
          extraExcel={[
            { titulo: "Nombre", valor: (f) => f.nombre },
            { titulo: "Cancelado neto", valor: (f) => f.cancelado.neto },
            { titulo: "Devuelto neto", valor: (f) => f.devuelto.neto },
            { titulo: "% por Full", valor: (f) => (f.parteFull == null ? null : f.parteFull * 100) },
          ]}
          nota="Venta sin IVA, a precio de lista."
          anchoMinimo={1050}
        />
      </Box>
    </PageContainer>
  );
}
