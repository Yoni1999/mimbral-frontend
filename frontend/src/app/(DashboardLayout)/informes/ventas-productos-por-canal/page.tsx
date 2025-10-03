"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  DialogActions,
  TextField,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  Avatar,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CloseIcon from "@mui/icons-material/Close";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import HeaderVentasPorCanalDrawer, { FiltrosPorCanal } from "./components/HeaderVentasPorCanalDrawer";
import VentasPorCanalTable, {
  ProductoPorCanal,
  ResumenCanalItem,
  Order,
  OrderBy,
  DetalleVenta,
} from "./components/VentasPorCanalTable";

const defaultPageSize = 60;

const formatNumber = (n?: number) =>
  typeof n === "number" ? n.toLocaleString("es-CL") : "-";

const money = (n?: number) =>
  typeof n === "number"
    ? n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 })
    : "-";

const InformeVentasPorCanalPage: React.FC = () => {
  const [filters, setFilters] = useState<FiltrosPorCanal>({ periodo: "7d" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [orderBy, setOrderBy] = useState<OrderBy>("cantidadVendida");
  const [order, setOrder] = useState<Order>("desc");

  const [rows, setRows] = useState<ProductoPorCanal[]>([]);
  const [total, setTotal] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openExportModal, setOpenExportModal] = useState(false);
  const [exportType, setExportType] = useState<"excel" | "pdf" | null>(null);
  const [exportCount, setExportCount] = useState<number>(100);

  // ==== Modal Detalle (ahora 100% implementado) ====
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [detalleTitulo, setDetalleTitulo] = useState("");
  const [detalleData, setDetalleData] = useState<DetalleVenta[]>([]);
  const [detalleSearch, setDetalleSearch] = useState("");

  const detalleFiltrado = useMemo(() => {
    if (!detalleSearch) return detalleData;
    const q = detalleSearch.toLowerCase();
    return detalleData.filter(
      (d) =>
        d.folioNum.toLowerCase().includes(q) ||
        d.vendedor.toLowerCase().includes(q)
    );
  }, [detalleSearch, detalleData]);

  const canalesUnion = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => r.porCanal?.forEach((c) => set.add(c.canal)));
    return Array.from(set);
  }, [rows]);

  const fetchData = async (pageToLoad = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      // filtros
      if (filters.periodo && filters.periodo !== "RANGO") params.append("periodo", filters.periodo);
      if (filters.periodo === "RANGO") {
        if (filters.fechaInicio) params.append("fechaInicio", filters.fechaInicio);
        if (filters.fechaFin) params.append("fechaFin", filters.fechaFin);
      }
      if (filters.proveedor) params.append("proveedor", filters.proveedor);
      if (filters.primerNivel) params.append("primerNivel", filters.primerNivel);
      if (filters.categoria) params.append("categoria", filters.categoria);
      if (filters.subcategoria) params.append("subcategoria", filters.subcategoria);

      // paginación + orden
      params.append("page", String(pageToLoad));
      params.append("pageSize", String(pageSize));
      params.append("orderBy", orderBy);
      params.append("order", order);

      const res = await fetchWithToken(
        `${BACKEND_URL}/api/informes/productos-por-canal-margen?${params.toString()}`
      );
      const data = await res!.json();

      setRows(Array.isArray(data?.data) ? data.data : []);
      setTotal(Number(data?.total || data?.count || 0));
    } catch (e) {
      console.error("Error fetch productos-por-canal:", e);
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters), orderBy, order, pageSize]);

  // ===== Exportaciones =====
  const openExport = (format: "excel" | "pdf") => {
    setExportType(format);
    setOpenExportModal(true);
    setAnchorEl(null);
  };

  const doExport = async () => {
    const params = new URLSearchParams();
    if (filters.periodo && filters.periodo !== "RANGO") params.append("periodo", filters.periodo);
    if (filters.periodo === "RANGO") {
      if (filters.fechaInicio) params.append("fechaInicio", filters.fechaInicio);
      if (filters.fechaFin) params.append("fechaFin", filters.fechaFin);
    }
    if (filters.proveedor) params.append("proveedor", filters.proveedor);
    if (filters.primerNivel) params.append("primerNivel", filters.primerNivel);
    if (filters.categoria) params.append("categoria", filters.categoria);
    if (filters.subcategoria) params.append("subcategoria", filters.subcategoria);

    params.append("page", "1");
    params.append("pageSize", String(exportCount > 0 ? exportCount : 10000));
    params.append("orderBy", orderBy);
    params.append("order", order);

    const res = await fetchWithToken(
      `${BACKEND_URL}/api/informes/productos-por-canal-margen?${params.toString()}`
    );
    const data = await res!.json();
    const list: ProductoPorCanal[] = Array.isArray(data?.data) ? data.data : [];

    if (exportType === "excel") return exportExcel(list);
    return exportPDF(list);
  };

  const exportExcel = (items: ProductoPorCanal[]) => {
    const channels =
      canalesUnion.length
        ? canalesUnion
        : Array.from(new Set(items.flatMap((r) => r.porCanal?.map((c) => c.canal) || [])));

    const rowsExcel = items.map((item) => {
      const base: any = {
        SKU: item.sku,
        Producto: item.nombre,
        "Cant. Total": item.cantidadVendida,
        "Margen Bruto": item.margenBruto,
        "% Margen": item.margenPorcentaje,
      };
      channels.forEach((ch) => {
        const c = item.porCanal?.find((x) => x.canal === ch);
        base[ch] = c ? c.cantidadVendida : 0;
      });
      return base;
    });

    const ws = XLSX.utils.json_to_sheet(rowsExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ventas por Canal");
    XLSX.writeFile(wb, "informe_ventas_por_canal.xlsx");
  };

  const exportPDF = (items: ProductoPorCanal[]) => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "A4" });
    doc.setFontSize(14);
    doc.text("Informe de ventas de productos por canal", 40, 40);

    const channels =
      canalesUnion.length
        ? canalesUnion
        : Array.from(new Set(items.flatMap((r) => r.porCanal?.map((c) => c.canal) || [])));

    const head = ["SKU", "Producto", "Cant. Total", "Margen Bruto", "% Margen", ...channels];
    const body = items.map((it) => [
      it.sku,
      it.nombre,
      it.cantidadVendida,
      it.margenBruto,
      it.margenPorcentaje,
      ...channels.map((ch) => it.porCanal?.find((x) => x.canal === ch)?.cantidadVendida || 0),
    ]);

    autoTable(doc, {
      head: [head],
      body,
      startY: 60,
      headStyles: { fillColor: [93, 135, 255], textColor: 255, fontStyle: "bold", fontSize: 10 },
      styles: { fontSize: 9, cellPadding: 4 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    doc.save("informe_ventas_por_canal.pdf");
  };

  return (
    <Box p={1}>
      <Typography variant="h4" fontWeight="bold" gutterBottom display="flex" alignItems="center">
        <TrendingUpIcon sx={{ mr: 1 }} />
        Informe ventas de Productos por Canal
      </Typography>

      <Typography variant="body1" color="text.secondary" gutterBottom>
        Agrupa ventas por producto y canal. Haz clic en una cifra para ver el detalle (folio, fecha, vendedor, etc.).
      </Typography>

      <HeaderVentasPorCanalDrawer
        onFilterChange={(f) => setFilters(f)}
        currentFilters={filters}
      />

      <Divider sx={{ my: 2 }} />

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle2">
          {total === 0 ? (
            "Sin resultados"
          ) : (
            <>
              Mostrando <strong>{(page - 1) * pageSize + 1}</strong> -{" "}
              <strong>{Math.min(page * pageSize, total)}</strong> de{" "}
              <strong>{formatNumber(total)}</strong>
            </>
          )}
        </Typography>

        <Box>
          <Button
            variant="contained"
            onClick={(e) => setAnchorEl(e.currentTarget)}
            endIcon={<MoreVertIcon />}
          >
            Exportar
          </Button>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <MenuItem onClick={() => openExport("excel")}>Exportar a Excel</MenuItem>
            <MenuItem onClick={() => openExport("pdf")}>Exportar a PDF</MenuItem>
          </Menu>
        </Box>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height={200}>
          <CircularProgress />
        </Box>
      ) : (
        <VentasPorCanalTable
          data={rows}
          canales={canalesUnion}
          ordenActual={order}
          ordenPorActual={orderBy}
          onSortChange={(campo) => {
            const nuevoOrden = orderBy === campo && order === "asc" ? "desc" : "asc";
            setOrder(nuevoOrden);
            setOrderBy(campo);
          }}
          // 👉 al hacer click en el número del canal, abrimos el modal con el detalle del endpoint
          onOpenDetalle={(titulo, detalles) => {
            setDetalleTitulo(titulo);
            setDetalleData(detalles || []);
            setDetalleSearch("");
            setDetalleOpen(true);
          }}
        />
      )}

      {totalPages > 1 && !loading && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_e, value) => {
              setPage(value);
              fetchData(value);
            }}
            color="primary"
            shape="rounded"
            siblingCount={1}
            boundaryCount={1}
          />
        </Box>
      )}

      {/* <Snackbar
        open
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        sx={{ maxWidth: "400px" }}
      >
        <Alert
          severity="warning"
          variant="filled"
          action={
            <IconButton aria-label="close" color="inherit" size="small">
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
          Este informe se actualiza a diario con la información más reciente. Para datos en tiempo real, pide al usuario ADMIN actualizar la información.
        </Alert>
      </Snackbar> */}

      {/* ===== Modal Detalle de venta ===== */}
      <Dialog open={detalleOpen} onClose={() => setDetalleOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Detalle de venta · {detalleTitulo}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            placeholder="Buscar por folio o vendedor"
            margin="dense"
            value={detalleSearch}
            onChange={(e) => setDetalleSearch(e.target.value)}
          />
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Folio</TableCell>
                  <TableCell>Cantidad</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Vendedor</TableCell>
                  <TableCell>Venta</TableCell>
                  <TableCell>Margen</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {detalleFiltrado.map((d) => (
                  <TableRow key={`${d.folioNum}-${d.vendedor}-${d.fecha}`}>
                    <TableCell>{d.folioNum}</TableCell>
                    <TableCell>{formatNumber(d.cantidad)}</TableCell>
                    <TableCell>{new Date(d.fecha).toLocaleDateString("es-CL")}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 28, height: 28 }}>
                          {d.vendedor?.[0]?.toUpperCase() || "V"}
                        </Avatar>
                        <Typography variant="body2">{d.vendedor}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{money(d.venta)}</TableCell>
                    <TableCell>{money(d.margenBrutoLinea)}</TableCell>
                  </TableRow>
                ))}
                {detalleFiltrado.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Sin resultados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetalleOpen(false)} startIcon={<CloseIcon />}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== Modal Export ===== */}
      <Dialog open={openExportModal} onClose={() => setOpenExportModal(false)}>
        <DialogTitle>Exportar {exportType?.toUpperCase()}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Cantidad a exportar (0 = máximo)"
            type="number"
            fullWidth
            value={exportCount}
            onChange={(e) => setExportCount(parseInt(e.target.value || "0", 10))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenExportModal(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={async () => {
              await doExport();
              setOpenExportModal(false);
            }}
          >
            Exportar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InformeVentasPorCanalPage;
