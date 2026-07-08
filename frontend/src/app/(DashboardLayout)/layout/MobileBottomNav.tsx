"use client";
import { Paper, BottomNavigation, BottomNavigationAction } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import {
  IconLayoutDashboard,
  IconChartBar,
  IconBoxSeam,
  IconClipboardCheck,
  IconMenu2,
} from "@tabler/icons-react";

interface Props {
  onOpenMenu: () => void;
}

// Accesos directos a las secciones principales para uso con el pulgar en el celular.
const items = [
  { label: "Inicio", href: "/inicio", icon: IconLayoutDashboard },
  { label: "Ventas", href: "/utilities/ventas/resumen-ventas", icon: IconChartBar },
  { label: "Análisis", href: "/utilities/analisis-producto1.1", icon: IconBoxSeam },
  { label: "Informes", href: "/informes/ventas-productos", icon: IconClipboardCheck },
];

const MobileBottomNav = ({ onOpenMenu }: Props) => {
  const pathname = usePathname() ?? "";
  const router = useRouter();

  // Determina cuál acceso directo corresponde a la ruta actual.
  const activeValue = (() => {
    if (pathname.startsWith("/utilities/ventas")) return 1;
    if (pathname.startsWith("/utilities/analisis")) return 2;
    if (pathname.startsWith("/informes")) return 3;
    if (pathname.startsWith("/inicio")) return 0;
    return false as const;
  })();

  return (
    <Paper
      elevation={8}
      sx={{
        display: { xs: "block", md: "none" },
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        borderTop: "1px solid #e0e0e0",
        pb: "env(safe-area-inset-bottom)",
      }}
    >
      <BottomNavigation
        showLabels
        value={activeValue}
        sx={{
          height: 60,
          "& .MuiBottomNavigationAction-root": { minWidth: 0, px: 0.5 },
          "& .MuiBottomNavigationAction-label": { fontSize: "0.68rem" },
        }}
      >
        {items.map((item) => (
          <BottomNavigationAction
            key={item.href}
            label={item.label}
            icon={<item.icon size={22} />}
            onClick={() => router.push(item.href)}
          />
        ))}
        <BottomNavigationAction
          label="Menú"
          icon={<IconMenu2 size={22} />}
          onClick={onOpenMenu}
        />
      </BottomNavigation>
    </Paper>
  );
};

export default MobileBottomNav;
