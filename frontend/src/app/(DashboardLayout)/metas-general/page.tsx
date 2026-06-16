"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Snackbar,
  Alert,
  IconButton,
  Typography,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import HeaderMetas, { MetaFilters } from "./components/HeaderMetas";
import TablaMetas from "./components/TableMetas";
import { apiJson } from "@/utils/apiClient";
import { BACKEND_URL } from "@/config";

// 👇 Mapeo nombre → código
const canalSlpMap: Record<string, number> = {
  Mercado_Libre: 4,
  Chorrillo: 2,
  Balmaceda: 3,
  Empresas: 1,
  Vtex: 5,
  Falabella: 6,
};

export default function MetasPage() {
  const [filters, setFilters] = useState<MetaFilters>({
    periodo: "",
    categoria: "",
    canal: "",
  });

  const [tipoMeta, setTipoMeta] = useState<"sku" | "monto">("sku");
  const [metasData, setMetasData] = useState<any[]>([]);
  const [metasMontoData, setMetasMontoData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showMensaje, setShowMensaje] = useState(true);

  const handleFilterChange = (newFilters: MetaFilters) => {
    console.log("🎯 Nuevos filtros:", newFilters);
    setFilters(newFilters);
  };

  useEffect(() => {
    const fetchMetas = async () => {
      if (!filters.periodo || !filters.canal) return;

      const idCanal = canalSlpMap[filters.canal];
      if (!idCanal) {
        console.warn("⚠️ Canal no reconocido:", filters.canal);
        return;
      }

      const queryParams = new URLSearchParams();
      queryParams.append("idPeriodo", filters.periodo);
      queryParams.append("idCanal", idCanal.toString());

      if (filters.vendedor) queryParams.append("slpCodes", filters.vendedor);
      if (filters.categoria) queryParams.append("primerNivel", filters.categoria);
      if (filters.subcategoria) queryParams.append("categoria", filters.subcategoria);
      if (filters.subsubcategoria) queryParams.append("subcategoria", filters.subsubcategoria);

      const endpoint = tipoMeta === "sku" ? "views" : "monto";
      const fullURL = `${BACKEND_URL}/api/metas/${endpoint}?${queryParams.toString()}`;

      console.log("🔍 Query final enviado a la API:", fullURL);

      setLoading(true);
      try {
        const data = await apiJson<any[]>(fullURL);

        if (tipoMeta === "sku") {
          setMetasData(data);
          setMetasMontoData([]); // limpia en caso de cambio
        } else {
          setMetasMontoData(data);
          setMetasData([]); // limpia en caso de cambio
        }
      } catch (err) {
        console.error("❌ Error al obtener metas:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetas();
  }, [filters, tipoMeta]);

  return (
    <PageContainer title="Metas" description="Sección de Metas">
      <Box sx={{ display: "flex", justifyContent: "center", px: 0, mt: 0 }}>
        <Box sx={{ width: "100%" }}>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 2, pl: 2 }}>
            Metas creadas
          </Typography>

          <HeaderMetas onFilterChange={handleFilterChange} initialFilters={filters} />

          {loading ? (
            <Box display="flex" justifyContent="center" mt={4}>
              <CircularProgress />
            </Box>
          ) : (
            <TablaMetas
              data={metasData}
              dataMonto={metasMontoData}
              tipoMeta={tipoMeta}
              setTipoMeta={setTipoMeta}
            />
          )}
        </Box>
      </Box>

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
            p: 1.5,
            borderRadius: 3,
            fontSize: "0.9rem",
          }}
        >
          🚧 Aún estamos trabajando para que puedas ver las metas completas en esta sección. ¡Pero ya puedes ver las metas completas de Venta Empresas!
        </Alert>
      </Snackbar>
    </PageContainer>
  );
}
