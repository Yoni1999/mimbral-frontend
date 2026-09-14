"use client";
import type { ReactNode } from "react";
import { Paper, CardContent, Typography, Box, alpha } from "@mui/material";

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  color?: "primary" | "secondary" | "success" | "warning" | "info" | "error";
}

/** Tarjeta de métrica del resumen de metas — misma línea visual que
 *  utilities/ventas/resumen-ventas/components/MetricCard.tsx (ícono en
 *  círculo + valor grande), adaptada acá para no cruzar una dependencia entre
 *  dos features que no se relacionan. */
export default function MetaMetricCard({ title, value, subtitle, icon, color = "primary" }: Props) {
  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2,
        height: "100%",
        transition: "0.2s",
        "&:hover": { transform: "translateY(-2px)", boxShadow: "0px 8px 20px rgba(0,0,0,0.06)" },
      }}
    >
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Box display="flex" alignItems="center" gap={1.25} mb={1.5}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: (theme) => alpha(theme.palette[color].main, 0.12),
              color: `${color}.main`,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Typography variant="subtitle2" color="text.secondary" fontWeight={600} noWrap>
            {title}
          </Typography>
        </Box>

        <Typography variant="h4" fontWeight={700} lineHeight={1}>
          {value}
        </Typography>

        {subtitle && (
          <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Paper>
  );
}
