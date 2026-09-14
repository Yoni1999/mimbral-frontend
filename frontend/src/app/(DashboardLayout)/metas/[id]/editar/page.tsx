"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { IconPencil } from "@tabler/icons-react";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import BlankCard from "@/app/(DashboardLayout)/components/shared/BlankCard";
import MetasPageHeader from "@/modules/metas/components/MetasPageHeader";
import OpcionCard from "@/modules/metas/components/OpcionCard";
import ResponsableAutocomplete from "@/modules/metas/components/ResponsableAutocomplete";
import ProductoSelector from "@/modules/metas/components/ProductoSelector";
import DistribucionMontoEditor from "@/modules/metas/components/DistribucionMontoEditor";
import DistribucionSkuMatriz from "@/modules/metas/components/DistribucionSkuMatriz";
import { editarMeta, obtenerMeta } from "@/modules/metas/services/metas.client";
import { OPCIONES_ASIGNACION, OPCIONES_TARGET_TYPE } from "@/modules/metas/opciones";
import type { AssignmentMode, Goal, GoalItem, GoalTarget, GoalTargetItem, TargetType } from "@/modules/metas/types";
import { notifyError, notifySuccess } from "@/components/ui/toast/notify";

export default function EditarMetaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [meta, setMeta] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetType, setTargetType] = useState<TargetType>("SELLER");
  const [targets, setTargets] = useState<GoalTarget[]>([]);
  const [assignmentMode, setAssignmentMode] = useState<AssignmentMode>("INDIVIDUAL");
  const [targetAmount, setTargetAmount] = useState(0);
  const [items, setItems] = useState<GoalItem[]>([]);
  const [targetItems, setTargetItems] = useState<GoalTargetItem[]>([]);

  useEffect(() => {
    obtenerMeta(params.id)
      .then((g) => {
        setMeta(g);
        setName(g.name);
        setDescription(g.description || "");
        setAssignmentMode(g.assignmentMode);
        setTargetAmount(g.targetAmount || 0);
        const targetsUi = (g.targets || []).map((t) => ({ ...t }));
        setTargets(targetsUi);
        setTargetType(targetsUi[0]?.targetType || "SELLER");
        setItems((g.items || []).map((it) => ({ ...it })));
        // El backend guarda GoalTargetItem con ids internos (goalTargetId/
        // goalItemId); acá se reconstruye a targetReferenceId/sku, que es lo
        // que entienden los editores de distribución del front.
        const targetById = new Map((g.targets || []).map((t) => [t.id, t]));
        const itemById = new Map((g.items || []).map((it) => [it.id, it]));
        setTargetItems(
          (g.targetItems || []).flatMap((ti) => {
            const responsable = targetById.get(ti.goalTargetId);
            const producto = itemById.get(ti.goalItemId);
            if (!responsable || !producto) return [];
            return [{ targetReferenceId: responsable.targetReferenceId, sku: producto.sku, assignedQuantity: ti.assignedQuantity }];
          })
        );
      })
      .catch(() => notifyError("No se pudo cargar la meta"))
      .finally(() => setLoading(false));
  }, [params.id]);

  function cambiarTipoResponsable(nuevo: TargetType) {
    setTargetType(nuevo);
    if (nuevo !== targets[0]?.targetType) {
      setTargets([]);
      setTargetItems([]);
    }
  }

  async function guardar() {
    if (!meta) return;
    setError(null);
    if (!name.trim()) return setError("El nombre es obligatorio.");
    if (targets.length === 0) return setError("Selecciona al menos un responsable.");
    if (meta.goalType === "SALES_AMOUNT") {
      if (!(targetAmount > 0)) return setError("El monto objetivo debe ser mayor a 0.");
      if (assignmentMode === "DISTRIBUTED") {
        const suma = targets.reduce((acc, t) => acc + (Number(t.assignedAmount) || 0), 0);
        if (Math.abs(suma - targetAmount) > 0.01) return setError("La suma distribuida debe coincidir con el objetivo.");
      }
    } else if (items.length === 0) {
      return setError("Agrega al menos un producto.");
    }

    setGuardando(true);
    try {
      await editarMeta(meta.id, {
        name: name.trim(),
        description: description.trim() || null,
        goalType: meta.goalType,
        assignmentMode,
        currencyCode: meta.goalType === "SALES_AMOUNT" ? meta.currencyCode : null,
        targetAmount: meta.goalType === "SALES_AMOUNT" ? targetAmount : null,
        targets,
        items: meta.goalType === "SKU_QUANTITY" ? items : undefined,
        targetItems: meta.goalType === "SKU_QUANTITY" && assignmentMode === "DISTRIBUTED" ? targetItems : undefined,
      });
      notifySuccess("Meta actualizada");
      router.push(`/metas/${meta.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la meta.");
    } finally {
      setGuardando(false);
    }
  }

  if (loading) return <PageContainer title="Editar meta"><Box><CircularProgress /></Box></PageContainer>;
  if (!meta) return <PageContainer title="Editar meta"><Typography color="text.secondary">La meta no existe.</Typography></PageContainer>;

  return (
    <PageContainer title="Editar meta" description="Administra los objetivos comerciales asignados a vendedores y canales de venta.">
      <Box>
        <MetasPageHeader icon={<IconPencil size={22} />} title="Editar meta" description={meta.name} />
        <BlankCard>
          <Box p={3}>
            <Stack spacing={3} maxWidth={760}>
              {error && <Alert severity="error">{error}</Alert>}

              <Alert severity="info">
                Periodo: <strong>{meta.periodName}</strong> · Tipo de meta: <strong>{meta.goalType === "SALES_AMOUNT" ? "Monto de venta" : "Cantidad de SKU"}</strong> (no se pueden cambiar en la edición; crea una meta nueva si necesitas otro periodo o tipo).
              </Alert>

              <TextField label="Nombre" required value={name} onChange={(e) => setName(e.target.value)} />
              <TextField label="Descripción" multiline minRows={2} value={description} onChange={(e) => setDescription(e.target.value)} />

              <Box>
                <Typography variant="subtitle2" mb={1.5}>Tipo de responsable</Typography>
                <Grid container spacing={2}>
                  {OPCIONES_TARGET_TYPE.map((op) => (
                    <Grid item xs={12} sm={6} key={op.value}>
                      <OpcionCard
                        selected={targetType === op.value}
                        icon={op.icon}
                        title={op.titulo}
                        description={op.descripcion}
                        onClick={() => cambiarTipoResponsable(op.value)}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
              <ResponsableAutocomplete targetType={targetType} value={targets} onChange={setTargets} />

              {targets.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" mb={1.5}>¿Cómo se aplica la meta?</Typography>
                  <Grid container spacing={2}>
                    {OPCIONES_ASIGNACION.map((op) => (
                      <Grid item xs={12} sm={4} key={op.value}>
                        <OpcionCard
                          selected={assignmentMode === op.value}
                          icon={op.icon}
                          title={op.titulo}
                          description={op.descripcion}
                          onClick={() => setAssignmentMode(op.value)}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {meta.goalType === "SALES_AMOUNT" ? (
                <>
                  <TextField label={`Monto objetivo (${meta.currencyCode})`} type="number" value={targetAmount || ""}
                    onChange={(e) => setTargetAmount(Number(e.target.value) || 0)} />
                  {assignmentMode === "DISTRIBUTED" && targetAmount > 0 && targets.length > 0 && (
                    <DistribucionMontoEditor targets={targets} targetAmount={targetAmount} currencyCode={meta.currencyCode || "CLP"} onChange={setTargets} />
                  )}
                </>
              ) : (
                <>
                  <ProductoSelector
                    value={items}
                    onChange={setItems}
                    targets={targets}
                    assignmentMode={assignmentMode}
                    targetItems={targetItems}
                    onTargetItemsChange={setTargetItems}
                  />
                  {assignmentMode === "DISTRIBUTED" && items.length > 0 && targets.length > 0 && (
                    <DistribucionSkuMatriz items={items} targets={targets} targetItems={targetItems} onChange={setTargetItems} />
                  )}
                </>
              )}

              <Stack direction="row" spacing={2}>
                <Button variant="outlined" onClick={() => router.push(`/metas/${meta.id}`)} disabled={guardando}>Cancelar</Button>
                <Button variant="contained" onClick={guardar} disabled={guardando}>Guardar cambios</Button>
              </Stack>
            </Stack>
          </Box>
        </BlankCard>
      </Box>
    </PageContainer>
  );
}
