"use client";
import { Chip } from "@mui/material";

const ESTILOS: Record<string, { label: string; color: "default" | "info" | "success" | "warning" | "error" }> = {
  DRAFT: { label: "Borrador", color: "default" },
  ACTIVE: { label: "Activo", color: "success" },
  CLOSED: { label: "Cerrado", color: "info" },
  CANCELLED: { label: "Cancelado", color: "error" },
};

export default function EstadoChip({ estado }: { estado: string }) {
  const config = ESTILOS[estado] || { label: estado, color: "default" as const };
  return <Chip size="small" label={config.label} color={config.color} variant={config.color === "default" ? "outlined" : "filled"} />;
}
