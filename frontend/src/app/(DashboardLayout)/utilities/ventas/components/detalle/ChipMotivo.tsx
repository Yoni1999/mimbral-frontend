"use client";

import { Box } from "@mui/material";
import { IconBan, IconCalculator, IconHelpCircle, IconPencil } from "@tabler/icons-react";
import { tinta } from "../estilo";

/** Motivo SII de una nota de crédito, con color e ícono fijos por motivo
 *  (el color siempre va con texto e ícono, nunca solo). */
export const MOTIVOS_NC: Record<string, { texto: string; color: string; fondo: string; Icono: typeof IconBan }> = {
  "1": { texto: "Anula documento", color: "#c4320a", fondo: "#fff4ed", Icono: IconBan },
  "3": { texto: "Corrige montos", color: "#175cd3", fondo: "#eff8ff", Icono: IconCalculator },
  "2": { texto: "Corrige texto", color: "#5925dc", fondo: "#f4f3ff", Icono: IconPencil },
  "": { texto: "Sin motivo informado", color: tinta.secundaria, fondo: "#f1f5f9", Icono: IconHelpCircle },
};

export const motivoNc = (codigo: string | null | undefined) => MOTIVOS_NC[String(codigo ?? "").trim()] ?? MOTIVOS_NC[""];

export default function ChipMotivo({ codigo, texto }: { codigo: string | null; texto?: string }) {
  const m = motivoNc(codigo);
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        px: 0.9,
        py: 0.3,
        borderRadius: 999,
        bgcolor: m.fondo,
        color: m.color,
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      <m.Icono size={13} />
      {texto || m.texto}
    </Box>
  );
}
