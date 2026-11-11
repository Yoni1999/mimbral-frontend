"use client";

import React from "react";
import { Box, Grid, Typography } from "@mui/material";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { useApiDatos } from "@/utils/useCargaDatos";
import { useEstadoVista } from "@/utils/estadoVista";
import SeccionTitulo from "../../../ventas/components/SeccionTitulo";
import MetricCard from "../../../ventas/components/MetricCard";
import { Pildoras, formatoMonto } from "../../../ventas/components/estilo";
import { AvisosDatos, Productos, SelectorPeriodo, mensajeError, n, parametrosPeriodo, unidades, urlCat, usePeriodoMl } from "../components/comun";
import { TablaProductosCat } from "../components/tablas";

type Vista = "alza" | "caida";

/** Ganadores y perdedores de Mercado Libre: los productos que más suben y más bajan entre dos períodos. */
export default function GanadoresPerdedoresMl() {
  const [periodo, setPeriodo] = usePeriodoMl();
  const [estado, setEstado] = useEstadoVista<{ vista: Vista }>("categorias-ml:ganadores", () => ({ vista: "alza" }));
  const params = parametrosPeriodo(periodo);
  const alza = useApiDatos<Productos | null>(urlCat("productos", { ...params, orden: "alza", limite: 500 }), null);
  const caida = useApiDatos<Productos | null>(urlCat("productos", { ...params, orden: "caida", limite: 500 }), null);
  const actual = estado.vista === "alza" ? alza : caida;
  const filas = actual.datos?.filas ?? [];

  const resumen = (d: Productos | null) => {
    const f = d?.filas ?? [];
    return {
      cantidad: d?.cantidad ?? 0,
      diferencia: f.reduce((s, x) => s + n(x.diferencia.neto), 0),
      nuevos: f.filter((x) => x.nuevo).length,
      sinVentas: f.filter((x) => x.sinVentas).length,
    };
  };
  const ra = resumen(alza.datos);
  const rc = resumen(caida.datos);

  return (
    <PageContainer title="Ganadores y perdedores · Mercado Libre" description="Productos de Mercado Libre que más suben y más bajan entre dos períodos">
      <Box sx={{ maxWidth: 1680, mx: "auto" }}>
        <SelectorPeriodo filtros={periodo} setFiltros={setPeriodo} contexto={actual.datos} />
        {actual.error ? <Typography sx={{ color: "#b42318", fontSize: 13, mb: 2 }}>No se pudo cargar: {mensajeError(actual.error)}</Typography> : null}
        <AvisosDatos contexto={actual.datos} />

        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>
            <MetricCard title="Productos que suben" value={unidades(ra.cantidad)} subtitle={`${unidades(ra.nuevos)} nuevos entre los 500 mayores`} cargando={alza.cargando} />
          </Grid>
          <Grid item xs={6} md={3}>
            <MetricCard title="Venta ganada (500 mayores)" value={formatoMonto(ra.diferencia)} subtitle="Diferencia neta contra la comparación" cargando={alza.cargando} />
          </Grid>
          <Grid item xs={6} md={3}>
            <MetricCard title="Productos que bajan" value={unidades(rc.cantidad)} subtitle={`${unidades(rc.sinVentas)} sin ventas ahora entre los 500 mayores`} cargando={caida.cargando} masEsMejor={false} />
          </Grid>
          <Grid item xs={6} md={3}>
            <MetricCard title="Venta perdida (500 mayores)" value={formatoMonto(rc.diferencia)} subtitle="Diferencia neta contra la comparación" cargando={caida.cargando} />
          </Grid>
        </Grid>

        <SeccionTitulo title="Productos" infoRight="Ordenados por la diferencia de venta en pesos; hasta 500 por lado." />
        <Box sx={{ mb: 1.5 }}>
          <Pildoras<Vista>
            etiqueta="Ver"
            valor={estado.vista}
            onCambiar={(vista) => setEstado({ vista })}
            opciones={[
              { valor: "alza", texto: "Los que más suben" },
              { valor: "caida", texto: "Los que más bajan" },
            ]}
          />
        </Box>
        <TablaProductosCat
          key={estado.vista}
          filas={filas}
          cargando={actual.cargando}
          nombreExcel={`mercado-libre-${estado.vista === "alza" ? "ganadores" : "perdedores"}`}
          orden="dif"
          invertido={estado.vista === "caida"}
        />
      </Box>
    </PageContainer>
  );
}
