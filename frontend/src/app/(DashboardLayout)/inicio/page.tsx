"use client";
import { useState, useEffect, type ElementType } from "react";
import { useRouter } from "next/navigation";
import { alpha, keyframes } from "@mui/material/styles";
import { Box, Button, Card, CardContent, Chip, Grid, Skeleton, Stack, Typography } from "@mui/material";
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
import { BACKEND_URL } from "@/config";
import { formatUnidades, formatVentas } from "@/utils/format";
import { useApiDatos } from "@/utils/useCargaDatos";

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
    route: "/utilities/ventas/resumen-ventas",
    icon: IconTrendingUp,
    accent: "#2563eb",
    softAccent: "rgba(37, 99, 235, 0.10)",
  },
  {
    title: "Ventas por Canal",
    route: "/utilities/ventas/ventas-por-canal",
    icon: IconChartBar,
    accent: "#0f766e",
    softAccent: "rgba(15, 118, 110, 0.10)",
  },
  {
    title: "Análisis por categoría",
    route: "/utilities/analisis-categoria",
    icon: IconShoppingCart,
    accent: "#dc2626",
    softAccent: "rgba(220, 38, 38, 0.10)",
  },
  {
    title: "Análisis por producto",
    route: "/utilities/analisis-producto1.1",
    icon: IconBox,
    accent: "#7c3aed",
    softAccent: "rgba(124, 58, 237, 0.10)",
  },
  {
    title: "Administrador de Metas",
    route: "/metas",
    icon: IconCategory,
    accent: "#ea580c",
    softAccent: "rgba(234, 88, 12, 0.10)",
  },
  {
    title: "Ventas por Vendedor",
    route: "/utilities/ventas/ventas-por-vendedor",
    icon: IconUsersGroup,
    accent: "#0f766e",
    softAccent: "rgba(13, 148, 136, 0.10)",
  },
];


const NOMBRE_CANAL: Record<string, string> = {
  Empresas: "Empresas",
  Chorrillo: "Chorrillos",
  Balmaceda: "Balmaceda",
  Vitex: "Vtex",
  Meli: "Mercado Libre",
  Falabella: "Falabella",
};

// Cuentas de vendedor que en SAP representan un canal, no a una persona
// (mismas listas que las reglas de canal del back).
const CUENTAS_DE_CANAL = new Set([355, 398, 426, 364, 371, 401, 397]);

const aFecha = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const variacion = (pct: number | null | undefined) =>
  typeof pct === "number" ? `${pct > 0 ? "+" : ""}${pct.toFixed(1)}% vs período anterior` : "";

