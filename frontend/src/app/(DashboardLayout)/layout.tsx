"use client";
import { styled, Container, Box } from "@mui/material";
import React, { useEffect, useState } from "react";
import Header from "@/app/(DashboardLayout)/layout/header/Header";
import Sidebar from "@/app/(DashboardLayout)/layout/sidebar/Sidebar";
import FloatingHelpAgent from "@/components/agent/FloatingHelpAgent";

const MainWrapper = styled("div")(() => ({
  display: "flex",
  minHeight: "100vh",
  width: "100%",
}));

// Mismo gris de fondo que usa FrontOms detras de sus tarjetas (su tema
// "Light", --page-bg: 240 5% 96% = #f4f4f5) — antes esto era casi blanco
// puro (#FEFEFE) y no distinguia el fondo de las tarjetas.
const PageWrapper = styled("div")(() => ({
  display: "flex",
  flexGrow: 1,
  flexDirection: "column",
  zIndex: 1,
  backgroundColor: "#f4f4f5",
  // Sin esto el contenedor se estira al ancho mínimo de su contenido y la
  // página entera se desplaza hacia el lado. Con "clip" lo que no cabe se
  // ajusta dentro de cada panel (no crea contenedor de scroll: los
  // encabezados fijos de las tablas siguen funcionando).
  minWidth: 0,
  overflowX: "clip",
}));

interface Props {
  children: React.ReactNode;
}

export default function RootLayout({ children }: Props) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  // Las vistas se dibujan solo en el navegador: leen lo que el usuario dejó
  // buscado (localStorage) al crearse, sin diferencias con el servidor.
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);

  return (
    <MainWrapper className="mainwrapper">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        isMobileSidebarOpen={isMobileSidebarOpen}
        onSidebarClose={() => setMobileSidebarOpen(false)}
      />

      <PageWrapper className="page-wrapper">
        <Header toggleMobileSidebar={() => setMobileSidebarOpen(true)} />

        <Container
          disableGutters
          maxWidth={false}
          sx={{ paddingTop: "20px", px: { xs: 2, md: 4, xl: 6 } }}
        >
          <Box sx={{ minHeight: "calc(100vh - 170px)" }}>{montado ? children : null}</Box>
        </Container>
      </PageWrapper>

      <FloatingHelpAgent />
    </MainWrapper>
  );
}
