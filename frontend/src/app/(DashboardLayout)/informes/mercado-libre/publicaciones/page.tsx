"use client";

import React from "react";
import { Box, Tooltip } from "@mui/material";
import { IconAlertCircle, IconEyeOff, IconExternalLink, IconScale, IconSearch } from "@tabler/icons-react";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { useApiDatos } from "@/utils/useCargaDatos";
import { useEstadoVista } from "@/utils/estadoVista";
import MetricCard from "@/app/(DashboardLayout)/utilities/ventas/components/MetricCard";
import { Pildoras, formatoMonto, tinta } from "@/app/(DashboardLayout)/utilities/ventas/components/estilo";
import TablaInforme, { CeldaProducto, ColumnaInforme, EncabezadoInforme, Etiqueta, Filtro } from "@/app/(DashboardLayout)/utilities/ventas/mercado-libre/components/TablaInforme";
import { urlMl } from "@/app/(DashboardLayout)/utilities/ventas/mercado-libre/components/comun";
import { entero, fecha, pesos, redondo } from "../comun";

type Problema = "pausada" | "en_revision" | "inactiva" | "error" | "stock_distinto";
interface Fila {
  sku: string;
  itemId: string;
  nombre: string | null;
  titulo: string | null;
  estado: string | null;
  catalogo: boolean;
  logistica: string | null;
  problemas: Problema[];
  error: string | null;
  calidad: number | null;
  calidadTexto: string | null;
  stockPublicado: number | null;
  stockCalculado: number | null;
  stock03: number | null;
  unidades: number;
  venta: number;
  ultimaVenta: string | null;
  url: string | null;
}

const PROBLEMAS: Record<Problema, { texto: string; color: string; fondo: string; ayuda: string }> = {
  pausada: { texto: "Pausada", color: "#b54708", fondo: "#fffaeb", ayuda: "La publicación está pausada: no se vende." },
  en_revision: { texto: "En revisión", color: "#175cd3", fondo: "#eff8ff", ayuda: "ML la tiene en revisión: no se vende hasta que la apruebe." },
  inactiva: { texto: "Inactiva", color: "#475569", fondo: "#f1f5f9", ayuda: "Publicación inactiva en ML." },
  error: { texto: "Con error", color: "#b42318", fondo: "#fef3f2", ayuda: "La última publicación o actualización en ML falló." },
  stock_distinto: {
    texto: "Stock distinto",
    color: "#6941c6",
    fondo: "#f4f3ff",
    ayuda: "El stock que muestra ML no es el que calculamos nosotros (solo publicaciones que no son Full).",
  },
};
const LOGISTICA: Record<string, string> = { fulfillment: "Full", cross_docking: "Colecta", self_service: "Flex", drop_off: "Drop off" };

type Ver = "todos" | Problema;
type Filtros = { dias: "30" | "60" | "90"; ver: Ver; soloConVenta: "si" | "no" };

