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
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { IconEye, IconPencil, IconLock, IconBan, IconTrash, IconPlus, IconCalendarStats } from "@tabler/icons-react";
import dayjs from "dayjs";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import BlankCard from "@/app/(DashboardLayout)/components/shared/BlankCard";
import EstadoChip from "@/modules/metas/components/EstadoChip";
import MetasPageHeader from "@/modules/metas/components/MetasPageHeader";
import ConfirmarAccionModal from "@/modules/metas/components/ConfirmarAccionModal";
import { cancelarPeriodo, cerrarPeriodo, eliminarPeriodo, listarPeriodos } from "@/modules/metas/services/metas.client";
import type { GoalPeriod, PeriodStatus } from "@/modules/metas/types";
import { notifyError, notifySuccess } from "@/components/ui/toast/notify";

const ESTADOS: { value: PeriodStatus | ""; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "DRAFT", label: "Borrador" },
  { value: "ACTIVE", label: "Activo" },
  { value: "CLOSED", label: "Cerrado" },
  { value: "CANCELLED", label: "Cancelado" },
];

export default function PeriodosPage() {
  const [periodos, setPeriodos] = useState<GoalPeriod[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [filtrosAplicados, setFiltrosAplicados] = useState({ search: "", startDate: "", endDate: "", status: "" });
  const [borrador, setBorrador] = useState(filtrosAplicados);
  const [accion, setAccion] = useState<{ tipo: "close" | "cancel" | "delete"; periodo: GoalPeriod } | null>(null);

  async function cargar() {
    setLoading(true);
    try {
      const { items, pagination } = await listarPeriodos({
        ...filtrosAplicados,
        status: filtrosAplicados.status || undefined,
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
      });
      setPeriodos(items);
      setTotal(pagination?.total ?? items.length);
    } catch {
      notifyError("No se pudieron cargar los periodos");
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
      if (accion.tipo === "close") {
        await cerrarPeriodo(accion.periodo.id);
        notifySuccess("Periodo cerrado");
      } else if (accion.tipo === "cancel") {
        await cancelarPeriodo(accion.periodo.id);
        notifySuccess("Periodo cancelado");
      } else {
        await eliminarPeriodo(accion.periodo.id);
        notifySuccess("Periodo eliminado");
      }
      setAccion(null);
      cargar();
    } catch (e) {
      notifyError(e instanceof Error ? e.message : "No se pudo completar la acción");
    }
  }

  const columnas: GridColDef<GoalPeriod>[] = useMemo(
    () => [
      { field: "name", headerName: "Nombre", flex: 1.2 },
      { field: "startDate", headerName: "Fecha inicio", width: 130, valueGetter: (v, row) => dayjs(row.startDate).format("DD-MM-YYYY") },
      { field: "endDate", headerName: "Fecha término", width: 130, valueGetter: (v, row) => dayjs(row.endDate).format("DD-MM-YYYY") },
      { field: "status", headerName: "Estado", width: 120, renderCell: (p) => <EstadoChip estado={p.value as string} /> },
      { field: "goalCount", headerName: "Metas", width: 90, align: "center", headerAlign: "center" },
      { field: "createdByUserName", headerName: "Creado por", width: 160, valueGetter: (v, row) => row.createdByUserName || row.createdByUserId },
      { field: "createdAt", headerName: "Fecha creación", width: 150, valueGetter: (v, row) => dayjs(row.createdAt).format("DD-MM-YYYY HH:mm") },
      {
        field: "acciones",
        headerName: "Acciones",
        width: 170,
        sortable: false,
        renderCell: (p) => {
          const periodo = p.row;
          return (
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Ver">
                <IconButton size="small" component={Link} href={`/metas/periodos/${periodo.id}`}><IconEye size={18} /></IconButton>
              </Tooltip>
              {(periodo.status === "DRAFT" || periodo.status === "ACTIVE") && (
                <Tooltip title="Editar">
                  <IconButton size="small" component={Link} href={`/metas/periodos/${periodo.id}/editar`}><IconPencil size={18} /></IconButton>
                </Tooltip>
              )}
              {periodo.status === "ACTIVE" && (
                <Tooltip title="Cerrar">
                  <IconButton size="small" onClick={() => setAccion({ tipo: "close", periodo })}><IconLock size={18} /></IconButton>
                </Tooltip>
              )}
              {periodo.status !== "CLOSED" && periodo.status !== "CANCELLED" && (
                <Tooltip title="Cancelar">
                  <IconButton size="small" onClick={() => setAccion({ tipo: "cancel", periodo })}><IconBan size={18} /></IconButton>
                </Tooltip>
              )}
              {(periodo.goalCount ?? 0) === 0 && (
                <Tooltip title="Eliminar">
                  <IconButton size="small" color="error" onClick={() => setAccion({ tipo: "delete", periodo })}><IconTrash size={18} /></IconButton>
                </Tooltip>
              )}
            </Stack>
          );
        },
      },
    ],
    []
  );

  return (
    <PageContainer title="Periodos" description="Administra los rangos de fechas utilizados para medir las metas.">
      <Box>
        <MetasPageHeader
          icon={<IconCalendarStats size={24} />}
          title="Periodos"
          description="Administra los rangos de fechas utilizados para medir las metas."
          action={
            <Button component={Link} href="/metas/periodos/nuevo" variant="contained" startIcon={<IconPlus size={18} />}>
              Crear periodo
            </Button>
          }
        />

        <BlankCard>
          <Box p={2}>
            <Grid container spacing={2} mb={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" label="Buscar" value={borrador.search}
                  onChange={(e) => setBorrador((f) => ({ ...f, search: e.target.value }))} />
              </Grid>
              <Grid item xs={6} sm={2}>
                <TextField fullWidth size="small" type="date" label="Fecha desde" InputLabelProps={{ shrink: true }} value={borrador.startDate}
                  onChange={(e) => setBorrador((f) => ({ ...f, startDate: e.target.value }))} />
              </Grid>
              <Grid item xs={6} sm={2}>
                <TextField fullWidth size="small" type="date" label="Fecha hasta" InputLabelProps={{ shrink: true }} value={borrador.endDate}
                  onChange={(e) => setBorrador((f) => ({ ...f, endDate: e.target.value }))} />
              </Grid>
              <Grid item xs={6} sm={2}>
                <TextField select fullWidth size="small" label="Estado" value={borrador.status}
                  onChange={(e) => setBorrador((f) => ({ ...f, status: e.target.value }))}>
                  {ESTADOS.map((e) => <MenuItem key={e.value} value={e.value}>{e.label}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={2}>
                <Stack direction="row" spacing={1}>
                  <Button variant="contained" fullWidth onClick={() => { setPaginationModel((p) => ({ ...p, page: 0 })); setFiltrosAplicados(borrador); }}>Filtrar</Button>
                  <Button variant="text" onClick={() => { const vacio = { search: "", startDate: "", endDate: "", status: "" }; setBorrador(vacio); setFiltrosAplicados(vacio); }}>Limpiar</Button>
                </Stack>
              </Grid>
            </Grid>

            <Box sx={{ height: 520 }}>
              <DataGrid
                rows={periodos}
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
        titulo={accion?.tipo === "close" ? "Cerrar periodo" : accion?.tipo === "cancel" ? "Cancelar periodo" : "Eliminar periodo"}
        descripcion={
          accion?.tipo === "close"
            ? `Se cerrará "${accion.periodo.name}". No podrán crearse nuevas metas en este periodo.`
            : accion?.tipo === "cancel"
              ? `Se cancelará "${accion.periodo.name}".`
              : `Se eliminará "${accion?.periodo.name}" permanentemente.`
        }
        onCancelar={() => setAccion(null)}
        onConfirmar={confirmarAccion}
        destructivo={accion?.tipo === "delete"}
      />
    </PageContainer>
  );
}
