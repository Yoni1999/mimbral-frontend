"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  MenuItem,
  Radio,
  RadioGroup,
  FormControlLabel,
  Step,
  StepLabel,
  Stepper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import EstadoChip from "./EstadoChip";
import ResponsableAutocomplete from "./ResponsableAutocomplete";
import ProductoSelector from "./ProductoSelector";
import DistribucionMontoEditor from "./DistribucionMontoEditor";
import DistribucionSkuMatriz from "./DistribucionSkuMatriz";
import { listarPeriodos } from "../services/metas.client";
import type { AssignmentMode, GoalDraft, GoalItem, GoalPeriod, GoalTarget, GoalTargetItem, GoalType, TargetType } from "../types";

const PASOS = ["Periodo", "Responsable", "Objetivo", "Confirmación"];

interface Props {
  onCrear: (draft: GoalDraft) => Promise<void>;
  onCancelar: () => void;
  creando?: boolean;
}

export default function MetaWizard({ onCrear, onCancelar, creando }: Props) {
  const [paso, setPaso] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Paso 1
  const [periodos, setPeriodos] = useState<GoalPeriod[]>([]);
  const [periodId, setPeriodId] = useState("");

  // Paso 2
  const [targetType, setTargetType] = useState<TargetType>("SELLER");
  const [targets, setTargets] = useState<GoalTarget[]>([]);
  const [assignmentMode, setAssignmentMode] = useState<AssignmentMode>("INDIVIDUAL");

  // Paso 3
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [goalType, setGoalType] = useState<GoalType>("SALES_AMOUNT");
  const [currencyCode] = useState("CLP");
  const [targetAmount, setTargetAmount] = useState<number>(0);
  const [items, setItems] = useState<GoalItem[]>([]);
  const [targetItems, setTargetItems] = useState<GoalTargetItem[]>([]);

  useEffect(() => {
    listarPeriodos({ pageSize: 100 }).then(({ items: todos }) =>
      setPeriodos(todos.filter((p) => p.status === "ACTIVE" || p.status === "DRAFT"))
    );
  }, []);

  const periodoSeleccionado = periodos.find((p) => p.id === periodId) || null;

  function validarPaso(): string | null {
    if (paso === 0 && !periodId) return "Selecciona un periodo.";
    if (paso === 1 && targets.length === 0) return "Selecciona al menos un responsable.";
    if (paso === 2) {
      if (!name.trim()) return "Ponle un nombre a la meta.";
      if (goalType === "SALES_AMOUNT") {
        if (!(targetAmount > 0)) return "El monto objetivo debe ser mayor a 0.";
        if (assignmentMode === "DISTRIBUTED") {
          const suma = targets.reduce((acc, t) => acc + (Number(t.assignedAmount) || 0), 0);
          if (Math.abs(suma - targetAmount) > 0.01) return "La suma distribuida debe coincidir exactamente con el objetivo.";
        }
      } else {
        if (items.length === 0) return "Agrega al menos un producto.";
        if (assignmentMode === "DISTRIBUTED") {
          const incompleto = items.some(
            (it) => targetItems.filter((ti) => ti.sku === it.sku).reduce((acc, ti) => acc + ti.assignedQuantity, 0) !== it.targetQuantity
          );
          if (incompleto) return "Cada producto debe tener su cantidad totalmente distribuida.";
        }
      }
    }
    return null;
  }

  function siguiente() {
    const problema = validarPaso();
    if (problema) return setError(problema);
    setError(null);
    setPaso((p) => Math.min(p + 1, PASOS.length - 1));
  }

  function anterior() {
    setError(null);
    setPaso((p) => Math.max(p - 1, 0));
  }

  async function confirmar() {
    setError(null);
    const draft: GoalDraft = {
      periodId,
      name: name.trim(),
      description: description.trim() || null,
      goalType,
      assignmentMode,
      currencyCode: goalType === "SALES_AMOUNT" ? currencyCode : null,
      targetAmount: goalType === "SALES_AMOUNT" ? targetAmount : null,
      targets,
      items: goalType === "SKU_QUANTITY" ? items : undefined,
      targetItems: goalType === "SKU_QUANTITY" && assignmentMode === "DISTRIBUTED" ? targetItems : undefined,
    };
    try {
      await onCrear(draft);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear la meta.");
    }
  }

  const formatoMonto = (valor: number) =>
    new Intl.NumberFormat("es-CL", { style: "currency", currency: currencyCode, maximumFractionDigits: 0 }).format(valor || 0);

  return (
    <Box>
      <Stepper activeStep={paso} sx={{ mb: 4 }}>
        {PASOS.map((label) => (
          <Step key={label}><StepLabel>{label}</StepLabel></Step>
        ))}
      </Stepper>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {paso === 0 && (
        <Stack spacing={2} maxWidth={480}>
          <Typography color="text.secondary">Sólo se puede crear una meta en un periodo Borrador o Activo.</Typography>
          <TextField select label="Periodo" value={periodId} onChange={(e) => setPeriodId(e.target.value)}>
            {periodos.map((p) => (
              <MenuItem key={p.id} value={p.id}>{p.name} ({dayjs(p.startDate).format("DD-MM-YYYY")} — {dayjs(p.endDate).format("DD-MM-YYYY")})</MenuItem>
            ))}
          </TextField>
          {periodoSeleccionado && (
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="subtitle1">{periodoSeleccionado.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {dayjs(periodoSeleccionado.startDate).format("DD-MM-YYYY")} — {dayjs(periodoSeleccionado.endDate).format("DD-MM-YYYY")}
                    </Typography>
                  </Box>
                  <EstadoChip estado={periodoSeleccionado.status} />
                </Stack>
              </CardContent>
            </Card>
          )}
        </Stack>
      )}

      {paso === 1 && (
        <Stack spacing={3} maxWidth={640}>
          <TextField select label="Tipo de responsable" value={targetType}
            onChange={(e) => { setTargetType(e.target.value as TargetType); setTargets([]); }}>
            <MenuItem value="SELLER">Vendedor</MenuItem>
            <MenuItem value="SALES_CHANNEL">Canal de venta</MenuItem>
          </TextField>

          <ResponsableAutocomplete targetType={targetType} value={targets} onChange={setTargets} />

          {targets.length > 0 && (
            <Box>
              <Typography variant="subtitle2" mb={1}>¿Cómo se aplicará la meta?</Typography>
              <RadioGroup value={assignmentMode} onChange={(e) => setAssignmentMode(e.target.value as AssignmentMode)}>
                <FormControlLabel value="INDIVIDUAL" control={<Radio />} label="Individual — cada responsable tiene el objetivo completo" />
                <FormControlLabel value="SHARED" control={<Radio />} label="Compartido — todos suman contra una misma meta" />
                <FormControlLabel value="DISTRIBUTED" control={<Radio />} label="Distribuido — el objetivo se reparte entre responsables" />
              </RadioGroup>
            </Box>
          )}
        </Stack>
      )}

      {paso === 2 && (
        <Stack spacing={3} maxWidth={760}>
          <TextField label="Nombre de la meta" required value={name} onChange={(e) => setName(e.target.value)} />
          <TextField label="Descripción" multiline minRows={2} value={description} onChange={(e) => setDescription(e.target.value)} />

          <TextField select label="Tipo de meta" value={goalType} onChange={(e) => setGoalType(e.target.value as GoalType)}>
            <MenuItem value="SALES_AMOUNT">Meta por monto de venta</MenuItem>
            <MenuItem value="SKU_QUANTITY">Meta por productos / SKU</MenuItem>
          </TextField>

          {goalType === "SALES_AMOUNT" ? (
            <>
              <TextField label={`Monto objetivo (${currencyCode})`} type="number" value={targetAmount || ""}
                onChange={(e) => setTargetAmount(Number(e.target.value) || 0)} />
              {assignmentMode === "DISTRIBUTED" && targetAmount > 0 && (
                <DistribucionMontoEditor targets={targets} targetAmount={targetAmount} currencyCode={currencyCode} onChange={setTargets} />
              )}
            </>
          ) : (
            <>
              <ProductoSelector value={items} onChange={setItems} />
              {assignmentMode === "DISTRIBUTED" && items.length > 0 && (
                <DistribucionSkuMatriz items={items} targets={targets} targetItems={targetItems} onChange={setTargetItems} />
              )}
            </>
          )}
        </Stack>
      )}

      {paso === 3 && (
        <Stack spacing={2} maxWidth={640}>
          <Typography variant="h6">Resumen</Typography>
          <Card variant="outlined"><CardContent>
            <Stack spacing={1.5}>
              <Row label="Periodo" value={periodoSeleccionado?.name} />
              <Row label="Nombre" value={name} />
              {description && <Row label="Descripción" value={description} />}
              <Row label="Tipo" value={goalType === "SALES_AMOUNT" ? "Monto de venta" : "Cantidad de SKU"} />
              <Row label="Modo" value={{ INDIVIDUAL: "Individual", SHARED: "Compartido", DISTRIBUTED: "Distribuido" }[assignmentMode]} />
              <Row label="Responsables" value={<Stack direction="row" flexWrap="wrap" gap={0.5}>{targets.map((t) => <Chip key={t.targetReferenceId} size="small" label={t.targetName} />)}</Stack>} />
              {goalType === "SALES_AMOUNT" ? (
                <Row label="Objetivo total" value={formatoMonto(targetAmount)} />
              ) : (
                <Row label="Productos" value={<Stack spacing={0.5}>{items.map((it) => <Typography key={it.sku} variant="body2">{it.sku} — {it.productName}: {it.targetQuantity}</Typography>)}</Stack>} />
              )}
            </Stack>
          </CardContent></Card>
        </Stack>
      )}

      <Stack direction="row" spacing={2} mt={4}>
        <Button variant="outlined" onClick={paso === 0 ? onCancelar : anterior} disabled={creando}>
          {paso === 0 ? "Cancelar" : "Volver"}
        </Button>
        {paso < PASOS.length - 1 ? (
          <Button variant="contained" onClick={siguiente}>Siguiente</Button>
        ) : (
          <Button variant="contained" onClick={confirmar} disabled={creando}>Crear meta</Button>
        )}
      </Stack>
    </Box>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Grid container>
      <Grid item xs={4}><Typography color="text.secondary">{label}</Typography></Grid>
      <Grid item xs={8}>{typeof value === "string" || typeof value === "number" ? <Typography>{value}</Typography> : value}</Grid>
    </Grid>
  );
}
