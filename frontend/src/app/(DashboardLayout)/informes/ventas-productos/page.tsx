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

const limit = 100;

interface FiltrosVentas {
  canal?: string;
  periodo: string;
  fechaInicio?: string;
  fechaFin?: string;
  proveedor?: string;
  primerNivel?: string;
  categoria?: string;
  subcategoria?: string;
}

type Order = "asc" | "desc";
type OrderBy =
  | "cantidadVendida"
  | "margenPorcentaje"
  | "margenBruto"
  | "precioPromedio"
  | "totalVentas"
  | "facturasUnicas";

const InformeVentaPage = () => {
  const [filters, setFilters] = useState<FiltrosVentas>({ periodo: "1D", canal: "Vitex" });
  const [productos, setProductos] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showMensaje, setShowMensaje] = useState(true);
  const [orden, setOrden] = useState<Order>("desc");
  const [ordenPor, setOrdenPor] = useState<OrderBy>("cantidadVendida");

  const totalPages = Math.ceil(total / limit);

  const fetchProductos = async (
    filtros: FiltrosVentas,
    pageNumber = 1,
    campoOrden: OrderBy = ordenPor,
    direccionOrden: Order = orden
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const offset = (pageNumber - 1) * limit;

      Object.entries(filtros).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      params.append("offset", offset.toString());
      params.append("limit", limit.toString());
      params.append("orderBy", campoOrden);
      params.append("order", direccionOrden);

      const res = await fetchWithToken(`${BACKEND_URL}/api/obtener-productos-detallado?${params}`);
      const data = await res!.json();

      setProductos(Array.isArray(data.data) ? data.data : []);
      setTotal(typeof data.total === "number" ? data.total : 0);
    } catch (error) {
      console.error("Error al cargar productos vendidos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (campo: OrderBy) => {
    const nuevoOrden = ordenPor === campo && orden === "asc" ? "desc" : "asc";
    setOrden(nuevoOrden);
    setOrdenPor(campo);
    fetchProductos(filters, page, campo, nuevoOrden);
  };

  const exportarTodosLosProductos = async () => {
    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      params.append("sinPaginacion", "true");
      params.append("orderBy", ordenPor);
      params.append("order", orden);

      const res = await fetchWithToken(`${BACKEND_URL}/api/obtener-productos-detallado?${params}`);
      const data = await res!.json();

      if (Array.isArray(data.data)) {
        exportToExcel(data.data);
      }
    } catch (error) {
      console.error("Error al exportar productos:", error);
    }
  };

  const exportToExcel = (productosData: any[]) => {
    import("xlsx").then((xlsx) => {
      const worksheet = xlsx.utils.json_to_sheet(productosData);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, "Productos");
      xlsx.writeFile(workbook, "informe_venta_productos.xlsx");
    });
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

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle2">
          {total === 0 ? (
            "Sin productos para mostrar"
          ) : (
            <>
              Mostrando del <strong>{(page - 1) * limit + 1}</strong> al{" "}
              <strong>{Math.min(page * limit, total)}</strong> de{" "}
              <strong>{total}</strong> productos
            </>
          )}
        </Typography>

        <button
          onClick={exportarTodosLosProductos}
          style={{
            padding: "8px 16px",
            backgroundColor: "#1976d2",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Exportar Informe a Excel
        </button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height={200}>
          <CircularProgress />
        </Box>
      ) : (
        <ProductosVendidosTable
          data={productos}
          onSortChange={handleSortChange}
          ordenActual={orden}
          ordenPorActual={ordenPor}
        />
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
          Este informe se actualiza a diario con la información de ventas más reciente. Si necesitas
          información más actualizada, pide al usuario ADMIN que actualice la información.
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InformeVentaPage;
