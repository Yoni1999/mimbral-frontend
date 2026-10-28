"use client";

import { Box, Stack } from "@mui/material";
import dayjs from "dayjs";
import { buildPresets, toDateStr } from "./DateRangeFilter";
import { tinta } from "./estilo";

// Accesos rápidos: los mismos rangos que ofrece el selector de fechas.
export const RAPIDOS = ["Ayer", "Últimos 7 días", "Este mes", "Mes pasado", "Últimos 30 días"];

// Texto corto en el botón (el rango completo se ve en el selector de fechas).
const CORTO: Record<string, string> = { "Últimos 7 días": "7 días", "Últimos 30 días": "30 días" };

export const presetsDeHoy = () =>
  buildPresets(new Date()).map((p) => ({
    label: p.label,
    inicio: toDateStr(p.range[0]),
    fin: toDateStr(p.range[1]),
  }));

/** Rango con que abren las vistas de ventas: "Ayer". La copia de SAP se carga
 *  a las 04:00, así que "Hoy" casi no tiene ventas durante el día. */
export const rangoInicial = () => {
  const ayer = presetsDeHoy().find((p) => p.label === "Ayer")!;
  return { fechaInicio: ayer.inicio, fechaFin: ayer.fin };
};

/** Temporadas con su rango de fechas: elegir una fija el período. */
export const TEMPORADAS: Record<string, { inicio: string; fin: string }> = {
  "Verano 2024": { inicio: "2024-01-01", fin: "2024-03-20" },
  "Otoño 2024": { inicio: "2024-03-21", fin: "2024-06-20" },
  "Invierno 2024": { inicio: "2024-06-21", fin: "2024-09-22" },
  "Primavera 2024": { inicio: "2024-09-23", fin: "2024-12-21" },
  "Verano 2025": { inicio: "2025-01-01", fin: "2025-03-20" },
  "Otoño 2025": { inicio: "2025-03-21", fin: "2025-06-20" },
  "Invierno 2025": { inicio: "2025-06-21", fin: "2025-09-22" },
  "Primavera 2025": { inicio: "2025-09-23", fin: "2025-12-21" },
};

type ConRango = { fechaInicio?: string; fechaFin?: string };

/** Para guardar lo buscado: si el rango es un acceso rápido ("Ayer", "Este
 *  mes"…) se anota cuál, para recalcular las fechas al volver otro día. */
export const conPeriodoRapido = <F extends ConRango>(f: F) => ({
  ...f,
  periodoRapido: presetsDeHoy().find((p) => p.inicio === f.fechaInicio && p.fin === f.fechaFin)?.label ?? "",
});

/** Al restaurar lo guardado: un acceso rápido vuelve con las fechas de hoy
 *  (el "Ayer" de mañana es otro día); un rango elegido a mano queda igual. */
export const resolverPeriodoRapido = <F extends ConRango>(guardado: F & { periodoRapido?: string }): F => {
  const { periodoRapido, ...resto } = guardado;
  const p = periodoRapido ? presetsDeHoy().find((x) => x.label === periodoRapido) : undefined;
  return (p ? { ...resto, fechaInicio: p.inicio, fechaFin: p.fin } : resto) as unknown as F;
};

/** Nombre del rango para mostrar: "Ayer", "Este mes", "05/10/2026 al 12/10/2026"… */
export const etiquetaRango = (inicio?: string, fin?: string) => {
  if (!inicio || !fin) return "Hoy";
  const preset = presetsDeHoy().find((p) => p.inicio === inicio && p.fin === fin);
  if (preset) return preset.label;
  const ini = dayjs(inicio).format("DD/MM/YYYY");
  const f = dayjs(fin).format("DD/MM/YYYY");
  return ini === f ? ini : `${ini} al ${f}`;
};

/** Fechas de un acceso rápido en corto: "27-10-26" o "01-10-26 al 27-10-26".
 *  Vacío si el rango no es un acceso rápido (ahí la etiqueta ya trae las fechas). */
export const fechasRango = (inicio?: string, fin?: string) => {
  if (!inicio || !fin || !presetsDeHoy().some((p) => p.inicio === inicio && p.fin === fin)) return "";
  const ini = dayjs(inicio).format("DD-MM-YY");
  const f = dayjs(fin).format("DD-MM-YY");
  return ini === f ? ini : `${ini} al ${f}`;
};

/** " · 27-10-26" junto a la etiqueta del rango; solo en escritorio. */
export function FechasDelRango({ inicio, fin }: { inicio?: string; fin?: string }) {
  const fechas = fechasRango(inicio, fin);
  if (!fechas) return null;
  return (
    <Box component="span" sx={{ display: { xs: "none", md: "inline" } }}>
      {" "}· {fechas}
    </Box>
  );
}

interface Props {
  fechaInicio?: string;
  fechaFin?: string;
  /** Con temporada activa ningún acceso rápido aparece marcado. */
  inactivo?: boolean;
  onElegir: (fechaInicio: string, fechaFin: string) => void;
  children?: React.ReactNode;
}

/** Fila de accesos rápidos de período. `children` va a la derecha (chips de
 *  filtros activos, por ejemplo). */
export default function RangosRapidos({ fechaInicio, fechaFin, inactivo = false, onElegir, children }: Props) {
  const presets = presetsDeHoy();
  const activo = inactivo ? undefined : presets.find((p) => p.inicio === fechaInicio && p.fin === fechaFin)?.label;

  return (
    <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap role="group" aria-label="Período">
      {RAPIDOS.map((label) => {
        const p = presets.find((x) => x.label === label);
        const marcado = activo === label;
        return (
          <Box
            key={label}
            component="button"
            type="button"
            onClick={() => p && onElegir(p.inicio, p.fin)}
            aria-pressed={marcado}
            sx={{
              border: `1px solid ${marcado ? tinta.acento : tinta.borde}`,
              bgcolor: marcado ? "#eff4ff" : "#fff",
              color: marcado ? tinta.acento : tinta.secundaria,
              fontWeight: marcado ? 700 : 600,
              fontSize: 12,
              borderRadius: 999,
              px: 1.25,
              py: 0.35,
              cursor: "pointer",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
              transition: "all 120ms ease",
              "&:hover": { borderColor: marcado ? tinta.acento : "#cbd5e1" },
            }}
          >
            {CORTO[label] ?? label}
          </Box>
        );
      })}
      {children}
    </Stack>
  );
}
