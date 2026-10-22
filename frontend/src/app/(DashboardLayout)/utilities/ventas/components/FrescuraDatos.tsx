"use client";

import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { apiJson } from "@/utils/apiClient";
import { tinta } from "./estilo";

const ZONA = "America/Santiago";

/** Fecha de hoy en Chile como "AAAA-MM-DD", igual que `ultimaFecha`. */
const hoyEnChile = () => new Intl.DateTimeFormat("en-CA", { timeZone: ZONA }).format(new Date());

const diasEntre = (desde: string, hasta: string) =>
  Math.round((Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / 86_400_000);

/** Verde si los datos son de hoy, amarillo si son de ayer, rojo con 2 días o más. */
const colorSegunAntiguedad = (dias: number) => (dias <= 0 ? "#16a34a" : dias === 1 ? "#eab308" : "#dc2626");

type Estado = { texto: string; color: string } | null;

/** Hasta cuándo llegan los datos: el fin de la última carga correcta de
 *  facturas desde SAP, según el registro de corridas de la carga. Se consulta
 *  en cada visita (sin memoria): si la copia se actualiza a mano durante el
 *  día, el texto cambia solo.
 *
 *  Se ubica en el espacio libre sobre la tarjeta de filtros, sin empujarla:
 *  la tarjeta que lo contiene debe tener `position: relative`. */
export default function FrescuraDatos() {
  const [estado, setEstado] = useState<Estado>(null);

  useEffect(() => {
    const controller = new AbortController();
    apiJson("/api/ultima-actualizacion", { signal: controller.signal })
      .then((d: { ultimaFecha?: string | null; ultimaHora?: string | null }) => {
        if (controller.signal.aborted) return;
        if (!d?.ultimaFecha) {
          setEstado({ texto: "Sin carga de SAP registrada", color: "#dc2626" });
          return;
        }
        const [y, m, dia] = d.ultimaFecha.split("-");
        setEstado({
          texto: `Datos SAP al ${dia}/${m}/${y}${d.ultimaHora ? ` ${d.ultimaHora}` : ""}`,
          color: colorSegunAntiguedad(diasEntre(d.ultimaFecha, hoyEnChile())),
        });
      })
      .catch(() => {
        if (!controller.signal.aborted) setEstado(null);
      });
    return () => controller.abort();
  }, []);

  if (!estado) return null;

  return (
    <Box
      title="Fin de la última carga correcta de facturas desde SAP"
      sx={{
        position: "absolute",
        right: 12,
        bottom: "calc(100% + 3px)",
        display: "flex",
        alignItems: "center",
        gap: 0.6,
        fontSize: 10.5,
        lineHeight: 1,
        color: tinta.tenue,
        whiteSpace: "nowrap",
        pointerEvents: "auto",
      }}
    >
      <Box component="span" sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: estado.color, flexShrink: 0 }} />
      {estado.texto}
    </Box>
  );
}
