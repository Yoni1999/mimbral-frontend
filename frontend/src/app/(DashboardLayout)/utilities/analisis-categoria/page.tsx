"use client";

import React from "react";
import { Box, Grid, Typography } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import {
  IconCreditCard,
  IconCurrencyDollar,
  IconPackage,
  IconReceipt,
  IconShoppingCart,
  IconTrendingUp,
} from "@tabler/icons-react";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import MetricCard, { notaSinNc } from "@/app/(DashboardLayout)/utilities/ventas/components/MetricCard";
import SeccionTitulo from "@/app/(DashboardLayout)/utilities/ventas/components/SeccionTitulo";
import ListaBarras from "@/app/(DashboardLayout)/utilities/ventas/components/ListaBarras";
import RankingProductos from "@/app/(DashboardLayout)/utilities/ventas/components/RankingProductos";
import TendenciaCanales, { Punto, puntosDeTendencia, totalesPorCanal } from "@/app/(DashboardLayout)/utilities/ventas/components/TendenciaCanales";
import { conPeriodoRapido, etiquetaRango, rangoInicial, resolverPeriodoRapido } from "@/app/(DashboardLayout)/utilities/ventas/components/RangosRapidos";
import { useDetalleTarjetas } from "@/app/(DashboardLayout)/utilities/ventas/components/detalle/useDetalleTarjetas";
import { Panel, formatoMonto, formatoPorcentaje, tinta } from "@/app/(DashboardLayout)/utilities/ventas/components/estilo";
import { apiJson } from "@/utils/apiClient";
import { useApiDatos, useCargaDatos } from "@/utils/useCargaDatos";
import { useEstadoVista } from "@/utils/estadoVista";
import { BACKEND_URL } from "@/config";
import HeaderCategorias, { FiltrosCategorias, OpcionCategoria } from "./components/HeaderCategorias";
import Desglose from "./components/Desglose";
import CategoriasMercadoLibre from "./components/CategoriasMercadoLibre";
import { CATALOGOS, CATALOGO_FAMILIAS, Paso, configDe } from "./niveles";

const n = (v: unknown) => Number(v) || 0;
const unidades = (v: number) => v.toLocaleString("es-CL", { maximumFractionDigits: 0 });
const vs = (texto: string) => `vs ${texto}`;

/** Nivel pedido por la URL (enlaces de las antiguas vistas por nivel). */
const pasoDesdeUrl = (sp: URLSearchParams | null): Paso | null => {
  if (!sp) return null;
  const sub = sp.get("subcategoria");
  if (sub) return { nivel: 3, codigo: sub, nombre: "" };
  const cat = sp.get("categoria");
  if (cat) return { nivel: 2, codigo: cat, nombre: "" };
  const pn = sp.get("primerNivel");
  if (pn) return { nivel: 1, codigo: pn, nombre: "" };
  return null;
};

/** Análisis por categoría: una sola vista que recorre el árbol de artículos,
 *  por categorías (primer nivel → categoría → subcategoría), por familias
 *  (familia → subfamilia) o por el árbol de categorías de Mercado Libre (solo
 *  la venta de ML, por tipo de envío). Reemplaza a las tres vistas por nivel;
 *  sus rutas redirigen acá. */
const AnalisisCategoriaPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const pasoUrl = pasoDesdeUrl(searchParams);
  const fechasUrl =
    searchParams?.get("fechaInicio") && searchParams?.get("fechaFin")
      ? { fechaInicio: searchParams.get("fechaInicio")!, fechaFin: searchParams.get("fechaFin")! }
      : null;
  // Enlaces desde Ventas → Mercado Libre: ?arbol=mercadolibre[&mlCategoria=MLC…&mlNombre=…].
  const mlUrl = searchParams?.get("arbol") === "mercadolibre";
  const mlCategoria = searchParams?.get("mlCategoria");
  const inicial = (): FiltrosCategorias => ({
    arbol: mlUrl ? "mercadolibre" : "categorias",
    temporada: "",
    ruta: pasoUrl ? [pasoUrl] : [],
    rutaMl: mlUrl && mlCategoria ? [{ id: mlCategoria, nombre: searchParams?.get("mlNombre") || mlCategoria }] : [],
    ...(fechasUrl ?? rangoInicial()),
  });

  const [filtros, setFiltros] = useEstadoVista<FiltrosCategorias>("analisis-categoria", inicial, {
    serializar: conPeriodoRapido,
    restaurar: (guardado) =>
      pasoUrl || fechasUrl || mlUrl
        ? { ...resolverPeriodoRapido<FiltrosCategorias>(guardado), ...inicial() }
        : { ...inicial(), ...resolverPeriodoRapido<FiltrosCategorias>(guardado) },
  });

  // Los parámetros de la URL ya quedaron en el estado: se quitan para que al
  // recargar mande lo que el usuario navegó y no el enlace de entrada.
  React.useEffect(() => {
    if (pasoUrl || fechasUrl || mlUrl) router.replace("/utilities/analisis-categoria");
    // Solo al entrar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Catálogo de los tres niveles: alimenta el buscador, nombra los pasos que
  // llegan solo con código y da los primeros niveles para el desglose.
  const { datos: catalogo, cargando: cargandoCatalogo } = useCargaDatos<OpcionCategoria[]>(
    "catalogo-categorias",
    async (signal) => {
      const [n1, n2, n3] = await Promise.all(
        ([1, 2, 3] as const).map((nivel) => apiJson(`${BACKEND_URL}${CATALOGOS[nivel]}`, { signal }).catch(() => []))
      );
      const lista = (raw: any, nivel: 1 | 2 | 3) =>
        (Array.isArray(raw) ? raw : []).map((o: any) => ({
          nivel,
          codigo: String(o.codigo),
          nombre: o.nombre || String(o.codigo),
          padre: o.primerNivelNombre || undefined,
          imagen: o.imagen || undefined,
        }));
      return [...lista(n1, 1), ...lista(n2, 2), ...lista(n3, 3)];
    },
    []
  );

  // Catálogo de familias → subfamilias (mismo formato que el de categorías).
  const { datos: catalogoFamilias, cargando: cargandoFamilias } = useCargaDatos<OpcionCategoria[]>(
    "catalogo-familias",
    async (signal) => {
      const raw = await apiJson(`${BACKEND_URL}${CATALOGO_FAMILIAS}`, { signal }).catch(() => []);
      return (Array.isArray(raw) ? raw : []).flatMap((f: any) => [
        { nivel: 1 as const, codigo: String(f.codigo), nombre: f.nombre || String(f.codigo) },
        ...(Array.isArray(f.subfamilias) ? f.subfamilias : []).map((s: any) => ({
          nivel: 2 as const,
          codigo: String(s.codigo),
          nombre: s.nombre || String(s.codigo),
          padre: f.nombre || String(f.codigo),
          padreCodigo: String(f.codigo),
        })),
      ]);
    },
    []
  );
  const catalogoActual = filtros.arbol === "familias" ? catalogoFamilias : catalogo;

  // Pasos sin nombre (venidos por URL): se nombran con el catálogo.
  const ruta = filtros.ruta.map((p) =>
    p.nombre ? p : { ...p, nombre: catalogoActual.find((o) => o.nivel === p.nivel && o.codigo === p.codigo)?.nombre ?? "" }
  );
  // Con el árbol de Mercado Libre las cifras de SAP no se piden (ver CategoriasMercadoLibre).
  const enMl = filtros.arbol === "mercadolibre";
  const { config, filtro, esHoja } = configDe(filtros.arbol === "familias" ? "familias" : "categorias", ruta);

  const periodo = new URLSearchParams({ fechaInicio: filtros.fechaInicio, fechaFin: filtros.fechaFin }).toString();
  const query = new URLSearchParams({ fechaInicio: filtros.fechaInicio, fechaFin: filtros.fechaFin, ...filtro }).toString();
  const url = (endpoint: string) => (enMl ? null : `${BACKEND_URL}${endpoint}?${query}`);

  const ventas = useApiDatos<any>(url(config.tarjetas.ventas), {});
  const margen = useApiDatos<any>(url(config.tarjetas.margen), {});
  const transacciones = useApiDatos<any>(url(config.tarjetas.transacciones), {});
  const notas = useApiDatos<any>(url(config.tarjetas.notas), {});
  const items = useApiDatos<any>(url(config.tarjetas.items), {});
  const unidadesVendidas = useApiDatos<any>(url(config.tarjetas.unidades), {});

  const urlTendencia = url(config.tendencia);
  const tendencia = useCargaDatos<Punto[]>(urlTendencia, async (signal) => puntosDeTendencia(await apiJson(urlTendencia!, { signal })), []);
  const canales = totalesPorCanal(tendencia.datos).sort((a, b) => b.venta - a.venta);
  const totalCanales = canales.reduce((s, c) => s + c.venta, 0);

  const entrar = (paso: Paso) => setFiltros((f) => ({ ...f, ruta: [...ruta, paso] }));

  const tarjetas = [
    {
      title: "Ventas",
      value: formatoMonto(ventas.datos.TotalVentasPeriodo),
      subtitle: vs(formatoMonto(ventas.datos.TotalVentasAnterior)),
      percentageChange: ventas.datos.PorcentajeCambio,
      cargando: ventas.cargando,
      icon: <IconCurrencyDollar />,
    },
    {
      // VariacionMargen es la diferencia en puntos: margen actual − anterior.
      title: "Margen de ventas",
      value: formatoPorcentaje(margen.datos.MargenPorcentajePeriodo, 2),
      subtitle: vs(formatoPorcentaje(n(margen.datos.MargenPorcentajePeriodo) - n(margen.datos.VariacionMargen), 2)),
      percentageChange: margen.datos.VariacionMargen,
      cargando: margen.cargando,
      icon: <IconTrendingUp />,
    },
    {
      title: "Cantidad de ventas",
      value: unidades(n(transacciones.datos.CantidadTransaccionesPeriodo)),
      subtitle: vs(unidades(n(transacciones.datos.CantidadTransaccionesAnterior))),
      percentageChange: transacciones.datos.PorcentajeCambio,
      cargando: transacciones.cargando,
      icon: <IconShoppingCart />,
    },
    {
      title: "Notas de crédito",
      value: unidades(n(notas.datos.CantidadNotasCreditoPeriodo)),
      subtitle: vs(unidades(n(notas.datos.CantidadNotasCreditoAnterior))),
      percentageChange: notas.datos.PorcentajeCambioNotasCredito,
      cargando: notas.cargando,
      masEsMejor: false,
      icon: <IconCreditCard />,
    },
    {
      title: "Ítems vendidos",
      value: unidades(n(items.datos.ProductosPeriodoActual)),
      subtitle: vs(unidades(n(items.datos.ProductosPeriodoAnterior))),
      percentageChange: items.datos.PorcentajeCambio,
      cargando: items.cargando,
      icon: <IconReceipt />,
    },
    {
      title: "Unidades vendidas",
      value: unidades(n(unidadesVendidas.datos.CantidadVendida)),
      subtitle: vs(unidades(n(unidadesVendidas.datos.CantidadVendidaAnterior))),
      percentageChange: unidadesVendidas.datos.PorcentajeCambio,
      cargando: unidadesVendidas.cargando,
      icon: <IconPackage />,
    },
  ];

  // Detalle de las tarjetas: período y el nivel del árbol elegido.
  const detalleTarjetas = useDetalleTarjetas({ fechaInicio: filtros.fechaInicio, fechaFin: filtros.fechaFin, ...filtro }, [
    filtros.temporada || etiquetaRango(filtros.fechaInicio, filtros.fechaFin),
    ruta.length
      ? ruta.map((p) => p.nombre || p.codigo).join(" › ")
      : filtros.arbol === "familias"
        ? "Todas las familias"
        : "Todas las categorías",
  ]);

  const panelCanales = (
    <Panel titulo="Ventas por canal" descripcion={tendencia.cargando ? "Cargando…" : `Total del período: ${formatoMonto(totalCanales)}`}>
      <ListaBarras
        cargando={tendencia.cargando}
        items={canales
          .filter((c) => c.venta !== 0)
          .map((c) => ({
            clave: c.clave,
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
        onSeleccionar={(item) => router.push(`/utilities/ventas/ventas-por-canal?canal=${item.clave}`)}
      />
    </Panel>
  );

  return (
    <PageContainer title="Análisis por categoría" description="Ventas, margen y productos por primer nivel, categoría y subcategoría">
      <Box sx={{ maxWidth: 1680, mx: "auto" }}>
        <HeaderCategorias
          filtros={{ ...filtros, ruta }}
          setFiltros={setFiltros}
          opciones={catalogo}
          cargandoOpciones={cargandoCatalogo}
          familias={catalogoFamilias}
          cargandoFamilias={cargandoFamilias}
        />

        {enMl ? (
          <CategoriasMercadoLibre
            fechaInicio={filtros.fechaInicio}
            fechaFin={filtros.fechaFin}
            rutaMl={filtros.rutaMl}
            onEntrar={(paso) => setFiltros((f) => ({ ...f, rutaMl: [...f.rutaMl, paso] }))}
          />
        ) : (
        <>
        <Grid container spacing={2}>
          {tarjetas.map((t) => (
            <Grid item xs={6} sm={6} md={4} lg={2} key={t.title}>
              <MetricCard {...t} nota={notaSinNc(t.title, true)} onClick={detalleTarjetas.alPulsar(t.title)} />
            </Grid>
          ))}
        </Grid>

        <SeccionTitulo
          title={!esHoja ? "Composición" : "Canales"}
          infoRight={!esHoja ? "Pulsa una fila del desglose para bajar de nivel." : "Venta del período por canal."}
        />
        <Grid container spacing={2}>
          {!esHoja && (
            <Grid item xs={12} lg={7}>
              <Desglose
                arbol={filtros.arbol === "familias" ? "familias" : "categorias"}
                ruta={ruta}
                periodo={periodo}
                primerosNiveles={catalogo.filter((o) => o.nivel === 1)}
                onEntrar={entrar}
              />
            </Grid>
          )}
          <Grid item xs={12} lg={5}>
            {panelCanales}
          </Grid>
          <Grid item xs={12} lg={!esHoja ? 12 : 7}>
            <TendenciaCanales datos={tendencia.datos} cargando={tendencia.cargando} />
          </Grid>
        </Grid>

        <SeccionTitulo title="Productos" infoRight="Ordena por venta, unidades o margen; de más a menos o al revés." />
        <RankingProductos
          claveVista="analisis-categoria:productos"
          parametros={{ fechaInicio: filtros.fechaInicio, fechaFin: filtros.fechaFin, ...filtro }}
        />
        </>
        )}
      </Box>
      {detalleTarjetas.ventana}
    </PageContainer>
  );
};

export default AnalisisCategoriaPage;
