"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Alert,
  Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { apiJson } from "@/utils/apiClient";
import { BACKEND_URL } from "@/config";

type ShareFilters = Record<string, string | null>;

type ChannelItem = {
  canal: string;
  cantidadVendida: number;
  margenBruto: number;
  margenPorcentaje: number;
  costoTotal: number;
  detalles: any[];
};

type StockItem = {
  bodega: string;
  stock: number;
};

type ProductItem = {
  sku: string;
  nombre: string;
  imagen?: string | null;
  cantidadVendida: number;
  margenBruto: number;
  margenPorcentaje: number;
  costoTotal: number;
  stock?: StockItem[];
  porCanal: ChannelItem[];
};

type ShareResponse = {
  expiresAt?: string | null;
  filters?: ShareFilters;
  data?: ProductItem[];
  meta?: {
    total?: number;
  };
  error?: string;
};

const COLORS = ["#4C6EDB", "#7C8CFF", "#22C55E", "#F59E0B", "#EF4444", "#06B6D4"];

const formatUnits = (n?: number) => (typeof n === "number" ? n.toLocaleString("es-CL") : "-");
const formatMoney = (n?: number) =>
  typeof n === "number"
    ? n.toLocaleString("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0,
      })
    : "-";

const normalizeChannel = (value: string) => value.trim().toLowerCase();
const channelDisplayLabel = (channelKey: string) => (channelKey?.toLowerCase() === "vitex" ? "VTEX" : channelKey);

const getStock0103 = (stock?: StockItem[]) =>
  (stock || [])
    .filter((item) => item.bodega === "01" || item.bodega === "03")
    .reduce((sum, item) => sum + (item.stock || 0), 0);

const getAllStock = (stock?: StockItem[]) =>
  [...(stock || [])].sort((a, b) => a.bodega.localeCompare(b.bodega));

const getSalesAmount = (product: ProductItem) => (product.costoTotal || 0) + (product.margenBruto || 0);

const getChannelProductQuantity = (product: ProductItem, channelKey?: string) => {
  if (!channelKey) return product.cantidadVendida || 0;
  const found = (product.porCanal || []).find((item) => normalizeChannel(item.canal) === channelKey);
  return found?.cantidadVendida || 0;
};

const channelLabelMap: Record<string, string> = {
  meli: "Meli",
  falabella: "Falabella",
  balmaceda: "Balmaceda",
  vitex: "Vtex",
  chorrillo: "Chorrillos",
  empresas: "Empresas",
};

