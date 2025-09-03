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
  Menu,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  TextField,            // <-- agregado para input manual
  DialogActions         // <-- agregado para botones del modal
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CloseIcon from "@mui/icons-material/Close";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ProductosVendidosTable from "./components/ProductosVendidos";
import HeaderVentasProductosDrawer from "./components/HeaderVentasProductosDrawer";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { OrderBy } from "@/types/orderBy";

const limit = 100;

interface FiltrosVentas {
  canal?: string | string[]; // <-- permitir string o string[] (multi)
  periodo: string;
  fechaInicio?: string;
  fechaFin?: string;
  proveedor?: string;
  primerNivel?: string;
  categoria?: string;
  subcategoria?: string;
  tipoEnvio?: "todas" | "full" | "colecta";
}

type Order = "asc" | "desc";

// ---- helpers para normalizar filtros (multi-canal, periodo/rango) ----
const toCsvLower = (v?: string | string[]) =>
  Array.isArray(v)
    ? v.map(x => String(x).trim().toLowerCase()).filter(Boolean).join(",")
    : (v ? String(v).trim().toLowerCase() : "");

const isYYYYMMDD = (d?: string) => !!d && /^\d{4}-\d{2}-\d{2}$/.test(d);
const hasValidRange = (a?: string, b?: string) => isYYYYMMDD(a) && isYYYYMMDD(b);

// mapea la respuesta del endpoint (que puede venir con totales anidados) a la estructura de la tabla
const mapApiRowToTable = (r: any) => ({
  sku: r?.sku ?? "",
  nombre: r?.nombre ?? "",
  imagen: r?.imagen || undefined,
  primerNivel: r?.primerNivel ?? "",
  categoria: r?.categoria ?? "",
  cantidadVendida: r?.cantidadVendida?.total ?? r?.cantidadVendida ?? 0,
  facturasUnicas: r?.facturasUnicas?.total ?? r?.facturasUnicas ?? 0,
  precioPromedio: r?.precioPromedio?.total ?? r?.precioPromedio ?? 0,
  totalVentas: Math.round(r?.totalVentas ?? 0),
  margenBruto: r?.margenBruto?.total ?? r?.margenBruto ?? 0,
  margenPorcentaje: Number(r?.margenPorcentaje ?? 0),
  stockCanal: r?.stockCanal?.total ?? r?.stockCanal ?? 0,
  stockChorrillo: r?.stockChorrillo ?? 0,
  stockOnOrder: r?.stockOnOrder ?? 0,
});

