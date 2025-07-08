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
  tipoEnvio?: "todas" | "full" | "colecta";
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

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openExportModal, setOpenExportModal] = useState(false);
  const [exportType, setExportType] = useState<'excel' | 'pdf' | null>(null);

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

      Object.entries(filtros).forEach(([key, value]) => {
        if (!value) return;

        // No enviar tipoEnvio si es "todos"
        if (key === "tipoEnvio" && value === "todas") return;

        params.append(key, value);
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

  const exportarProductos = async (tipo: 'excel' | 'pdf', exportLimit: number | 'all') => {
    setLoading(true);
    setOpenExportModal(false);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      if (exportLimit !== 'all') {
        params.append("limit", exportLimit.toString());
        params.append("offset", "0");
      } else {
        params.append("sinPaginacion", "true");
      }

      params.append("orderBy", ordenPor);
      params.append("order", orden);

      const res = await fetchWithToken(`${BACKEND_URL}/api/obtener-productos-detallado?${params}`);
      const data = await res!.json();

      if (Array.isArray(data.data)) {
        if (tipo === 'excel') exportToExcel(data.data);
        else {
          const nombreUsuario = await obtenerNombreUsuario();
          exportToPDF(data.data, nombreUsuario);
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
    const worksheet = XLSX.utils.json_to_sheet(productosData);
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

  const canal = filters.canal || "Todos";
  const periodo = filters.periodo || "";
  const proveedor = filters.proveedor || "N/A";
  const primerNivel = filters.primerNivel || "N/A";
  const categoria = filters.categoria || "N/A";
  const subcategoria = filters.subcategoria || "N/A";

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
      ["Generado por:", usuario, "Fecha:", fechaStr + " · Hora: " + horaStr],
      ["Canal:", canal, "Período:", periodoTexto],
      ["Proveedor:", proveedor, "Primer nivel:", primerNivel],
      ["Categoría:", categoria, "Subcategoría:", subcategoria],
    ];

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
    ];

    const headers = columnas.map(c => c.label);
    const rows = productosData.map((item, index) =>
      columnas.map(c =>
        c.key === "numero" ? (index + 1).toString() : item[c.key] ?? ""
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

      <Dialog open={openExportModal} onClose={handleCloseExportModal}>
        <DialogTitle>Selecciona la cantidad a exportar</DialogTitle>
        <DialogContent>
          <List>
            {[50, 100, 200, 300].map(cantidad => (
              <ListItem disablePadding key={cantidad}>
                <ListItemButton onClick={() => exportarProductos(exportType!, cantidad)}>
                  <ListItemText primary={`Top ${cantidad}`} />
                </ListItemButton>
              </ListItem>
            ))}
            <Divider sx={{ my: 1 }} />
            <ListItem disablePadding>
              <ListItemButton onClick={() => exportarProductos(exportType!, 'all')}>
                <ListItemText primary="Exportar Todo" />
              </ListItemButton>
            </ListItem>
          </List>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default InformeVentaPage;
