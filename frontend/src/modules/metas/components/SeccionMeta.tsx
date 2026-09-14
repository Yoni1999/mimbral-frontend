"use client";
import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";

interface Props {
  title: string;
  icon?: ReactNode;
}

/** Encabezado de subsección dentro de una página de detalle (misma línea
 *  visual que SeccionTitulo de resumen-ventas: barra de color + título en
 *  mayúsculas), copiado en vez de importado entre features. */
export default function SeccionMeta({ title, icon }: Props) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 4, mb: 2 }}>
      <Box sx={{ width: 4, height: 22, bgcolor: "primary.main", borderRadius: 1 }} />
      <Typography variant="subtitle1" fontWeight={700} color="text.primary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
        {title}
      </Typography>
      {icon && <Box color="primary.main" display="flex">{icon}</Box>}
    </Box>
  );
}
