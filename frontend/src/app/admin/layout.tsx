"use client";
import { Box } from "@mui/material";
import AdminSidebar from "./opciones/components/AdminSidebar";
import AdminBreadcrumb from "./opciones/components/AdminBreadcrumb";
import Header from "@/app/(DashboardLayout)/layout/header/Header";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box display="flex" flexDirection="column" height="100vh">
      {/* 🔺 Header principal con prop requerida */}
      <Header toggleMobileSidebar={() => {}} />

      {/* 🔻 Contenido principal dividido */}
      <Box display="flex" flex={1}>
        <AdminSidebar />
        <Box flex={1}>
          <AdminBreadcrumb />
          <Box p={3} sx={{ backgroundColor: "#FEFEFE", minHeight: "100vh" }}>
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
