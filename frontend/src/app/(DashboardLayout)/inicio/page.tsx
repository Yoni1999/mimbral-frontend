"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Grid,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
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
  const [openModal, setOpenModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);

    // Verifica el token para redirección
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (!token) {
      router.push("/authentication/login");
    }

    // Solo muestra el modal si no se ha mostrado en esta sesión
    const modalMostrado = sessionStorage.getItem("modalMostrado");
    if (!modalMostrado) {
      setOpenModal(true);
      sessionStorage.setItem("modalMostrado", "true");
    }
  }, [router]);

  if (!isClient) return null;

  return (
    <PageContainer title="Dashboard" description="this is Dashboard">
      {/* MODAL: Nueva versión del software */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" component="div">
              🚀 ¡Nueva versión del software disponible!
            </Typography>
            <IconButton onClick={() => setOpenModal(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          <Typography variant="body1" gutterBottom>
            Hemos implementado mejoras clave en los siguientes informes:
          </Typography>

          <Box mb={2}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              📦 Informe de Productos Detenidos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ahora puedes obtener informes más precisos de productos detenidos para compras, con filtros por:
              <ul style={{ paddingLeft: "1.2rem", margin: 0 }}>
                <li>Período</li>
                <li>Rango de fecha</li>
                <li>Proveedor</li>
                <li>Categorías</li>
              </ul>
              Se incluyen productos <strong>activos</strong> y <strong>inactivos con stock</strong>.
            </Typography>
          </Box>

          <Box mb={2}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              📈 Informe de Ventas de Productos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              El informe de ventas permite visualizar los productos vendidos, con filtros por:
              <ul style={{ paddingLeft: "1.2rem", margin: 0 }}>
                <li>Canal de ventas</li>
                <li>Período</li>
                <li>Rango de fecha</li>
                <li>Proveedor</li>
                <li>Categorías</li>
              </ul>
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" mt={2}>
            Puedes cerrar este mensaje para continuar navegando en el dashboard.
          </Typography>
        </DialogContent>
      </Dialog>

      {/* Tarjetas del Dashboard */}
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
          <Grid item xs={12} sm={6} md={4}>
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
          <Grid item xs={12} sm={6} md={4}>
            <MetricCard
              title="Análisis Por Producto"
              value="200K"
              description="Análisa ventas por SKU"
              icon={<IconBox size={32} className="text-purple-600" />}
              onClick={() => router.push("/utilities/analisis-producto1.1")}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <MetricCard
              title="Monitorea las Metas"
              value="250K"
              description="Monitorea metas comerciales"
              icon={<IconCategory size={32} className="text-orange-600" />}
              onClick={() => router.push("/metas-general")}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
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
