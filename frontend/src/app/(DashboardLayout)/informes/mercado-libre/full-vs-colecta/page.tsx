"use client";

import React from "react";
import { Box } from "@mui/material";
import { IconArrowsExchange, IconBuildingWarehouse, IconTruck, IconTruckReturn } from "@tabler/icons-react";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { useApiDatos } from "@/utils/useCargaDatos";
import MetricCard from "@/app/(DashboardLayout)/utilities/ventas/components/MetricCard";
import { etiquetaRango } from "@/app/(DashboardLayout)/utilities/ventas/components/RangosRapidos";
import { Pildoras, formatoMonto, tinta } from "@/app/(DashboardLayout)/utilities/ventas/components/estilo";
import HeaderMl from "@/app/(DashboardLayout)/utilities/ventas/mercado-libre/components/HeaderMl";
import TablaInforme, { CeldaProducto, ColumnaInforme, Etiqueta } from "@/app/(DashboardLayout)/utilities/ventas/mercado-libre/components/TablaInforme";
import { urlMl } from "@/app/(DashboardLayout)/utilities/ventas/mercado-libre/components/comun";
import { entero, fecha, pesos, porcentaje, redondo, useFiltrosInforme } from "../comun";

interface Lado {
  unidades: number;
  venta: number;
  cobra: number;
  cobraPct: number | null;
  margen: number | null;
  margenPct: number | null;
}
interface Fila {
  sku: string;
  nombre: string | null;
  full: Lado;
  colecta: Lado;
  stockFull: number | null;
  stockFullAl: string | null;
  edadFull: number | null;
  costoMensualFull: number;
  coberturaFull: number | null;
  stock03: number | null;
  sugerencia: "llevar_a_full" | "revisar_full" | null;
}

const SUGERENCIAS = {
  llevar_a_full: {
    texto: "Llevar a Full",
    color: "#175cd3",
    fondo: "#eff8ff",
    ayuda: "Vende 10 o más unidades por Colecta en el período, deja margen y no tiene stock en Full.",
  },
  revisar_full: {
    texto: "Revisar Full",
    color: "#b54708",
    fondo: "#fffaeb",
    ayuda: "Tiene stock en Full que dura más de 90 días al ritmo actual, o ya paga almacenamiento por antigüedad.",
  },
} as const;

type Ver = "todos" | "llevar_a_full" | "revisar_full" | "ambos";
const VER: { valor: Ver; texto: string }[] = [
  { valor: "todos", texto: "Todos" },
  { valor: "llevar_a_full", texto: "Llevar a Full" },
  { valor: "revisar_full", texto: "Revisar Full" },
  { valor: "ambos", texto: "Venden por los dos" },
];

/** Celda de un lado: venta, unidades y margen. */
function CeldaLado({ l }: { l: Lado }) {
  if (!l.unidades) return <Box component="span" sx={{ color: tinta.tenue }}>—</Box>;
  return (
    <Box title={`ML cobra ${pesos(l.cobra)} (${porcentaje(l.cobraPct)})`}>
      <Box component="span" sx={{ fontWeight: 600 }}>{pesos(l.venta)}</Box>
      <Box sx={{ fontSize: 10.5, color: tinta.tenue }}>
        {entero(l.unidades)} u. · margen{" "}
        <Box component="span" sx={{ color: (l.margen ?? 0) < 0 ? "#b42318" : tinta.secundaria, fontWeight: 600 }}>{porcentaje(l.margenPct)}</Box>
      </Box>
    </Box>
  );
}

