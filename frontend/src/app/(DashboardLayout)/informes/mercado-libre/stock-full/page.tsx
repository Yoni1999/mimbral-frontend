"use client";

import React from "react";
import { Box } from "@mui/material";
import { IconCash, IconClockDollar, IconHourglassHigh, IconPackages } from "@tabler/icons-react";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { useApiDatos } from "@/utils/useCargaDatos";
import { useEstadoVista } from "@/utils/estadoVista";
import MetricCard from "@/app/(DashboardLayout)/utilities/ventas/components/MetricCard";
import { Pildoras, formatoMonto, tinta } from "@/app/(DashboardLayout)/utilities/ventas/components/estilo";
import TablaInforme, { CeldaProducto, ColumnaInforme, EncabezadoInforme, Etiqueta, Filtro } from "@/app/(DashboardLayout)/utilities/ventas/mercado-libre/components/TablaInforme";
import { urlMl } from "@/app/(DashboardLayout)/utilities/ventas/mercado-libre/components/comun";
import { entero, fecha, pesos, redondo } from "../comun";

interface Fila {
  sku: string;
  nombre: string | null;
  unidades: number;
  noVendibles: number;
  edad: number | null;
  tramo: string | null;
  tamano: string | null;
  costoMensual: number;
  ventas30: number;
  ventas90: number;
  diasEnFull: number | null;
  cobertura: number | null;
  proximoTramo: string | null;
  diasAlProximoTramo: number | null;
  cargoProximoMensual: number | null;
  valorInmovilizado: number | null;
  al: string | null;
}

type Ver = "todos" | "pagan" | "saltan" | "lentos" | "sinVenta";
const VER: { valor: Ver; texto: string }[] = [
  { valor: "todos", texto: "Todos" },
  { valor: "pagan", texto: "Ya pagan antigüedad" },
  { valor: "saltan", texto: "Saltan de tramo en ≤ 30 días" },
  { valor: "lentos", texto: "Rotación lenta (> 90 días)" },
  { valor: "sinVenta", texto: "Sin venta en 30 días" },
];
const cumple = (f: Fila, v: Ver) =>
  v === "todos"
    ? true
    : v === "pagan"
      ? f.costoMensual > 0 || !!f.tramo
      : v === "saltan"
        ? f.diasAlProximoTramo != null && f.diasAlProximoTramo <= 30
        : v === "lentos"
          ? f.cobertura != null && f.cobertura > 90
          : f.ventas30 === 0;

