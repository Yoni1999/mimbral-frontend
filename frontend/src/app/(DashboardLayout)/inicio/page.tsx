"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Grid, Box, Typography } from "@mui/material";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import {
  IconTrendingUp,
  IconChartBar,
  IconShoppingCart,
  IconBox,
  IconCategory,
  IconUsersGroup,
} from "@tabler/icons-react";
import MetricCard from "../components/dashboard/MetricCard";

const Dashboard = () => {
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/authentication/login");
    }
  }, [router]);

  if (!isClient) return null;

  return (
    <PageContainer title="Dashboard" description="this is Dashboard">
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Grid container spacing={2} justifyContent="center">
          <Grid item xs={12} sm={6} md={4}>
            <MetricCard
              title="Resumen Ventas"
              value="500K"
              description="Resumen de ventas totales"
              icon={<IconTrendingUp size={32} className="text-blue-600" />}
              onClick={() => router.push("/utilities/ventas/resumen-ventas")}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <MetricCard
              title="Ventas por Canal"
              value="300K"
              description="Análisis de ventas por canal comercial"
              icon={<IconChartBar size={32} className="text-green-600" />}
              onClick={() => router.push("/utilities/ventas/ventas-por-canal")}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} >
            <MetricCard
              title="Análisis Categorías"
              value="132 Categorías"
              description="Análisis de ventas por categoría"
              icon={<IconShoppingCart size={32} className="text-red-600" />}
              onClick={() =>
                router.push("/utilities/analisis-categoria/resumen-categorias")
              }
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} >
            <MetricCard
              title="Análisis Por Producto"
              value="200K"
              description="Análisis de inventario disponible"
              icon={<IconBox size={32} className="text-purple-600" />}
              onClick={() => router.push("/utilities/ventas/inventario")}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <MetricCard
              title="Análisis De Metas"
              value="250K"
              description="Análisis de ventas por categoría"
              icon={<IconCategory size={32} className="text-orange-600" />}
              onClick={() =>
                router.push("/utilities/ventas/ventas-por-categoria")
              }
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4} >
            <MetricCard
              title="Ventas por Vendedor"
              value="100K"
              description="Análisis de ventas por vendedor"
              icon={<IconUsersGroup size={32} className="text-teal-600" />}
              onClick={() =>
                router.push("/utilities/ventas/ventas-por-vendedor")
              }
            />
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default Dashboard;
