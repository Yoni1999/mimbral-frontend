"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Box,
  Button,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { IconEye, IconPencil, IconBan, IconTrash, IconPlus } from "@tabler/icons-react";
import dayjs from "dayjs";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import BlankCard from "@/app/(DashboardLayout)/components/shared/BlankCard";
import EstadoChip from "@/modules/metas/components/EstadoChip";
import ConfirmarAccionModal from "@/modules/metas/components/ConfirmarAccionModal";
import { cancelarMeta, eliminarMeta, listarMetas, listarPeriodos } from "@/modules/metas/services/metas.client";
import type { Goal, GoalPeriod } from "@/modules/metas/types";
import { notifyError, notifySuccess } from "@/components/ui/toast/notify";

const TIPOS_RESPONSABLE = [{ value: "", label: "Todos" }, { value: "SELLER", label: "Vendedor" }, { value: "SALES_CHANNEL", label: "Canal de venta" }];
const TIPOS_META = [{ value: "", label: "Todas" }, { value: "SALES_AMOUNT", label: "Monto de venta" }, { value: "SKU_QUANTITY", label: "Cantidad SKU" }];
const MODOS = [{ value: "", label: "Todos" }, { value: "INDIVIDUAL", label: "Individual" }, { value: "SHARED", label: "Compartido" }, { value: "DISTRIBUTED", label: "Distribuido" }];
const ESTADOS = [{ value: "", label: "Todos" }, { value: "ACTIVE", label: "Activo" }, { value: "CANCELLED", label: "Cancelado" }];

const FILTROS_VACIOS = { search: "", periodId: "", targetType: "", goalType: "", assignmentMode: "", status: "" };

