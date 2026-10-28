"use client";

import React from "react";
import { Box, Tooltip } from "@mui/material";
import { IconArrowDownRight, IconExternalLink, IconScale, IconTag, IconTrendingDown } from "@tabler/icons-react";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { useApiDatos } from "@/utils/useCargaDatos";
import { useEstadoVista } from "@/utils/estadoVista";
import MetricCard from "@/app/(DashboardLayout)/utilities/ventas/components/MetricCard";
import { Pildoras, cifraSx, tinta } from "@/app/(DashboardLayout)/utilities/ventas/components/estilo";
import TablaInforme, { CeldaProducto, ColumnaInforme, EncabezadoInforme, Filtro } from "@/app/(DashboardLayout)/utilities/ventas/mercado-libre/components/TablaInforme";
import { urlMl } from "@/app/(DashboardLayout)/utilities/ventas/mercado-libre/components/comun";
import { entero, fecha, pesos, porcentaje, redondo } from "../comun";

interface Fila {
  sku: string;
  itemId: string;
  nombre: string | null;
  precio: number;
  precioOriginal: number | null;
  enOferta: boolean;
  comisionPct: number | null;
  envio: number | null;
  costo: number | null;
  margenPct: number | null;
  precioMinimo: number | null;
  bajoObjetivo: boolean;
  unidades7d: number;
  logistica: string | null;
  url: string | null;
  competencia: {
    tienda: string;
    vendedor: string | null;
    precio: number;
    /** La más barata de ML puede costar más que nosotros. */
    masBarataQueNosotros: boolean;
    url: string | null;
    al: string | null;
    cantidad: number | null;
    diferenciaPct: number | null;
    margenAlIgualar: number | null;
  } | null;
}

type Ver = "todos" | "bajoObjetivo" | "masCaros" | "masBaratos" | "conCompetencia";
const VER: { valor: Ver; texto: string }[] = [
  { valor: "todos", texto: "Todos" },
  { valor: "bajoObjetivo", texto: "Bajo el margen objetivo" },
  { valor: "masCaros", texto: "Más caros que la competencia (> 5 %)" },
  { valor: "masBaratos", texto: "Más baratos (> 5 %)" },
  { valor: "conCompetencia", texto: "Con competencia en ML" },
];
const cumple = (f: Fila, v: Ver) =>
  v === "todos"
    ? true
    : v === "bajoObjetivo"
      ? f.bajoObjetivo
      : v === "masCaros"
        ? (f.competencia?.diferenciaPct ?? 0) > 5
        : v === "masBaratos"
          ? (f.competencia?.diferenciaPct ?? 0) < -5
          : !!f.competencia;

const Enlace = ({ url, children }: { url: string | null; children: React.ReactNode }) =>
  url ? (
    <Box component="a" href={url} target="_blank" rel="noopener noreferrer" sx={{ color: tinta.acento, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 0.3, "&:hover": { textDecoration: "underline" } }}>
      {children} <IconExternalLink size={12} />
    </Box>
  ) : (
    <>{children}</>
  );

