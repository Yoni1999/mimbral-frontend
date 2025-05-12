"use client";

import { useRouter } from "next/navigation";
import { Box, Typography, Grid } from "@mui/material";
import {
  IconCamera,
  IconChartBar,
  IconUsersGroup,
  IconCategory,
  IconTrendingUp,
  IconShoppingCart,
  IconBox,
} from "@tabler/icons-react";
import MetricCard from "../datos-maestros/components/MetricCard";

export default function VentasPage() {
  const router = useRouter();

  return (
    <Box sx={{ p: 4, textAlign: "center" }}>
      <Typography variant="h5" fontWeight="bold" mb={2}>
        KPIs Análisis de Ventas
      </Typography>

      <Grid container spacing={2} justifyContent="center">
        <Grid item xs={12} sm={6}>
          <MetricCard
            title="Resumen Ventas"
            value="500K"
            description="Resumen de ventas totales"
            icon={<IconTrendingUp size={32} className="text-blue-600" />}
            onClick={() => router.push("/utilities/ventas/resumen-ventas")}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <MetricCard
            title="Ventas por Canal"
            value="300K"
            description="Análisis de ventas por canal comercial"
            icon={<IconChartBar size={32} className="text-green-600" />}
            onClick={() => router.push("/utilities/ventas/ventas-por-canal")}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <MetricCard
            title="Ventas por Temporada"
            value="150K"
            description="Análisis de ventas por temporada"
            icon={<IconShoppingCart size={32} className="text-red-600" />}
            onClick={() => router.push("/utilities/ventas/ventas-por-temporada")}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <MetricCard
            title="Ventas por Vendedor"
            value="100K"
            description="Análisis de ventas por vendedor"
            icon={<IconUsersGroup size={32} className="text-teal-600" />}
            onClick={() => router.push("/utilities/ventas/ventas-por-vendedor")}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
