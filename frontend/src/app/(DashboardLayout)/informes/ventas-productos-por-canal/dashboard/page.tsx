"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import { apiJson } from "@/utils/apiClient";
import { BACKEND_URL } from "@/config";

type ChannelItem = {
  canal: string;
  cantidadVendida: number;
  margenBruto: number;
  margenPorcentaje: number;
};

type StockItem = {
  bodega: string;
  stock: number;
};

type ProductItem = {
  sku: string;
  nombre: string;
  cantidadVendida: number;
  margenBruto: number;
  margenPorcentaje: number;
  costoTotal: number;
  stock?: StockItem[];
  porCanal: ChannelItem[];
};

type ChannelSlice = {
  key: string;
  label: string;
  value: number;
};

type ProductView = ProductItem & {
  displaySales: number;
  stock0103: number;
};

type StockDetailProduct = ProductView | null;

const COLORS = ["#4C6EDB", "#7C8CFF", "#22C55E", "#F59E0B", "#EF4444", "#06B6D4"];
const shimmer = keyframes`
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
`;
const floaty = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-4px);
  }
`;

const channelLabelMap: Record<string, string> = {
  meli: "Meli",
  falabella: "Falabella",
  balmaceda: "Balmaceda",
  vitex: "Vtex",
  chorrillo: "Chorrillo",
  empresas: "Empresas",
};

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

const channelDisplayLabel = (channelKey: string) => channelLabelMap[channelKey] || channelKey;

const ShimmerBlock = ({
  width = "100%",
  height,
  borderRadius = 2,
  sx,
  delay = 0,
}: {
  width?: string | number;
  height: number | string;
  borderRadius?: number;
  sx?: object;
  delay?: number;
}) => (
  <Box
    sx={{
      width,
      height,
      borderRadius,
      background:
        "linear-gradient(90deg, rgba(229,232,240,0.65) 0%, rgba(245,247,251,0.95) 50%, rgba(229,232,240,0.65) 100%)",
      backgroundSize: "200% 100%",
      animation: `${shimmer} 1.6s linear infinite`,
      animationDelay: `${delay}s`,
      ...sx,
    }}
  />
);

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  loading,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  loading: boolean;
}) {
  return (
    <Card sx={{ borderRadius: 3, height: "100%", minHeight: 108 }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              backgroundColor: "#eef3ff",
              color: "#294273",
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            {loading ? (
              <Box sx={{ animation: `${floaty} 2.8s ease-in-out infinite` }}>
                <ShimmerBlock width={120} height={14} borderRadius={999} />
                <Box height={8} />
                <ShimmerBlock width={90} height={30} borderRadius={2} />
                <Box height={8} />
                <ShimmerBlock width={170} height={12} borderRadius={999} />
              </Box>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary">
                  {title}
                </Typography>
                <Typography variant="h6" fontWeight={800}>
                  {value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {subtitle}
                </Typography>
              </>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function SectionCard({
  title,
  subtitle,
  loading,
  loadingNode,
  actionNode,
  children,
  minHeight,
}: {
  title: string;
  subtitle?: string;
  loading: boolean;
  loadingNode: React.ReactNode;
  actionNode?: React.ReactNode;
  children?: React.ReactNode;
  minHeight?: number;
}) {
  return (
    <Card sx={{ borderRadius: 3, height: "100%", minHeight: minHeight ?? 360 }}>
      <CardContent sx={{ height: "100%" }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={1}>
          <Box>
            <Typography fontWeight={800}>{title}</Typography>
            {subtitle ? (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            ) : null}
          </Box>
          {actionNode}
        </Box>
        {loading ? loadingNode : children}
      </CardContent>
    </Card>
  );
}

const DashboardVentasPorCanalPage: React.FC = () => {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProductItem[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const [stockDetailProduct, setStockDetailProduct] = useState<StockDetailProduct>(null);

  const queryString = useMemo(() => searchParams?.toString() ?? "", [searchParams]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams(queryString);
        params.set("page", "1");
        params.set("pageSize", "10000");
        params.set("sinPaginacion", "true");
        const res = await apiJson(
          `${BACKEND_URL}/api/informes/productos-por-canal-margen?${params.toString()}`
        );
        const json = await res!.json();
        setData(Array.isArray(json?.data) ? json.data : []);
      } catch (error) {
        console.error("Error cargando dashboard ventas por canal:", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [queryString]);

  const channelSlices: ChannelSlice[] = useMemo(() => {
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
  const scopeLabel = selectedChannel
    ? `Productos con ventas en ${selectedChannelLabel}`
    : "Universo total filtrado";

  const productsInScope: ProductView[] = useMemo(() => {
    const source = selectedChannel
      ? data.filter((product) => getChannelProductQuantity(product, selectedChannel) > 0)
      : data;

    return source
      .map((product) => ({
        ...product,
        displaySales: selectedChannel
          ? getChannelProductQuantity(product, selectedChannel)
          : product.cantidadVendida || 0,
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

  const lowStockChartTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
    if (!active || !payload?.length) return null;
    const row = payload[0].payload as ProductView;
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
  };

  const openStockDetail = (product: ProductView) => {
    setStockDetailProduct(product);
  };

  const closeStockDetail = () => {
    setStockDetailProduct(null);
  };

  const loadingPie = (
    <Box height={300} display="flex" alignItems="center" justifyContent="center" flexDirection="column" gap={2}>
      <Box sx={{ animation: `${floaty} 3s ease-in-out infinite` }}>
        <Skeleton variant="circular" width={160} height={160} />
      </Box>
      <Box display="flex" gap={1} flexWrap="wrap" justifyContent="center">
        {Array.from({ length: 6 }).map((_, idx) => (
          <Box key={idx} sx={{ animation: `${floaty} 2.4s ease-in-out infinite`, animationDelay: `${idx * 0.08}s` }}>
            <ShimmerBlock width={72} height={24} borderRadius={999} />
          </Box>
        ))}
      </Box>
    </Box>
  );
  const loadingBar = (
    <Box height={300} display="flex" alignItems="flex-end" gap={1}>
      {Array.from({ length: 8 }).map((_, idx) => (
        <Box
          key={idx}
          sx={{
            width: "100%",
            display: "flex",
            alignItems: "flex-end",
            animation: `${floaty} 2.6s ease-in-out infinite`,
            animationDelay: `${idx * 0.1}s`,
          }}
        >
          <ShimmerBlock width="100%" height={80 + idx * 10} borderRadius={1.5} />
        </Box>
      ))}
    </Box>
  );
  const loadingHorizontalBars = (
    <Box height={300} display="flex" flexDirection="column" gap={1}>
      {Array.from({ length: 8 }).map((_, idx) => (
        <Box
          key={idx}
          sx={{
            animation: `${floaty} 2.5s ease-in-out infinite`,
            animationDelay: `${idx * 0.08}s`,
          }}
        >
          <ShimmerBlock width={`${95 - idx * 6}%`} height={28} borderRadius={1.5} />
        </Box>
      ))}
    </Box>
  );
  const loadingTable = (
    <TableContainer component={Paper} sx={{ boxShadow: "none", maxHeight: 420 }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            {["SKU", "Producto", "Ventas", "Margen", "Stock 01+03"].map((head, headIdx) => (
              <TableCell
                key={head}
                sx={headIdx === 0 || headIdx === 3 ? { display: { xs: "none", md: "table-cell" } } : undefined}
              >
                {head}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: 6 }).map((_, idx) => (
            <TableRow key={idx}>
              {Array.from({ length: 5 }).map((__, cellIdx) => (
                <TableCell
                  key={cellIdx}
                  sx={cellIdx === 0 || cellIdx === 3 ? { display: { xs: "none", md: "table-cell" } } : undefined}
                >
                  <ShimmerBlock
                    width={cellIdx === 1 ? 220 : 90}
                    height={14}
                    borderRadius={999}
                    delay={idx * 0.08 + cellIdx * 0.04}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box sx={{ p: { xs: 1.5, md: 3 } }}>
      <Box mb={2}>
        <Typography
          variant="h4"
          fontWeight={800}
          gutterBottom
          display="flex"
          alignItems="center"
          gap={1}
          sx={{ flexWrap: "wrap", fontSize: { xs: "1.4rem", sm: "2.125rem" } }}
        >
          <TrendingUpIcon />
          Dashboard de ventas por canal
        </Typography>
        <Typography color="text.secondary">
          Vista resumida con los mismos filtros aplicados desde la tabla.
        </Typography>
      </Box>

      <Box mb={2} display="flex" flexWrap="wrap" gap={1}>
        {searchParams?.toString() ? (
          Array.from(searchParams.entries()).map(([key, value]) => (
            <Chip key={`${key}-${value}`} label={`${key}: ${value}`} variant="outlined" />
          ))
        ) : (
          <Chip label="Sin filtros" />
        )}
        {selectedChannel && (
          <Chip
            color="primary"
            label={`Canal: ${selectedChannelLabel}`}
            onDelete={() => setSelectedChannel("")}
          />
        )}
      </Box>

      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Ventas netas (CLP)"
            value={formatMoney(totals.sales)}
            subtitle={scopeLabel}
            icon={<PaymentsOutlinedIcon />}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Ventas (unidades)"
            value={formatUnits(totals.units)}
            subtitle={scopeLabel}
            icon={<ShoppingCartOutlinedIcon />}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Margen bruto"
            value={formatMoney(totals.margin)}
            subtitle={scopeLabel}
            icon={<TrendingUpIcon />}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="SKUs"
            value={formatUnits(totals.skuCount)}
            subtitle={scopeLabel}
            icon={<StorefrontOutlinedIcon />}
            loading={loading}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} md={4}>
          <SectionCard
            title="Distribucion por canal"
            subtitle="Haz click en un canal para filtrar las metricas y los productos"
            loading={loading}
            loadingNode={loadingPie}
            minHeight={430}
          >
            <Box height={330}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelSlices}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={2}
                  >
                    {channelSlices.map((entry, index) => {
                      const isActive = !selectedChannel || selectedChannel === entry.key;
                      return (
                        <Cell
                          key={`cell-${entry.key}`}
                          fill={COLORS[index % COLORS.length]}
                          fillOpacity={isActive ? 1 : 0.25}
                          cursor="pointer"
                          onClick={() => setSelectedChannel((current) => (current === entry.key ? "" : entry.key))}
                        />
                      );
                    })}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: number) => formatUnits(value)}
                    labelFormatter={(label) => channelDisplayLabel(String(label).toLowerCase())}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={8}>
          <SectionCard
            title={selectedChannel ? `Top productos vendidos en ${selectedChannelLabel}` : "Top productos por ventas"}
            subtitle={selectedChannel ? "Solo productos con ventas en el canal seleccionado" : "Universo total de productos"}
            loading={loading}
            loadingNode={loadingBar}
            minHeight={430}
          >
            <Box height={330}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="nombre" hide />
                  <YAxis />
                  <RechartsTooltip
                    formatter={(value: number) => formatUnits(value)}
                    labelFormatter={(_label, payload) => {
                      const item = payload?.[0]?.payload as ProductView | undefined;
                      return item ? `${item.nombre} - ${item.sku}` : "";
                    }}
                  />
                  <Legend />
                  <Bar dataKey="displaySales" fill="#4C6EDB" radius={[8, 8, 0, 0]} name={selectedChannel ? "Ventas canal" : "Ventas"} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </SectionCard>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <SectionCard
            title={selectedChannel ? `Productos destacados en ${selectedChannelLabel}` : "Productos destacados"}
            subtitle={selectedChannel ? "Filtrado por el canal seleccionado" : "Top productos del universo total"}
            loading={loading}
            loadingNode={loadingTable}
            minHeight={520}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Box display="flex" alignItems="center" gap={1}>
                <Chip
                  label={selectedChannel ? `Canal activo: ${selectedChannelLabel}` : "Vista general"}
                  size="small"
                  sx={{
                    backgroundColor: alpha("#4C6EDB", 0.08),
                    color: "#294273",
                    fontWeight: 700,
                  }}
                />
                <Chip
                  label="Top 8"
                  size="small"
                  variant="outlined"
                  sx={{
                    borderColor: "#d9e2f3",
                    color: "#6b7a99",
                    fontWeight: 600,
                  }}
                />
              </Box>
              <Typography variant="caption" color="text.secondary">
                Ordenado por ventas
              </Typography>
            </Box>
            <TableContainer
              component={Paper}
              sx={{
                boxShadow: "none",
                maxHeight: 420,
                border: "1px solid #e8eef8",
                borderRadius: 3,
                overflow: "auto",
                background: "linear-gradient(180deg, #ffffff 0%, #fbfcff 100%)",
              }}
            >
              <Table stickyHeader size="small" sx={{ minWidth: 560 }}>
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
                    <TableRow
                      key={product.sku}
                      hover
                      sx={{
                        "&:nth-of-type(odd)": { backgroundColor: alpha("#4C6EDB", 0.02) },
                        "&:hover": { backgroundColor: alpha("#4C6EDB", 0.06) },
                      }}
                    >
                      <TableCell sx={{ fontWeight: 700, color: "#294273" }}>{product.sku}</TableCell>
                      <TableCell>
                        <Typography fontWeight={700} sx={{ lineHeight: 1.2 }}>
                          {product.nombre}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={formatUnits(product.displaySales)}
                          size="small"
                          sx={{ backgroundColor: alpha("#4C6EDB", 0.08), fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {formatMoney(product.margenBruto)}
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={formatUnits(product.stock0103)}
                          size="small"
                          clickable
                          onClick={() => openStockDetail(product)}
                          sx={{
                            backgroundColor: alpha("#F59E0B", 0.1),
                            fontWeight: 700,
                            cursor: "pointer",
                            "&:hover": { backgroundColor: alpha("#F59E0B", 0.18) },
                          }}
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
          </SectionCard>
        </Grid>

        <Grid item xs={12} md={5}>
          <SectionCard
            title="Productos con menor stock 01+03"
            subtitle="Se ordena por la suma del stock de las bodegas 01 y 03"
            loading={loading}
            loadingNode={loadingHorizontalBars}
            minHeight={520}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
              <Chip
                label="Menor disponibilidad"
                size="small"
                sx={{
                  backgroundColor: alpha("#F59E0B", 0.12),
                  color: "#9a5f00",
                  fontWeight: 700,
                }}
              />
              <Typography variant="caption" color="text.secondary">
                Bodegas 01 + 03
              </Typography>
            </Box>
            <Box
              sx={{
                height: 420,
                border: "1px solid #f0e6d4",
                borderRadius: 3,
                background:
                  "radial-gradient(circle at top left, rgba(245,158,11,0.09), transparent 35%), linear-gradient(180deg, #ffffff 0%, #fffaf0 100%)",
                p: 1,
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lowStockProducts} layout="vertical" margin={{ left: 16, right: 24, top: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="4 4" opacity={0.18} horizontal={false} />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#7b8798", fontSize: 12 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="nombre"
                    width={190}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#294273", fontSize: 12, fontWeight: 600 }}
                  />
                  <RechartsTooltip content={lowStockChartTooltip} />
                  <Legend />
                  <Bar
                    dataKey="stock0103"
                    fill="url(#stockGradient)"
                    radius={[0, 12, 12, 0]}
                    name="Stock 01 + 03"
                    barSize={22}
                  />
                  <defs>
                    <linearGradient id="stockGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#FDBA74" />
                      <stop offset="100%" stopColor="#F59E0B" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </SectionCard>
        </Grid>
      </Grid>

      <Dialog
        open={Boolean(stockDetailProduct)}
        onClose={closeStockDetail}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            fontWeight: 800,
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={800}>
              Detalle de stock por bodegas
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {stockDetailProduct?.nombre} - SKU {stockDetailProduct?.sku}
            </Typography>
          </Box>
          <Button onClick={closeStockDetail} startIcon={<CloseIcon />} size="small">
            Cerrar
          </Button>
        </DialogTitle>
        <DialogContent sx={{ pt: 1, pb: 2 }}>
          {stockDetailProduct && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Card
                  sx={{
                    borderRadius: 3,
                    border: "1px solid #edf1f7",
                    background: "linear-gradient(180deg, #ffffff 0%, #fbfcff 100%)",
                  }}
                >
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Stock 01 + 03
                    </Typography>
                    <Typography variant="h4" fontWeight={800} color="#294273">
                      {formatUnits(stockDetailProduct.stock0103)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Suma usada para ordenar este dashboard
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={8}>
                <Card
                  sx={{
                    borderRadius: 3,
                    border: "1px solid #edf1f7",
                    height: "100%",
                  }}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography fontWeight={800}>Todas las bodegas</Typography>
                      <Chip
                        label={`${getAllStock(stockDetailProduct.stock).length} bodegas`}
                        size="small"
                        sx={{ backgroundColor: alpha("#4C6EDB", 0.08), fontWeight: 700 }}
                      />
                    </Box>
                    <TableContainer
                      component={Paper}
                      sx={{
                        boxShadow: "none",
                        maxHeight: 340,
                        border: "1px solid #eef2f8",
                        borderRadius: 2,
                      }}
                    >
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 800, backgroundColor: "#f4f7fc" }}>Bodega</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, backgroundColor: "#f4f7fc" }}>
                              Stock
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {getAllStock(stockDetailProduct.stock).length ? (
                            getAllStock(stockDetailProduct.stock).map((item) => (
                              <TableRow key={`${stockDetailProduct.sku}-${item.bodega}`}>
                                <TableCell sx={{ fontWeight: 700 }}>
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <span>{item.bodega}</span>
                                    {(item.bodega === "01" || item.bodega === "03") && (
                                      <Chip
                                        label="Incluida en 01+03"
                                        size="small"
                                        sx={{
                                          backgroundColor: alpha("#F59E0B", 0.12),
                                          color: "#9a5f00",
                                          fontWeight: 700,
                                          height: 24,
                                        }}
                                      />
                                    )}
                                  </Box>
                                </TableCell>
                                <TableCell align="right">
                                  <Chip
                                    label={formatUnits(item.stock)}
                                    size="small"
                                    sx={{
                                      backgroundColor: alpha("#F59E0B", 0.12),
                                      fontWeight: 700,
                                    }}
                                  />
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                                <TableCell colSpan={2} align="center">
                                No hay stock disponible
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeStockDetail} variant="contained">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DashboardVentasPorCanalPage;
