"use client";
import { useRouter } from "next/navigation";
import { Box, Typography } from "@mui/material";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import BlankCard from "@/app/(DashboardLayout)/components/shared/BlankCard";
import PeriodoForm from "@/modules/metas/components/PeriodoForm";
import { crearPeriodo, type PeriodoPayload } from "@/modules/metas/services/metas.client";
import { notifyError, notifyInfo, notifySuccess } from "@/components/ui/toast/notify";

export default function NuevoPeriodoPage() {
  const router = useRouter();

  async function guardar(payload: PeriodoPayload) {
    try {
      const { period, warning } = await crearPeriodo(payload);
      notifySuccess("Periodo creado");
      if (warning) notifyInfo(warning.message);
      router.push(`/metas/periodos/${period.id}`);
    } catch (e) {
      notifyError(e instanceof Error ? e.message : "No se pudo crear el periodo");
    }
  }

  return (
    <PageContainer title="Crear periodo" description="Administra los rangos de fechas utilizados para medir las metas.">
      <Box>
        <Typography variant="h4" mb={3}>Crear periodo</Typography>
        <BlankCard>
          <Box p={3}>
            <PeriodoForm modo="crear" onCancelar={() => router.push("/metas/periodos")} onGuardar={guardar} />
          </Box>
        </BlankCard>
      </Box>
    </PageContainer>
  );
}
