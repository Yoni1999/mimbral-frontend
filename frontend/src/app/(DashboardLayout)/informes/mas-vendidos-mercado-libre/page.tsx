"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Button, InputAdornment, Pagination, TextField, Typography } from "@mui/material";
import { IconDownload, IconSearch } from "@tabler/icons-react";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { useApiDatos } from "@/utils/useCargaDatos";
import { useEstadoVista } from "@/utils/estadoVista";
import { conPeriodoRapido, etiquetaRango, presetsDeHoy, resolverPeriodoRapido } from "@/app/(DashboardLayout)/utilities/ventas/components/RangosRapidos";
import { Pildoras, controlSx, etiquetaControlSx, formatoMonto, formatoPesos, tarjetaSx, tinta } from "@/app/(DashboardLayout)/utilities/ventas/components/estilo";
import { descargarExcel } from "@/app/(DashboardLayout)/utilities/ventas/components/detalle/comun";
import HeaderMl, { RangoMl } from "@/app/(DashboardLayout)/utilities/ventas/mercado-libre/components/HeaderMl";
import TablaProductosMl, { filasExcelProductos } from "@/app/(DashboardLayout)/utilities/ventas/mercado-libre/components/TablaProductosMl";
import {
  AvisoEstimaciones,
  ProductoMl,
  ProductosMl,
  TIPOS_ENVIO,
  TipoEnvio,
  cobros,
  n,
  sumaPar,
  unidades,
  urlMl,
} from "@/app/(DashboardLayout)/utilities/ventas/mercado-libre/components/comun";

type FiltroTipo = TipoEnvio | "";
type Medida = "venta" | "unidades" | "queda" | "stock";

const OPCIONES_TIPO: { valor: FiltroTipo | "todos"; texto: string }[] = [
  { valor: "todos", texto: "Todos los envíos" },
  { valor: "full", texto: "Full" },
  { valor: "colecta", texto: "Colecta" },
  { valor: "flex", texto: "Flex" },
];
const MEDIDAS: { valor: Medida; texto: string }[] = [
  { valor: "venta", texto: "Venta" },
  { valor: "unidades", texto: "Unidades" },
  { valor: "queda", texto: "Queda" },
  { valor: "stock", texto: "Menos stock" },
];
const LIMITES = [
  { valor: "100", texto: "Top 100" },
  { valor: "300", texto: "Top 300" },
  { valor: "1000", texto: "Top 1.000" },
];
const POR_PAGINA = 50;

/** Últimos 30 días: un informe de más vendidos necesita más de un día. */
const rangoInforme = (): RangoMl => {
  const p = presetsDeHoy().find((x) => x.label === "Últimos 30 días")!;
  return { fechaInicio: p.inicio, fechaFin: p.fin };
};

type FiltroPublicacion = "" | "activa" | "pausada";
const OPCIONES_PUBLICACION: { valor: FiltroPublicacion | "todas"; texto: string }[] = [
  { valor: "todas", texto: "Todas" },
  { valor: "activa", texto: "Con activa" },
  { valor: "pausada", texto: "Solo pausadas" },
];
/** "Con activa": alguna publicación activa. "Solo pausadas": ninguna activa y alguna pausada. */
const cumplePublicacion = (p: ProductoMl, f: FiltroPublicacion) => {
  if (!f) return true;
  const estados = (p.publicaciones ?? []).map((x) => x.estado);
  return f === "activa" ? estados.includes("active") : !estados.includes("active") && estados.includes("paused");
};

type Filtros = RangoMl & { tipo: FiltroTipo; medida: Medida; limite: string; publicacion: FiltroPublicacion };
const inicial = (): Filtros => ({ tipo: "", medida: "venta", limite: "100", publicacion: "", ...rangoInforme() });

/** Stock que manda según el envío: Full en Full, bodega 03 en el resto. */
const stockDe = (p: ProductoMl, tipo: FiltroTipo) =>
  tipo === "full" ? p.stockFull : tipo === "" ? n(p.stockFull) + n(p.stock03) : p.stock03;

const valor = (p: ProductoMl, m: Medida, tipo: FiltroTipo) =>
  m === "unidades" ? n(p.unidades) : m === "queda" ? n(p.queda.neto) : m === "stock" ? -n(stockDe(p, tipo)) : n(p.venta.neto);

