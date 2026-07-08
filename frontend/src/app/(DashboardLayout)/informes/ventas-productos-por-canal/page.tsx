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
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { apiJson } from "@/utils/apiClient";
import { BACKEND_URL } from "@/config";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import LaunchIcon from "@mui/icons-material/Launch";
import HeaderVentasPorCanalDrawer, { FiltrosPorCanal } from "./components/HeaderVentasPorCanalDrawer";
import VentasPorCanalTable, {
  ProductoPorCanal,
  Order,
  OrderBy,
  DetalleVenta,
  StockBodegaItem,
} from "./components/VentasPorCanalTable";

const defaultPageSize = 60;

const formatNumber = (n?: number) =>
  typeof n === "number" ? n.toLocaleString("es-CL") : "-";

const money = (n?: number) =>
  typeof n === "number"
    ? n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 })
    : "-";

const getStockTotalProducto = (stock?: { bodega: string; stock: number }[]) =>
  (stock || [])
    .filter((item) => item.bodega === "01" || item.bodega === "03")
    .reduce((sum, item) => sum + (item.stock || 0), 0);

const getStockRestoProducto = (stock?: { bodega: string; stock: number }[]) =>
  (stock || [])
    .filter((item) => item.bodega !== "01" && item.bodega !== "03")
    .reduce((sum, item) => sum + (item.stock || 0), 0);

const formatChannelLabel = (channel: string) =>
  channel?.toLowerCase() === "vitex" ? "VTEX" : channel;

const toDateOnly = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getPeriodoFechasLabel = (filters: FiltrosPorCanal) => {
  if (filters.fechaInicio && filters.fechaFin) {
    return `Ventas desde ${filters.fechaInicio} hasta ${filters.fechaFin}`;
  }

  const end = new Date();
  const start = new Date(end);
  const periodo = filters.periodo?.toLowerCase();

  switch (periodo) {
    case "1d":
      break;
    case "7d":
      start.setDate(end.getDate() - 6);
      break;
    case "14d":
      start.setDate(end.getDate() - 13);
      break;
    case "1m":
      start.setMonth(end.getMonth() - 1);
      break;
    case "3m":
      start.setMonth(end.getMonth() - 3);
      break;
    case "6m":
      start.setMonth(end.getMonth() - 6);
      break;
    default:
      break;
  }

  return `Ventas desde ${toDateOnly(start)} hasta ${toDateOnly(end)}`;
};

