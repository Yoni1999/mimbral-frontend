"use client";
import { styled, Container, Box } from "@mui/material";
import React, { useState } from "react";
import Header from "@/app/(DashboardLayout)/layout/header/Header";
import Sidebar from "@/app/(DashboardLayout)/layout/sidebar/Sidebar";
import AdminBreadcrumb from "@/app/admin/opciones/components/AdminBreadcrumb";

import { useVerificarExpiracionToken } from "@/hooks/useVerificarExpiracionToke";
import { ModalRenovarSesion } from "@/components/ModalRenovarSesion";
import { renovarSesion } from "@/utils/renovarSesion";

const MainWrapper = styled("div")(() => ({
  display: "flex",
  minHeight: "100vh",
  width: "100%",
}));

const PageWrapper = styled("div")(() => ({
  display: "flex",
  flexGrow: 1,
  flexDirection: "column",
  zIndex: 1,
  backgroundColor: "#FEFEFE",
}));

interface Props {
  children: React.ReactNode;
}

export default function RootLayout({ children }: Props) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const { mostrarModal, cerrarModal } = useVerificarExpiracionToken();


  const handleRenovar = async (password: string): Promise<boolean> => {
    const exito = await renovarSesion(password);
    if (exito) {
      cerrarModal();
      window.location.reload(); // opcional
      return true;
    }
    return false;
  };

  return (
    <MainWrapper className="mainwrapper">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        isMobileSidebarOpen={isMobileSidebarOpen}
        onSidebarClose={() => setMobileSidebarOpen(false)}
      />

      <PageWrapper className="page-wrapper">
        <Header toggleMobileSidebar={() => setMobileSidebarOpen(true)} />
        <AdminBreadcrumb />

        <Container
          disableGutters
          maxWidth={false}
          sx={{ paddingTop: "20px", px: { xs: 2, md: 4, xl: 6 } }}
        >
          <Box sx={{ minHeight: "calc(100vh - 170px)" }}>{children}</Box>
        </Container>
      </PageWrapper>

      {mostrarModal && (
        <ModalRenovarSesion
          onRenovar={handleRenovar}
          onCancelar={cerrarModal}
        />
      )}
    </MainWrapper>
  );
}