/**
 * Informe: productos más vendidos en Mercado Libre, por tipo de envío (Full,
 * Colecta o Flex) y rango de fechas. Muestra lo que cobra ML, lo que queda y
 * el stock que corresponde (Full en Full, bodega 03 en Colecta), que al
 * pulsarlo abre el stock en todas las bodegas. Se descarga en Excel.
 */
export default function InformeMasVendidosMercadoLibre() {
  const router = useRouter();
  const sp = useSearchParams();
  const desdeUrl = sp?.get("fechaInicio") && sp?.get("fechaFin");

  const [filtros, setFiltros] = useEstadoVista<Filtros>("informe-mas-vendidos-ml", inicial, {
    serializar: conPeriodoRapido,
    restaurar: (g) => {
      const f = { ...inicial(), ...resolverPeriodoRapido<Filtros>(g) };
      // Enlace desde Ventas → Mercado Libre: manda lo que trae la URL.
      return desdeUrl
        ? { ...f, tipo: (sp!.get("tipo") as FiltroTipo) || "", fechaInicio: sp!.get("fechaInicio")!, fechaFin: sp!.get("fechaFin")! }
        : f;
    },
  });
  React.useEffect(() => {
    if (desdeUrl) router.replace("/informes/mas-vendidos-mercado-libre");
    // Solo al entrar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [buscar, setBuscar] = React.useState("");
  const [pagina, setPagina] = React.useState(1);
  const [descargando, setDescargando] = React.useState(false);
  React.useEffect(() => setPagina(1), [filtros, buscar]);

  const datos = useApiDatos<ProductosMl | null>(
    urlMl("productos", { fechaInicio: filtros.fechaInicio, fechaFin: filtros.fechaFin, tipo: filtros.tipo, limite: filtros.limite }),
    null
  );
  const todas = datos.datos?.filas ?? [];

  const q = buscar.trim().toLowerCase();
  const filas = todas
    .filter((p) => cumplePublicacion(p, filtros.publicacion))
    .filter((p) => !q || p.sku.toLowerCase().includes(q) || (p.nombre ?? "").toLowerCase().includes(q) || p.rutaCategoria.some((c) => c.nombre.toLowerCase().includes(q)))
    .sort((a, b) => valor(b, filtros.medida, filtros.tipo) - valor(a, filtros.medida, filtros.tipo));
  const paginas = Math.max(1, Math.ceil(filas.length / POR_PAGINA));
  const visibles = filas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  const venta = sumaPar(...filas.map((p) => p.venta));
  const cobra = sumaPar(...filas.map((p) => cobros(p)));
  const tipoNombre = filtros.tipo ? TIPOS_ENVIO.find((t) => t.clave === filtros.tipo)!.nombre : "Todos los envíos";

  const exportar = async () => {
    setDescargando(true);
    try {
      await descargarExcel(`mas_vendidos_ml_${filtros.tipo || "todos"}_${filtros.fechaInicio}_${filtros.fechaFin}`, [
        { nombre: `Más vendidos ${tipoNombre}`, filas: filasExcelProductos(filas) },
      ]);
    } finally {
      setDescargando(false);
    }
  };

  const resumen = [
    { titulo: "Productos", valor: unidades(filas.length), pie: datos.datos && datos.datos.cantidad > todas.length ? `de ${unidades(datos.datos.cantidad)} con venta` : "con venta en el período" },
    { titulo: "Unidades", valor: unidades(filas.reduce((s, p) => s + n(p.unidades), 0)), pie: tipoNombre },
    { titulo: "Venta sin IVA", valor: formatoMonto(venta.neto), pie: `${formatoPesos(venta.conIva)} con IVA` },
    { titulo: "Cobra ML", valor: formatoMonto(cobra.neto), pie: n(venta.neto) ? `${((n(cobra.neto) / n(venta.neto)) * 100).toFixed(1).replace(".", ",")}% de la venta` : "—" },
    { titulo: "Queda", valor: formatoMonto(n(venta.neto) - n(cobra.neto)), pie: "Venta − comisión − envío" },
  ];

  return (
    <PageContainer title="Más vendidos Mercado Libre" description="Productos más vendidos en Mercado Libre por tipo de envío">
      <Box sx={{ maxWidth: 1680, mx: "auto" }}>
        <HeaderMl
          titulo="Más vendidos Mercado Libre"
          contexto={tipoNombre}
          rango={filtros}
          onRango={(r) => setFiltros((f) => ({ ...f, ...r }))}
          datosAl={datos.cargando ? undefined : datos.datos?.datosAl ?? null}
          enEstadoInicial={!filtros.tipo && !filtros.publicacion && filtros.medida === "venta" && filtros.limite === "100" && etiquetaRango(filtros.fechaInicio, filtros.fechaFin) === "Últimos 30 días"}
          onLimpiar={() => {
            setFiltros(inicial());
            setBuscar("");
          }}
          acciones={
            <Button
              variant="contained"
              disableElevation
              startIcon={<IconDownload size={16} />}
              disabled={descargando || datos.cargando || filas.length === 0}
              onClick={exportar}
              sx={{ textTransform: "none", borderRadius: "10px", height: 34, fontWeight: 700, whiteSpace: "nowrap" }}
            >
              <span className="boton-texto">{descargando ? "Generando…" : "Excel"}</span>
            </Button>
          }
        >
          <Pildoras
            etiqueta="Tipo de envío"
            opciones={OPCIONES_TIPO}
            valor={filtros.tipo || "todos"}
            onCambiar={(t) => setFiltros((f) => ({ ...f, tipo: t === "todos" ? "" : (t as TipoEnvio) }))}
          />
        </HeaderMl>
        <AvisoEstimaciones estimaciones={datos.datos?.estimaciones} />

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(5, 1fr)" }, gap: 1.5, mb: 2 }}>
          {resumen.map((r) => (
            <Box key={r.titulo} sx={{ ...tarjetaSx, px: 1.5, py: 1.25 }}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: tinta.secundaria }}>{r.titulo}</Typography>
              <Typography sx={{ fontSize: 20, fontWeight: 750, color: tinta.primaria, fontVariantNumeric: "tabular-nums" }}>{datos.cargando ? "…" : r.valor}</Typography>
              <Typography noWrap sx={{ fontSize: 11.5, color: tinta.tenue }}>{r.pie}</Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ ...tarjetaSx, pt: 2, pb: 1 }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 2, px: 2.5, mb: 1.5 }}>
            <TextField
              size="small"
              placeholder="Buscar SKU, producto o categoría"
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              InputProps={{
                sx: controlSx,
                startAdornment: (
                  <InputAdornment position="start">
                    <IconSearch size={16} color={tinta.tenue} />
                  </InputAdornment>
                ),
              }}
              sx={{ width: { xs: "100%", sm: 300 } }}
            />
            <Box>
              <Typography sx={etiquetaControlSx}>Ordenar por</Typography>
              <Pildoras etiqueta="Ordenar por" opciones={MEDIDAS} valor={filtros.medida} onCambiar={(m) => setFiltros((f) => ({ ...f, medida: m }))} />
            </Box>
            <Box>
              <Typography sx={etiquetaControlSx}>Publicación</Typography>
              <Pildoras
                etiqueta="Estado de la publicación"
                opciones={OPCIONES_PUBLICACION}
                valor={filtros.publicacion || "todas"}
                onCambiar={(v) => setFiltros((f) => ({ ...f, publicacion: v === "todas" ? "" : (v as FiltroPublicacion) }))}
              />
            </Box>
            <Box>
              <Typography sx={etiquetaControlSx}>Cuántos</Typography>
              <Pildoras etiqueta="Cuántos" opciones={LIMITES} valor={filtros.limite} onCambiar={(l) => setFiltros((f) => ({ ...f, limite: l }))} />
            </Box>
            <Typography sx={{ fontSize: 12, color: tinta.tenue, ml: "auto" }}>
              Montos sin IVA (con IVA debajo). * Comisión del Full estimada con la publicación.
            </Typography>
          </Box>

          <TablaProductosMl
            filas={visibles}
            cargando={datos.cargando}
            tipo={filtros.tipo}
            desde={(pagina - 1) * POR_PAGINA}
            filasCargando={12}
            vacio={q ? "Ningún producto coincide con la búsqueda." : "Sin ventas de Mercado Libre en el período."}
          />

          {paginas > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 1.5 }}>
              <Pagination count={paginas} page={pagina} onChange={(_, p) => setPagina(p)} shape="rounded" size="small" />
            </Box>
          )}
        </Box>
      </Box>
    </PageContainer>
  );
}
