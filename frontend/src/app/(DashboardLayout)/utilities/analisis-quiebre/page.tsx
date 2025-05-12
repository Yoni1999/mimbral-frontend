"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation"; // ✅ useSearchParams para leer la URL
import { Box, Typography } from "@mui/material";
import Image from "next/image";
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import QuiebresPorCategoria from './components/QuiebresPorCategoria';
import Header from './components/header';

const AnalisisQuiebrePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [hydrated, setHydrated] = useState(false); // 🔹 Estado de carga

  // 🔹 Estado de filtros
  const [filters, setFilters] = useState({
    fechaInicio: "",
    fechaFin: "",
    providerCode: "",
    providerName: "",
    filterType: "categoria",
    skuList: "",
  });

  // ✅ Restaurar los filtros desde la URL al cargar la página
  useEffect(() => {
    const providerFromURL = searchParams.get("proveedor");
    const filterTypeFromURL = searchParams.get("filterType");

    setFilters((prev) => ({
      ...prev,
      providerCode: providerFromURL || prev.providerCode,
      filterType: filterTypeFromURL || prev.filterType,
    }));
  }, [searchParams]);

  // 🔹 Simulación de carga antes de mostrar contenido
  useEffect(() => {
    const token = localStorage.getItem("token");
  
    if (!token) {
      router.push("/authentication/login"); // 🔐 Redirige si no hay token
    } else {
      setTimeout(() => {
        setHydrated(true); // ✅ Solo muestra si hay token
      }, 1500);
    }
  }, []);
  

  if (!hydrated) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          width: "100vw",
          position: "fixed",
          top: 0,
          left: 0,
          backgroundColor: "rgba(255, 255, 255, 0.9)", // 🔹 Fondo translúcido
        }}
      >
        {/* 🔹 Logo girando */}
        <Box
          sx={{
            animation: "spin 1.5s linear infinite",
            borderRadius: "50%",
            overflow: "hidden",
            width: "60px",
            height: "60px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
          }}
        >
          <Image src="/images/logos/logoitem.jpg" alt="Logo" width={60} height={60} priority />
        </Box>

        {/* 🔹 Texto de carga */}
        <Typography
          variant="h6"
          sx={{
            mt: 2,
            color: "#000",
            fontWeight: "bold",
          }}
        >
          Cargando datos...
        </Typography>

        {/* 🔹 Animación CSS */}
        <style jsx global>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </Box>
    );
  }

  // 🔹 Manejar el clic en una categoría para redirigir con `providerCode`
  const handleCategoriaClick = (categoriaId: string) => {
    const queryParams = new URLSearchParams();

    if (filters.providerCode) {
      queryParams.set("proveedor", filters.providerCode);
    }

    router.push(`/utilities/analisis-quiebre/subcategorias/${categoriaId}?${queryParams.toString()}`);
  };

  // 🔹 Manejar cambio de filtros en el `Header`
  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);

    const queryParams = new URLSearchParams();
    if (newFilters.providerCode) queryParams.set("proveedor", newFilters.providerCode);
    if (newFilters.filterType) queryParams.set("filterType", newFilters.filterType);
    if (newFilters.fechaInicio) queryParams.set("fechaInicio", newFilters.fechaInicio);
    if (newFilters.fechaFin) queryParams.set("fechaFin", newFilters.fechaFin);
    if (newFilters.skuList) queryParams.set("skuList", newFilters.skuList);

    if (newFilters.filterType === "producto") {
      router.push(`/utilities/analisis-quiebre-sku?${queryParams.toString()}`);
    } else {
      router.replace(`/utilities/analisis-quiebre?${queryParams.toString()}`);
    }
  };

  return (
    <PageContainer title="Análisis de Quiebre" description="Sección de análisis de quiebre">
      {/* ✅ `Header` maneja búsqueda y filtros */}
      <Header 
        onSearch={setSearchTerm} 
        onFilterChange={handleFilterChange} 
      />

      {/* ✅ `QuiebresPorCategoria` recibe `providerCode` para filtrar por proveedor */}
      <QuiebresPorCategoria 
        onCategoriaClick={handleCategoriaClick} 
        searchTerm={searchTerm} 
        selectedProveedor={filters.providerCode} 
      />
    </PageContainer>
  );
};

export default AnalisisQuiebrePage;
