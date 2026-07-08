"use client";
import { useState } from "react";
import { Box, Drawer } from "@mui/material";
import Header from "@/app/(DashboardLayout)/layout/header/Header";
import AdminBreadcrumb from "../admin/opciones/components/AdminBreadcrumb";
import MetasSidebar from "./components/MetasSidebar";

export default function MetasLayout({ children }: { children: React.ReactNode }) {
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <Box display="flex" height="100vh" sx={{ bgcolor: "#FEFEFE", minHeight: "100vh" }}>
      {/* 🔹 Sidebar fijo solo en pantallas medianas o mayores */}
      <Box sx={{ display: { xs: "none", md: "block" } }}>
        <MetasSidebar />
      </Box>

      {/* 🔹 Sidebar móvil como drawer temporal */}
      <Drawer
        anchor="left"
        open={isMobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        variant="temporary"
        sx={{ display: { xs: "block", md: "none" } }}
      >
        <Box onClick={() => setMobileSidebarOpen(false)} height="100%">
          <MetasSidebar expanded />
        </Box>
      </Drawer>

      {/* 🔹 Contenido principal */}
      <Box flex={1} minWidth={0} display="flex" flexDirection="column" height="100vh" overflow="hidden">
        <Header toggleMobileSidebar={() => setMobileSidebarOpen(true)} />
        <AdminBreadcrumb />
        <Box p={{ xs: 1.5, md: 2 }} flex={1} overflow="auto">
          {children}
        </Box>
      </Box>
    </Box>
  );
}
