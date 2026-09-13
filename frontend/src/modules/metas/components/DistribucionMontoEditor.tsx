"use client";
import { Alert, Box, Stack, TextField, Typography } from "@mui/material";
import type { GoalTarget } from "../types";

interface Props {
  targets: GoalTarget[];
  targetAmount: number;
  currencyCode: string;
  onChange: (targets: GoalTarget[]) => void;
  disabled?: boolean;
}

const formatoMonto = (valor: number, moneda: string) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: moneda || "CLP", maximumFractionDigits: 0 }).format(valor || 0);

/** Modo DISTRIBUTED de una meta SALES_AMOUNT: el monto total se reparte entre
 *  los responsables. Ver prompt sección "SALES_AMOUNT DISTRIBUTED". */
export default function DistribucionMontoEditor({ targets, targetAmount, currencyCode, onChange, disabled }: Props) {
  const suma = targets.reduce((acc, t) => acc + (Number(t.assignedAmount) || 0), 0);
  const coincide = Math.abs(suma - targetAmount) < 0.01;

  function actualizar(referenceId: string, monto: number) {
    onChange(targets.map((t) => (t.targetReferenceId === referenceId ? { ...t, assignedAmount: monto } : t)));
  }

  return (
    <Box>
      <Stack spacing={1.5}>
        {targets.map((t) => (
          <Stack key={t.targetReferenceId} direction="row" spacing={2} alignItems="center">
            <Typography sx={{ flex: 1 }}>{t.targetName}</Typography>
            <TextField
              type="number"
              size="small"
              value={t.assignedAmount ?? ""}
              disabled={disabled}
              onChange={(e) => actualizar(t.targetReferenceId, Number(e.target.value) || 0)}
              inputProps={{ min: 0, style: { textAlign: "right" } }}
              sx={{ width: 200 }}
            />
          </Stack>
        ))}
      </Stack>

      <Alert severity={coincide ? "success" : "warning"} sx={{ mt: 2 }}>
        Distribuido: {formatoMonto(suma, currencyCode)} de {formatoMonto(targetAmount, currencyCode)}
        {!coincide && " — la suma debe coincidir exactamente con el objetivo total para poder guardar."}
      </Alert>
    </Box>
  );
}
