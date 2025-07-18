"use client";

import React, { useState } from "react";
import { Box } from "@mui/material";
import HeaderLineaCredito from "./components/TituloLineaCredito";
import HeaderDrawerCredito from "./components/HeaderDrawerCredito";
import TablaLineaCredito from "./components/TablaLineaCredito";

const LineaCreditoPage = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filters, setFilters] = useState({});

  const handleOpenDrawer = () => {
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
  };

  const handleApplyFilters = (appliedFilters: any) => {
    setFilters(appliedFilters);
    console.log("📊 Filtros aplicados:", appliedFilters);
  };

  const obtenerDescripcionPeriodo = () => {
    return "Statics";
  };

  return (
    <Box p={2}>
      <HeaderLineaCredito
        obtenerDescripcionPeriodo={obtenerDescripcionPeriodo}
        handleOpenDrawer={handleOpenDrawer}
      />

      <HeaderDrawerCredito
        open={drawerOpen}
        onClose={handleCloseDrawer}
        onApply={handleApplyFilters}
      />

      <TablaLineaCredito filters={filters} />
    </Box>
  );
};

export default LineaCreditoPage;
