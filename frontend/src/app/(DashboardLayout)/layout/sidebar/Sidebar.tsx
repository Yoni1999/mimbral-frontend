"use client";
import { Box, Drawer, useMediaQuery, useTheme } from "@mui/material";
import SidebarItems from "./SidebarItems";
import SidebarUserMenu from "./SidebarUserMenu";
import RailSidebar from "./RailSidebar";
import LogoMimbral from "@/app/(DashboardLayout)/layout/shared/logo/LogoMimbral";

interface ItemType {
  isMobileSidebarOpen: boolean;
  onSidebarClose: (event: React.MouseEvent<HTMLElement>) => void;
  isSidebarOpen: boolean;
}

const EXPANDED_WIDTH = 260;

const scrollbarStyles = {
  "&::-webkit-scrollbar": { width: "7px" },
  "&::-webkit-scrollbar-thumb": { backgroundColor: "#eff2f7", borderRadius: "15px" },
};

const MSidebar = ({ isMobileSidebarOpen, onSidebarClose }: ItemType) => {
  const theme = useTheme();
  const lgUp = useMediaQuery(theme.breakpoints.up("lg"));

  // Escritorio: rail de módulos como el de FrontOms (ver RailSidebar).
  if (lgUp) return <RailSidebar />;

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