/** Informe: stock en la bodega Full de ML que cuesta o va a costar (antigüedad y rotación). */
export default function StockFullQueCuesta() {
  // useEstadoVista guarda objetos: el filtro va dentro de uno.
  const [vista, setVista] = useEstadoVista<{ ver: Ver }>("informe-ml-stock-full", () => ({ ver: "todos" }));
  const ver = vista.ver;
  const setVer = (v: Ver | ((x: Ver) => Ver)) => setVista((s) => ({ ver: typeof v === "function" ? v(s.ver) : v }));
  const datos = useApiDatos<{ filas: Fila[] } | null>(urlMl("informes/stock-full", {}), null);
  const todas = datos.datos?.filas ?? [];
  const filas = todas.filter((f) => cumple(f, ver));

  const pagan = todas.filter((f) => f.costoMensual > 0);
  const saltan = todas.filter((f) => cumple(f, "saltan"));
  const lentos = todas.filter((f) => cumple(f, "lentos") || cumple(f, "sinVenta"));
  const elegir = (v: Ver) => () => setVer((x) => (x === v ? "todos" : v));
  const tarjetas = [
    {
      title: "Stock en Full",
      value: `${entero(todas.reduce((s, f) => s + f.unidades, 0))} u.`,
      subtitle: `${entero(todas.length)} productos · ${formatoMonto(todas.reduce((s, f) => s + (f.valorInmovilizado ?? 0), 0))} a costo`,
      icon: <IconPackages />,
    },
    {
      title: "Ya pagan antigüedad",
      value: `${formatoMonto(pagan.reduce((s, f) => s + f.costoMensual, 0))}/mes`,
      subtitle: `${entero(pagan.length)} productos`,
      icon: <IconCash />,
      onClick: elegir("pagan"),
      nota: "Cargo mensual que ML cobra hoy por stock con más de 4 meses en Full. Clic para verlos.",
    },
    {
      title: "Saltan de tramo en 30 días",
      value: entero(saltan.length),
      subtitle: `+${formatoMonto(saltan.reduce((s, f) => s + (f.cargoProximoMensual ?? 0), 0))}/mes si no se mueven`,
      icon: <IconClockDollar />,
      onClick: elegir("saltan"),
      nota: "Productos cuyo stock más antiguo entra al próximo tramo de cobro en 30 días o menos. Clic para verlos.",
    },
    {
      title: "Rotación lenta o sin venta",
      value: entero(lentos.length),
      subtitle: `${formatoMonto(lentos.reduce((s, f) => s + (f.valorInmovilizado ?? 0), 0))} inmovilizados a costo`,
      icon: <IconHourglassHigh />,
      onClick: elegir("lentos"),
      nota: "Stock que dura más de 90 días al ritmo de los últimos 30, o que no vendió en 30 días.",
    },
  ];

  const columnas: ColumnaInforme<Fila>[] = [
    { clave: "producto", titulo: "Producto", ancho: 27, valor: (f) => f.nombre ?? "", celda: (f) => <CeldaProducto sku={f.sku} nombre={f.nombre} secundario={f.tamano ?? undefined} /> },
    {
      clave: "unidades",
      titulo: "Stock Full",
      ancho: 9,
      alinear: "right",
      valor: (f) => f.unidades,
      celda: (f) => (
        <Box title={f.al ? `Según ML al ${fecha(f.al)}` : ""}>
          {entero(f.unidades)}
          {f.noVendibles > 0 && <Box sx={{ fontSize: 10.5, color: "#b54708" }}>+{entero(f.noVendibles)} no vendibles</Box>}
          <Box sx={{ fontSize: 10, color: tinta.tenue }}>al {fecha(f.al)}</Box>
        </Box>
      ),
    },
    { clave: "edad", titulo: "Edad", ancho: 8, alinear: "right", valor: (f) => f.edad, excel: "Edad del stock más antiguo (días)", celda: (f) => (f.edad == null ? <Box component="span" sx={{ color: tinta.tenue }}>Sin dato</Box> : `${entero(f.edad)} d`) },
    {
      clave: "tramo",
      titulo: "Tramo",
      ancho: 9,
      valor: (f) => f.tramo ?? "",
      celda: (f) => (f.tramo ? <Etiqueta texto={f.tramo} color="#b42318" fondo="#fef3f2" /> : <Box component="span" sx={{ color: tinta.tenue }}>Sin cobro</Box>),
    },
    { clave: "costoMensual", titulo: "Cobro/mes", ancho: 9, alinear: "right", valor: (f) => f.costoMensual, excel: "Cobro mensual actual", celda: (f) => (f.costoMensual ? pesos(f.costoMensual) : "—") },
    {
      clave: "proximo",
      titulo: "Próximo tramo",
      ancho: 11,
      alinear: "right",
      valor: (f) => f.diasAlProximoTramo,
      excel: "Días al próximo tramo",
      celda: (f) =>
        f.diasAlProximoTramo == null ? (
          "—"
        ) : (
          <Box>
            <Box component="span" sx={{ fontWeight: 600, color: f.diasAlProximoTramo <= 30 ? "#b54708" : tinta.primaria }}>
              {f.proximoTramo} en {entero(f.diasAlProximoTramo)} d
            </Box>
            {f.cargoProximoMensual != null && <Box sx={{ fontSize: 10.5, color: tinta.tenue }}>{pesos(f.cargoProximoMensual)}/mes</Box>}
          </Box>
        ),
    },
    { clave: "ventas30", titulo: "Vende 30 d", ancho: 8, alinear: "right", valor: (f) => f.ventas30, celda: (f) => entero(f.ventas30) },
    {
      clave: "cobertura",
      titulo: "Alcanza",
      ancho: 9,
      alinear: "right",
      valor: (f) => (f.cobertura == null ? (f.ventas30 === 0 ? 99999 : null) : redondo(f.cobertura)),
      excel: "Cobertura (días)",
      celda: (f) =>
        f.cobertura == null ? (
          <Box component="span" sx={{ color: "#b42318", fontWeight: 600 }}>Sin venta</Box>
        ) : (
          <Box component="span" sx={{ color: f.cobertura > 90 ? "#b54708" : tinta.primaria, fontWeight: f.cobertura > 90 ? 700 : 400 }}>
            {entero(f.cobertura)} d
          </Box>
        ),
    },
    { clave: "valor", titulo: "A costo", ancho: 10, alinear: "right", valor: (f) => redondo(f.valorInmovilizado), excel: "Valor a costo SAP", celda: (f) => pesos(f.valorInmovilizado) },
  ];

  return (
    <PageContainer title="Stock Full que cuesta" description="Stock en la bodega Full de Mercado Libre por antigüedad, cobro y rotación">
      <Box sx={{ maxWidth: 1680, mx: "auto" }}>
        <EncabezadoInforme
          titulo="Stock Full que cuesta"
          descripcion="Stock en la bodega Full de ML, cuánto paga hoy por antigüedad, cuándo salta al próximo tramo y cuánto dura al ritmo actual. Foto del último barrido de ML (cada producto trae su fecha)."
        >
          <Filtro etiqueta="Mostrar">
            <Pildoras etiqueta="Mostrar" opciones={VER} valor={ver} onCambiar={setVer} />
          </Filtro>
        </EncabezadoInforme>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2, mb: 2 }}>
          {tarjetas.map((t) => (
            <MetricCard key={t.title} {...t} cargando={datos.cargando} />
          ))}
        </Box>

        <TablaInforme
          key={ver}
          filas={filas}
          cargando={datos.cargando}
          columnas={columnas}
          clave={(f) => f.sku}
          textoBusqueda={(f) => `${f.sku} ${f.nombre ?? ""}`}
          ordenInicial={ver === "saltan" ? { clave: "proximo", direccion: "asc" } : ver === "todos" ? { clave: "valor", direccion: "desc" } : { clave: "costoMensual", direccion: "desc" }}
          nombreExcel="stock_full_ml"
          nota="Tramos de ML: 4–6 meses desde 120 días, 6–12 meses desde 180, más de 12 desde 365. Sin dato de edad: ML no informó la entrada."
          extraExcel={[
            { titulo: "SKU", valor: (f) => f.sku },
            { titulo: "No vendibles", valor: (f) => f.noVendibles },
            { titulo: "Tamaño", valor: (f) => f.tamano },
            { titulo: "Cargo próximo tramo (mes)", valor: (f) => f.cargoProximoMensual },
            { titulo: "Ventas 90 días", valor: (f) => f.ventas90 },
            { titulo: "Dato al", valor: (f) => (f.al ? f.al.slice(0, 10) : "") },
          ]}
        />
      </Box>
    </PageContainer>
  );
}
