"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Box, CircularProgress, Typography } from "@mui/material";
import { IconPencil } from "@tabler/icons-react";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import BlankCard from "@/app/(DashboardLayout)/components/shared/BlankCard";
import MetasPageHeader from "@/modules/metas/components/MetasPageHeader";
import PeriodoForm from "@/modules/metas/components/PeriodoForm";
import { editarPeriodo, obtenerPeriodo, type PeriodoPayload } from "@/modules/metas/services/metas.client";
import type { GoalPeriod } from "@/modules/metas/types";
import { notifyError, notifyInfo, notifySuccess } from "@/components/ui/toast/notify";

export default function EditarPeriodoPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [periodo, setPeriodo] = useState<GoalPeriod | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    obtenerPeriodo(params.id)
      .then(setPeriodo)
      .catch(() => notifyError("No se pudo cargar el periodo"))
      .finally(() => setLoading(false));
  }, [params.id]);

  async function guardar(payload: PeriodoPayload) {
    try {
      const { period, warning } = await editarPeriodo(params.id, payload);
      notifySuccess("Periodo actualizado");
      if (warning) notifyInfo(warning.message);
      router.push(`/metas/periodos/${period.id}`);
    } catch (e) {
      notifyError(e instanceof Error ? e.message : "No se pudo editar el periodo");
    }
  }

  return (
    <PageContainer title="Editar periodo" description="Administra los rangos de fechas utilizados para medir las metas.">
      <Box>
        <MetasPageHeader icon={<IconPencil size={22} />} title="Editar periodo" description={periodo?.name} />
        {loading ? (
          <CircularProgress />
        ) : periodo ? (
          <BlankCard>
            <Box p={3}>
              <PeriodoForm
                modo="editar"
                valoresIniciales={periodo}
                onCancelar={() => router.push(`/metas/periodos/${params.id}`)}
                onGuardar={guardar}
                advertenciaMetasAsociadas={
                  (periodo.goalCount ?? 0) > 0
                    ? `Este periodo tiene ${periodo.goalCount} meta(s) asociada(s): cambiar sus fechas puede afectar su cumplimiento.`
                    : null
                }
              />
            </Box>
          </BlankCard>
        ) : (
          <Typography color="text.secondary">El periodo no existe.</Typography>
        )}
      </Box>
    </PageContainer>
  );
}
