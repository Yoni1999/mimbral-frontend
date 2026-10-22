'use client';

import React, { useEffect } from "react";
import {
  Box, Typography, Divider,
  Pagination, CircularProgress, Button
} from "@mui/material";
import { TrendingDown } from "@mui/icons-material";
import ProductosEstancadosTable from "./components/ProductosEstancadosTable";
import HeaderProductosDetenidos from "./components/HeaderProductosDetenidos";
import { apiJson } from "@/utils/apiClient";
import { useCargaDatos } from "@/utils/useCargaDatos";
import { useEstadoVista } from "@/utils/estadoVista";
import { BACKEND_URL } from "@/config";
import CustomTabs from "../components/CustomTabs";
import * as XLSX from "xlsx";
import { notifyInfo } from "@/components/ui/toast/notify";

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
  MargenPorcentaje: number | null;
}

const ProductosDetenidosPage = () => {
  // Filtros, página y pestaña se recuerdan al cambiar de vista y volver. El
  // período es relativo ("1M", "3M"…) o un rango elegido a mano: va tal cual.
  const [vista, setVista] = useEstadoVista<{ filters: FiltroProductos; page: number; pestana: number }>(
    "informe-productos-detenidos",
    () => ({ filters: {}, page: 1, pestana: 0 })
  );
  const { filters, page, pestana } = vista;
  const setFilters = (f: FiltroProductos) => setVista((v) => ({ ...v, filters: f }));
  const setPage = (p: number) => setVista((v) => ({ ...v, page: p }));

  useEffect(() => {
    notifyInfo("Informe actualizado a diario", {
      description: "Si necesitas información más reciente pide al usuario ADMIN que actualice la información.",
      durationMs: 8000,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const paramsFiltros = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return params;
  };

  // Cada tabla se identifica por su URL con filtros (y página): al cambiar se
  // limpia al instante, se cancela lo pendiente y solo se muestra la última
  // respuesta (ver useCargaDatos).
  const paramsActivos = paramsFiltros();
  paramsActivos.append("offset", ((page - 1) * limit).toString());
  paramsActivos.append("limit", limit.toString());
  const urlActivos = `${BACKEND_URL}/api/productos-detenidos?${paramsActivos}`;
  const { datos: activos, cargando: loading } = useCargaDatos<{ productos: ProductoEstancado[]; total: number }>(
    urlActivos,
    async (signal) => {
      const data = await apiJson<any>(urlActivos, { signal });
      return {
        productos: Array.isArray(data.data) ? data.data : [],
        total: typeof data.total === "number" ? data.total : 0,
      };
    },
    { productos: [], total: 0 }
  );
  const { productos, total } = activos;
  const totalPages = Math.ceil(total / limit);

  const urlInactivos = `${BACKEND_URL}/api/stock-detenido-ventas?${paramsFiltros()}`;
  const { datos: stockInactivos, cargando: loadingInactivos } = useCargaDatos<ProductoEstancado[]>(
    urlInactivos,
    async (signal) => {
      const data = await apiJson<any>(urlInactivos, { signal });
      return data.data.map((item: any) => ({
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
    },
    []
  );

  const exportarExcelActivos = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      params.append("sinPaginacion", "true");

      const data = await apiJson<any>(`${BACKEND_URL}/api/productos-detenidos?${params}`);

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

      const data = await apiJson<any>(`${BACKEND_URL}/api/stock-detenido-ventas?${params}`);

      const worksheet = XLSX.utils.json_to_sheet(data.data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Inactivos");
      XLSX.writeFile(workbook, "productos_detenidos_inactivos.xlsx");
    } catch (err) {
      console.error("Error al exportar inactivos:", err);
    }
  };

  // Solo cambia el estado: las cargas salen de las URLs de arriba (antes se
  // pedía aquí y otra vez en un efecto sobre filters, dos veces por cambio).
  const handleFilterChange = (newFilters: FiltroProductos) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  return (
    <Box p={0}>
      <CustomTabs
        tabLabels={["Activos para compras", "Inactivos para compra con stock"]}
        value={pestana}
        onChange={(p) => setVista((v) => ({ ...v, pestana: p }))}
        tabContents={[
          <React.Fragment key="tab-activos">
            <Typography variant="h4" fontWeight="bold" gutterBottom display="flex" alignItems="center">
              <TrendingDown sx={{ mr: 1 }} />
              Informe de Productos Detenidos Activos para compras
            </Typography>

            <Typography variant="body1" color="text.secondary" gutterBottom>
              Este reporte muestra los productos que no han tenido ventas desde hace varios días, con información detallada sobre inventario y margen.
            </Typography>

            <HeaderProductosDetenidos onFilterChange={handleFilterChange} currentFilters={filters} />
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
              <ProductosEstancadosTable data={productos} etiquetaMargen="% Margen potencial" />
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

            <HeaderProductosDetenidos onFilterChange={handleFilterChange} currentFilters={filters} />
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
    </Box>
  );
};

export default ProductosDetenidosPage;
