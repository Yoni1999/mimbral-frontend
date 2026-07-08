"use client";
import { useState } from "react";
import { Box, Drawer } from "@mui/material";
import AdminSidebar from "./opciones/components/AdminSidebar";
import AdminBreadcrumb from "./opciones/components/AdminBreadcrumb";
import Header from "@/app/(DashboardLayout)/layout/header/Header";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      {/* 🔺 Header principal */}
      <Header toggleMobileSidebar={() => setMobileSidebarOpen(true)} />

      {/* 🔻 Contenido principal dividido */}
      <Box display="flex" flex={1}>
        {/* Sidebar fijo solo en pantallas medianas o mayores */}
        <Box sx={{ display: { xs: "none", md: "block" } }}>
          <AdminSidebar />
        </Box>

        {/* Sidebar móvil como drawer temporal */}
        <Drawer
          anchor="left"
          open={isMobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          variant="temporary"
          sx={{ display: { xs: "block", md: "none" } }}
        >
          <Box onClick={() => setMobileSidebarOpen(false)}>
            <AdminSidebar expanded />
          </Box>
        </Drawer>

        <Box flex={1} minWidth={0}>
          <AdminBreadcrumb />
          <Box p={{ xs: 1.5, md: 3 }} sx={{ backgroundColor: "#FEFEFE", minHeight: "100vh" }}>
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
