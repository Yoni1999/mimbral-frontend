"use client";
// Barra de período en celular (< 600 px), compartida por todas las vistas con
// accesos rápidos de período: un selector segmentado de una línea (riel gris,
// el período elegido en blanco con sombra) y, en la misma fila, el calendario
// y el botón de filtros (38 px, con borde; punto azul si hay filtros puestos).
// Queda pegada justo bajo la barra de arriba al bajar por la vista.
//
// Solo cambia el disparador: el estado, los manejadores y las hojas de filtros
// (HojaFiltros, PanelFiltrosMovil) siguen siendo los de cada vista. En
// escritorio no se usa: cada encabezado sigue con su fila de píldoras.
import React from "react";
import { Box, IconButton } from "@mui/material";
import { IconAdjustmentsHorizontal } from "@tabler/icons-react";
import { ALTO_BARRA_MOVIL } from "@/app/(DashboardLayout)/layout/header/BarraMovil";
import { RAPIDOS, etiquetaRango, presetsDeHoy } from "./RangosRapidos";
import { ChipFiltro, tinta } from "./estilo";

/** Nombre corto de cada acceso rápido: los cinco caben (o casi) en una línea. */
const CORTO: Record<string, string> = {
  Ayer: "Ayer",
  "Últimos 7 días": "7 días",
  "Este mes": "Mes",
  "Mes pasado": "Mes ant.",
  "Últimos 30 días": "30 d",
};

/** Períodos con código de los informes de productos ("7D", "1M", "RANGO"…). */
const PERIODOS_CODIGO: Record<string, string> = {
  "1D": "Hoy",
  "7D": "Últimos 7 días",
  "14D": "Últimos 14 días",
  "1M": "Último mes",
  "3M": "Últimos 3 meses",
  "6M": "Últimos 6 meses",
  "1Y": "Último año",
  "2Y": "Últimos 2 años",
};

/** Nombre de un período con código para el subtítulo de la barra de celular:
 *  un rango a mano sale con sus fechas ("05/10/2026 al 12/10/2026"). */
export const etiquetaPeriodoCodigo = (periodo?: string, fechaInicio?: string, fechaFin?: string) => {
  if (fechaInicio && fechaFin && (!periodo || periodo.toUpperCase() === "RANGO")) return etiquetaRango(fechaInicio, fechaFin);
  return PERIODOS_CODIGO[(periodo ?? "").toUpperCase()] ?? "";
};

/** Botón cuadrado de 38 px de la barra (calendario, filtros). */
export const botonBarraMovilSx = {
  width: 38,
  height: 38,
  flexShrink: 0,
  borderRadius: "12px",
  border: `1px solid ${tinta.borde}`,
  bgcolor: "#fff",
  color: tinta.primaria,
  "&:hover": { bgcolor: tinta.fondoSuave, borderColor: "#cbd5e1" },
} as const;

/** Punto azul en la esquina del botón de filtros cuando hay alguno puesto. */
export function PuntoFiltros({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <Box
      component="span"
      aria-hidden
      sx={{ position: "absolute", top: 6, right: 6, width: 9, height: 9, borderRadius: "50%", bgcolor: tinta.acento, border: "2px solid #fff", boxSizing: "content-box" }}
    />
  );
}

/** Botón de filtros de la barra: ícono, con el punto azul si hay filtros puestos. */
export const BotonFiltrosBarra = React.forwardRef<HTMLButtonElement, { activos: boolean; onClick: (e: React.MouseEvent<HTMLElement>) => void }>(
  function BotonFiltrosBarra({ activos, onClick }, ref) {
    return (
      <IconButton ref={ref} aria-label={activos ? "Filtros (hay filtros puestos)" : "Filtros"} onClick={onClick} sx={{ ...botonBarraMovilSx, position: "relative" }}>
        <IconAdjustmentsHorizontal size={19} stroke={1.8} />
        <PuntoFiltros visible={activos} />
      </IconButton>
    );
  }
);

interface Props {
  fechaInicio?: string;
  fechaFin?: string;
  /** Con temporada (u otro período fijo) ningún segmento aparece marcado. */
  inactivo?: boolean;
  onElegir: (fechaInicio: string, fechaFin: string) => void;
  /** El calendario de la vista (`<DateRangeFilter soloIcono />`): se agranda a 38 px. */
  calendario?: React.ReactNode;
  /** Botón de filtros propio (p. ej. el de PanelFiltrosMovil). Si no se pasa y hay `onFiltros`, va el de la barra. */
  filtros?: React.ReactNode;
  onFiltros?: (e: React.MouseEvent<HTMLElement>) => void;
  filtrosActivos?: boolean;
}