/** Informe: cada producto en Full y en Colecta, con sugerencia de qué mover. */
export default function FullContraColecta() {
  const { filtros, setFiltros, inicial } = useFiltrosInforme<{ ver: Ver }>("informe-ml-full-vs-colecta", { ver: "todos" });
  const datos = useApiDatos<{ dias: number; filas: Fila[]; datosAl: string | null } | null>(
    urlMl("informes/full-vs-colecta", { fechaInicio: filtros.fechaInicio, fechaFin: filtros.fechaFin }),
    null
  );
  const todas = datos.datos?.filas ?? [];
  const filas = todas.filter((f) =>
    filtros.ver === "todos" ? true : filtros.ver === "ambos" ? f.full.unidades > 0 && f.colecta.unidades > 0 : f.sugerencia === filtros.ver
  );

  const suma = (k: "full" | "colecta") => todas.reduce((s, f) => s + f[k].venta, 0);
  const margenDe = (k: "full" | "colecta") => {
    const conMargen = todas.filter((f) => f[k].margen != null);
    const v = conMargen.reduce((s, f) => s + f[k].venta, 0);
    return v ? (conMargen.reduce((s, f) => s + (f[k].margen ?? 0), 0) / v) * 100 : null;
  };
  const llevar = todas.filter((f) => f.sugerencia === "llevar_a_full");
  const revisar = todas.filter((f) => f.sugerencia === "revisar_full");
  const elegir = (v: Ver) => () => setFiltros((x) => ({ ...x, ver: x.ver === v ? "todos" : v }));
  const tarjetas = [
    { title: "Full", value: formatoMonto(suma("full")), subtitle: `Margen ${porcentaje(margenDe("full"))} · sin IVA`, icon: <IconBuildingWarehouse /> },
    { title: "Colecta y otros", value: formatoMonto(suma("colecta")), subtitle: `Margen ${porcentaje(margenDe("colecta"))} · sin IVA`, icon: <IconTruck /> },
    {
      title: "Candidatos a Full",
      value: entero(llevar.length),
      subtitle: `${entero(llevar.reduce((s, f) => s + f.colecta.unidades, 0))} u. vendidas por Colecta`,
      icon: <IconArrowsExchange />,
      onClick: elegir("llevar_a_full"),
      nota: `${SUGERENCIAS.llevar_a_full.ayuda} Clic para verlos.`,
    },
    {
      title: "Revisar en Full",
      value: entero(revisar.length),
      subtitle: `${formatoMonto(revisar.reduce((s, f) => s + f.costoMensualFull, 0))}/mes en almacenamiento`,
      icon: <IconTruckReturn />,
      onClick: elegir("revisar_full"),
      nota: `${SUGERENCIAS.revisar_full.ayuda} Clic para verlos.`,
    },
  ];

  const columnas: ColumnaInforme<Fila>[] = [
    { clave: "producto", titulo: "Producto", ancho: 26, valor: (f) => f.nombre ?? "", celda: (f) => <CeldaProducto sku={f.sku} nombre={f.nombre} /> },
    {
      clave: "sugerencia",
      titulo: "Sugerencia",
      ancho: 11,
      valor: (f) => (f.sugerencia ? SUGERENCIAS[f.sugerencia].texto : ""),
      celda: (f) => (f.sugerencia ? <Box title={SUGERENCIAS[f.sugerencia].ayuda}><Etiqueta {...SUGERENCIAS[f.sugerencia]} /></Box> : "—"),
    },
    { clave: "full", titulo: "Full", ancho: 13, alinear: "right", valor: (f) => redondo(f.full.venta), excel: "Venta Full sin IVA", celda: (f) => <CeldaLado l={f.full} /> },
    { clave: "colecta", titulo: "Colecta y otros", ancho: 13, alinear: "right", valor: (f) => redondo(f.colecta.venta), excel: "Venta Colecta sin IVA", celda: (f) => <CeldaLado l={f.colecta} /> },
    {
      clave: "stockFull",
      titulo: "Stock Full",
      ancho: 10,
      alinear: "right",
      valor: (f) => f.stockFull,
      celda: (f) =>
        f.stockFull == null ? (
          <Box component="span" sx={{ color: tinta.tenue }}>—</Box>
        ) : (
          <Box title={`Según ML al ${fecha(f.stockFullAl)}`}>
            {entero(f.stockFull)}
            <Box sx={{ fontSize: 10.5, color: tinta.tenue }}>{f.edadFull != null ? `${entero(f.edadFull)} d de edad` : ""}</Box>
          </Box>
        ),
    },
    {
      clave: "cobertura",
      titulo: "Alcanza (Full)",
      ancho: 10,
      alinear: "right",
      valor: (f) => redondo(f.coberturaFull),
      excel: "Cobertura Full (días)",
      celda: (f) => (f.coberturaFull == null ? "—" : <Box component="span" sx={{ color: f.coberturaFull > 90 ? "#b54708" : tinta.primaria, fontWeight: f.coberturaFull > 90 ? 700 : 400 }}>{entero(f.coberturaFull)} d</Box>),
    },
    { clave: "costoMensual", titulo: "Cobro Full/mes", ancho: 9, alinear: "right", valor: (f) => f.costoMensualFull, celda: (f) => (f.costoMensualFull ? pesos(f.costoMensualFull) : "—") },
    { clave: "stock03", titulo: "Bodega 03", ancho: 8, alinear: "right", valor: (f) => f.stock03, celda: (f) => entero(f.stock03) },
  ];

  return (
    <PageContainer title="Full contra Colecta" description="Cada producto de Mercado Libre en Full y en Colecta, con sugerencia">
      <Box sx={{ maxWidth: 1680, mx: "auto" }}>
        <HeaderMl
          titulo="Full contra Colecta"
          contexto="Qué conviene mover"
          rango={filtros}
          onRango={(r) => setFiltros((f) => ({ ...f, ...r }))}
          datosAl={datos.cargando ? undefined : datos.datos?.datosAl ?? null}
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
          ordenInicial={filtros.ver === "llevar_a_full" ? { clave: "colecta", direccion: "desc" } : filtros.ver === "revisar_full" ? { clave: "cobertura", direccion: "desc" } : { clave: "full", direccion: "desc" }}
          nombreExcel={`full_vs_colecta_ml_${filtros.fechaInicio}_${filtros.fechaFin}`}
          nota="Montos sin IVA. Margen = venta − comisión − envío − costo de SAP. Las sugerencias son reglas simples: revisa cada caso antes de mover mercadería."
          extraExcel={[
            { titulo: "SKU", valor: (f) => f.sku },
            { titulo: "Unidades Full", valor: (f) => f.full.unidades },
            { titulo: "Margen Full %", valor: (f) => redondo(f.full.margenPct, 1) },
            { titulo: "Unidades Colecta", valor: (f) => f.colecta.unidades },
            { titulo: "Margen Colecta %", valor: (f) => redondo(f.colecta.margenPct, 1) },
          ]}
        />
      </Box>
    </PageContainer>
  );
}
