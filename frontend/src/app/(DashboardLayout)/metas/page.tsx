"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Box,
  Button,
  Grid,
  MenuItem,
  TextField,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { IconPlus, IconTargetArrow, IconCalendarStats, IconGauge, IconBan } from "@tabler/icons-react";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import BlankCard from "@/app/(DashboardLayout)/components/shared/BlankCard";
import EstadoChip from "@/modules/metas/components/EstadoChip";
import MetasPageHeader from "@/modules/metas/components/MetasPageHeader";
import MetaMetricCard from "@/modules/metas/components/MetaMetricCard";
import { listarMetas, listarPeriodos, obtenerResumenMetas } from "@/modules/metas/services/metas.client";
import type { Goal, GoalPeriod, GoalsSummary } from "@/modules/metas/types";
import { notifyError } from "@/components/ui/toast/notify";

const TIPOS_RESPONSABLE = [
  { value: "", label: "Todos" },
  { value: "SELLER", label: "Vendedor" },
  { value: "SALES_CHANNEL", label: "Canal de venta" },
];
const TIPOS_META = [
  { value: "", label: "Todas" },
  { value: "SALES_AMOUNT", label: "Monto de venta" },
  { value: "SKU_QUANTITY", label: "Cantidad SKU" },
];
const ESTADOS = [
  { value: "", label: "Todos" },
  { value: "ACTIVE", label: "Activo" },
  { value: "CANCELLED", label: "Cancelado" },
];

export default function ResumenMetasPage() {
  const [periodos, setPeriodos] = useState<GoalPeriod[]>([]);
  const [resumen, setResumen] = useState<GoalsSummary | null>(null);
  const [metas, setMetas] = useState<Goal[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });

  const [filtros, setFiltros] = useState({ periodId: "", targetType: "", goalType: "", status: "" });

  useEffect(() => {
    listarPeriodos({ pageSize: 100 })
      .then(({ items }) => setPeriodos(items))
      .catch(() => notifyError("No se pudieron cargar los periodos"));
  }, []);

  useEffect(() => {
    obtenerResumenMetas({ periodId: filtros.periodId || undefined })
      .then(setResumen)
      .catch(() => notifyError("No se pudo cargar el resumen de metas"));
  }, [filtros.periodId]);

  useEffect(() => {
    setLoading(true);
    listarMetas({
      ...filtros,
      periodId: filtros.periodId || undefined,
      targetType: filtros.targetType || undefined,
      goalType: filtros.goalType || undefined,
      status: filtros.status || undefined,
      page: paginationModel.page + 1,
      pageSize: paginationModel.pageSize,
    })
      .then(({ items, pagination }) => {
        setMetas(items);
        setTotal(pagination?.total ?? items.length);
      })
      .catch(() => notifyError("No se pudieron cargar las metas"))
      .finally(() => setLoading(false));
  }, [filtros, paginationModel]);

  const columnas: GridColDef<Goal>[] = useMemo(
    () => [
      { field: "name", headerName: "Meta", flex: 1.4, renderCell: (p) => <Link href={`/metas/${p.row.id}`}>{p.value}</Link> },
      { field: "targetNames", headerName: "Responsable(s)", flex: 1.2, valueGetter: (v, row) => row.targetNames || "—" },
      {
        field: "targetType",
        headerName: "Tipo responsable",
        width: 150,
        valueGetter: (v, row) => (row.targetType === "SELLER" ? "Vendedor" : row.targetType === "SALES_CHANNEL" ? "Canal de venta" : "—"),
      },
      { field: "periodName", headerName: "Periodo", width: 160 },
      {
        field: "goalType",
        headerName: "Tipo meta",
        width: 140,
        valueGetter: (v, row) => (row.goalType === "SALES_AMOUNT" ? "Monto de venta" : "Cantidad SKU"),
      },
      {
        field: "targetAmount",
        headerName: "Objetivo",
        width: 140,
        valueGetter: (v, row) =>
          row.goalType === "SALES_AMOUNT"
            ? new Intl.NumberFormat("es-CL", { style: "currency", currency: row.currencyCode || "CLP", maximumFractionDigits: 0 }).format(row.targetAmount || 0)
            : "—",
      },
      { field: "status", headerName: "Estado", width: 120, renderCell: (p) => <EstadoChip estado={p.value as string} /> },
    ],
    []
  );

  return (
    <PageContainer title="Administrador de Metas" description="Gestiona periodos, objetivos comerciales y cumplimiento de vendedores y canales de venta.">
      <Box>
        <MetasPageHeader
          icon={<IconTargetArrow size={24} />}
          title="Administrador de Metas"
          description="Gestiona periodos, objetivos comerciales y cumplimiento de vendedores y canales de venta."
          action={
            <Button component={Link} href="/metas/nueva" variant="contained" startIcon={<IconPlus size={18} />}>
              Crear meta
            </Button>
          }
        />

        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <MetaMetricCard title="Periodo activo" value={resumen?.activePeriod?.name || "—"} icon={<IconCalendarStats size={18} />} color="info" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetaMetricCard title="Metas activas" value={resumen?.activeGoals ?? "—"} icon={<IconTargetArrow size={18} />} color="success" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetaMetricCard
              title="Cumplimiento general"
              value={resumen?.overallCompliancePct != null ? `${resumen.overallCompliancePct}%` : "—"}
              subtitle={resumen?.overallCompliancePct == null ? "Pendiente de definir" : undefined}
              icon={<IconGauge size={18} />}
              color="warning"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <MetaMetricCard title="Metas canceladas" value={resumen?.cancelledGoals ?? "—"} icon={<IconBan size={18} />} color="error" />
          </Grid>
        </Grid>

        <BlankCard>
          <Box p={2}>
            <Grid container spacing={2} mb={2}>
              <Grid item xs={12} sm={3}>
                <TextField select fullWidth size="small" label="Periodo" value={filtros.periodId}
                  onChange={(e) => setFiltros((f) => ({ ...f, periodId: e.target.value }))}>
                  <MenuItem value="">Todos</MenuItem>
                  {periodos.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField select fullWidth size="small" label="Tipo responsable" value={filtros.targetType}
                  onChange={(e) => setFiltros((f) => ({ ...f, targetType: e.target.value }))}>
                  {TIPOS_RESPONSABLE.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField select fullWidth size="small" label="Tipo de meta" value={filtros.goalType}
                  onChange={(e) => setFiltros((f) => ({ ...f, goalType: e.target.value }))}>
                  {TIPOS_META.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField select fullWidth size="small" label="Estado" value={filtros.status}
                  onChange={(e) => setFiltros((f) => ({ ...f, status: e.target.value }))}>
                  {ESTADOS.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </TextField>
              </Grid>
            </Grid>

            <Box sx={{ height: 520 }}>
              <DataGrid
                rows={metas}
                columns={columnas}
                loading={loading}
                rowCount={total}
                paginationMode="server"
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[10, 20, 50]}
                disableRowSelectionOnClick
                density="comfortable"
              />
            </Box>
          </Box>
        </BlankCard>
      </Box>
    </PageContainer>
  );
}
