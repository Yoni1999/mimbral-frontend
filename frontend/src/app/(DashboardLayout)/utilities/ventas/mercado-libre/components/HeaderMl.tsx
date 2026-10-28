"use client";

import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import DateRangeFilter, { DateRangeValue } from "../../components/DateRangeFilter";
import RangosRapidos, { FechasDelRango, etiquetaRango, rangoInicial } from "../../components/RangosRapidos";
import { BotonLimpiar, filaControlesSx, tarjetaSx, tinta } from "../../components/estilo";
import { DatosMlAl } from "./comun";

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
}

/** Barra de filtros de las vistas de Mercado Libre, con la misma forma que la
 *  de Ventas por canal. Cada cambio se aplica al instante. */
export default function HeaderMl({ titulo, contexto, rango, onRango, datosAl, children, acciones, enEstadoInicial, onLimpiar }: Props) {
  const alElegirRango = (r: DateRangeValue | null) => onRango(r ? { fechaInicio: r.start, fechaFin: r.end } : rangoInicial());

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
