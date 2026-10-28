"use client";

import React from "react";
import { Box } from "@mui/material";
import { IconAlertTriangle, IconCurrencyDollar, IconPigMoney, IconTrendingDown } from "@tabler/icons-react";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { useApiDatos } from "@/utils/useCargaDatos";
import MetricCard from "@/app/(DashboardLayout)/utilities/ventas/components/MetricCard";
import { etiquetaRango } from "@/app/(DashboardLayout)/utilities/ventas/components/RangosRapidos";
import { Pildoras, cifraSx, estado, formatoMonto, tinta } from "@/app/(DashboardLayout)/utilities/ventas/components/estilo";
import HeaderMl from "@/app/(DashboardLayout)/utilities/ventas/mercado-libre/components/HeaderMl";
import TablaInforme, { CeldaProducto, ColumnaInforme } from "@/app/(DashboardLayout)/utilities/ventas/mercado-libre/components/TablaInforme";
import { urlMl } from "@/app/(DashboardLayout)/utilities/ventas/mercado-libre/components/comun";
import { entero, pesos, porcentaje, redondo, useFiltrosInforme } from "../comun";

interface Fila {
  sku: string;
  nombre: string | null;
  unidades: number;
  unidadesFull: number;
  unidadesColecta: number;
  venta: number;
  comision: number | null;
  envio: number | null;
  costo: number | null;
  margen: number | null;
  margenPct: number | null;
  margenUnitario: number | null;
  comisionEstimada: boolean;
}
interface Respuesta {
  datosAl: string | null;
  estimaciones: boolean;
  filas: Fila[];
}

type Lado = "" | "full" | "colecta";
type Ver = "todos" | "negativo" | "bajo10" | "bajo15";
const VER: { valor: Ver; texto: string }[] = [
  { valor: "todos", texto: "Todos" },
  { valor: "negativo", texto: "Pierden plata" },
  { valor: "bajo10", texto: "Margen < 10 %" },
  { valor: "bajo15", texto: "Margen < 15 %" },
];
const cumple = (f: Fila, v: Ver) =>
  v === "todos" ? true : v === "negativo" ? (f.margen ?? 0) < 0 : f.margenPct != null && f.margenPct < (v === "bajo10" ? 10 : 15);

const cobra = (f: Fila) => (f.comision ?? 0) + (f.envio ?? 0);

