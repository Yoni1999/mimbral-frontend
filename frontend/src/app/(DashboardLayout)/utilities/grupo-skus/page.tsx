"use client";

import React from "react";
import { Alert, Box, Button, Grid, Stack, Tab, Tabs, Typography } from "@mui/material";
import {
  IconCreditCard,
  IconCurrencyDollar,
  IconDownload,
  IconListDetails,
  IconPackage,
  IconReceipt2,
  IconShoppingCart,
  IconTrendingUp,
  IconUsers,
  IconStack2,
} from "@tabler/icons-react";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import MetricCard from "@/app/(DashboardLayout)/utilities/ventas/components/MetricCard";
import ListaBarras from "@/app/(DashboardLayout)/utilities/ventas/components/ListaBarras";
import TendenciaCanales, { puntosDeTendencia } from "@/app/(DashboardLayout)/utilities/ventas/components/TendenciaCanales";
import { conPeriodoRapido, etiquetaRango, presetsDeHoy, resolverPeriodoRapido } from "@/app/(DashboardLayout)/utilities/ventas/components/RangosRapidos";
import { CANALES, Panel, Pildoras, formatoMonto, formatoPorcentaje, pestanasSx, tarjetaSx, tinta } from "@/app/(DashboardLayout)/utilities/ventas/components/estilo";
import { apiJson } from "@/utils/apiClient";
import { useCargaDatos } from "@/utils/useCargaDatos";
import { useEstadoVista } from "@/utils/estadoVista";
import { BACKEND_URL } from "@/config";
import HeaderGrupo, { FiltrosGrupo } from "./components/HeaderGrupo";
import EditorSkus from "./components/EditorSkus";
import { TablaCanales, TablaInventario, TablaMensual, TablaProductos } from "./components/Tablas";
import { MAX_SKUS, RespuestaGrupo, RespuestaInventario } from "./tipos";
import { descargarExcelGrupo, descargarPlantillaSkus } from "./exportarExcel";

type Pestana = "resumen" | "canales" | "mensual" | "inventario";

const PESTANAS: { valor: Pestana; texto: string }[] = [
  { valor: "resumen", texto: "Resumen" },
  { valor: "canales", texto: "Por canal" },
  { valor: "mensual", texto: "Mes a mes" },
  { valor: "inventario", texto: "Inventario" },
];

const n = (v: unknown) => Number(v) || 0;
const unidades = (v: number) => v.toLocaleString("es-CL", { maximumFractionDigits: 0 });
const vs = (texto: string) => `vs ${texto}`;

/** Un grupo se mira mejor en un período largo: abre con los últimos 30 días. */
const rangoGrupo = () => {
  const p = presetsDeHoy().find((x) => x.label === "Últimos 30 días") ?? presetsDeHoy()[0];
  return { fechaInicio: p.inicio, fechaFin: p.fin };
};

/** Análisis de un GRUPO de hasta 100 SKUs: los mismos filtros que Análisis de
 *  producto, con las cifras del grupo, cada SKU comparado, su reparto por
 *  canal y por mes, el inventario, y todo en un Excel. Los SKUs se escriben,
 *  se pegan o se cargan con la plantilla. */
