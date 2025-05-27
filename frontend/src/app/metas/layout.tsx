"use client";
import { Box } from "@mui/material";
import Header from "@/app/(DashboardLayout)/layout/header/Header";
import AdminBreadcrumb from "../admin/opciones/components/AdminBreadcrumb";
import MetasSidebar from "./components/MetasSidebar";

export default function MetasLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box display="flex" height="100vh" sx={{ bgcolor: '#FEFEFE', minHeight: '100vh' }}>
      {/* 🔹 Sidebar parte desde arriba */}
      <MetasSidebar />

      {/* 🔹 Contenido principal */}
      <Box flex={1} display="flex" flexDirection="column" height="100vh" overflow="hidden">
        <Header toggleMobileSidebar={() => {}} />
        <AdminBreadcrumb />
        <Box p={2} flex={1} overflow="auto">
          {children}
        </Box>
      </Box>
    </Box>
  );
}