/** Color del margen: rojo si pierde, ámbar si es bajo. */
function Margen({ v, pct }: { v: number | null; pct: number | null }) {
  if (v == null) return <Box component="span" sx={{ color: tinta.tenue }}>Sin costo</Box>;
  const color = v < 0 ? estado.mal.color : pct != null && pct < 10 ? "#b54708" : estado.bien.color;
  return (
    <Box component="span" sx={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end", ...cifraSx }}>
      <Box component="span" sx={{ fontWeight: 700, color }}>{pesos(v)}</Box>
      <Box component="span" sx={{ fontSize: 10.5, color }}>{porcentaje(pct)}</Box>
    </Box>
  );
}

/** Informe: rentabilidad por producto en Mercado Libre, después de comisión, envío y costo. */
export default function RentabilidadMercadoLibre() {
  const { filtros, setFiltros, inicial } = useFiltrosInforme<{ lado: Lado; ver: Ver }>("informe-ml-rentabilidad", { lado: "", ver: "todos" });
  const datos = useApiDatos<Respuesta | null>(urlMl("informes/rentabilidad", { fechaInicio: filtros.fechaInicio, fechaFin: filtros.fechaFin, lado: filtros.lado }), null);
  const todas = datos.datos?.filas ?? [];
  const filas = todas.filter((f) => cumple(f, filtros.ver));

  const venta = todas.reduce((s, f) => s + f.venta, 0);
  const margen = todas.reduce((s, f) => s + (f.margen ?? 0), 0);
  const ventaConCosto = todas.filter((f) => f.costo != null).reduce((s, f) => s + f.venta, 0);
  const negativos = todas.filter((f) => (f.margen ?? 0) < 0);
  const bajos = todas.filter((f) => f.margenPct != null && f.margenPct >= 0 && f.margenPct < 10);
  const ver = (v: Ver) => () => setFiltros((x) => ({ ...x, ver: x.ver === v ? "todos" : v }));

  const tarjetas = [
    { title: "Venta", value: formatoMonto(venta), subtitle: `${entero(todas.length)} productos · sin IVA`, icon: <IconCurrencyDollar /> },
    {
      title: "Margen después de todo",
      value: porcentaje(ventaConCosto ? (margen / ventaConCosto) * 100 : null),
      subtitle: `${formatoMonto(margen)} de margen`,
      icon: <IconPigMoney />,
      nota: "Venta − comisión − envío − costo de SAP, sin IVA.",
    },
    {
      title: "Pierden plata",
      value: entero(negativos.length),
      subtitle: `${formatoMonto(negativos.reduce((s, f) => s + (f.margen ?? 0), 0))} de pérdida`,
      icon: <IconTrendingDown />,
      onClick: ver("negativo"),
      nota: "Productos con margen negativo después de comisión, envío y costo. Clic para ver solo estos.",
    },
    {
      title: "Margen bajo (0–10 %)",
      value: entero(bajos.length),
      subtitle: `${formatoMonto(bajos.reduce((s, f) => s + f.venta, 0))} de venta`,
      icon: <IconAlertTriangle />,
      onClick: ver("bajo10"),
      nota: "Clic para ver los productos con margen menor a 10 %.",
    },
  ];

  const columnas: ColumnaInforme<Fila>[] = [
    { clave: "producto", titulo: "Producto", ancho: 30, valor: (f) => f.nombre ?? "", excel: "Producto", celda: (f) => <CeldaProducto sku={f.sku} nombre={f.nombre} /> },
    {
      clave: "unidades",
      titulo: "Unid.",
      ancho: 8,
      alinear: "right",
      valor: (f) => f.unidades,
      celda: (f) => (
        <Box title={`Full ${entero(f.unidadesFull)} · Colecta y otros ${entero(f.unidadesColecta)}`}>{entero(f.unidades)}</Box>
      ),
    },
    { clave: "venta", titulo: "Venta", ancho: 11, alinear: "right", valor: (f) => redondo(f.venta), excel: "Venta sin IVA", celda: (f) => pesos(f.venta) },
    {
      clave: "cobra",
      titulo: "Cobra ML",
      ancho: 11,
      alinear: "right",
      valor: (f) => redondo(cobra(f)),
      excel: "Comisión + envío sin IVA",
      celda: (f) => (
        <Box title={`Comisión ${pesos(f.comision)}${f.comisionEstimada ? " (Full estimada)" : ""} · envío ${pesos(f.envio)}`}>
          {pesos(cobra(f))}
          <Box sx={{ fontSize: 10.5, color: tinta.tenue }}>{porcentaje(f.venta ? (cobra(f) / f.venta) * 100 : null)}</Box>
        </Box>
      ),
    },
    { clave: "costo", titulo: "Costo", ancho: 11, alinear: "right", valor: (f) => redondo(f.costo), excel: "Costo SAP", celda: (f) => pesos(f.costo) },
    { clave: "margen", titulo: "Margen", ancho: 11, alinear: "right", valor: (f) => redondo(f.margen), excel: "Margen sin IVA", celda: (f) => <Margen v={f.margen} pct={f.margenPct} /> },
    { clave: "margenPct", titulo: "Margen %", ancho: 9, alinear: "right", valor: (f) => redondo(f.margenPct, 1), celda: (f) => porcentaje(f.margenPct) },
    { clave: "margenUnitario", titulo: "Por unidad", ancho: 9, alinear: "right", valor: (f) => redondo(f.margenUnitario), excel: "Margen por unidad", celda: (f) => pesos(f.margenUnitario) },
  ];

  return (
    <PageContainer title="Rentabilidad Mercado Libre" description="Margen por producto en Mercado Libre después de comisión, envío y costo">
      <Box sx={{ maxWidth: 1680, mx: "auto" }}>
        <HeaderMl
          titulo="Rentabilidad por producto"
          contexto={filtros.lado === "full" ? "Full" : filtros.lado === "colecta" ? "Colecta y otros" : "Todos los envíos"}
          rango={filtros}
          onRango={(r) => setFiltros((f) => ({ ...f, ...r }))}
          datosAl={datos.cargando ? undefined : datos.datos?.datosAl ?? null}
          enEstadoInicial={!filtros.lado && filtros.ver === "todos" && etiquetaRango(filtros.fechaInicio, filtros.fechaFin) === "Últimos 30 días"}
          onLimpiar={() => setFiltros(inicial())}
        >
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            <Pildoras
              etiqueta="Envío"
              opciones={[
                { valor: "todos", texto: "Todos los envíos" },
                { valor: "full", texto: "Full" },
                { valor: "colecta", texto: "Colecta y otros" },
              ]}
              valor={filtros.lado || "todos"}
              onCambiar={(v) => setFiltros((f) => ({ ...f, lado: v === "todos" ? "" : (v as Lado) }))}
            />
            <Pildoras etiqueta="Mostrar" opciones={VER} valor={filtros.ver} onCambiar={(v) => setFiltros((f) => ({ ...f, ver: v }))} />
          </Box>
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
          ordenInicial={{ clave: filtros.ver === "todos" ? "venta" : "margen", direccion: filtros.ver === "todos" ? "desc" : "asc" }}
          nombreExcel={`rentabilidad_ml_${filtros.fechaInicio}_${filtros.fechaFin}`}
          nota="Montos sin IVA. Costo: costo promedio de SAP. Comisión del Full estimada con la publicación."
          extraExcel={[
            { titulo: "SKU", valor: (f) => f.sku },
            { titulo: "Unidades Full", valor: (f) => f.unidadesFull },
            { titulo: "Unidades Colecta y otros", valor: (f) => f.unidadesColecta },
            { titulo: "Comisión sin IVA", valor: (f) => redondo(f.comision) },
            { titulo: "Envío sin IVA", valor: (f) => redondo(f.envio) },
          ]}
        />
      </Box>
    </PageContainer>
  );
}