/** Barra de período de celular: selector segmentado + calendario + filtros, pegada bajo la barra de arriba. */
export default function PeriodoMovil({ fechaInicio, fechaFin, inactivo = false, onElegir, calendario, filtros, onFiltros, filtrosActivos = false }: Props) {
  const presets = presetsDeHoy();
  const activo = inactivo ? undefined : presets.find((p) => p.inicio === fechaInicio && p.fin === fechaFin)?.label;

  // El segmento elegido siempre a la vista si el riel no cabe y se desliza.
  const riel = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = riel.current;
    const marcado = el?.querySelector<HTMLElement>("[aria-pressed='true']");
    if (!el || !marcado) return;
    const izq = marcado.offsetLeft - el.offsetLeft;
    const der = izq + marcado.offsetWidth;
    if (izq < el.scrollLeft) el.scrollLeft = Math.max(0, izq - 16);
    else if (der > el.scrollLeft + el.clientWidth) el.scrollLeft = der - el.clientWidth + 16;
  }, [activo]);

  return (
    <Box
      sx={{
        position: "sticky",
        top: ALTO_BARRA_MOVIL,
        // Bajo la barra de arriba (appBar 1100) y bajo los menús y hojas.
        zIndex: 1090,
        // De lado a lado de la pantalla (el layout deja 12 px por lado) y pegada a la barra de arriba.
        mx: -1.5,
        mt: -1.5,
        mb: 1.5,
        px: 1.5,
        py: 1,
        display: "flex",
        alignItems: "center",
        gap: 1,
        bgcolor: "rgba(255, 255, 255, 0.96)",
        backdropFilter: "saturate(180%) blur(12px)",
        WebkitBackdropFilter: "saturate(180%) blur(12px)",
        borderBottom: `1px solid ${tinta.borde}`,
      }}
    >
      <Box
        ref={riel}
        role="group"
        aria-label="Período"
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          gap: "2px",
          p: "3px",
          borderRadius: "12px",
          bgcolor: "#f1f5f9",
          overflowX: "auto",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {RAPIDOS.map((label) => {
          const p = presets.find((x) => x.label === label);
          const marcado = activo === label;
          return (
            <Box
              key={label}
              component="button"
              type="button"
              aria-pressed={marcado}
              aria-label={label}
              onClick={() => p && onElegir(p.inicio, p.fin)}
              sx={{
                flex: "1 0 auto",
                height: 32,
                px: 1.1,
                border: 0,
                borderRadius: "9px",
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: marcado ? 600 : 500,
                whiteSpace: "nowrap",
                cursor: "pointer",
                color: marcado ? tinta.primaria : tinta.secundaria,
                bgcolor: marcado ? "#fff" : "transparent",
                boxShadow: marcado ? "0 1px 3px rgba(15, 23, 42, 0.12), 0 1px 2px rgba(15, 23, 42, 0.06)" : "none",
                transition: "background-color 140ms ease, color 140ms ease",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {CORTO[label] ?? label}
            </Box>
          );
        })}
      </Box>

      {calendario && (
        <Box sx={{ display: "flex", flexShrink: 0, "& .MuiIconButton-root": { ...botonBarraMovilSx, color: undefined } }}>{calendario}</Box>
      )}
      {filtros ?? (onFiltros && <BotonFiltrosBarra activos={filtrosActivos} onClick={onFiltros} />)}
    </Box>
  );
}

/**
 * Bajo la barra: los filtros puestos como chips (cada uno con su ×) y, con dos
 * o más, «Limpiar» para quitarlos todos. `extra` va a la derecha (exportar…).
 * Sin nada que mostrar no ocupa lugar.
 */
export function FiltrosPuestosMovil({
  activos,
  onLimpiar,
  extra,
}: {
  activos: { etiqueta: string; onQuitar: () => void }[];
  onLimpiar?: () => void;
  extra?: React.ReactNode;
}) {
  if (activos.length === 0 && !extra) return null;
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1.5, minWidth: 0 }}>
      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.75, "& button": { minWidth: 26, minHeight: 26 } }}>
        {activos.map((a) => (
          <ChipFiltro key={a.etiqueta} etiqueta={a.etiqueta} onQuitar={a.onQuitar} />
        ))}
        {onLimpiar && activos.length > 1 && (
          <Box
            component="button"
            type="button"
            onClick={onLimpiar}
            sx={{ border: 0, bgcolor: "transparent", p: 0.5, fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, color: tinta.acento, cursor: "pointer" }}
          >
            Limpiar
          </Box>
        )}
      </Box>
      {extra && <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>{extra}</Box>}
    </Box>
  );
}
