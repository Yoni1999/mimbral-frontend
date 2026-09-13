"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Typography } from "@mui/material";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import BlankCard from "@/app/(DashboardLayout)/components/shared/BlankCard";
import MetaWizard from "@/modules/metas/components/MetaWizard";
import { crearMeta } from "@/modules/metas/services/metas.client";
import type { GoalDraft } from "@/modules/metas/types";
import { notifyError, notifySuccess } from "@/components/ui/toast/notify";

export default function NuevaMetaPage() {
  const router = useRouter();
  const [creando, setCreando] = useState(false);

  async function crear(draft: GoalDraft) {
    setCreando(true);
    try {
      const goal = await crearMeta(draft);
      notifySuccess("Meta creada");
      router.push(`/metas/${goal.id}`);
    } catch (e) {
      notifyError(e instanceof Error ? e.message : "No se pudo crear la meta");
      throw e;
    } finally {
      setCreando(false);
    }
  }

  return (
    <PageContainer title="Nueva meta" description="Crea una meta comercial asignada a vendedores o canales de venta.">
      <Box>
        <Typography variant="h4" mb={3}>Crear meta</Typography>
        <BlankCard>
          <Box p={3}>
            <MetaWizard onCrear={crear} onCancelar={() => router.push("/metas/listado")} creando={creando} />
          </Box>
        </BlankCard>
      </Box>
    </PageContainer>
  );
}