const InformeVentasPorCanalPage: React.FC = () => {
  // Pantalla completa para el modal de detalle en móviles
  const theme = useTheme();
  const fullScreenXs = useMediaQuery(theme.breakpoints.down("sm"));
  const [filters, setFilters] = useState<FiltrosPorCanal>({});
  const [appliedFilters, setAppliedFilters] = useState<FiltrosPorCanal | null>(null);
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
  const [stockOpen, setStockOpen] = useState(false);
  const [stockTitulo, setStockTitulo] = useState("");
  const [stockData, setStockData] = useState<StockBodegaItem[]>([]);

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

  const hasAppliedFilters = Boolean(
    appliedFilters?.periodo ||
      appliedFilters?.fechaInicio ||
      appliedFilters?.fechaFin ||
      appliedFilters?.sku ||
      appliedFilters?.familia ||
      appliedFilters?.subfamilia ||
      appliedFilters?.proveedor ||
      appliedFilters?.primerNivel ||
      appliedFilters?.categoria ||
      appliedFilters?.subcategoria
  );

  const fetchData = async (pageToLoad = page) => {
    setLoading(true);
    try {
      const sourceFilters = appliedFilters || filters;
      const params = new URLSearchParams();
      // filtros
      if (sourceFilters.periodo && sourceFilters.periodo !== "RANGO") params.append("periodo", sourceFilters.periodo);
      if (sourceFilters.periodo === "RANGO") {
        if (sourceFilters.fechaInicio) params.append("fechaInicio", sourceFilters.fechaInicio);
        if (sourceFilters.fechaFin) params.append("fechaFin", sourceFilters.fechaFin);
      }
      if (sourceFilters.proveedor) params.append("proveedor", sourceFilters.proveedor);
      if (sourceFilters.sku) params.append("sku", sourceFilters.sku);
      if (sourceFilters.familia) params.append("familia", sourceFilters.familia);
      if (sourceFilters.subfamilia) params.append("subfamilia", sourceFilters.subfamilia);
      if (sourceFilters.primerNivel) params.append("primerNivel", sourceFilters.primerNivel);
      if (sourceFilters.categoria) params.append("categoria", sourceFilters.categoria);
      if (sourceFilters.subcategoria) params.append("subcategoria", sourceFilters.subcategoria);

      // paginación + orden
      params.append("page", String(pageToLoad));
      params.append("pageSize", String(pageSize));
      params.append("orderBy", orderBy);
      params.append("order", order);

      const res = await apiJson(
        `${BACKEND_URL}/api/informes/productos-por-canal-margen?${params.toString()}`
      );
      const data = await res!.json();

      setRows(Array.isArray(data?.data) ? data.data : []);
      setTotal(
        Number(data?.meta?.total ?? data?.total ?? data?.count ?? 0)
      );
      if (data?.meta?.page) {
        setPage(Number(data.meta.page));
      }
    } catch (e) {
      console.error("Error fetch productos-por-canal:", e);
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasAppliedFilters) return;
    fetchData(1);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(appliedFilters), orderBy, order, pageSize, hasAppliedFilters]);

  const buildDashboardUrl = () => {
    const sourceFilters = appliedFilters || filters;
    const params = new URLSearchParams();
    if (sourceFilters.periodo) params.set("periodo", sourceFilters.periodo);
    if (sourceFilters.fechaInicio) params.set("fechaInicio", sourceFilters.fechaInicio);
    if (sourceFilters.fechaFin) params.set("fechaFin", sourceFilters.fechaFin);
    if (sourceFilters.sku) params.set("sku", sourceFilters.sku);
    if (sourceFilters.familia) params.set("familia", sourceFilters.familia);
    if (sourceFilters.subfamilia) params.set("subfamilia", sourceFilters.subfamilia);
    if (sourceFilters.proveedor) params.set("proveedor", sourceFilters.proveedor);
    if (sourceFilters.primerNivel) params.set("primerNivel", sourceFilters.primerNivel);
    if (sourceFilters.categoria) params.set("categoria", sourceFilters.categoria);
    if (sourceFilters.subcategoria) params.set("subcategoria", sourceFilters.subcategoria);
    return `/informes/ventas-productos-por-canal/dashboard?${params.toString()}`;
  };

  const handleAppliedFiltersChange = (nextFilters: FiltrosPorCanal) => {
    setFilters(nextFilters);
    setAppliedFilters(nextFilters);
  };

  // ===== Exportaciones =====
  const openExport = (format: "excel" | "pdf") => {
    setExportType(format);
    setOpenExportModal(true);
    setAnchorEl(null);
  };

  const doExport = async () => {
    if (!hasAppliedFilters) return;
    const params = new URLSearchParams();
    if (filters.periodo && filters.periodo !== "RANGO") params.append("periodo", filters.periodo);
    if (filters.periodo === "RANGO") {
      if (filters.fechaInicio) params.append("fechaInicio", filters.fechaInicio);
      if (filters.fechaFin) params.append("fechaFin", filters.fechaFin);
    }
    if (filters.proveedor) params.append("proveedor", filters.proveedor);
    if (filters.sku) params.append("sku", filters.sku);
    if (filters.familia) params.append("familia", filters.familia);
    if (filters.subfamilia) params.append("subfamilia", filters.subfamilia);
    if (filters.primerNivel) params.append("primerNivel", filters.primerNivel);
    if (filters.categoria) params.append("categoria", filters.categoria);
    if (filters.subcategoria) params.append("subcategoria", filters.subcategoria);

    params.append("page", "1");
    params.append("pageSize", String(exportCount > 0 ? exportCount : 10000));
    params.append("orderBy", orderBy);
    params.append("order", order);

    const res = await apiJson(
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
      const stockTotal = getStockTotalProducto(item.stock);
      const base: any = {
        SKU: item.sku,
        Producto: item.nombre,
        "Cant. Total": item.cantidadVendida,
        "Stock Bodega 01+03": stockTotal,
        "Stock Resto Almacenes": getStockRestoProducto(item.stock),
        "Margen Bruto": item.margenBruto,
        "% Margen": item.margenPorcentaje,
      };
      channels.forEach((ch) => {
        const c = item.porCanal?.find((x) => x.canal === ch);
        base[ch] = c ? c.cantidadVendida : 0;
      });
      return base;
    });

    const periodoLabel = getPeriodoFechasLabel(filters);
    const ws = XLSX.utils.aoa_to_sheet([[periodoLabel], []]);
    XLSX.utils.sheet_add_json(ws, rowsExcel, { origin: "A3", skipHeader: false });
    const totalColumns = Object.keys(rowsExcel[0] || {
      SKU: "",
      Producto: "",
      "Cant. Total": "",
      "Stock Bodega 01+03": "",
      "Stock Resto Almacenes": "",
      "Margen Bruto": "",
      "% Margen": "",
    }).length;
    ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(0, totalColumns - 1) } }];
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

    const head = [
      "SKU",
      "Producto",
      "Cant. Total",
      "Stock",
      "Margen Bruto",
      "% Margen",
      ...channels.map(formatChannelLabel),
    ];
    const body = items.map((it) => [
      it.sku,
      it.nombre,
      it.cantidadVendida,
      getStockTotalProducto(it.stock),
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
      <HeaderVentasPorCanalDrawer
        onFilterChange={handleAppliedFiltersChange}
        currentFilters={filters}
      />

      <Divider sx={{ my: { xs: 1, md: 2 } }} />

      <Box
        display="flex"
        justifyContent="space-between"
        sx={{
          mb: { xs: 1, md: 2 },
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Typography variant="subtitle2" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
          {!hasAppliedFilters ? (
            "Sin filtros aplicados"
          ) : total === 0 ? (
            "Sin resultados"
          ) : (
            <>
              Mostrando <strong>{(page - 1) * pageSize + 1}</strong> -{" "}
              <strong>{Math.min(page * pageSize, total)}</strong> de{" "}
              <strong>{formatNumber(total)}</strong>
            </>
          )}
        </Typography>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<LaunchIcon />}
            disabled={!hasAppliedFilters}
            onClick={() => window.open(buildDashboardUrl(), "_blank", "noopener,noreferrer")}
            sx={{ mr: 0.5, fontSize: { xs: "0.75rem", sm: "0.875rem" }, py: { xs: 0.4, sm: 0.75 } }}
          >
            Dashboard
          </Button>
          <Button
            variant="contained"
            onClick={(e) => setAnchorEl(e.currentTarget)}
            endIcon={<MoreVertIcon />}
            sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" }, py: { xs: 0.4, sm: 0.75 } }}
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
          data={hasAppliedFilters ? rows : []}
          canales={hasAppliedFilters ? canalesUnion : []}
          emptyMessage={hasAppliedFilters ? "No hay datos" : "Sin filtros aplicados"}
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
          onOpenStock={(titulo, stock) => {
            setStockTitulo(titulo);
            setStockData(stock || []);
            setStockOpen(true);
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

      {/* ===== Modal Detalle de venta ===== */}
      <Dialog
        open={detalleOpen}
        onClose={() => setDetalleOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={fullScreenXs}
      >
        <DialogTitle>Detalle de venta · {detalleTitulo}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            placeholder="Buscar por folio o vendedor"
            margin="dense"
            value={detalleSearch}
            onChange={(e) => setDetalleSearch(e.target.value)}
          />
          <TableContainer component={Paper} sx={{ mt: 2, overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: { xs: 0, md: 650 } }}>
              <TableHead>
                <TableRow>
                  <TableCell>Folio</TableCell>
                  <TableCell>Cantidad</TableCell>
                  <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Fecha</TableCell>
                  <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Vendedor</TableCell>
                  <TableCell>Venta</TableCell>
                  <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Margen</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {detalleFiltrado.map((d) => (
                  <TableRow key={`${d.folioNum}-${d.vendedor}-${d.fecha}`}>
                    <TableCell>{d.folioNum}</TableCell>
                    <TableCell>{formatNumber(d.cantidad)}</TableCell>
                    <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>{new Date(d.fecha).toLocaleDateString("es-CL")}</TableCell>
                    <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 28, height: 28 }}>
                          {d.vendedor?.[0]?.toUpperCase() || "V"}
                        </Avatar>
                        <Typography variant="body2">{d.vendedor}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{money(d.venta)}</TableCell>
                    <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>{money(d.margenBrutoLinea)}</TableCell>
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

      <Dialog
        open={stockOpen}
        onClose={() => setStockOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxWidth: 420,
          },
        }}
      >
        <DialogTitle sx={{ py: 1.5, px: 2.2, fontSize: "1rem", fontWeight: 700 }}>
          {stockTitulo}
        </DialogTitle>
        <DialogContent sx={{ px: 2.2, pb: 1.5 }}>
          <TableContainer component={Paper} sx={{ mt: 0.5, boxShadow: "none", border: "1px solid #e9eef6", borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ py: 1, fontWeight: 700 }}>Bodega</TableCell>
                  <TableCell align="right" sx={{ py: 1, fontWeight: 700 }}>Stock</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stockData.map((item) => (
                  <TableRow key={`${item.bodega}-${item.stock}`}>
                    <TableCell sx={{ py: 0.9 }}>{item.bodega}</TableCell>
                    <TableCell align="right" sx={{ py: 0.9 }}>{formatNumber(item.stock)}</TableCell>
                  </TableRow>
                ))}
                {stockData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} align="center" sx={{ py: 1.5 }}>
                      Sin stock disponible
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 1.5 }}>
          <Button onClick={() => setStockOpen(false)} startIcon={<CloseIcon />} size="small">
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