/** Informe: publicaciones que vendían y hoy no están a la venta, o con error o stock distinto. */
export default function PublicacionesConProblemas() {
  const [filtros, setFiltros] = useEstadoVista<Filtros>("informe-ml-publicaciones", () => ({ dias: "60", ver: "todos", soloConVenta: "si" }));
  const datos = useApiDatos<{ dias: number; filas: Fila[] } | null>(urlMl("informes/publicaciones", { dias: filtros.dias }), null);
  const todas = (datos.datos?.filas ?? []).filter((f) => filtros.soloConVenta === "no" || f.venta > 0);
  const filas = todas.filter((f) => filtros.ver === "todos" || f.problemas.includes(filtros.ver));

  const de = (p: Problema) => todas.filter((f) => f.problemas.includes(p));
  const elegir = (p: Problema) => () => setFiltros((x) => ({ ...x, ver: x.ver === p ? "todos" : p }));
  const tarjeta = (p: Problema, title: string, icon: React.ReactNode) => {
    const lista = de(p);
    return {
      title,
      value: entero(lista.length),
      subtitle: `${formatoMonto(lista.reduce((s, f) => s + f.venta, 0))} vendidos en ${filtros.dias} días`,
      icon,
      onClick: elegir(p),
      nota: `${PROBLEMAS[p].ayuda} La cifra de abajo es lo que esos productos vendieron en ML en los últimos ${filtros.dias} días. Clic para verlas.`,
    };
  };
  const tarjetas = [
    tarjeta("pausada", "Pausadas", <IconEyeOff />),
    tarjeta("en_revision", "En revisión", <IconSearch />),
    tarjeta("stock_distinto", "Stock distinto en ML", <IconScale />),
    tarjeta("error", "Con error", <IconAlertCircle />),
  ];

  const columnas: ColumnaInforme<Fila>[] = [
    {
      clave: "producto",
      titulo: "Producto",
      ancho: 28,
      valor: (f) => f.nombre ?? "",
      celda: (f) => <CeldaProducto sku={f.sku} nombre={f.nombre} secundario={`${f.catalogo ? "Catálogo" : "Normal"} · ${LOGISTICA[f.logistica ?? ""] ?? f.logistica ?? "—"}`} />,
    },
    {
      clave: "publicacion",
      titulo: "Publicación",
      ancho: 13,
      valor: (f) => f.itemId,
      celda: (f) =>
        f.url ? (
          <Box component="a" href={f.url} target="_blank" rel="noopener noreferrer" sx={{ display: "inline-flex", alignItems: "center", gap: 0.4, color: tinta.acento, fontWeight: 600, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
            {f.itemId} <IconExternalLink size={13} />
          </Box>
        ) : (
          f.itemId
        ),
    },
    {
      clave: "problemas",
      titulo: "Problema",
      ancho: 14,
      valor: (f) => f.problemas.map((p) => PROBLEMAS[p].texto).join(", "),
      celda: (f) => (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          {f.problemas.map((p) => (
            <Tooltip key={p} title={p === "error" && f.error ? f.error : PROBLEMAS[p].ayuda} arrow placement="top">
              <span>
                <Etiqueta texto={PROBLEMAS[p].texto} color={PROBLEMAS[p].color} fondo={PROBLEMAS[p].fondo} />
              </span>
            </Tooltip>
          ))}
        </Box>
      ),
    },
    { clave: "venta", titulo: `Vendió ${filtros.dias} d`, ancho: 11, alinear: "right", valor: (f) => redondo(f.venta), excel: "Venta sin IVA", celda: (f) => <Box>{pesos(f.venta)}<Box sx={{ fontSize: 10.5, color: tinta.tenue }}>{entero(f.unidades)} u.</Box></Box> },
    { clave: "ultima", titulo: "Última venta", ancho: 9, alinear: "right", valor: (f) => f.ultimaVenta ?? "", celda: (f) => fecha(f.ultimaVenta) },
    {
      clave: "stock",
      titulo: "Stock ML / nuestro",
      ancho: 13,
      alinear: "right",
      valor: (f) => f.stockPublicado,
      excel: "Stock que muestra ML",
      celda: (f) => (
        <Box title="Lo que muestra ML / lo que calculamos nosotros / bodega 03 de SAP">
          <Box component="span" sx={{ fontWeight: 600, color: f.problemas.includes("stock_distinto") ? "#6941c6" : tinta.primaria }}>
            {entero(f.stockPublicado)} / {entero(f.stockCalculado)}
          </Box>
          <Box sx={{ fontSize: 10.5, color: tinta.tenue }}>B03: {entero(f.stock03)}</Box>
        </Box>
      ),
    },
    { clave: "calidad", titulo: "Calidad", ancho: 12, alinear: "right", valor: (f) => f.calidad, celda: (f) => (f.calidad == null ? "—" : <Box title={f.calidadTexto ?? ""}>{entero(f.calidad)}<Box sx={{ fontSize: 10.5, color: tinta.tenue }}>{f.calidadTexto ?? ""}</Box></Box>) },
  ];

  return (
    <PageContainer title="Publicaciones con problemas" description="Publicaciones de Mercado Libre pausadas, en revisión, con error o con stock distinto">
      <Box sx={{ maxWidth: 1680, mx: "auto" }}>
        <EncabezadoInforme
          titulo="Publicaciones con problemas"
          descripcion="Publicaciones vigentes que hoy no se venden (pausadas, en revisión, inactivas), con error, o cuyo stock en ML no es el que calculamos. Ordenadas por lo que vendieron: lo que más se está dejando de vender, arriba."
        >
          <Filtro etiqueta="Venta de los últimos">
            <Pildoras
              etiqueta="Días"
              opciones={[
                { valor: "30", texto: "30 días" },
                { valor: "60", texto: "60 días" },
                { valor: "90", texto: "90 días" },
              ]}
              valor={filtros.dias}
              onCambiar={(v) => setFiltros((x) => ({ ...x, dias: v }))}
            />
          </Filtro>
          <Filtro etiqueta="Problema">
            <Pildoras
              etiqueta="Problema"
              opciones={[{ valor: "todos" as Ver, texto: "Todos" }, ...(Object.keys(PROBLEMAS) as Problema[]).map((p) => ({ valor: p as Ver, texto: PROBLEMAS[p].texto }))]}
              valor={filtros.ver}
              onCambiar={(v) => setFiltros((x) => ({ ...x, ver: v }))}
            />
          </Filtro>
          <Filtro etiqueta="Publicaciones">
            <Pildoras
              etiqueta="Solo con venta"
              opciones={[
                { valor: "si", texto: "Solo las que vendían" },
                { valor: "no", texto: "Todas" },
              ]}
              valor={filtros.soloConVenta}
              onCambiar={(v) => setFiltros((x) => ({ ...x, soloConVenta: v }))}
            />
          </Filtro>
        </EncabezadoInforme>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2, mb: 2 }}>
          {tarjetas.map((t) => (
            <MetricCard key={t.title} {...t} cargando={datos.cargando} />
          ))}
        </Box>

        <TablaInforme
          filas={filas}
          cargando={datos.cargando}
          columnas={columnas}
          clave={(f) => f.itemId}
          textoBusqueda={(f) => `${f.sku} ${f.nombre ?? ""} ${f.itemId}`}
          ordenInicial={{ clave: "venta", direccion: "desc" }}
          nombreExcel={`publicaciones_problemas_ml_${filtros.dias}d`}
          nota="La venta es del producto en ML (todas sus publicaciones). Calidad: puntaje de la publicación según ML."
          extraExcel={[
            { titulo: "SKU", valor: (f) => f.sku },
            { titulo: "Estado", valor: (f) => f.estado },
            { titulo: "Envío", valor: (f) => LOGISTICA[f.logistica ?? ""] ?? f.logistica },
            { titulo: "Stock calculado", valor: (f) => f.stockCalculado },
            { titulo: "Stock bodega 03", valor: (f) => f.stock03 },
            { titulo: "Error", valor: (f) => f.error },
            { titulo: "Enlace", valor: (f) => f.url },
          ]}
        />
      </Box>
    </PageContainer>
  );
}
