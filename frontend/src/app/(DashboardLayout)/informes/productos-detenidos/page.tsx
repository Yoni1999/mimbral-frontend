'use client';

import React, { useState, useEffect } from "react";
import {
  Box, Typography, Divider, Snackbar, Alert, IconButton,
  Pagination, CircularProgress, Button
} from "@mui/material";
import { TrendingDown, Close as CloseIcon } from "@mui/icons-material";
import ProductosEstancadosTable from "./components/ProductosEstancadosTable";
import HeaderProductosDetenidos from "./components/HeaderProductosDetenidos";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";
import CustomTabs from "../components/CustomTabs";
import * as XLSX from "xlsx";

const limit = 20;

interface FiltroProductos {
  periodo?: string;
  fechaInicio?: string;
  fechaFin?: string;
  primerNivel?: string;
  categoria?: string;
  subcategoria?: string;
  proveedor?: string;
}

interface ProductoEstancado {
  SKU: string;
  Producto: string;
  PrimerNivel: string | null;
  Categoria: string | null;
  Subcategoria: string | null;
  UltimaVenta: string | null;
  UltimaFechaCompra: string | null;
  DiasSinVenta: number;
  Stock: number;
  Imagen: string | null;
  CostoPromedioUlt3Compras: number;
  MargenPorcentaje: number;
}

const ProductosDetenidosPage = () => {
  const [filters, setFilters] = useState<FiltroProductos>({});
  const [productos, setProductos] = useState<ProductoEstancado[]>([]);
  const [stockInactivos, setStockInactivos] = useState<ProductoEstancado[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingInactivos, setLoadingInactivos] = useState<boolean>(false);
  const [showMensaje, setShowMensaje] = useState<boolean>(true);

  const totalPages = Math.ceil(total / limit);

  const fetchProductos = async (filtros: FiltroProductos, pageNumber = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const offset = (pageNumber - 1) * limit;

      Object.entries(filtros).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      params.append("offset", offset.toString());
      params.append("limit", limit.toString());

      const res = await fetchWithToken(`${BACKEND_URL}/api/productos-detenidos?${params}`);
      const data = await res!.json();

      setProductos(Array.isArray(data.data) ? data.data : []);
      setTotal(typeof data.total === "number" ? data.total : 0);
    } catch (error) {
      console.error("Error al cargar productos detenidos:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockInactivos = async (filtros: FiltroProductos = {}) => {
    setLoadingInactivos(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const res = await fetchWithToken(`${BACKEND_URL}/api/stock-detenido-ventas?${params}`);
      const data = await res!.json();

      const adaptados: ProductoEstancado[] = data.data.map((item: any) => ({
        SKU: item.ItemCode,
        Producto: item.ItemName,
        PrimerNivel: item.NombrePrimerNivel,
        Categoria: item.NombreCategoria,
        Subcategoria: item.NombreSubcategoria,
        UltimaVenta: item.FechaUltimaVenta,
        UltimaFechaCompra: item.FechaUltimaCompra,
        DiasSinVenta: item.DiasSinVentas,
        Stock: item.StockDisponible,
        Imagen: item.U_Imagen,
        CostoPromedioUlt3Compras: item.CostoPromedio,
        MargenPorcentaje: item.PorcentajeMargen,
      }));

      setStockInactivos(adaptados);
    } catch (error) {
      console.error("Error al cargar productos inactivos con stock:", error);
    } finally {
      setLoadingInactivos(false);
    }
  };

  const exportarExcelActivos = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      params.append("sinPaginacion", "true");

      const res = await fetchWithToken(`${BACKEND_URL}/api/productos-detenidos?${params}`);
      const data = await res!.json();

      const worksheet = XLSX.utils.json_to_sheet(data.data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Activos");
      XLSX.writeFile(workbook, "productos_detenidos_activos.xlsx");
    } catch (err) {
      console.error("Error al exportar activos:", err);
    }
  };

  const exportarExcelInactivos = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      params.append("sinPaginacion", "true");

      const res = await fetchWithToken(`${BACKEND_URL}/api/stock-detenido-ventas?${params}`);
      const data = await res!.json();

      const worksheet = XLSX.utils.json_to_sheet(data.data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Inactivos");
      XLSX.writeFile(workbook, "productos_detenidos_inactivos.xlsx");
    } catch (err) {
      console.error("Error al exportar inactivos:", err);
    }
  };

  const handleFilterChange = (newFilters: FiltroProductos) => {
    setFilters(newFilters);
    setPage(1);
    fetchProductos(newFilters, 1);
    fetchStockInactivos(newFilters);
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    fetchProductos(filters, value);
  };

  useEffect(() => {
    fetchProductos(filters, 1);
    fetchStockInactivos(filters);
  }, [filters]);

  return (
    <Box p={0}>
      <CustomTabs
        tabLabels={["Activos para compras", "Inactivos para compra con stock"]}
        tabContents={[
          <React.Fragment key="tab-activos">
            <Typography variant="h4" fontWeight="bold" gutterBottom display="flex" alignItems="center">
              <TrendingDown sx={{ mr: 1 }} />
              Informe de Productos Detenidos Activos para compras
            </Typography>

            <Typography variant="body1" color="text.secondary" gutterBottom>
              Este reporte muestra los productos que no han tenido ventas desde hace varios días, con información detallada sobre inventario y margen.
            </Typography>

            <HeaderProductosDetenidos onFilterChange={handleFilterChange} />
            <Divider sx={{ my: 3 }} />

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle2">
                Mostrando {productos.length} de {total} productos
              </Typography>
              <Button variant="outlined" onClick={exportarExcelActivos}>
                Exportar Excel
              </Button>
            </Box>

            {loading ? (
              <Box display="flex" flexDirection="column" alignItems="center" height={200} justifyContent="center">
                <CircularProgress />
                <Typography mt={2} variant="body2" color="text.secondary">Cargando productos...</Typography>
              </Box>
            ) : (
              <ProductosEstancadosTable data={productos} />
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
          </React.Fragment>,

          <React.Fragment key="tab-inactivos">
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Inactivos para compra con stock
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={2}>
              Productos que tienen stock disponible, pero están desactivados para compras y no tienen ventas recientes.
            </Typography>

            <HeaderProductosDetenidos onFilterChange={handleFilterChange} />
            <Divider sx={{ my: 3 }} />

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle2">
                Mostrando {stockInactivos.length} productos
              </Typography>
              <Button variant="outlined" onClick={exportarExcelInactivos}>
                Exportar Excel
              </Button>
            </Box>

            {loadingInactivos ? (
              <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                <CircularProgress />
                <Typography ml={2} variant="body2" color="text.secondary">Cargando productos detenidos…</Typography>
              </Box>
            ) : (
              <ProductosEstancadosTable data={stockInactivos} />
            )}
          </React.Fragment>,
        ]}
      />

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
          Este informe de productos detenidos se actualiza a diario, ¡si necesitas información más reciente pide al usuario ADMIN que actualice la información!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProductosDetenidosPage;
