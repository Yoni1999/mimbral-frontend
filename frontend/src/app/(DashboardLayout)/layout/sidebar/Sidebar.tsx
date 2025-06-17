import {Box, Drawer } from "@mui/material";
import SidebarItems from "./SidebarItems";  // Importa SidebarItems
import { Sidebar } from "react-mui-sidebar";
import LogoMimbral from "@/app/(DashboardLayout)/layout/shared/logo/LogoMimbral";

interface ItemType {
  isMobileSidebarOpen: boolean;
  onSidebarClose: (event: React.MouseEvent<HTMLElement>) => void;
  isSidebarOpen: boolean;
}

const MSidebar = ({
  isMobileSidebarOpen,
  onSidebarClose,
  isSidebarOpen,
}: ItemType) => {
  const lgUp = false; // Forzar modo móvil en todas las pantallas
  //const lgUp = useMediaQuery((theme: any) => theme.breakpoints.up("lg"));

  const sidebarWidth = "260px";

  // Custom CSS for short scrollbar
  const scrollbarStyles = {
    "&::-webkit-scrollbar": {
      width: "7px",
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: "#eff2f7",
      borderRadius: "15px",
    },
  };

  if (lgUp) {
    return (
      <Box
        sx={{
          width: sidebarWidth,
          flexShrink: 0,
        }}
      >
        <Drawer
          anchor="left"
          open={isSidebarOpen}
          variant="permanent"
          PaperProps={{
            sx: {
              boxSizing: "border-box",
              ...scrollbarStyles,
            },
          }}
        >
          <Box
            sx={{
              height: "100%",
            }}
          >
            <Sidebar
              width={"270px"}
              collapsewidth="80px"
              open={isSidebarOpen}
              themeColor="#5d87ff"
              themeSecondaryColor="#49beff"
              showProfile={false}
            >
              <Box display="flex" alignItems="center" justifyContent="center" p={2}>
                <LogoMimbral />
              </Box>

              {/* Aquí envolvemos SidebarItems con el Box para asegurar que el zIndex se aplique */}
              <Box sx={{ position: 'relative', zIndex: 1000 }}>
                <SidebarItems />
              </Box>
            </Sidebar>
          </Box>
        </Drawer>
      </Box>
    );
  }

  return (
    <Drawer
      anchor="left"
      open={isMobileSidebarOpen}
      onClose={onSidebarClose}
      variant="temporary"
      PaperProps={{
        sx: {
          boxShadow: (theme) => theme.shadows[8],
          ...scrollbarStyles,
        },
      }}
    >
      <Box px={2}>
        <Sidebar
          width={"270px"}
          collapsewidth="80px"
          isCollapse={false}
          mode="light"
          direction="ltr"
          themeColor="#5d87ff"
          themeSecondaryColor="#49beff"
          showProfile={false}
        >
          <Box display="flex" alignItems="center" justifyContent="center" p={2}>
            <LogoMimbral />
          </Box>

          <Box sx={{ position: 'relative', zIndex: 1000 }}>
            <SidebarItems />
          </Box>
        </Sidebar>
      </Box>
    </Drawer>
  );
};

export default MSidebar;