export default function SharedVentasPorCanalPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [share, setShare] = useState<ShareResponse | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const [stockDetailProduct, setStockDetailProduct] = useState<ProductItem | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const response = await apiJson<ShareResponse>(`${BACKEND_URL}/api/public/informes/ventas-productos-por-canal/${encodeURIComponent(token)}`, {
          auth: "none",
        });
        setShare(response);
      } catch (err) {
        const message = err instanceof Error ? err.message : "No se pudo cargar el enlace compartido.";
        setError(message);
        setShare(null);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [token]);

  const data = useMemo(() => share?.data || [], [share]);

  const channelSlices = useMemo(() => {
    const channels = new Map<string, number>();
    data.forEach((product) => {
      (product.porCanal || []).forEach((item) => {
        const key = normalizeChannel(item.canal);
        channels.set(key, (channels.get(key) || 0) + (item.cantidadVendida || 0));
      });
    });

    return Array.from(channels.entries())
      .map(([key, value]) => ({
        key,
        label: channelDisplayLabel(key),
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  const selectedChannelLabel = selectedChannel ? channelDisplayLabel(selectedChannel) : "";

  const productsInScope = useMemo(() => {
    const source = selectedChannel
      ? data.filter((product) => getChannelProductQuantity(product, selectedChannel) > 0)
      : data;

    return source
      .map((product) => ({
        ...product,
        displaySales: selectedChannel ? getChannelProductQuantity(product, selectedChannel) : product.cantidadVendida || 0,
        stock0103: getStock0103(product.stock),
      }))
      .sort((a, b) => b.displaySales - a.displaySales);
  }, [data, selectedChannel]);

  const topProducts = useMemo(() => productsInScope.slice(0, 8), [productsInScope]);

  const lowStockProducts = useMemo(
    () =>
      [...data]
        .map((product) => ({
          ...product,
          stock0103: getStock0103(product.stock),
        }))
        .filter((product) => product.stock0103 > 0)
        .sort((a, b) => a.stock0103 - b.stock0103)
        .slice(0, 8),
    [data]
  );

  const totals = useMemo(() => {
    const metrics = productsInScope.reduce(
      (acc, product) => {
        acc.units += product.displaySales || 0;
        acc.sales += getSalesAmount(product);
        acc.margin += product.margenBruto || 0;
        return acc;
      },
      { units: 0, sales: 0, margin: 0 }
    );

    return {
      ...metrics,
      skuCount: productsInScope.length,
    };
  }, [productsInScope]);

  const filtersChips = useMemo(() => {
    const entries = Object.entries(share?.filters || {});
    return entries.filter(([, value]) => value !== null && value !== "");
  }, [share]);

  const loadingTable = (
    <Box height={280} display="flex" alignItems="center" justifyContent="center">
      <CircularProgress />
    </Box>
  );

  return (
    <Box p={3}>
      <Box mb={2}>
        <Typography variant="h4" fontWeight={800} gutterBottom display="flex" alignItems="center" gap={1}>
          <TrendingUpIcon />
          Dashboard de ventas por canal
        </Typography>
        <Typography color="text.secondary">
          Vista compartida de solo lectura. Este enlace vence en 24 horas.
        </Typography>
      </Box>

      {share?.expiresAt && (
        <Box mb={2}>
          <Chip label={`Vence: ${new Date(share.expiresAt).toLocaleString("es-CL")}`} variant="outlined" />
        </Box>
      )}

      <Box mb={2} display="flex" flexWrap="wrap" gap={1}>
        {filtersChips.length > 0 ? (
          filtersChips.map(([key, value]) => (
            <Chip key={`${key}-${value}`} label={`${key}: ${value}`} variant="outlined" />
          ))
        ) : (
          <Chip label="Sin filtros" />
        )}
        {selectedChannel && <Chip color="primary" label={`Canal: ${selectedChannelLabel}`} onDelete={() => setSelectedChannel("")} />}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        loadingTable
      ) : (
        <>
          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Ventas netas (CLP)
                  </Typography>
                  <Typography variant="h6" fontWeight={800}>
                    {formatMoney(totals.sales)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Universo total filtrado
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Ventas (unidades)
                  </Typography>
                  <Typography variant="h6" fontWeight={800}>
                    {formatUnits(totals.units)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Universo total filtrado
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Margen bruto
                  </Typography>
                  <Typography variant="h6" fontWeight={800}>
                    {formatMoney(totals.margin)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Universo total filtrado
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    SKUs
                  </Typography>
                  <Typography variant="h6" fontWeight={800}>
                    {formatUnits(totals.skuCount)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Universo total filtrado
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: 3, height: "100%", minHeight: 430 }}>
                <CardContent>
                  <Typography fontWeight={800}>Distribucion por canal</Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Haz click en un canal para filtrar las metricas y los productos
                  </Typography>
                  <Box height={330}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={channelSlices} dataKey="value" nameKey="label" innerRadius={70} outerRadius={110} paddingAngle={2}>
                          {channelSlices.map((entry, index) => (
                            <Cell
                              key={`cell-${entry.key}`}
                              fill={COLORS[index % COLORS.length]}
                              fillOpacity={!selectedChannel || selectedChannel === entry.key ? 1 : 0.25}
                              cursor="pointer"
                              onClick={() => setSelectedChannel((current) => (current === entry.key ? "" : entry.key))}
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(value: number) => formatUnits(value)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={8}>
              <Card sx={{ borderRadius: 3, height: "100%", minHeight: 430 }}>
                <CardContent>
                  <Typography fontWeight={800}>
                    {selectedChannel ? `Top productos vendidos en ${selectedChannelLabel}` : "Top productos por ventas"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {selectedChannel ? "Solo productos con ventas en el canal seleccionado" : "Universo total de productos"}
                  </Typography>
                  <Box height={330}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topProducts}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="nombre" hide />
                        <YAxis />
                        <RechartsTooltip
                          formatter={(value: number) => formatUnits(value)}
                          labelFormatter={(_label, payload) => {
                            const item = payload?.[0]?.payload as ProductItem | undefined;
                            return item ? `${item.nombre} - ${item.sku}` : "";
                          }}
                        />
                        <Legend />
                        <Bar dataKey="displaySales" fill="#4C6EDB" radius={[8, 8, 0, 0]} name={selectedChannel ? "Ventas canal" : "Ventas"} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} md={7}>
              <Card sx={{ borderRadius: 3, height: "100%", minHeight: 520 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip label={selectedChannel ? `Canal activo: ${selectedChannel}` : "Vista general"} size="small" />
                      <Chip label="Top 8" size="small" variant="outlined" />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Ordenado por ventas
                    </Typography>
                  </Box>
                  <TableContainer component={Paper} sx={{ boxShadow: "none", maxHeight: 420, border: "1px solid #e8eef8", borderRadius: 3 }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800, backgroundColor: "#f4f7fc" }}>SKU</TableCell>
                          <TableCell sx={{ fontWeight: 800, backgroundColor: "#f4f7fc" }}>Producto</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, backgroundColor: "#f4f7fc" }}>
                            {selectedChannel ? "Ventas canal" : "Ventas"}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, backgroundColor: "#f4f7fc" }}>Margen</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, backgroundColor: "#f4f7fc" }}>Stock 01+03</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {topProducts.map((product) => (
                          <TableRow key={product.sku} hover>
                            <TableCell sx={{ fontWeight: 700 }}>{product.sku}</TableCell>
                            <TableCell>
                              <Typography fontWeight={700}>{product.nombre}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Chip label={formatUnits(product.displaySales)} size="small" />
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                              {formatMoney(product.margenBruto)}
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                label={formatUnits(product.stock0103)}
                                size="small"
                                clickable
                                onClick={() => setStockDetailProduct(product)}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                        {!topProducts.length && (
                          <TableRow>
                            <TableCell colSpan={5} align="center">
                              Sin datos disponibles
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={5}>
              <Card sx={{ borderRadius: 3, height: "100%", minHeight: 520 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <Chip label="Menor disponibilidad" size="small" />
                    <Typography variant="caption" color="text.secondary">
                      Bodegas 01 + 03
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      height: 420,
                      border: "1px solid #f0e6d4",
                      borderRadius: 3,
                      p: 1,
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={lowStockProducts} layout="vertical" margin={{ left: 16, right: 24, top: 8, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="4 4" opacity={0.18} horizontal={false} />
                        <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                        <YAxis
                          type="category"
                          dataKey="nombre"
                          width={190}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 12, fontWeight: 600 }}
                        />
                        <RechartsTooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const row = payload[0].payload as ProductItem & { stock0103: number };
                            return (
                              <Box
                                sx={{
                                  background: "#fff",
                                  border: "1px solid #dfe6f3",
                                  borderRadius: 2,
                                  p: 1.5,
                                  boxShadow: 2,
                                }}
                              >
                                <Typography fontWeight={700} fontSize={13}>
                                  {row.nombre}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  Stock 01 + 03: {formatUnits(row.stock0103)}
                                </Typography>
                              </Box>
                            );
                          }}
                        />
                        <Legend />
                        <Bar dataKey="stock0103" fill="#F59E0B" radius={[0, 12, 12, 0]} name="Stock 01 + 03" barSize={22} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      <Dialog open={Boolean(stockDetailProduct)} onClose={() => setStockDetailProduct(null)} fullWidth maxWidth="md">
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography variant="h6" fontWeight={800}>
              Detalle de stock por bodegas
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {stockDetailProduct?.nombre} - SKU {stockDetailProduct?.sku}
            </Typography>
          </Box>
          <Button onClick={() => setStockDetailProduct(null)} startIcon={<CloseIcon />} size="small">
            Cerrar
          </Button>
        </DialogTitle>
        <DialogContent>
          {stockDetailProduct && (
            <TableContainer component={Paper} sx={{ mt: 1, boxShadow: "none", border: "1px solid #edf1f7", borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Bodega</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Stock</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getAllStock(stockDetailProduct.stock).map((item) => (
                    <TableRow key={`${stockDetailProduct.sku}-${item.bodega}`}>
                      <TableCell>{item.bodega}</TableCell>
                      <TableCell align="right">{formatUnits(item.stock)}</TableCell>
                    </TableRow>
                  ))}
                  {getAllStock(stockDetailProduct.stock).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} align="center">
                        No hay stock disponible
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
