"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  Pagination,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CloseIcon from "@mui/icons-material/Close";
import ProductosVendidosTable from "./components/ProductosVendidos";
import HeaderVentasProductosDrawer from "./components/HeaderVentasProductosDrawer";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";

const limit = 20;

interface FiltrosVentas {
  canal?: string;
  periodo: string;
  fechaInicio?: string;
  fechaFin?: string;
}

const InformeVentaPage = () => {
  const [filters, setFilters] = useState<FiltrosVentas>({ periodo: "7D" });
  const [productos, setProductos] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showMensaje, setShowMensaje] = useState(true);

  const totalPages = Math.ceil(total / limit);

  const fetchProductos = async (filtros: FiltrosVentas, pageNumber = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const offset = (pageNumber - 1) * limit;

      Object.entries(filtros).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      params.append("offset", offset.toString());
      params.append("limit", limit.toString());

      const res = await fetchWithToken(`${BACKEND_URL}/api/productos-vendidos?${params}`);
      const data = await res!.json();

      setProductos(Array.isArray(data.data) ? data.data : []);
      setTotal(typeof data.total === "number" ? data.total : 0);
    } catch (error) {
      console.error("Error al cargar productos vendidos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: FiltrosVentas) => {
    setFilters(newFilters);
    setPage(1);
    fetchProductos(newFilters, 1);
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    fetchProductos(filters, value);
  };

  useEffect(() => {
    fetchProductos(filters, 1);
  }, []);

  return (
    <Box p={1}>
      <Typography
        variant="h4"
        fontWeight="bold"
        gutterBottom
        display="flex"
        alignItems="center"
      >
        <TrendingUpIcon sx={{ mr: 1 }} />
        Informe de Venta de productos
      </Typography>

      <Typography variant="body1" color="text.secondary" gutterBottom>
        Revisa el detalle de productos vendidos por período, canal, proveedor y más.
      </Typography>

      <HeaderVentasProductosDrawer
        onFilterChange={handleFilterChange}
        currentFilters={filters}
      />

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" mb={2}>
        Mostrando {productos.length} de {total} productos
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height={200}>
          <CircularProgress />
        </Box>
      ) : (
        <ProductosVendidosTable data={productos} />
      )}

      {totalPages > 1 && !loading && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            shape="rounded"
            siblingCount={1}
            boundaryCount={1}
          />
        </Box>
      )}

      <Snackbar
        open={showMensaje}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        autoHideDuration={null}
      >
        <Alert
          severity="info"
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
          sx={{ borderRadius: 2 }}
        >
          ℹ️ Este informe se actualiza a diario con la información de ventas más reciente.
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InformeVentaPage;