const GrupoSkusPage: React.FC = () => {
  const [filtros, setFiltros] = useEstadoVista<FiltrosGrupo>(
    "grupo-skus",
    () => ({ skus: [], canal: "", temporada: "", modoComparacion: "", ...rangoGrupo() }),
    { serializar: conPeriodoRapido, restaurar: (g) => resolverPeriodoRapido<FiltrosGrupo>(g) }
  );
  const [pestana, setPestana] = useEstadoVista<{ valor: Pestana }>("grupo-skus:pestana", () => ({ valor: "resumen" }));
  const [ver, setVer] = React.useState<"venta" | "unidades">("venta");
  const [editor, setEditor] = React.useState(false);
  const [descargando, setDescargando] = React.useState(false);

  const skus = filtros.skus;
  const listaSkus = skus.join(",");

  const query = new URLSearchParams({
    skus: listaSkus,
    fechaInicio: filtros.fechaInicio,
    fechaFin: filtros.fechaFin,
    ...(filtros.canal ? { canal: filtros.canal } : {}),
    ...(filtros.modoComparacion ? { modoComparacion: filtros.modoComparacion } : {}),
  }).toString();
  const urlGrupo = skus.length ? `${BACKEND_URL}/api/pv/grupo?${query}` : null;
  const grupo = useCargaDatos<RespuestaGrupo | null>(urlGrupo, (signal) => apiJson(urlGrupo!, { signal }), null);

  // El inventario no depende del período: se pide una vez por lista de SKUs.
  const urlInventario = skus.length ? `${BACKEND_URL}/api/grupo-skus/inventario?skus=${encodeURIComponent(listaSkus)}` : null;
  const inventario = useCargaDatos<RespuestaInventario | null>(urlInventario, (signal) => apiJson(urlInventario!, { signal }), null);
  const errorInventario = inventario.error ? (inventario.error as Error).message || "sin acceso" : null;

  const datos = grupo.datos;
  const r = datos?.resumen;
  const conComparacion = !!datos?.periodo.anterior;
  const conMargen = r?.margen !== undefined;
  const cargando = grupo.cargando;

  const margenActual = r?.margenPorcentaje ?? 0;
  const margenAnterior = r?.margenPorcentajeAnterior ?? null;

  const tarjetas = [
    {
      title: "Ventas",
      value: formatoMonto(r?.venta),
      subtitle: conComparacion ? vs(formatoMonto(r?.ventaAnterior)) : "Sin comparación",
      percentageChange: r?.variacionVenta ?? undefined,
      icon: <IconCurrencyDollar />,
    },
    ...(conMargen || !r
      ? [
          {
            title: "Margen de ventas",
            value: formatoPorcentaje(margenActual, 2),
            subtitle: margenAnterior != null ? vs(formatoPorcentaje(margenAnterior, 2)) : formatoMonto(r?.margen),
            percentageChange: margenAnterior != null && r?.venta ? margenActual - margenAnterior : undefined,
            unidadVariacion: "pp" as const,
            icon: <IconTrendingUp />,
          },
        ]
      : []),
    {
      title: "Unidades vendidas",
      value: unidades(n(r?.unidades)),
      subtitle: conComparacion ? vs(unidades(n(r?.unidadesAnterior))) : "",
      percentageChange: r?.variacionUnidades ?? undefined,
      icon: <IconPackage />,
    },
    {
      title: "Cantidad de ventas",
      value: unidades(n(r?.documentos)),
      subtitle: conComparacion ? vs(unidades(n(r?.documentosAnterior))) : "",
      percentageChange: r?.variacionDocumentos ?? undefined,
      icon: <IconShoppingCart />,
    },
    {
      title: "Ticket promedio",
      value: formatoMonto(r?.ticketPromedio),
      subtitle: "Venta del grupo ÷ ventas",
      icon: <IconReceipt2 />,
    },
    {
      title: "Clientes",
      value: unidades(n(r?.clientes)),
      subtitle: conComparacion ? vs(unidades(n(r?.clientesAnterior))) : "",
      icon: <IconUsers />,
    },
    {
      title: "SKUs con venta",
      value: `${n(r?.conVentas)} de ${n(r?.skus)}`,
      subtitle: datos?.noEncontrados.length ? `${datos.noEncontrados.length} no existen en el catálogo` : "Todos existen en el catálogo",
      icon: <IconStack2 />,
    },
    {
      title: "Notas de crédito",
      value: formatoMonto(r?.ncMonto),
      subtitle: `${unidades(n(r?.ncDocumentos))} NC · ${unidades(n(r?.ncUnidades))} unidades devueltas`,
      masEsMejor: false,
      icon: <IconCreditCard />,
    },
  ];

  const canales = (datos?.canales ?? [])
    .filter((c) => c.venta !== 0)
    .map((c) => ({ ...c, ...(CANALES.find((x) => x.clave === c.canal) ?? { nombre: c.canal, color: tinta.acento }) }))
    .sort((a, b) => b.venta - a.venta);
  const totalCanales = canales.reduce((s, c) => s + c.venta, 0);
  const tendencia = React.useMemo(() => puntosDeTendencia(datos?.diario ?? []), [datos]);

  const descargar = () => {
    if (!datos) return;
    setDescargando(true);
    try {
      descargarExcelGrupo(datos, inventario.datos, {
        canal: CANALES.find((c) => c.clave === filtros.canal)?.nombre ?? "Todos los canales",
        rango: filtros.temporada || etiquetaRango(filtros.fechaInicio, filtros.fechaFin),
        comparacion: filtros.modoComparacion ? "mismo período del año anterior" : "período anterior",
      });
    } finally {
      setDescargando(false);
    }
  };

  const vacio = (
    <Box sx={{ ...tarjetaSx, p: { xs: 3, md: 4 }, textAlign: "center" }}>
      <Typography sx={{ fontSize: 18, fontWeight: 750, color: tinta.primaria }}>¿Qué SKUs quieres analizar?</Typography>
      <Typography sx={{ fontSize: 13, color: tinta.secundaria, mt: 0.5, mb: 2, maxWidth: 560, mx: "auto" }}>
        Escribe o pega hasta {MAX_SKUS} SKUs, o cárgalos desde un Excel con la plantilla. Verás sus ventas, márgenes, canales, la evolución mes a mes y
        el inventario, y podrás descargar todo en Excel.
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="center">
        <Button
          variant="contained"
          disableElevation
          startIcon={<IconListDetails size={16} />}
          onClick={() => setEditor(true)}
          sx={{ textTransform: "none", borderRadius: "10px", fontWeight: 600 }}
        >
          Escribir o cargar SKUs
        </Button>
        <Button
          variant="outlined"
          startIcon={<IconDownload size={16} />}
          onClick={descargarPlantillaSkus}
          sx={{ textTransform: "none", borderRadius: "10px", fontWeight: 600 }}
        >
          Descargar plantilla
        </Button>
      </Stack>
    </Box>
  );

  const selectorVer = (
    <Box sx={{ mb: 1.5 }}>
      <Pildoras
        etiqueta="Ver"
        opciones={[
          { valor: "venta", texto: "Venta" },
          { valor: "unidades", texto: "Unidades" },
        ]}
        valor={ver}
        onCambiar={setVer}
      />
    </Box>
  );

  const cuerpo = !skus.length ? (
    vacio
  ) : (
    <>
      {grupo.error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          No se pudo calcular el grupo: {(grupo.error as Error).message}
        </Alert>
      ) : null}
      {!!datos?.noEncontrados.length && (
        <Alert severity="warning" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={() => setEditor(true)}>Corregir</Button>}>
          {datos.noEncontrados.length === 1 ? "Este SKU no existe" : `Estos ${datos.noEncontrados.length} SKUs no existen`} en el catálogo de SAP:{" "}
          <strong>{datos.noEncontrados.slice(0, 12).join(", ")}</strong>
          {datos.noEncontrados.length > 12 ? "…" : ""}
        </Alert>
      )}

      <Tabs value={pestana.valor} onChange={(_, v) => setPestana({ valor: v })} variant="scrollable" allowScrollButtonsMobile sx={pestanasSx}>
        {PESTANAS.map((p) => (
          <Tab key={p.valor} value={p.valor} label={p.texto} />
        ))}
      </Tabs>

      {pestana.valor === "resumen" && (
        <>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {tarjetas.map((t) => (
              <Grid item xs={6} sm={6} md={3} key={t.title}>
                <MetricCard {...t} cargando={cargando} />
              </Grid>
            ))}
          </Grid>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} lg={5}>
              <Panel titulo="Ventas por canal" descripcion={cargando ? "Cargando…" : `Total del grupo: ${formatoMonto(totalCanales)} · pulsa uno para filtrar`}>
                <ListaBarras
                  cargando={cargando}
                  vacio="Sin ventas en el período."
                  seleccionada={filtros.canal || null}
                  items={canales.map((c) => ({
                    clave: c.canal,
                    etiqueta: c.nombre,
                    valor: c.venta,
                    color: c.color,
                    texto: formatoMonto(c.venta),
                    detalle: (
                      <Typography component="span" sx={{ fontSize: 12, color: tinta.tenue, minWidth: 44, textAlign: "right" }}>
                        {totalCanales > 0 ? formatoPorcentaje((c.venta / totalCanales) * 100) : "—"}
                      </Typography>
                    ),
                  }))}
                  onSeleccionar={(item) => setFiltros((f) => ({ ...f, canal: f.canal === item.clave ? "" : item.clave }))}
                />
              </Panel>
            </Grid>
            <Grid item xs={12} lg={7}>
              <TendenciaCanales datos={tendencia} cargando={cargando} />
            </Grid>
          </Grid>
          <TablaProductos productos={datos?.productos ?? []} cargando={cargando} conComparacion={conComparacion} />
        </>
      )}
      {pestana.valor === "canales" && (
        <>
          {selectorVer}
          <TablaCanales productos={datos?.productos ?? []} cargando={cargando} ver={ver} />
        </>
      )}
      {pestana.valor === "mensual" && (
        <>
          {selectorVer}
          <TablaMensual productos={datos?.productos ?? []} mensual={datos?.mensual ?? []} cargando={cargando} ver={ver} />
        </>
      )}
      {pestana.valor === "inventario" && (
        <TablaInventario inventario={inventario.datos} productos={datos?.productos ?? []} cargando={inventario.cargando} error={errorInventario} />
      )}
    </>
  );

  return (
    <PageContainer title="Grupo de SKUs" description="Ventas, márgenes, canales e inventario de un grupo de hasta 100 productos">
      <Box sx={{ maxWidth: 1680, mx: "auto" }}>
        <HeaderGrupo
          filtros={filtros}
          setFiltros={setFiltros}
          rangoPorDefecto={rangoGrupo}
          onEditarSkus={() => setEditor(true)}
          onDescargar={skus.length ? descargar : undefined}
          descargando={descargando || cargando || !datos}
        />
        {cuerpo}
      </Box>
      <EditorSkus
        abierto={editor}
        skus={skus}
        onCerrar={() => setEditor(false)}
        onAplicar={(lista) => {
          setFiltros((f) => ({ ...f, skus: lista }));
          setEditor(false);
        }}
      />
    </PageContainer>
  );
};

export default GrupoSkusPage;
