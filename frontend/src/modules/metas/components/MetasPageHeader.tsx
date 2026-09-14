"use client";
import type { ReactNode } from "react";
import { Box, Stack, Typography, alpha } from "@mui/material";

interface Props {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  color?: "primary" | "secondary" | "success" | "warning" | "info";
}

/** Encabezado estándar de toda página del módulo de metas: ícono + título +
 *  descripción + acción principal, en vez de repetir el mismo Stack/Typography
 *  suelto en cada página. */
export default function MetasPageHeader({ icon, title, description, action, color = "primary" }: Props) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      justifyContent="space-between"
      alignItems={{ xs: "flex-start", sm: "center" }}
      spacing={2}
      mb={3}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          sx={{
            width: 48,
            height: 48,
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
        <Box>
          <Typography variant="h4">{title}</Typography>
          {description && (
            <Typography color="text.secondary" variant="body2">
              {description}
            </Typography>
          )}
        </Box>
      </Stack>
      {action}
    </Stack>
  );
}
