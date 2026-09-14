"use client";
import type { ReactNode } from "react";
import { Box, Stack, Typography, ButtonBase } from "@mui/material";
import { IconCircleCheck } from "@tabler/icons-react";

interface Props {
  selected: boolean;
  icon: ReactNode;
  title: string;
  description?: string;
  onClick: () => void;
  disabled?: boolean;
}

/** Tarjeta seleccionable usada para reemplazar los <Select>/<RadioGroup>
 *  planos del wizard de metas (tipo de responsable, modo de asignación, tipo
 *  de meta) por algo más visual e intuitivo de escanear. */
export default function OpcionCard({ selected, icon, title, description, onClick, disabled }: Props) {
  return (
    <ButtonBase
      onClick={onClick}
      disabled={disabled}
      sx={{
        width: "100%",
        textAlign: "left",
        borderRadius: 2,
        p: 2,
        border: "1px solid",
        borderColor: selected ? "primary.main" : "divider",
        bgcolor: selected ? "primary.light" : "background.paper",
        transition: "border-color 0.15s, background-color 0.15s",
        "&:hover": disabled ? undefined : { borderColor: "primary.main" },
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start" width="100%">
        <Box sx={{ color: selected ? "primary.main" : "text.secondary", display: "flex", mt: 0.25 }}>{icon}</Box>
        <Box flex={1}>
          <Typography variant="subtitle1" fontWeight={600} color={selected ? "primary.main" : "text.primary"}>
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          )}
        </Box>
        {selected && (
          <Box sx={{ color: "primary.main", display: "flex" }}>
            <IconCircleCheck size={20} />
          </Box>
        )}
      </Stack>
    </ButtonBase>
  );
}
