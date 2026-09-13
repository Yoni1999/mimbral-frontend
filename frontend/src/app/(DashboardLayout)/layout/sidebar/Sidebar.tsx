"use client";
import { useState } from "react";
import { Box, Drawer, useMediaQuery, useTheme } from "@mui/material";
import SidebarItems from "./SidebarItems";
import SidebarUserMenu from "./SidebarUserMenu";
import LogoMimbral from "@/app/(DashboardLayout)/layout/shared/logo/LogoMimbral";

interface ItemType {
  isMobileSidebarOpen: boolean;
  onSidebarClose: (event: React.MouseEvent<HTMLElement>) => void;
  isSidebarOpen: boolean;
}

const COLLAPSED_WIDTH = 80;
const EXPANDED_WIDTH = 260;

const scrollbarStyles = {
  "&::-webkit-scrollbar": { width: "7px" },
  "&::-webkit-scrollbar-thumb": { backgroundColor: "#eff2f7", borderRadius: "15px" },
};

const MSidebar = ({ isMobileSidebarOpen, onSidebarClose }: ItemType) => {
  const theme = useTheme();
  // Riel angosto de iconos, siempre visible, igual que FrontOms -antes esto
  // estaba fijado a "false" a proposito ("modo movil siempre"), asi que el
  // sidebar de escritorio nunca se veia.
  const lgUp = useMediaQuery(theme.breakpoints.up("lg"));
  const [hovered, setHovered] = useState(false);

  if (lgUp) {
    const collapsed = !hovered;
    return (
      // Reserva SIEMPRE el ancho angosto en el flujo de la pagina: al
      // expandirse con el hover, el riel se superpone al contenido en vez de
      // correrlo, para que las tablas de abajo no salten de ancho cada vez
      // que el mouse pasa por el borde.
      <Box sx={{ width: COLLAPSED_WIDTH, flexShrink: 0 }}>
        <Box
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          sx={{
            // `fixed` (no `absolute`): absolute lo anclaba al contenedor de la
            // pagina, que se desplaza con el scroll -el sidebar entero subia
            // con el resto del contenido en paginas largas. Fixed lo ancla a
            // la ventana, que es lo que un riel de navegacion tiene que hacer.
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 1200,
            height: "100vh",
            width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
            bgcolor: "background.paper",
            borderRight: "1px solid",
            borderColor: "divider",
            boxShadow: collapsed ? "none" : theme.shadows[8],
            transition: "width 150ms ease",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="center" p={2} flexShrink={0}>
            <LogoMimbral width={collapsed ? 36 : 150} />
          </Box>

          <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden", ...scrollbarStyles }}>
            <SidebarItems collapsed={collapsed} />
          </Box>

          <Box flexShrink={0} sx={{ borderTop: "1px solid", borderColor: "divider" }}>
            <SidebarUserMenu collapsed={collapsed} />
          </Box>
        </Box>
      </Box>
    );
  }

  // Mobile / pantallas chicas: drawer temporal de siempre, expandido (con
  // rotulos) porque ahi no hay hover que lo abra.
  return (
    <Drawer
      anchor="left"
      open={isMobileSidebarOpen}
      onClose={onSidebarClose}
      variant="temporary"
      PaperProps={{
        sx: {
          width: EXPANDED_WIDTH,
          boxShadow: (theme) => theme.shadows[8],
          display: "flex",
          flexDirection: "column",
          ...scrollbarStyles,
        },
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="center" p={2} flexShrink={0}>
        <LogoMimbral />
      </Box>
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        <SidebarItems />
      </Box>
      <Box flexShrink={0} sx={{ borderTop: "1px solid", borderColor: "divider" }}>
        <SidebarUserMenu collapsed={false} />
      </Box>
    </Drawer>
  );
};

export default MSidebar;
