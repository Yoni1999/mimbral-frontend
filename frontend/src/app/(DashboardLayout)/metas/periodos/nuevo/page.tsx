"use client";
import { useRouter } from "next/navigation";
import { Box } from "@mui/material";
import { IconCalendarStats } from "@tabler/icons-react";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import BlankCard from "@/app/(DashboardLayout)/components/shared/BlankCard";
import MetasPageHeader from "@/modules/metas/components/MetasPageHeader";
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
        <MetasPageHeader icon={<IconCalendarStats size={22} />} title="Crear periodo" description="Define el rango de fechas para medir las metas." />
        <BlankCard>
          <Box p={3}>
            <PeriodoForm modo="crear" onCancelar={() => router.push("/metas/periodos")} onGuardar={guardar} />
          </Box>
        </BlankCard>
      </Box>
    </PageContainer>
  );
}