/** Informe: precio en ML contra el mínimo para el margen objetivo y contra la competencia. */
export default function PrecioYCompetencia() {
  const [filtros, setFiltros] = useEstadoVista<{ objetivo: "10" | "15" | "20" | "25"; ver: Ver }>("informe-ml-precios", () => ({ objetivo: "15", ver: "todos" }));
  const datos = useApiDatos<{ filas: Fila[] } | null>(urlMl("informes/precios", { objetivo: filtros.objetivo }), null);
  const todas = datos.datos?.filas ?? [];
  const filas = todas.filter((f) => cumple(f, filtros.ver));

  const elegir = (v: Ver) => () => setFiltros((x) => ({ ...x, ver: x.ver === v ? "todos" : v }));
  const con = todas.filter((f) => f.competencia);
  const tarjetas = [
    {
      title: "Publicaciones activas",
      value: entero(todas.length),
      subtitle: `${entero(con.length)} con competencia en ML (30 días)`,
      icon: <IconTag />,
      onClick: elegir("conCompetencia"),
      nota: "Competencia: otros vendedores de Mercado Libre del monitor de precios, con precio visto en los últimos 30 días. Clic para ver solo esas.",
    },
    {
      title: `Bajo ${filtros.objetivo} % de margen`,
      value: entero(todas.filter((f) => f.bajoObjetivo).length),
      subtitle: "Precio menor al mínimo para el objetivo",
      icon: <IconTrendingDown />,
      onClick: elegir("bajoObjetivo"),
      nota: "Con la comisión y el envío de la publicación y el costo de SAP, el precio publicado deja menos que el margen objetivo. Clic para verlas.",
    },
    {
      title: "Más caros que la competencia",
      value: entero(con.filter((f) => cumple(f, "masCaros")).length),
      subtitle: "Más de 5 % sobre el precio más bajo",
      icon: <IconScale />,
      onClick: elegir("masCaros"),
      nota: "Hay otro vendedor de ML más de 5 % más barato que nosotros (precio visto en los últimos 30 días). Clic para verlas.",
    },
    {
      title: "Más baratos que la competencia",
      value: entero(con.filter((f) => cumple(f, "masBaratos")).length),
      subtitle: "Más de 5 % bajo el precio más bajo",
      icon: <IconArrowDownRight />,
      onClick: elegir("masBaratos"),
      nota: "Somos más de 5 % más baratos que el vendedor de ML más barato: puede haber espacio para subir el precio. Clic para verlos.",
    },
  ];

  const columnas: ColumnaInforme<Fila>[] = [
    { clave: "producto", titulo: "Producto", ancho: 25, valor: (f) => f.nombre ?? "", celda: (f) => <CeldaProducto sku={f.sku} nombre={f.nombre} secundario={`${entero(f.unidades7d)} u. en 7 días`} /> },
    {
      clave: "precio",
      titulo: "Precio ML",
      ancho: 10,
      alinear: "right",
      valor: (f) => f.precio,
      excel: "Precio ML (con IVA)",
      celda: (f) => (
        <Box>
          <Enlace url={f.url}>{pesos(f.precio)}</Enlace>
          {f.enOferta && f.precioOriginal && <Box sx={{ fontSize: 10.5, color: tinta.tenue, textDecoration: "line-through" }}>{pesos(f.precioOriginal)}</Box>}
        </Box>
      ),
    },
    {
      clave: "margen",
      titulo: "Margen hoy",
      ancho: 9,
      alinear: "right",
      valor: (f) => redondo(f.margenPct, 1),
      excel: "Margen hoy %",
      celda: (f) => (
        <Tooltip title={`Comisión ${porcentaje(f.comisionPct, 0)} · envío ${pesos(f.envio)} · costo ${pesos(f.costo)}`} arrow placement="top">
          <Box component="span" sx={{ fontWeight: 700, color: (f.margenPct ?? 0) < 0 ? "#b42318" : f.bajoObjetivo ? "#b54708" : "#067647", ...cifraSx }}>{porcentaje(f.margenPct)}</Box>
        </Tooltip>
      ),
    },
    {
      clave: "minimo",
      titulo: `Mínimo ${filtros.objetivo} %`,
      ancho: 11,
      alinear: "right",
      valor: (f) => redondo(f.precioMinimo),
      excel: `Precio mínimo para ${filtros.objetivo} % (con IVA)`,
      celda: (f) => (f.precioMinimo == null ? "—" : <Box component="span" sx={{ color: f.bajoObjetivo ? "#b54708" : tinta.secundaria, fontWeight: f.bajoObjetivo ? 700 : 400 }}>{pesos(f.precioMinimo)}</Box>),
    },
    {
      clave: "competencia",
      titulo: "Competencia en ML",
      ancho: 18,
      valor: (f) => f.competencia?.precio,
      excel: "Precio más bajo de otro vendedor en ML",
      celda: (f) =>
        f.competencia ? (
          f.competencia.masBarataQueNosotros ? (
            <Box>
              <Enlace url={f.competencia.url}>{pesos(f.competencia.precio)}</Enlace>
              <Box sx={{ fontSize: 10.5, color: tinta.tenue }}>
                {f.competencia.vendedor ?? "Otro vendedor"} · {fecha(f.competencia.al)}
                {f.competencia.cantidad && f.competencia.cantidad > 1 ? ` · ${f.competencia.cantidad} vendedores` : ""}
              </Box>
            </Box>
          ) : (
            // Nadie en ML vende más barato: se dice, y el más cercano queda como referencia.
            <Box>
              <Box component="span" sx={{ fontWeight: 600, color: "#067647" }}>Somos los más baratos</Box>
              <Box sx={{ fontSize: 10.5, color: tinta.tenue }}>
                Siguiente: <Enlace url={f.competencia.url}>{pesos(f.competencia.precio)}</Enlace> · {f.competencia.vendedor ?? "otro vendedor"}
              </Box>
            </Box>
          )
        ) : (
          <Box component="span" sx={{ color: tinta.tenue }}>Sin dato</Box>
        ),
    },
    {
      clave: "diferencia",
      titulo: "Diferencia",
      ancho: 13,
      alinear: "right",
      valor: (f) => redondo(f.competencia?.diferenciaPct, 1),
      excel: "Diferencia vs competencia %",
      celda: (f) => {
        const d = f.competencia?.diferenciaPct;
        if (d == null) return "—";
        return (
          <Box title={f.competencia?.margenAlIgualar != null ? `Si igualas su precio el margen queda en ${porcentaje(f.competencia.margenAlIgualar)}` : ""}>
            <Box component="span" sx={{ fontWeight: 700, color: d > 5 ? "#b42318" : d < -5 ? "#067647" : tinta.secundaria }}>
              {d > 0 ? "+" : ""}
              {porcentaje(d)}
            </Box>
            {f.competencia?.margenAlIgualar != null && <Box sx={{ fontSize: 10.5, color: tinta.tenue }}>al igualar: {porcentaje(f.competencia.margenAlIgualar)}</Box>}
          </Box>
        );
      },
    },
    { clave: "unidades7d", titulo: "Vende 7 d", ancho: 8, alinear: "right", valor: (f) => f.unidades7d, celda: (f) => entero(f.unidades7d) },
    { clave: "logistica", titulo: "Envío", ancho: 6, valor: (f) => (f.logistica === "fulfillment" ? "Full" : f.logistica === "cross_docking" ? "Colecta" : f.logistica ?? ""), ordenable: false },
  ];

  return (
    <PageContainer title="Precio y competencia" description="Precio en Mercado Libre contra el mínimo para el margen objetivo y la competencia">
      <Box sx={{ maxWidth: 1680, mx: "auto" }}>
        <EncabezadoInforme
          titulo="Precio y competencia"
          descripcion="Publicaciones activas de ML (la más vendida de cada producto): margen al precio de hoy, precio mínimo para el margen objetivo y el precio más bajo de otros vendedores de Mercado Libre en los últimos 30 días. Fuente: cálculo de márgenes del PIM y monitor de competencia (solo Mercado Libre)."
        >
          <Filtro etiqueta="Margen objetivo">
            <Pildoras
              etiqueta="Margen objetivo"
              opciones={[
                { valor: "10", texto: "10 %" },
                { valor: "15", texto: "15 %" },
                { valor: "20", texto: "20 %" },
                { valor: "25", texto: "25 %" },
              ]}
              valor={filtros.objetivo}
              onCambiar={(v) => setFiltros((x) => ({ ...x, objetivo: v }))}
            />
          </Filtro>
          <Filtro etiqueta="Mostrar">
            <Pildoras etiqueta="Mostrar" opciones={VER} valor={filtros.ver} onCambiar={(v) => setFiltros((x) => ({ ...x, ver: v }))} />
          </Filtro>
        </EncabezadoInforme>

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
          clave={(f) => f.itemId}
          textoBusqueda={(f) => `${f.sku} ${f.nombre ?? ""} ${f.itemId}`}
          ordenInicial={filtros.ver === "masCaros" || filtros.ver === "masBaratos" ? { clave: "diferencia", direccion: filtros.ver === "masCaros" ? "desc" : "asc" } : { clave: "unidades7d", direccion: "desc" }}
          nombreExcel={`precios_ml_objetivo_${filtros.objetivo}`}
          nota="Precios con IVA. Margen sobre la venta neta: precio − comisión − envío − costo de SAP. Competencia: otros vendedores de ML del monitor (no páginas web); revisa que sea el mismo producto."
          extraExcel={[
            { titulo: "SKU", valor: (f) => f.sku },
            { titulo: "Publicación", valor: (f) => f.itemId },
            { titulo: "Comisión %", valor: (f) => f.comisionPct },
            { titulo: "Envío", valor: (f) => f.envio },
            { titulo: "Costo SAP", valor: (f) => redondo(f.costo) },
            { titulo: "Vendedor competencia (ML)", valor: (f) => f.competencia?.vendedor },
            { titulo: "Competencia más barata que nosotros", valor: (f) => (f.competencia ? (f.competencia.masBarataQueNosotros ? "Sí" : "No") : "") },
            { titulo: "Competencia al", valor: (f) => (f.competencia?.al ? f.competencia.al.slice(0, 10) : "") },
            { titulo: "Margen al igualar %", valor: (f) => redondo(f.competencia?.margenAlIgualar, 1) },
          ]}
        />
      </Box>
    </PageContainer>
  );
}
