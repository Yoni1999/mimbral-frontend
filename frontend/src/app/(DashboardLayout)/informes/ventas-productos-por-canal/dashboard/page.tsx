"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import { apiJson } from "@/utils/apiClient";
import { BACKEND_URL } from "@/config";

type ChannelItem = { canal: string; cantidadVendida: number; margenBruto: number; margenPorcentaje: number };
type StockItem = { bodega: string; stock: number };
type ProductItem = {
  sku: string;
  nombre: string;
  cantidadVendida: number;
  margenBruto: number;
  margenPorcentaje: number;
  stock?: StockItem[];
  porCanal: ChannelItem[];
};

const COLORS = ["#4C6EDB", "#7C8CFF", "#22C55E", "#F59E0B", "#EF4444", "#06B6D4"];

const formatNumber = (n?: number) => (typeof n === "number" ? n.toLocaleString("es-CL") : "-");
const money = (n?: number) => (typeof n === "number" ? n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }) : "-");
const getStockTotal = (stock?: StockItem[]) => (stock || []).filter((i) => i.bodega === "01" || i.bodega === "03").reduce((s, i) => s + (i.stock || 0), 0);

export default function DashboardVentasPorCanalPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProductItem[]>([]);

  const queryString = useMemo(() => searchParams.toString(), [searchParams]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams(queryString);
        params.set("page", "1");
        params.set("pageSize", "10000");
        params.set("sinPaginacion", "true");
        const res = await apiJson(`${BACKEND_URL}/api/informes/productos-por-canal-margen?${params.toString()}`);
        const json = await res!.json();
        setData(Array.isArray(json?.data) ? json.data : []);
      } catch (e) {
        console.error("Error cargando dashboard ventas por canal:", e);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [queryString]);

  const totals = useMemo(() => {
    const channels = new Map<string, number>();
    let ventas = 0;
    let margen = 0;
    let stock = 0;
    let skuCount = data.length;

    data.forEach((p) => {
      ventas += p.cantidadVendida || 0;
      margen += p.margenBruto || 0;
      stock += getStockTotal(p.stock);
      (p.porCanal || []).forEach((c) => channels.set(c.canal, (channels.get(c.canal) || 0) + (c.cantidadVendida || 0)));
    });

    return {
      ventas,
      margen,
      stock,
      skuCount,
      channels: Array.from(channels.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    };
  }, [data]);

  const topProducts = useMemo(
    () =>
      [...data]
        .sort((a, b) => (b.cantidadVendida || 0) - (a.cantidadVendida || 0))
        .slice(0, 8),
    [data]
  );

  const topChannelsByProduct = useMemo(
    () =>
      topProducts.map((p) => {
        const top = [...(p.porCanal || [])].sort((a, b) => b.cantidadVendida - a.cantidadVendida).slice(0, 2);
        return { sku: p.sku, nombre: p.nombre, top };
      }),
    [topProducts]
  );

  return (
    <Box p={3}>
      <Box mb={2}>
        <Typography variant="h4" fontWeight={800} gutterBottom display="flex" alignItems="center" gap={1}>
          <TrendingUpIcon />
          Dashboard de ventas por canal
        </Typography>
        <Typography color="text.secondary">
          Vista resumida con los mismos filtros aplicados desde la tabla.
        </Typography>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height={280}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box mb={2} display="flex" flexWrap="wrap" gap={1}>
            {searchParams.toString() ? (
              Array.from(searchParams.entries()).map(([k, v]) => (
                <Chip key={`${k}-${v}`} label={`${k}: ${v}`} variant="outlined" />
              ))
            ) : (
              <Chip label="Sin filtros" />
            )}
          </Box>

          <Grid container spacing={2} mb={2}>
            {[
              { label: "Ventas netas", value: money(totals.ventas), icon: <AssessmentOutlinedIcon /> },
              { label: "Margen bruto", value: money(totals.margen), icon: <TrendingUpIcon /> },
              { label: "Stock 01+03", value: formatNumber(totals.stock), icon: <Inventory2OutlinedIcon /> },
              { label: "SKUs", value: formatNumber(totals.skuCount), icon: <StorefrontOutlinedIcon /> },
            ].map((card) => (
              <Grid item xs={12} sm={6} md={3} key={card.label}>
                <Card sx={{ borderRadius: 3, height: "100%" }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Box sx={{ width: 40, height: 40, borderRadius: 2, display: "grid", placeItems: "center", backgroundColor: "#eef3ff", color: "#294273" }}>
                        {card.icon}
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">{card.label}</Typography>
                        <Typography variant="h6" fontWeight={800}>{card.value}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: 3, height: 360 }}>
                <CardContent sx={{ height: "100%" }}>
                  <Typography fontWeight={800} mb={1}>Distribución por canal</Typography>
                  <ResponsiveContainer width="100%" height="90%">
                    <PieChart>
                      <Pie data={totals.channels} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={2}>
                        {totals.channels.map((entry, index) => (
                          <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => formatNumber(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={8}>
              <Card sx={{ borderRadius: 3, height: 360 }}>
                <CardContent sx={{ height: "100%" }}>
                  <Typography fontWeight={800} mb={1}>Top canales por producto</Typography>
                  <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={topProducts}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="nombre" hide />
                      <YAxis />
                      <Tooltip formatter={(value: any) => formatNumber(value)} />
                      <Legend />
                      <Bar dataKey="cantidadVendida" fill="#4C6EDB" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} md={7}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography fontWeight={800} mb={2}>Productos destacados</Typography>
                  <TableContainer component={Paper} sx={{ boxShadow: "none", maxHeight: 420 }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>SKU</TableCell>
                          <TableCell>Producto</TableCell>
                          <TableCell align="right">Ventas</TableCell>
                          <TableCell align="right">Margen</TableCell>
                          <TableCell align="right">Stock</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {topProducts.map((p) => (
                          <TableRow key={p.sku}>
                            <TableCell>{p.sku}</TableCell>
                            <TableCell>{p.nombre}</TableCell>
                            <TableCell align="right">{formatNumber(p.cantidadVendida)}</TableCell>
                            <TableCell align="right">{money(p.margenBruto)}</TableCell>
                            <TableCell align="right">{formatNumber(getStockTotal(p.stock))}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={5}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Typography fontWeight={800} mb={2}>Top 2 canales por producto</Typography>
                  <Box display="flex" flexDirection="column" gap={1.5}>
                    {topChannelsByProduct.map((item) => (
                      <Box key={item.sku} sx={{ p: 1.5, borderRadius: 2, border: "1px solid #e5eaf3", background: "#fff" }}>
                        <Typography fontWeight={700} mb={0.5}>{item.nombre}</Typography>
                        <Box display="flex" gap={1} flexWrap="wrap">
                          {item.top.map((c) => (
                            <Chip key={`${item.sku}-${c.canal}`} label={`${c.canal}: ${formatNumber(c.cantidadVendida)}`} sx={{ backgroundColor: "rgba(76,110,219,0.10)" }} />
                          ))}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}