/** Datos reales del mes en curso para cada tarjeta del inicio. */
function useResumenInicio() {
  const hoy = new Date();
  const desde = aFecha(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  const hasta = aFecha(hoy);
  const mes = `fechaInicio=${desde}&fechaFin=${hasta}`;
  const api = (ruta: string) => `${BACKEND_URL}/api/${ruta}`;

  const ventas = useApiDatos<any>(api(`ventas-periodo?${mes}`), {});
  // ventas-canal solo respeta las fechas si no se le manda periodo.
  const canales = useApiDatos<any[]>(api(`ventas-canal?${mes}`), []);
  const categorias = useApiDatos<any[]>(api("resumen-categoria/mostrar-categorias"), []);
  const productos = useApiDatos<any>(api(`productos-distintos-periodo?${mes}`), {});
  const metas = useApiDatos<any>(api("goals/summary"), {});
  const vendedores = useApiDatos<any[]>(api(`top-vendedores?${mes}`), []);

  const fila = Array.isArray(canales.datos) ? canales.datos[0] : null;
  const [canalTop, ventaCanalTop] = fila
    ? (Object.entries(fila) as [string, number][]).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0] ?? []
    : [];
  // top-vendedores no viene ordenado por venta: se ordena antes de elegir.
  const vendedorTop = (Array.isArray(vendedores.datos) ? [...vendedores.datos] : [])
    .sort((a, b) => (b.TotalVentas ?? 0) - (a.TotalVentas ?? 0))
    .find((v) => !CUENTAS_DE_CANAL.has(Number(v.SlpCode)));
  const sinDato = "—";

  return {
    "Resumen Ventas": {
      cargando: ventas.cargando,
      value: ventas.error ? sinDato : formatVentas(ventas.datos.TotalVentasPeriodo ?? 0),
      description: ventas.error
        ? "No se pudo cargar la venta del mes"
        : `Venta neta del mes · ${variacion(ventas.datos.PorcentajeCambio)}`,
    },
    "Ventas por Canal": {
      cargando: canales.cargando,
      value: canalTop ? `${NOMBRE_CANAL[canalTop] || canalTop}` : sinDato,
      description: canalTop
        ? `Canal con más venta del mes: ${formatVentas(ventaCanalTop ?? 0)}`
        : "Sin ventas por canal en el mes",
    },
    "Análisis por categoría": {
      cargando: categorias.cargando,
      value: categorias.error ? sinDato : `${formatUnidades(categorias.datos.length)} Categorias`,
      description: "Análisis de ventas por categoría",
    },
    "Análisis por producto": {
      cargando: productos.cargando,
      value: productos.error ? sinDato : `${formatUnidades(productos.datos.ProductosPeriodoActual ?? 0)} SKU`,
      description: productos.error
        ? "No se pudo cargar los productos del mes"
        : `Vendidos en el mes · ${variacion(productos.datos.PorcentajeCambio)}`,
    },
    "Administrador de Metas": {
      cargando: metas.cargando,
      value: metas.error ? sinDato : `${formatUnidades(metas.datos.activeGoals ?? 0)} activas`,
      description: metas.datos.activePeriod?.name
        ? `Período activo: ${metas.datos.activePeriod.name}`
        : "Periodos, objetivos y cumplimiento por vendedor y canal",
    },
    "Ventas por Vendedor": {
      cargando: vendedores.cargando,
      value: vendedorTop ? formatVentas(vendedorTop.TotalVentas ?? 0) : sinDato,
      description: vendedorTop
        ? `Vendedor con más venta del mes: ${vendedorTop.Nombre}`
        : "Análisis de ventas por vendedor",
    },
  } as Record<string, { cargando: boolean; value: string; description: string }>;
}

function LauncherCard({
  title,
  value,
  description,
  cargando,
  route,
  icon: Icon,
  accent,
  softAccent,
  onClick,
}: {
  title: string;
  value: string;
  description: string;
  cargando: boolean;
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
        minHeight: { xs: 0, sm: 210 },
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
          // En celular la tarjeta es compacta: la tarjeta entera ya es el acceso.
          p: { xs: 2, sm: 3 },
          "&:last-child": { pb: { xs: 2, sm: 3 } },
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box
            sx={{
              width: { xs: 44, sm: 58 },
              height: { xs: 44, sm: 58 },
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
            label="Abrir módulo"
            size="small"
            sx={{
              display: { xs: "none", sm: "inline-flex" },
              backgroundColor: alpha(accent, 0.08),
              color: accent,
              fontWeight: 700,
              "& .MuiChip-icon": {
                color: accent,
              },
            }}
          />
        </Stack>

        <Box sx={{ mt: { xs: 1.25, sm: 2 } }}>
          <Typography variant="h6" fontWeight={800} color="#17315e" sx={{ lineHeight: 1.15 }}>
            {title}
          </Typography>
          <Typography variant="h4" fontWeight={900} sx={{ mt: { xs: 0.5, sm: 1 }, color: accent, fontSize: { xs: "1.6rem", sm: undefined } }}>
            {cargando ? <Skeleton width="60%" /> : value}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {cargando ? <Skeleton width="85%" /> : description}
          </Typography>
        </Box>

        <Box
          sx={{
            mt: 2.5,
            // En celular sobra: tocar la tarjeta ya entra al módulo.
            display: { xs: "none", sm: "flex" },
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
            Navegación rápida
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
  const resumen = useResumenInicio();

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
                <LauncherCard
                  {...item}
                  {...resumen[item.title]}
                  onClick={(route) => router.push(route)}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </PageContainer>
  );
};

export default Dashboard;
