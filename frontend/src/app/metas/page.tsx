"use client";
import { useState } from "react";
import { Box, Typography } from "@mui/material";
import HeaderFiltrosMetas from "./components/HeaderFiltrosMetas";
import TablaMetasFiltradas from "./components/TablaMetasFiltradas";

// 🧠 Estado inicial para filtros
const filtrosIniciales = {
  canal: "",
  periodo: "",
  busqueda: "",
};

const PanelMetasPage = () => {
  const [filtros, setFiltros] = useState(filtrosIniciales);
  const [metas, setMetas] = useState([
    // Ejemplo de datos simulados
    {
      id: 1,
      sku: "SKU-001",
      nombre: "Meta Martillo",
      canal: "retail",
      metaAsignada: 100,
      metaAlcanzada: 80,
      fechaCreacion: "2025-04-01",
    },
    {
      id: 2,
      sku: "SKU-002",
      nombre: "Meta Taladro",
      canal: "online",
      metaAsignada: 150,
      metaAlcanzada: 150,
      fechaCreacion: "2025-03-28",
    },
  ]);

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" mb={2}>
        Administración de Metas
      </Typography>

      {/* 🔍 Filtros */}
      <HeaderFiltrosMetas filtros={filtros} setFiltros={setFiltros} />

      {/* 📊 Tabla */}
      <TablaMetasFiltradas filtros={filtros} metas={metas} />
    </Box>
  );
};

export default PanelMetasPage;
