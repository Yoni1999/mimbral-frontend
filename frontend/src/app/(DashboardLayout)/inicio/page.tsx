"use client";
import { useState, useEffect, type ElementType } from "react";
import { useRouter } from "next/navigation";
import { alpha, keyframes } from "@mui/material/styles";
import { Box, Button, Card, CardContent, Chip, Grid, Stack, Typography } from "@mui/material";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import {
  IconTrendingUp,
  IconChartBar,
  IconShoppingCart,
  IconBox,
  IconCategory,
  IconUsersGroup,
  IconArrowRight,
} from "@tabler/icons-react";

const floatIn = keyframes`
  0% {
    transform: translateY(10px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
`;

const launcherItems = [
  {
    title: "Resumen Ventas",
    value: "500K",
    description: "Resumen de ventas totales",
    route: "/utilities/ventas/resumen-ventas",
    icon: IconTrendingUp,
    accent: "#2563eb",
    softAccent: "rgba(37, 99, 235, 0.10)",
  },
  {
    title: "Ventas por Canal",
    value: "300K",
    description: "Analisis de ventas por canal comercial",
    route: "/utilities/ventas/ventas-por-canal",
    icon: IconChartBar,
    accent: "#0f766e",
    softAccent: "rgba(15, 118, 110, 0.10)",
  },
  {
    title: "Analisis Categorias",
    value: "132 Categorias",
    description: "Analisis de ventas por categoria",
    route: "/utilities/analisis-categoria/resumen-categorias",
    icon: IconShoppingCart,
    accent: "#dc2626",
    softAccent: "rgba(220, 38, 38, 0.10)",
  },
  {
    title: "Analisis Por Producto",
    value: "200K",
    description: "Analiza ventas por SKU",
    route: "/utilities/analisis-producto1.1",
    icon: IconBox,
    accent: "#7c3aed",
    softAccent: "rgba(124, 58, 237, 0.10)",
  },
  {
    title: "Administrador de Metas",
    value: "250K",
    description: "Periodos, objetivos y cumplimiento por vendedor y canal",
    route: "/metas",
    icon: IconCategory,
    accent: "#ea580c",
    softAccent: "rgba(234, 88, 12, 0.10)",
  },
  {
    title: "Ventas por Vendedor",
    value: "100K",
    description: "Analisis de ventas por vendedor",
    route: "/utilities/ventas/ventas-por-vendedor",
    icon: IconUsersGroup,
    accent: "#0f766e",
    softAccent: "rgba(13, 148, 136, 0.10)",
  },
];

function LauncherCard({
  title,
  value,
  description,
  route,
  icon: Icon,
  accent,
  softAccent,
  onClick,
}: {
  title: string;
  value: string;
  description: string;
  route: string;
  icon: ElementType;
  accent: string;
  softAccent: string;
  onClick: (route: string) => void;
}) {
  return (
    <Card
      onClick={() => onClick(route)}
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 4,
        border: "1px solid rgba(17, 38, 74, 0.08)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,251,255,0.92) 100%)",
        boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
        minHeight: 210,
        cursor: "pointer",
        transition: "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
        animation: `${floatIn} 500ms ease both`,
        "&:hover": {
          transform: "translateY(-6px)",
          boxShadow: "0 24px 50px rgba(15, 23, 42, 0.14)",
          borderColor: alpha(accent, 0.22),
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at top right, ${softAccent}, transparent 40%)`,
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${accent}, ${alpha(accent, 0.45)})`,
        }}
      />
      <CardContent
        sx={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          p: 3,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box
            sx={{
              width: 58,
              height: 58,
              borderRadius: 3,
              display: "grid",
              placeItems: "center",
              background: `linear-gradient(135deg, ${alpha(accent, 0.18)}, ${alpha(accent, 0.08)})`,
              color: accent,
              boxShadow: `0 10px 24px ${alpha(accent, 0.18)}`,
            }}
          >
            <Icon size={30} />
          </Box>
          <Chip
            label="Abrir modulo"
            size="small"
            sx={{
              backgroundColor: alpha(accent, 0.08),
              color: accent,
              fontWeight: 700,
              "& .MuiChip-icon": {
                color: accent,
              },
            }}
          />
        </Stack>

        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" fontWeight={800} color="#17315e" sx={{ lineHeight: 1.15 }}>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={900} sx={{ mt: 1, color: accent }}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {description}
          </Typography>
        </Box>

        <Box
          sx={{
            mt: 2.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
            Navegacion rapida
          </Typography>
          <Button
            size="small"
            endIcon={<IconArrowRight size={16} />}
            sx={{
              textTransform: "none",
              fontWeight: 800,
              color: accent,
              backgroundColor: alpha(accent, 0.06),
              borderRadius: 999,
              px: 1.5,
              "&:hover": {
                backgroundColor: alpha(accent, 0.12),
              },
            }}
          >
            Entrar
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

const Dashboard = () => {
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);

    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (!token) {
      router.push("/authentication/login");
    }
  }, [router]);

  if (!isClient) return null;

  return (
    <PageContainer title="Dashboard" description="this is Dashboard">
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          minHeight: "calc(100vh - 140px)",
          p: { xs: 2, md: 4 },
          // Transparente: hereda el gris de PageWrapper (layout.tsx) en vez de
          // pintar su propio blanco encima, que dejaba un panel blanco
          // recortado sobre el fondo gris del resto de la app.
          background: "transparent",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage:
              "linear-gradient(rgba(17, 38, 74, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(17, 38, 74, 0.03) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage: "linear-gradient(180deg, rgba(0,0,0,0.34), rgba(0,0,0,0))",
          }}
        />

        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Grid container spacing={2.5}>
            {launcherItems.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.title}>
                <LauncherCard {...item} onClick={(route) => router.push(route)} />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </PageContainer>
  );
};

export default Dashboard;
