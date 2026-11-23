"use client";

import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import DateRangeFilter, { DateRangeValue } from "../../components/DateRangeFilter";
import RangosRapidos, { FechasDelRango, etiquetaRango, rangoInicial } from "../../components/RangosRapidos";
import { BotonLimpiar, filaControlesSx, tarjetaSx, tinta } from "../../components/estilo";
import { DatosMlAl } from "./comun";
import { useEsCelular } from "../../components/movil";
import { BotonFiltrosMovil, FiltroActivo } from "./PanelFiltrosMovil";
import PeriodoMovil, { FiltrosPuestosMovil } from "../../components/PeriodoMovil";
import { useBarraMovil } from "@/app/(DashboardLayout)/layout/header/BarraMovil";

export interface RangoMl {
  fechaInicio: string;
  fechaFin: string;
}

interface Props {
  titulo: string;
  /** Lo que se está mirando, delante del período ("Todos los envíos"). */
  contexto?: string;
  rango: RangoMl;
  onRango: (rango: RangoMl) => void;
  datosAl?: string | null;
  /** Filtros propios de la vista (píldoras de tipo, etc.), bajo los accesos rápidos. */
  children?: React.ReactNode;
  /** Controles extra a la derecha (exportar…). */
  acciones?: React.ReactNode;
  enEstadoInicial: boolean;
  onLimpiar: () => void;
  /** Filtros propios que no están en su valor de siempre: en celular se ven
   *  como chips bajo la barra y cuentan en el botón «Filtros». */
  filtrosActivos?: FiltroActivo[];
}

/** Barra de filtros de las vistas de Mercado Libre, con la misma forma que la
 *  de Ventas por canal. Cada cambio se aplica al instante. */
export default function HeaderMl({ titulo, contexto, rango, onRango, datosAl, children, acciones, enEstadoInicial, onLimpiar, filtrosActivos = [] }: Props) {
  const alElegirRango = (r: DateRangeValue | null) => onRango(r ? { fechaInicio: r.start, fechaFin: r.end } : rangoInicial());
  const esCelular = useEsCelular();
  // Celular: el nombre de la vista y «contexto · período» van en la barra de arriba.
  const periodo = etiquetaRango(rango.fechaInicio, rango.fechaFin);
  useBarraMovil({ titulo, subtitulo: contexto ? `${contexto} · ${periodo}` : periodo });

  const calendario = (
    <DateRangeFilter
      value={rango.fechaInicio && rango.fechaFin ? { start: rango.fechaInicio, end: rango.fechaFin } : null}
      onChange={alElegirRango}
      label="Rango de fecha"
      soloIcono
    />
  );

  // Celular: sin tarjeta de título (el nombre y «contexto · período» van en la
  // barra de arriba). Barra de período pegada arriba con el calendario y, si la
  // vista tiene filtros propios, el botón que abre su panel desde abajo; bajo
  // ella, los filtros puestos como chips y las acciones (exportar…).
  if (esCelular) {
    return (
      <>
        <PeriodoMovil
          fechaInicio={rango.fechaInicio}
          fechaFin={rango.fechaFin}
          onElegir={(fechaInicio, fechaFin) => onRango({ fechaInicio, fechaFin })}
          calendario={calendario}
          filtros={
            children ? (
              <BotonFiltrosMovil activos={filtrosActivos} soloIcono>
                {children}
              </BotonFiltrosMovil>
            ) : undefined
          }
        />
        <FiltrosPuestosMovil
          activos={filtrosActivos}
          onLimpiar={enEstadoInicial ? undefined : onLimpiar}
          extra={acciones ? <Box sx={{ display: "flex", gap: 1, "& .MuiIconButton-root, & .MuiButton-root": { height: 36, minWidth: 36 } }}>{acciones}</Box> : undefined}
        />
      </>
    );
  }

  return (
    <Box sx={{ ...tarjetaSx, position: "relative", mb: 2, px: { xs: 1.5, md: 2 }, py: 1.25 }}>
      <DatosMlAl datosAl={datosAl} />
      <Stack direction={{ xs: "column", xl: "row" }} spacing={1.25} alignItems={{ xs: "stretch", xl: "center" }}>
        <Box sx={{ minWidth: 210, flexShrink: 0 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 800, color: tinta.primaria, letterSpacing: "-0.01em", lineHeight: 1.2 }}>{titulo}</Typography>
          <Typography sx={{ fontSize: 11.5, color: tinta.secundaria }}>
            {contexto && (
              <>
                <strong style={{ color: tinta.primaria }}>{contexto}</strong> ·{" "}
              </>
            )}
            <strong style={{ color: tinta.primaria }}>{etiquetaRango(rango.fechaInicio, rango.fechaFin)}</strong>
            <FechasDelRango inicio={rango.fechaInicio} fin={rango.fechaFin} />
          </Typography>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 0.75 }}>
          <RangosRapidos fechaInicio={rango.fechaInicio} fechaFin={rango.fechaFin} onElegir={(fechaInicio, fechaFin) => onRango({ fechaInicio, fechaFin })} />
          {children}
        </Box>

        <Stack direction="row" spacing={1} alignItems="center" useFlexGap sx={filaControlesSx}>
          <DateRangeFilter
            value={rango.fechaInicio && rango.fechaFin ? { start: rango.fechaInicio, end: rango.fechaFin } : null}
            onChange={alElegirRango}
            label="Rango de fecha"
            soloIcono
          />
          {acciones}
          <BotonLimpiar onClick={onLimpiar} disabled={enEstadoInicial} />
        </Stack>
      </Stack>
    </Box>
  );
}
