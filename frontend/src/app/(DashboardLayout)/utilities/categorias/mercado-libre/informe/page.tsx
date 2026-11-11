"use client";

import React from "react";
import { Box, Grid, Typography } from "@mui/material";
import { IconCash, IconPackages, IconPercentage, IconReceipt, IconShoppingCart, IconTicket } from "@tabler/icons-react";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { useApiDatos } from "@/utils/useCargaDatos";
import { useEstadoVista } from "@/utils/estadoVista";
import MetricCard from "../../../ventas/components/MetricCard";
import SeccionTitulo from "../../../ventas/components/SeccionTitulo";
import ListaBarras from "../../../ventas/components/ListaBarras";
import { ChipVariacion, Panel, formatoMonto, formatoPorcentaje, tinta } from "../../../ventas/components/estilo";
import { AvisosDatos, Comparativo, LeyendaTiposCat, SelectorPeriodo, mensajeError, n, parametrosPeriodo, pct, pp, unidades, urlCat, usePeriodoMl } from "../components/comun";
import { TablaCategorias, rutaFicha } from "../components/tablas";
import { useRouter } from "next/navigation";

type Paso = { id: string; nombre: string };

/** Informe de categorías de Mercado Libre: un período contra otro, por nivel del árbol de ML. */
export default function InformeCategoriasMl() {
  const router = useRouter();
  const [periodo, setPeriodo] = usePeriodoMl();
  const [nav, setNav] = useEstadoVista<{ ruta: Paso[] }>("categorias-ml:informe", () => ({ ruta: [] }));
  const ruta = nav.ruta;
  const padre = ruta[ruta.length - 1];

  const { datos, cargando, error } = useApiDatos<Comparativo | null>(
    urlCat("comparativo", { ...parametrosPeriodo(periodo), nivel: ruta.length, padre: padre?.id }),
    null
  );
  const t = datos?.total;
  const filas = datos?.categorias ?? [];
  const conBase = filas.filter((f) => f.id && n(f.comparacion.venta.neto) > 0);
  const suben = [...conBase].sort((a, b) => n(b.diferencia.neto) - n(a.diferencia.neto)).filter((f) => n(f.diferencia.neto) > 0).slice(0, 6);
  const bajan = [...conBase].sort((a, b) => n(a.diferencia.neto) - n(b.diferencia.neto)).filter((f) => n(f.diferencia.neto) < 0).slice(0, 6);

  const tarjetas = [
    { title: "Venta neta", value: formatoMonto(t?.actual.venta.neto), subtitle: `Comparación: ${formatoMonto(t?.comparacion.venta.neto)}`, percentageChange: pct(t?.variacion.venta) ?? undefined, icon: <IconCash size={18} /> },
    { title: "Unidades", value: unidades(t?.actual.unidades), subtitle: `Comparación: ${unidades(t?.comparacion.unidades)}`, percentageChange: pct(t?.variacion.unidades) ?? undefined, icon: <IconPackages size={18} /> },
    { title: "Órdenes", value: unidades(t?.actual.ordenes), subtitle: `Comparación: ${unidades(t?.comparacion.ordenes)}`, percentageChange: pct(t?.variacion.ordenes) ?? undefined, icon: <IconShoppingCart size={18} /> },
    { title: "Ticket promedio", value: formatoMonto(t?.actual.ticket.neto), subtitle: `Comparación: ${formatoMonto(t?.comparacion.ticket.neto)}`, percentageChange: t?.comparacion.ticket.neto ? ((n(t.actual.ticket.neto) - n(t.comparacion.ticket.neto)) / n(t.comparacion.ticket.neto)) * 100 : undefined, icon: <IconTicket size={18} /> },
    { title: "Margen estimado", value: formatoMonto(t?.actual.margen), subtitle: `Comparación: ${formatoMonto(t?.comparacion.margen)}`, percentageChange: pct(t?.variacion.margen) ?? undefined, icon: <IconReceipt size={18} /> },
    { title: "Margen %", value: t?.actual.margenPct == null ? "—" : formatoPorcentaje(t.actual.margenPct * 100), subtitle: `Comparación: ${t?.comparacion.margenPct == null ? "—" : formatoPorcentaje(t.comparacion.margenPct * 100)}`, percentageChange: pp(t?.variacion.margenPuntos) ?? undefined, unidadVariacion: "pp" as const, icon: <IconPercentage size={18} /> },
  ];

  const barras = (lista: typeof conBase, color: string) =>
    lista.map((f) => ({
      clave: f.id as string,
      etiqueta: f.nombre,
      valor: Math.abs(n(f.diferencia.neto)),
      texto: `${n(f.diferencia.neto) > 0 ? "+" : "−"}${formatoMonto(Math.abs(n(f.diferencia.neto)))}`,
      color,
      detalle: <ChipVariacion valor={pct(f.variacion.venta)} />,
    }));

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
    <PageContainer title="Categorías Mercado Libre" description="Venta, crecimiento y margen por categoría de Mercado Libre, un período contra otro">
      <Box sx={{ maxWidth: 1680, mx: "auto" }}>
        <SelectorPeriodo filtros={periodo} setFiltros={setPeriodo} contexto={datos} />
        {error ? <Typography sx={{ color: "#b42318", fontSize: 13, mb: 2 }}>No se pudo cargar el informe: {mensajeError(error)}</Typography> : null}
        <AvisosDatos contexto={datos} />

        <Grid container spacing={2}>
          {tarjetas.map((c) => (
            <Grid item xs={6} md={4} lg={2} key={c.title}>
              <MetricCard {...c} cargando={cargando} />
            </Grid>
          ))}
        </Grid>

        <SeccionTitulo title="Quién explica el cambio" infoRight="Diferencia de venta neta contra el período de comparación, en este nivel." />
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Panel titulo="Las que más crecen" descripcion="Mayor aumento de venta en pesos">
              <ListaBarras items={barras(suben, "#1baf7a")} cargando={cargando} vacio="Ninguna categoría creció." numerado onSeleccionar={(i) => router.push(rutaFicha(i.clave, i.etiqueta))} />
            </Panel>
          </Grid>
          <Grid item xs={12} md={6}>
            <Panel titulo="Las que más caen" descripcion="Mayor baja de venta en pesos">
              <ListaBarras items={barras(bajan, "#e5484d")} cargando={cargando} vacio="Ninguna categoría cayó." numerado onSeleccionar={(i) => router.push(rutaFicha(i.clave, i.etiqueta))} />
            </Panel>
          </Grid>
        </Grid>

        <SeccionTitulo title="Categorías" infoRight="Pulsa una categoría para ver sus subcategorías; «Ver ficha» abre su evolución y productos." />
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.75, mb: 1 }}>
          {miga("Todo Mercado Libre", 0, ruta.length === 0)}
          {ruta.map((p, i) => (
            <React.Fragment key={p.id}>
              <Box component="span" sx={{ color: tinta.tenue }}>›</Box>
              {miga(p.nombre, i + 1, i === ruta.length - 1)}
            </React.Fragment>
          ))}
          <Box sx={{ flex: 1 }} />
          <LeyendaTiposCat />
        </Box>
        <TablaCategorias
          filas={filas}
          cargando={cargando}
          onEntrar={(f) => f.id && setNav({ ruta: [...ruta, { id: f.id, nombre: f.nombre }] })}
          nombreExcel={`categorias-ml${padre ? `-${padre.nombre}` : ""}`}
        />
      </Box>
    </PageContainer>
  );
}