const InformeVentaPage = () => {
  const [filters, setFilters] = useState<FiltrosVentas>({ periodo: "1D", canal: "Vitex" });
  const [productos, setProductos] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showMensaje, setShowMensaje] = useState(true);
  const [orden, setOrden] = useState<Order>("desc");
  const [ordenPor, setOrdenPor] = useState<OrderBy>("cantidadVendida");

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openExportModal, setOpenExportModal] = useState(false);
  const [exportType, setExportType] = useState<'excel' | 'pdf' | null>(null);

  // CAMBIO: cantidad manual a exportar (-1 = todo)
  const [exportCount, setExportCount] = useState<number>(100);

  const totalPages = Math.ceil(total / limit);

  const obtenerNombreUsuario = async (): Promise<string> => {
    try {
      const res = await fetchWithToken(`${BACKEND_URL}/api/auth/usuario`);
      const data = await res!.json();
      return data?.nombre ?? "Usuario";
    } catch (error) {
      console.error("Error al obtener usuario:", error);
      return "Usuario";
    }
  };

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

      // --- construir query segun reglas del endpoint ---
      const canalCsv = toCsvLower(filtros.canal);
      const { periodo, fechaInicio, fechaFin, tipoEnvio } = filtros;
      const tieneRango = hasValidRange(fechaInicio, fechaFin);
      const tienePeriodo = !!periodo && !tieneRango;

      if (canalCsv) params.append("canal", canalCsv);

      if (tieneRango) {
        params.append("fechaInicio", String(fechaInicio));
        params.append("fechaFin", String(fechaFin));
      } else if (tienePeriodo) {
        params.append("periodo", String(periodo).toLowerCase());
      }

      // forward de otros filtros
      (["proveedor","primerNivel","categoria","subcategoria"] as const).forEach(k => {
        const v = (filtros as any)[k] as string | undefined;
        if (v) params.append(k, v);
      });

      // tipoEnvio solo si incluye meli y valor válido
      const incluyeMeli = canalCsv ? canalCsv.split(",").includes("meli") : false;
      if (incluyeMeli && (tipoEnvio === "full" || tipoEnvio === "colecta")) {
        params.append("tipoEnvio", tipoEnvio);
      }

      // paginación/orden
      params.append("offset", offset.toString());
      params.append("limit", limit.toString());
      params.append("orderBy", campoOrden);
      params.append("order", direccionOrden);

      const res = await fetchWithToken(`${BACKEND_URL}/api/obtener-productos-detallado?${params.toString()}`);
      const data = await res!.json();

      const rows = Array.isArray(data?.data) ? data.data.map(mapApiRowToTable) : [];
      setProductos(rows);
      setTotal(typeof data?.total === "number" ? data.total : rows.length);
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

  const exportarProductos = async (tipo: 'excel' | 'pdf', exportLimit: number | 'all') => {
    setLoading(true);
    setOpenExportModal(false);
    try {
      const params = new URLSearchParams();

      // --- mismos criterios de construcción que en fetchProductos ---
      const canalCsv = toCsvLower(filters.canal);
      const { periodo, fechaInicio, fechaFin, tipoEnvio } = filters;
      const tieneRango = hasValidRange(fechaInicio, fechaFin);
      const tienePeriodo = !!periodo && !tieneRango;

      if (canalCsv) params.append("canal", canalCsv);

      if (tieneRango) {
        params.append("fechaInicio", String(fechaInicio));
        params.append("fechaFin", String(fechaFin));
      } else if (tienePeriodo) {
        params.append("periodo", String(periodo).toLowerCase());
      }

      (["proveedor","primerNivel","categoria","subcategoria"] as const).forEach(k => {
        const v = (filters as any)[k] as string | undefined;
        if (v) params.append(k, v);
      });

      const incluyeMeli = canalCsv ? canalCsv.split(",").includes("meli") : false;
      if (incluyeMeli && (tipoEnvio === "full" || tipoEnvio === "colecta")) {
        params.append("tipoEnvio", tipoEnvio);
      }

      // límite del modal o todo
      if (exportLimit !== 'all') {
        params.append("limit", String(exportLimit));
        params.append("offset", "0");
      } else {
        params.append("sinPaginacion", "true");
      }

      // orden actual
      params.append("orderBy", ordenPor);
      params.append("order", orden);

      const res = await fetchWithToken(`${BACKEND_URL}/api/obtener-productos-detallado?${params.toString()}`);
      const data = await res!.json();

      if (Array.isArray(data?.data)) {
        const rows = data.data.map(mapApiRowToTable);
        if (tipo === 'excel') exportToExcel(rows);
        else {
          const nombreUsuario = await obtenerNombreUsuario();
          exportToPDF(rows, nombreUsuario);
        }
      }
    } catch (error) {
      console.error("Error al exportar productos:", error);
    } finally {
      setLoading(false);
      setAnchorEl(null);
    }
  };

  const exportToExcel = (productosData: any[]) => {
    const dataFiltrada = productosData.map((item, index) => ({
      "#": index + 1,
      SKU: item.sku,
      Nombre: item.nombre,
      "Primer Nivel": item.primerNivel,
      Categoría: item.categoria,
      "Cantidad Vendida": item.cantidadVendida,
      Transacciones: item.facturasUnicas,
      "Precio Prom. Venta": item.precioPromedio,
      "Total Ventas": item.totalVentas,
      "Margen Bruto": item.margenBruto,
      "% Margen": item.margenPorcentaje,
      "Stock Canal": item.stockCanal,
      "Stock Chorrillo": item.stockChorrillo,
      "OC (On Order)": item.stockOnOrder,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataFiltrada);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Productos");

    XLSX.writeFile(workbook, "informe_venta_productos.xlsx");
  };

  const exportToPDF = (productosData: any[], usuario: string) => {
    if (productosData.length === 0) {
      console.warn("No hay datos para exportar a PDF.");
      return;
    }

    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "A4" });

    const fechaActual = new Date();
    const fechaStr = fechaActual.toLocaleDateString("es-CL");
    const horaStr = fechaActual.toLocaleTimeString("es-CL", { hour: "numeric", minute: "2-digit" });

    const canal = Array.isArray(filters.canal) ? filters.canal.join(", ") : (filters.canal || "Todos");
    const periodo = filters.periodo || "";
    const proveedor = filters.proveedor || "N/A";
    const primerNivel = filters.primerNivel || "N/A";
    const categoria = filters.categoria || "N/A";
    const subcategoria = filters.subcategoria || "N/A";
    const tipoEnvio = filters.tipoEnvio || "todas";

    const periodoTexto = (() => {
      switch (periodo) {
        case "1D":
          return "Últimas 24 horas";
        case "7D":
          return "Últimos 7 días";
        case "14D":
          return "Últimos 14 días";
        case "1M":
          return "Último mes";
        case "3M":
          return "Últimos 3 meses";
        case "6M":
          return "Últimos 6 meses";
        case "RANGO":
        default:
          if (filters.fechaInicio && filters.fechaFin) {
            return `Desde ${filters.fechaInicio} hasta ${filters.fechaFin}`;
          }
          return "Período no especificado";
      }
    })();

    const titulo = `Informe de Venta de Productos · Canal seleccionado: ${canal} · Período: ${periodoTexto}`;

    // Cargar logo
    const logo = new Image();
    logo.src = "/images/logos/image.png"; // PNG o JPG en public

    logo.onload = () => {
      doc.addImage(logo, "PNG", 40, 20, 100, 40);

      // Título principal
      doc.setFontSize(14);
      doc.setTextColor(40);
      doc.text(titulo, 160, 40);

      // Datos resumen tipo tabla
      doc.setFontSize(10);
      doc.setTextColor(50);

      const startY = 60;
      const lineHeight = 15;

      const info = [
        ["Generado por:", usuario, "Fecha:", `${fechaStr} · Hora: ${horaStr}`],
        ["Canal:", canal, "Período:", periodoTexto],
        ["Proveedor:", proveedor, "Primer nivel:", primerNivel],
        ["Categoría:", categoria, "Subcategoría:", subcategoria],
      ];

      // Si canal es MercadoLibre, agregar tipo de envío
      const canalesLower = (Array.isArray(filters.canal) ? filters.canal : [filters.canal]).map(c => (c||"").toLowerCase());
      if (canalesLower.includes("meli")) {
        const tipoEnvioTexto =
          tipoEnvio === "full" ? "FULL" :
          tipoEnvio === "colecta" ? "COLECTA" : "TODOS";
        info.push(["Tipo de Envío:", tipoEnvioTexto, "", ""]);
      }

      info.forEach((row, i) => {
        row.forEach((txt, j) => {
          doc.text(txt.toString(), 160 + j * 160, startY + i * lineHeight);
        });
      });

      // Línea divisoria
      const infoBlockHeight = startY + info.length * lineHeight;
      doc.setDrawColor(200);
      doc.setLineWidth(1);
      doc.line(40, infoBlockHeight + 10, 800, infoBlockHeight + 10);

      // Definición de columnas
      const columnas = [
        { key: "numero", label: "#" },
        { key: "sku", label: "SKU" },
        { key: "nombre", label: "Nombre" },
        { key: "primerNivel", label: "Primer Nivel" },
        { key: "categoria", label: "Categoría" },
        { key: "cantidadVendida", label: "Cantidad Vendida" },
        { key: "facturasUnicas", label: "Transacciones" },
        { key: "stockCanal", label: "Stock Canal" },
        { key: "stockChorrillo", label: "Stock Chorrillo" },
        { key: "stockOnOrder", label: "OC (On Order)" },
      ];

      const headers = columnas.map(c => c.label);
      const rows = productosData.map((item, index) =>
        columnas.map(c =>
          c.key === "numero" ? (index + 1).toString() : (item as any)[c.key] ?? ""
        )
      );

      // Tabla de productos
      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: infoBlockHeight + 20,
        headStyles: {
          fillColor: [93, 135, 255],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 10,
        },
        styles: {
          fontSize: 9,
          cellPadding: 4,
          valign: "middle",
          textColor: 20,
        },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });

      doc.save("informe_venta_productos.pdf");
    };
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

  const handleOpenExportMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseExportMenu = () => {
    setAnchorEl(null);
  };

  const handleSelectExportFormat = (format: 'excel' | 'pdf') => {
    setExportType(format);
    setOpenExportModal(true);
    handleCloseExportMenu();
  };

  const handleCloseExportModal = () => {
    setOpenExportModal(false);
    setExportType(null);
  };

  useEffect(() => {
    fetchProductos(filters, 1);
  }, []);

  return (
    <Box p={1}>
      <Typography variant="h4" fontWeight="bold" gutterBottom display="flex" alignItems="center">
        <TrendingUpIcon sx={{ mr: 1 }} />
        Informe de Venta de productos
      </Typography>

      <Typography variant="body1" color="text.secondary" gutterBottom>
        Revisa el detalle de productos vendidos por período, canal, proveedor y más.
      </Typography>

      <HeaderVentasProductosDrawer
        onFilterChange={handleFilterChange}
        currentFilters={filters}
        multiCanal={true}   // <-- habilita multi-selección de canales en el header
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

        <Box>
          <Button
            variant="contained"
            onClick={handleOpenExportMenu}
            endIcon={<MoreVertIcon />}
          >
            Exportar
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleCloseExportMenu}
          >
            <MenuItem onClick={() => handleSelectExportFormat('excel')}>Exportar a Excel</MenuItem>
            <MenuItem onClick={() => handleSelectExportFormat('pdf')}>Exportar a PDF</MenuItem>
          </Menu>
        </Box>
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

      {/* CAMBIO: modal de exportación con input numérico */}
      <Dialog open={openExportModal} onClose={handleCloseExportModal}>
        <DialogTitle>Exportar {exportType?.toUpperCase()}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Cantidad a exportar (usa -1 para todo)"
            type="number"
            fullWidth
            value={exportCount}
            onChange={(e) => setExportCount(parseInt(e.target.value || "", 10))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseExportModal}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={() => exportarProductos(exportType!, exportCount === -1 ? 'all' : exportCount)}
          >
            Exportar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InformeVentaPage;
