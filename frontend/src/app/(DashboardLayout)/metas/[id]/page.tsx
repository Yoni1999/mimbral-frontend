"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import { IconBuildingStore, IconClockHour4, IconUser } from "@tabler/icons-react";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import BlankCard from "@/app/(DashboardLayout)/components/shared/BlankCard";
import EstadoChip from "@/modules/metas/components/EstadoChip";
import SeccionMeta from "@/modules/metas/components/SeccionMeta";
import ConfirmarAccionModal from "@/modules/metas/components/ConfirmarAccionModal";
import { cancelarMeta, eliminarMeta, obtenerHistorialMeta, obtenerMeta } from "@/modules/metas/services/metas.client";
import type { Goal, GoalAuditEntry } from "@/modules/metas/types";
import { notifyError, notifySuccess } from "@/components/ui/toast/notify";

const MODOS: Record<string, string> = { INDIVIDUAL: "Individual", SHARED: "Compartido", DISTRIBUTED: "Distribuido" };

function Dato({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography>{value ?? "—"}</Typography>
    </Box>
  );
}

function formatoMonto(valor: number | null, moneda: string | null) {
  if (valor == null) return "—";
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: moneda || "CLP", maximumFractionDigits: 0 }).format(valor);
}

export default function DetalleMetaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [meta, setMeta] = useState<Goal | null>(null);
  const [historial, setHistorial] = useState<GoalAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [accion, setAccion] = useState<"cancel" | "delete" | null>(null);

  function cargar() {
    setLoading(true);
    Promise.all([obtenerMeta(params.id), obtenerHistorialMeta(params.id, { pageSize: 10 })])
      .then(([m, h]) => { setMeta(m); setHistorial(h.items); })
      .catch(() => notifyError("No se pudo cargar la meta"))
      .finally(() => setLoading(false));
  }

  useEffect(cargar, [params.id]);

  async function confirmarAccion() {
    if (!meta || !accion) return;
    try {
      if (accion === "cancel") {
        await cancelarMeta(meta.id);
        notifySuccess("Meta cancelada");
        cargar();
      } else {
        await eliminarMeta(meta.id);
        notifySuccess("Meta eliminada");
        router.push("/metas/listado");
      }
      setAccion(null);
    } catch (e) {
      notifyError(e instanceof Error ? e.message : "No se pudo completar la acción");
    }
  }

  if (loading) return <PageContainer title="Meta"><Box><CircularProgress /></Box></PageContainer>;
  if (!meta) return <PageContainer title="Meta"><Typography color="text.secondary">La meta no existe.</Typography></PageContainer>;

  return (
    <PageContainer title={meta.name} description="Detalle de la meta comercial.">
      <Box>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} mb={3}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            {(meta.targetType || meta.targets?.[0]?.targetType) === "SALES_CHANNEL" ? (
              <IconBuildingStore size={26} />
            ) : (
              <IconUser size={26} />
            )}
            <Box>
              <Typography variant="h4">{meta.name}</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <EstadoChip estado={meta.status} />
                <Typography variant="body2" color="text.secondary">{meta.periodName}</Typography>
              </Stack>
            </Box>
          </Stack>
          {meta.status === "ACTIVE" && (
            <Stack direction="row" spacing={1}>
              <Button component={Link} href={`/metas/${meta.id}/editar`} variant="outlined">Editar</Button>
              <Button color="warning" variant="outlined" onClick={() => setAccion("cancel")}>Cancelar</Button>
              <Button color="error" variant="outlined" onClick={() => setAccion("delete")}>Eliminar</Button>
            </Stack>
          )}
        </Stack>

        <BlankCard>
          <Box p={3}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}><Dato label="Periodo" value={<Link href={`/metas/periodos/${meta.periodId}`}>{meta.periodName}</Link>} /></Grid>
              <Grid item xs={12} sm={6} md={3}><Dato label="Estado" value={<EstadoChip estado={meta.status} />} /></Grid>
              <Grid item xs={12} sm={6} md={3}><Dato label="Tipo" value={meta.goalType === "SALES_AMOUNT" ? "Monto de venta" : "Cantidad de SKU"} /></Grid>
              <Grid item xs={12} sm={6} md={3}><Dato label="Modo" value={MODOS[meta.assignmentMode]} /></Grid>
              <Grid item xs={12} sm={6} md={6}>
                <Dato label="Responsables" value={<Stack direction="row" flexWrap="wrap" gap={0.5}>{(meta.targets || []).map((t) => <Chip key={t.targetReferenceId} size="small" label={t.targetName} />)}</Stack>} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}><Dato label="Creado por" value={meta.createdByUserName || meta.createdByUserId} /></Grid>
              <Grid item xs={12} sm={6} md={3}><Dato label="Fecha creación" value={dayjs(meta.createdAt).format("DD-MM-YYYY HH:mm")} /></Grid>
              {meta.updatedAt && (
                <>
                  <Grid item xs={12} sm={6} md={3}><Dato label="Modificado por" value={meta.updatedByUserName || meta.updatedByUserId} /></Grid>
                  <Grid item xs={12} sm={6} md={3}><Dato label="Fecha modificación" value={dayjs(meta.updatedAt).format("DD-MM-YYYY HH:mm")} /></Grid>
                </>
              )}
            </Grid>
          </Box>
        </BlankCard>

        <SeccionMeta title="Cumplimiento" />
        <Card variant="outlined" sx={{ mb: 1 }}>
          <CardContent>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <IconClockHour4 size={20} />
              <Typography variant="body2" color="text.secondary">
                El cálculo de venta real todavía no está definido (depende de cómo se conecte con SAP) — por ahora sólo se muestra el objetivo configurado.
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        <SeccionMeta title="Detalle del objetivo" />
        {meta.goalType === "SALES_AMOUNT" ? (
          <BlankCard>
            <Box p={3}>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}><Dato label="Objetivo" value={formatoMonto(meta.targetAmount, meta.currencyCode)} /></Grid>
                <Grid item xs={6} sm={3}><Dato label="Venta acumulada" value="—" /></Grid>
                <Grid item xs={6} sm={3}><Dato label="Monto faltante" value="—" /></Grid>
                <Grid item xs={6} sm={3}><Dato label="Cumplimiento" value="Pendiente de definir" /></Grid>
              </Grid>
              {meta.assignmentMode === "DISTRIBUTED" && (
                <Table size="small" sx={{ mt: 3 }}>
                  <TableHead sx={{ "& th": { bgcolor: "action.hover", fontWeight: 600 } }}><TableRow><TableCell>Responsable</TableCell><TableCell align="right">Objetivo</TableCell><TableCell align="right">Vendido</TableCell><TableCell align="right">Cumplimiento</TableCell></TableRow></TableHead>
                  <TableBody>
                    {(meta.targets || []).map((t) => (
                      <TableRow key={t.targetReferenceId}>
                        <TableCell>{t.targetName}</TableCell>
                        <TableCell align="right">{formatoMonto(t.assignedAmount ?? null, meta.currencyCode)}</TableCell>
                        <TableCell align="right">—</TableCell>
                        <TableCell align="right">—</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          </BlankCard>
        ) : (
          <BlankCard>
            <Box p={3}>
              <Table size="small">
                <TableHead sx={{ "& th": { bgcolor: "action.hover", fontWeight: 600 } }}>
                  <TableRow><TableCell>SKU</TableCell><TableCell>Producto</TableCell><TableCell align="right">Meta</TableCell><TableCell align="right">Vendido</TableCell><TableCell align="right">Faltante</TableCell><TableCell align="right">%</TableCell></TableRow>
                </TableHead>
                <TableBody>
                  {(meta.items || []).map((it) => (
                    <TableRow key={it.sku} hover>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: 13 }}>{it.sku}</TableCell>
                      <TableCell>{it.productName}</TableCell>
                      <TableCell align="right">{it.targetQuantity}</TableCell>
                      <TableCell align="right">—</TableCell>
                      <TableCell align="right">—</TableCell>
                      <TableCell align="right">—</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {meta.assignmentMode === "DISTRIBUTED" && (meta.targetItems?.length ?? 0) > 0 && (
                <>
                  <Typography variant="subtitle2" mt={3} mb={1}>Distribución configurada</Typography>
                  <Table size="small">
                    <TableHead sx={{ "& th": { bgcolor: "action.hover", fontWeight: 600 } }}><TableRow><TableCell>SKU</TableCell><TableCell>Responsable</TableCell><TableCell align="right">Cantidad asignada</TableCell></TableRow></TableHead>
                    <TableBody>
                      {(meta.targetItems || []).map((ti, idx) => {
                        const responsable = (meta.targets || []).find((t) => t.id === ti.goalTargetId);
                        return (
                          <TableRow key={idx}>
                            <TableCell>{(meta.items || []).find((it) => it.id === ti.goalItemId)?.sku ?? "—"}</TableCell>
                            <TableCell>{responsable?.targetName ?? "—"}</TableCell>
                            <TableCell align="right">{ti.assignedQuantity}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </>
              )}
            </Box>
          </BlankCard>
        )}

        {historial.length > 0 && (
          <>
            <SeccionMeta title="Historial de cambios" />
            <BlankCard>
              <Table size="small">
                <TableHead sx={{ "& th": { bgcolor: "action.hover", fontWeight: 600 } }}>
                  <TableRow><TableCell>Fecha</TableCell><TableCell>Usuario</TableCell><TableCell>Acción</TableCell></TableRow>
                </TableHead>
                <TableBody>
                  {historial.map((h) => (
                    <TableRow key={h.id} hover>
                      <TableCell>{dayjs(h.createdAt).format("DD-MM-YYYY HH:mm")}</TableCell>
                      <TableCell>{h.userName || h.userId}</TableCell>
                      <TableCell>{h.action}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </BlankCard>
          </>
        )}
      </Box>

      <ConfirmarAccionModal
        abierto={Boolean(accion)}
        titulo={accion === "cancel" ? "Cancelar meta" : "Eliminar meta"}
        descripcion={accion === "cancel" ? `Se cancelará "${meta.name}".` : `Se eliminará "${meta.name}" permanentemente.`}
        onCancelar={() => setAccion(null)}
        onConfirmar={confirmarAccion}
        destructivo={accion === "delete"}
      />
    </PageContainer>
  );
}