export default function ListadoMetasPage() {
  const [periodos, setPeriodos] = useState<GoalPeriod[]>([]);
  const [metas, setMetas] = useState<Goal[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [filtrosAplicados, setFiltrosAplicados] = useState(FILTROS_VACIOS);
  const [borrador, setBorrador] = useState(FILTROS_VACIOS);
  const [accion, setAccion] = useState<{ tipo: "cancel" | "delete"; meta: Goal } | null>(null);

  useEffect(() => {
    listarPeriodos({ pageSize: 100 }).then(({ items }) => setPeriodos(items)).catch(() => notifyError("No se pudieron cargar los periodos"));
  }, []);

  async function cargar() {
    setLoading(true);
    try {
      const { items, pagination } = await listarMetas({
        search: filtrosAplicados.search || undefined,
        periodId: filtrosAplicados.periodId || undefined,
        targetType: filtrosAplicados.targetType || undefined,
        goalType: filtrosAplicados.goalType || undefined,
        assignmentMode: filtrosAplicados.assignmentMode || undefined,
        status: filtrosAplicados.status || undefined,
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
      });
      setMetas(items);
      setTotal(pagination?.total ?? items.length);
    } catch {
      notifyError("No se pudieron cargar las metas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtrosAplicados, paginationModel]);

  async function confirmarAccion() {
    if (!accion) return;
    try {
      if (accion.tipo === "cancel") {
        await cancelarMeta(accion.meta.id);
        notifySuccess("Meta cancelada");
      } else {
        await eliminarMeta(accion.meta.id);
        notifySuccess("Meta eliminada");
      }
      setAccion(null);
      cargar();
    } catch (e) {
      notifyError(e instanceof Error ? e.message : "No se pudo completar la acción");
    }
  }

  const columnas: GridColDef<Goal>[] = useMemo(
    () => [
      { field: "name", headerName: "Nombre", flex: 1.2, renderCell: (p) => <Link href={`/metas/${p.row.id}`}>{p.value}</Link> },
      { field: "periodName", headerName: "Periodo", width: 150 },
      { field: "targetType", headerName: "Tipo responsable", width: 140, valueGetter: (v, row) => (row.targetType === "SELLER" ? "Vendedor" : row.targetType === "SALES_CHANNEL" ? "Canal" : "—") },
      { field: "targetNames", headerName: "Responsables", flex: 1, valueGetter: (v, row) => row.targetNames || "—" },
      { field: "goalType", headerName: "Tipo meta", width: 130, valueGetter: (v, row) => (row.goalType === "SALES_AMOUNT" ? "Monto" : "SKU") },
      { field: "assignmentMode", headerName: "Modo", width: 120, valueGetter: (v, row) => ({ INDIVIDUAL: "Individual", SHARED: "Compartido", DISTRIBUTED: "Distribuido" }[row.assignmentMode]) },
      {
        field: "targetAmount", headerName: "Objetivo", width: 130,
        valueGetter: (v, row) => row.goalType === "SALES_AMOUNT"
          ? new Intl.NumberFormat("es-CL", { style: "currency", currency: row.currencyCode || "CLP", maximumFractionDigits: 0 }).format(row.targetAmount || 0)
          : "—",
      },
      { field: "status", headerName: "Estado", width: 110, renderCell: (p) => <EstadoChip estado={p.value as string} /> },
      { field: "createdByUserName", headerName: "Creado por", width: 150, valueGetter: (v, row) => row.createdByUserName || row.createdByUserId },
      {
        field: "acciones", headerName: "Acciones", width: 140, sortable: false,
        renderCell: (p) => {
          const meta = p.row;
          return (
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Ver"><IconButton size="small" component={Link} href={`/metas/${meta.id}`}><IconEye size={18} /></IconButton></Tooltip>
              {meta.status === "ACTIVE" && (
                <>
                  <Tooltip title="Editar"><IconButton size="small" component={Link} href={`/metas/${meta.id}/editar`}><IconPencil size={18} /></IconButton></Tooltip>
                  <Tooltip title="Cancelar"><IconButton size="small" onClick={() => setAccion({ tipo: "cancel", meta })}><IconBan size={18} /></IconButton></Tooltip>
                </>
              )}
              <Tooltip title="Eliminar"><IconButton size="small" color="error" onClick={() => setAccion({ tipo: "delete", meta })}><IconTrash size={18} /></IconButton></Tooltip>
            </Stack>
          );
        },
      },
    ],
    []
  );

  return (
    <PageContainer title="Metas" description="Administra los objetivos comerciales asignados a vendedores y canales de venta.">
      <Box>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={2} mb={3}>
          <Box>
            <Typography variant="h4">Metas</Typography>
            <Typography color="text.secondary">Administra los objetivos comerciales asignados a vendedores y canales de venta.</Typography>
          </Box>
          <Button component={Link} href="/metas/nueva" variant="contained" startIcon={<IconPlus size={18} />}>Crear meta</Button>
        </Stack>

        <BlankCard>
          <Box p={2}>
            <Grid container spacing={2} mb={2} alignItems="center">
              <Grid item xs={12} sm={3}>
                <TextField fullWidth size="small" label="Buscar" value={borrador.search} onChange={(e) => setBorrador((f) => ({ ...f, search: e.target.value }))} />
              </Grid>
              <Grid item xs={6} sm={2}>
                <TextField select fullWidth size="small" label="Periodo" value={borrador.periodId} onChange={(e) => setBorrador((f) => ({ ...f, periodId: e.target.value }))}>
                  <MenuItem value="">Todos</MenuItem>
                  {periodos.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6} sm={2}>
                <TextField select fullWidth size="small" label="Tipo resp." value={borrador.targetType} onChange={(e) => setBorrador((f) => ({ ...f, targetType: e.target.value }))}>
                  {TIPOS_RESPONSABLE.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6} sm={2}>
                <TextField select fullWidth size="small" label="Tipo meta" value={borrador.goalType} onChange={(e) => setBorrador((f) => ({ ...f, goalType: e.target.value }))}>
                  {TIPOS_META.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6} sm={1.5}>
                <TextField select fullWidth size="small" label="Modo" value={borrador.assignmentMode} onChange={(e) => setBorrador((f) => ({ ...f, assignmentMode: e.target.value }))}>
                  {MODOS.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6} sm={1.5}>
                <TextField select fullWidth size="small" label="Estado" value={borrador.status} onChange={(e) => setBorrador((f) => ({ ...f, status: e.target.value }))}>
                  {ESTADOS.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <Stack direction="row" spacing={1}>
                  <Button variant="contained" onClick={() => { setPaginationModel((p) => ({ ...p, page: 0 })); setFiltrosAplicados(borrador); }}>Filtrar</Button>
                  <Button variant="text" onClick={() => { setBorrador(FILTROS_VACIOS); setFiltrosAplicados(FILTROS_VACIOS); }}>Limpiar</Button>
                </Stack>
              </Grid>
            </Grid>

            <Box sx={{ height: 560 }}>
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
              />
            </Box>
          </Box>
        </BlankCard>
      </Box>

      <ConfirmarAccionModal
        abierto={Boolean(accion)}
        titulo={accion?.tipo === "cancel" ? "Cancelar meta" : "Eliminar meta"}
        descripcion={accion?.tipo === "cancel" ? `Se cancelará "${accion.meta.name}".` : `Se eliminará "${accion?.meta.name}" permanentemente.`}
        onCancelar={() => setAccion(null)}
        onConfirmar={confirmarAccion}
        destructivo={accion?.tipo === "delete"}
      />
    </PageContainer>
  );
}
