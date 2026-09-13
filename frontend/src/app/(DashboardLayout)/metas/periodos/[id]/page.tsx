"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Box, Button, CircularProgress, Grid, Stack, Typography } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import dayjs from "dayjs";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import BlankCard from "@/app/(DashboardLayout)/components/shared/BlankCard";
import EstadoChip from "@/modules/metas/components/EstadoChip";
import { listarMetas, obtenerPeriodo } from "@/modules/metas/services/metas.client";
import type { Goal, GoalPeriod } from "@/modules/metas/types";
import { notifyError } from "@/components/ui/toast/notify";

function Dato({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography>{value ?? "—"}</Typography>
    </Box>
  );
}

export default function DetallePeriodoPage() {
  const params = useParams<{ id: string }>();
  const [periodo, setPeriodo] = useState<GoalPeriod | null>(null);
  const [metas, setMetas] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([obtenerPeriodo(params.id), listarMetas({ periodId: params.id, pageSize: 100 })])
      .then(([p, { items }]) => {
        setPeriodo(p);
        setMetas(items);
      })
      .catch(() => notifyError("No se pudo cargar el periodo"))
      .finally(() => setLoading(false));
  }, [params.id]);

  const columnas: GridColDef<Goal>[] = [
    { field: "name", headerName: "Meta", flex: 1.2, renderCell: (p) => <Link href={`/metas/${p.row.id}`}>{p.value}</Link> },
    { field: "targetNames", headerName: "Responsable(s)", flex: 1 },
    { field: "goalType", headerName: "Tipo", width: 130, valueGetter: (v, row) => (row.goalType === "SALES_AMOUNT" ? "Monto" : "SKU") },
    { field: "status", headerName: "Estado", width: 120, renderCell: (p) => <EstadoChip estado={p.value as string} /> },
  ];

  if (loading) return <PageContainer title="Periodo"><Box><CircularProgress /></Box></PageContainer>;
  if (!periodo) return <PageContainer title="Periodo"><Typography color="text.secondary">El periodo no existe.</Typography></PageContainer>;

  return (
    <PageContainer title={periodo.name} description="Detalle del periodo.">
      <Box>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={2} mb={3}>
          <Typography variant="h4">{periodo.name}</Typography>
          {(periodo.status === "DRAFT" || periodo.status === "ACTIVE") && (
            <Button component={Link} href={`/metas/periodos/${periodo.id}/editar`} variant="outlined">Editar</Button>
          )}
        </Stack>

        <BlankCard>
          <Box p={3}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}><Dato label="Estado" value={<EstadoChip estado={periodo.status} />} /></Grid>
              <Grid item xs={12} sm={6} md={3}><Dato label="Fecha inicio" value={dayjs(periodo.startDate).format("DD-MM-YYYY")} /></Grid>
              <Grid item xs={12} sm={6} md={3}><Dato label="Fecha término" value={dayjs(periodo.endDate).format("DD-MM-YYYY")} /></Grid>
              <Grid item xs={12} sm={6} md={3}><Dato label="Cantidad de metas" value={periodo.goalCount ?? metas.length} /></Grid>
              <Grid item xs={12} sm={6} md={3}><Dato label="Descripción" value={periodo.description} /></Grid>
              <Grid item xs={12} sm={6} md={3}><Dato label="Creado por" value={periodo.createdByUserName || periodo.createdByUserId} /></Grid>
              <Grid item xs={12} sm={6} md={3}><Dato label="Fecha creación" value={dayjs(periodo.createdAt).format("DD-MM-YYYY HH:mm")} /></Grid>
              {periodo.updatedAt && (
                <>
                  <Grid item xs={12} sm={6} md={3}><Dato label="Modificado por" value={periodo.updatedByUserName || periodo.updatedByUserId} /></Grid>
                  <Grid item xs={12} sm={6} md={3}><Dato label="Fecha modificación" value={dayjs(periodo.updatedAt).format("DD-MM-YYYY HH:mm")} /></Grid>
                </>
              )}
            </Grid>
          </Box>
        </BlankCard>

        <Typography variant="h5" mt={4} mb={2}>Metas de este periodo</Typography>
        <BlankCard>
          <Box sx={{ height: 420 }}>
            <DataGrid rows={metas} columns={columnas} disableRowSelectionOnClick hideFooter={metas.length <= 10} />
          </Box>
        </BlankCard>
      </Box>
    </PageContainer>
  );
}
