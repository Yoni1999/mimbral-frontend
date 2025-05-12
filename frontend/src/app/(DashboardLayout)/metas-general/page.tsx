"use client";

import React, { useState } from "react";
import {
  Box,
  Snackbar,
  Alert,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import HeaderMetas, { MetaFilters } from "./components/HeaderMetas";
import TablaMetas from "./components/TableMetas";

export default function MetasPage() {
  const [filters, setFilters] = useState<MetaFilters>({
    periodo: "Ultimos 7 días",
    categoria: "",
    canal: "",
  });

  const [showMensaje, setShowMensaje] = useState(true);

  const handleFilterChange = (newFilters: MetaFilters) => {
    console.log("🎯 Nuevos filtros:", newFilters);
    setFilters(newFilters);
    // Aquí podrías hacer fetch de metas filtradas en el futuro
  };

  return (
    <PageContainer title="Metas" description="Sección de Metas">
      <Box sx={{ display: "flex", justifyContent: "center", px: 2, mt: 2 }}>
        <Box sx={{ width: "100%", maxWidth: "1400px" }}>
          {/* Header */}
          <HeaderMetas
            onFilterChange={handleFilterChange}
            initialFilters={filters}
          />

          {/* Tabla (estática por ahora) */}
          <TablaMetas />
        </Box>
      </Box>

      {/* Mensaje flotante en construcción */}
      <Snackbar
        open={showMensaje}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        autoHideDuration={null}
        sx={{ maxWidth: "400px" }}
      >
        <Alert
          severity="warning"
          variant="filled"
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setShowMensaje(false)}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
          sx={{
            display: "flex",
            alignItems: "center",
            p: 2,
            borderRadius: 2,
            fontSize: "0.9rem",
          }}
        >
          🚧 Aún estamos trabajando para que puedas ver las metas completas en
          esta sección. ¡Vuelve pronto!
        </Alert>
      </Snackbar>
    </PageContainer>
  );
}
