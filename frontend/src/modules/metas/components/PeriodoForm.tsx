"use client";
import { useState } from "react";
import { Alert, Button, Grid, MenuItem, Stack, TextField } from "@mui/material";
import type { GoalPeriod } from "../types";
import type { PeriodoPayload } from "../services/metas.client";

interface Props {
  modo: "crear" | "editar";
  valoresIniciales?: GoalPeriod;
  onCancelar: () => void;
  onGuardar: (payload: PeriodoPayload) => Promise<void>;
  guardando?: boolean;
  advertenciaMetasAsociadas?: string | null;
}

export default function PeriodoForm({ modo, valoresIniciales, onCancelar, onGuardar, guardando, advertenciaMetasAsociadas }: Props) {
  const [name, setName] = useState(valoresIniciales?.name || "");
  const [description, setDescription] = useState(valoresIniciales?.description || "");
  const [startDate, setStartDate] = useState(valoresIniciales?.startDate?.slice(0, 10) || "");
  const [endDate, setEndDate] = useState(valoresIniciales?.endDate?.slice(0, 10) || "");
  const [status, setStatus] = useState<"DRAFT" | "ACTIVE">((valoresIniciales?.status as "DRAFT" | "ACTIVE") || "DRAFT");
  const [error, setError] = useState<string | null>(null);

  async function manejarGuardar() {
    setError(null);
    if (!name.trim()) return setError("El nombre es obligatorio.");
    if (!startDate || !endDate) return setError("Debes indicar fecha de inicio y de término.");
    if (endDate < startDate) return setError("La fecha de término no puede ser anterior a la de inicio.");

    await onGuardar({
      name: name.trim(),
      description: description.trim() || null,
      startDate,
      endDate,
      ...(modo === "crear" ? { status } : {}),
    });
  }

  return (
    <Stack spacing={3} maxWidth={640}>
      {advertenciaMetasAsociadas && <Alert severity="warning">{advertenciaMetasAsociadas}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}

      <TextField label="Nombre" required fullWidth value={name} onChange={(e) => setName(e.target.value)} />
      <TextField label="Descripción" fullWidth multiline minRows={2} value={description} onChange={(e) => setDescription(e.target.value)} />

      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField label="Fecha inicio" type="date" required fullWidth InputLabelProps={{ shrink: true }} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </Grid>
        <Grid item xs={6}>
          <TextField label="Fecha término" type="date" required fullWidth InputLabelProps={{ shrink: true }} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </Grid>
      </Grid>

      {modo === "crear" && (
        <TextField select label="Estado" fullWidth value={status} onChange={(e) => setStatus(e.target.value as "DRAFT" | "ACTIVE")}>
          <MenuItem value="DRAFT">Borrador</MenuItem>
          <MenuItem value="ACTIVE">Activo</MenuItem>
        </TextField>
      )}

      <Stack direction="row" spacing={2}>
        <Button variant="outlined" onClick={onCancelar} disabled={guardando}>Cancelar</Button>
        <Button variant="contained" onClick={manejarGuardar} disabled={guardando}>
          {modo === "crear" ? "Crear periodo" : "Guardar cambios"}
        </Button>
      </Stack>
    </Stack>
  );
}
