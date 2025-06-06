'use client';

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Divider,
  Button as MuiButton,
  Paper
} from "@mui/material";
import {
  FilterAltOutlined, Folder as FolderIcon,
  HourglassEmpty as HourglassEmptyIcon, Inventory as InventoryIcon,
  LocalShipping as LocalShippingIcon, CheckCircle as CheckCircleIcon,
  MonetizationOn as MonetizationOnIcon, TrendingUp as TrendingUpIcon,
  CreditCard as CreditCardIcon, PeopleAlt as PeopleAltIcon,
  WarningAmber as WarningAmberIcon, History as HistoryIcon,
  Warehouse as WarehouseIcon, Store as StoreIcon
} from "@mui/icons-material";
import HeaderDrawerProducto from "./components/HeaderDrawerProducto";
import MetricCard from "./components/MetricCard";
import VentasChart from "./components/VentasChart";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";

const AnalisisProductoPage = () => {
  const [openDrawer, setOpenDrawer] = useState(false);

  const [margenTotal, setMargenTotal] = useState({
    MargenBrutoPeriodo: 0,
    MargenBrutoAnterior: 0,
    PorcentajeCambio: 0
  });

  const [filtros, setFiltros] = useState<{
    itemCode: string;
    temporada: string;
    periodo: string;
    fechaInicio: string;
    fechaFin: string;
    canal: string;
    modoComparacion: "" | "PeriodoAnterior" | "MismoPeriodoAnoAnterior";
  }>({
    itemCode: "",
    temporada: "",
    periodo: "1M",
    fechaInicio: "",
    fechaFin: "",
    canal: "Todos",
    modoComparacion: "",
  });

  useEffect(() => {
    const fetchMargenTotal = async () => {
      try {
        const response = await fetchWithToken(`${BACKEND_URL}/api/pv/margentotal`);
        if (!response) throw new Error("Error al obtener margen total");
        const data = await response.json();
        setMargenTotal(data);
      } catch (error) {
        console.error("❌ Error en margen total:", error);
      }
    };

    fetchMargenTotal();
  }, []);

  const handleOpenDrawer = () => setOpenDrawer(true);
  const handleCloseDrawer = () => setOpenDrawer(false);

  return (
    <Box p={1}>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        p={2}
        mb={3}
        borderRadius={2}
        border={1}
        borderColor="divider"
        bgcolor="background.paper"
        boxShadow="0 1px 2px rgba(0, 0, 0, 0.04)"
      >
        <Typography variant="h5" fontWeight={700} color="text.primary">
          ANÁLISIS DE PRODUCTO
        </Typography>
        <MuiButton
          variant="outlined"
          startIcon={<FilterAltOutlined />}
          onClick={handleOpenDrawer}
          sx={{ textTransform: "none", fontWeight: 500 }}
        >
          Filtros Avanzados
        </MuiButton>
      </Box>

      {/* Producto Principal */}
      <Box
        display="flex"
        alignItems="center"
        p={2}
        border={1}
        borderRadius={2}
        borderColor="divider"
        bgcolor="background.paper"
        boxShadow="0 1px 2px rgba(0, 0, 0, 0.04)"
        gap={3}
      >
        <Box flexShrink={0} display="flex" flexDirection="column" alignItems="center">
          <img
            src="https://mimbralb2c.vtexassets.com/arquivos/ids/156047-1200-auto?v=638818065559000000&width=1200&height=auto&aspect=true.png"
            alt="Producto"
            style={{ width: 96, height: 96, objectFit: "contain", borderRadius: 8 }}
          />
          <Typography variant="caption" color="primary" fontWeight="bold" sx={{ mt: 1 }}>
            Seyturario
          </Typography>
        </Box>

        <Box flex={1}>
          <Typography variant="h6" fontWeight={700}>CEMENTO 25KG POLPAICO</Typography>
          <Typography variant="body2" color="text.secondary" mb={1}>Canal: {filtros.canal}</Typography>

          <Box display="flex" gap={1.5} flexWrap="wrap">
            <MetricCard icon={<FolderIcon color="primary" />} label="Stock" value="65 U" variation="-24,44%" variationColor="error" />
            <MetricCard icon={<HourglassEmptyIcon color="success" />} label="Días Inventario" value="65" variation="S Unrt" variationColor="success" />
            <MetricCard icon={<InventoryIcon color="warning" />} label="Unidades Vendidas" value="30" variation="20,08% + que el periodo anterior" variationColor="error" />
            <MetricCard icon={<LocalShippingIcon color="warning" />} label="Stock en tránsito" value="4000" variationColor="warning" />
            <MetricCard icon={<CheckCircleIcon color="success" />} label="Valor" value="$2.850" variation="5% mayor que la ultima orden " variationColor="success" />
          </Box>
        </Box>
      </Box>

      {/* Grilla de KPIs */}
      <Box display="flex" gap={2} mt={2}>
        <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} flex={1}>
          {[
            {
              label: 'Ventas',
              icon: <MonetizationOnIcon color="primary" />,
              value: '$24 UL',
              detail: 'Anterior: $154'
            },
            {
              label: 'Margen Bruto',
              icon: <TrendingUpIcon color="success" />,
              value: new Intl.NumberFormat("es-CL", {
                style: "currency",
                currency: "CLP",
                maximumFractionDigits: 0
              }).format(margenTotal.MargenBrutoPeriodo),
              detail: `Anterior: ${new Intl.NumberFormat("es-CL", {
                style: "currency",
                currency: "CLP",
                maximumFractionDigits: 0
              }).format(margenTotal.MargenBrutoAnterior)}`,
              detailColor: margenTotal.PorcentajeCambio >= 0 ? 'success.main' : 'error.main'
            },
            {
              label: 'N° Transacciones',
              icon: <PeopleAltIcon color="primary" />,
              value: '12,044',
              detail: '+25%',
              detailColor: 'success.main'
            },
            {
            label: 'N° Transacciones', icon: <PeopleAltIcon color="primary" />, value: '12,044', detail: '+25%', detailColor: 'success.main'
          }
            
          ].map((item, i) => (
            <Paper key={i} variant="outlined" sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', borderRadius: 3 }}>
              {item.icon}
              <Box>
                <Typography variant="subtitle2" color="text.secondary">{item.label}</Typography>
                <Typography variant="h6" fontWeight={700}>{item.value}</Typography>
                <Typography variant="caption" sx={{ color: item.detailColor || 'text.secondary' }}>{item.detail}</Typography>
              </Box>
            </Paper>
          ))}
        </Box>

        {/* Columna intermedia */}
        <Box flex={1.2}>
          <Paper variant="outlined" sx={{ p: 3, height: '100%', borderRadius: 3, display: 'flex', justifyContent: 'space-between', gap: 3 }}>
            <Box flex={1}>
              <Typography fontWeight={700} mb={1}>Detalle de stock</Typography>
              <Typography variant="body2"><b>Unidades Disponibles:</b> 90</Typography>
              <Typography variant="body2"><b>Valor Total Inventario:</b> 40</Typography>
              <Typography variant="body2"><b>Notas de Venta:</b> 40</Typography>
              <Typography variant="body2"><b>Stock Disponible Total:</b> 45 días</Typography>
              <Typography variant="body2"><b>Unidades Con Fallas:</b> 400</Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box flex={1}>
              <Typography fontWeight={700} mb={1}>Stock por almacén</Typography>
              {['01', '02', '03', '05', '07', '12', '13'].map(code => (
                <Typography variant="body2" key={code}>
                  Almacén {code}: {Math.floor(Math.random() * 50) + 1}
                </Typography>
              ))}
            </Box>
          </Paper>
        </Box>

        {/* Columna derecha */}
        <Box flex={1} display="flex" flexDirection="column" gap={2}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <WarningAmberIcon color="warning" />
            <Typography fontWeight={700}>Alertas actuales del producto</Typography>
            <Typography color="text.secondary">SIN ALERTAS</Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <HistoryIcon color="action" />
            <Typography fontWeight={700}>Histórico por rotación</Typography>
            <Typography color="text.secondary">Últimos 12 meses</Typography>
          </Paper>
        </Box>
      </Box>

      {/* Gráficos y acciones */}
      <Box display="flex" gap={2} mt={3}>
        <Box flex={0.6}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <VentasChart filtros={filtros} />
          </Paper>
        </Box>
        <Box flex={0.4} display="flex" flexDirection="column" gap={2}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Typography fontWeight={700}>Histórico de Ventas</Typography>
            <Typography color="text.secondary">Últimos 12 meses</Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Typography fontWeight={700}>Sugerencia de Compra</Typography>
            <Typography color="success.main">SIN ALERTAS</Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Typography fontWeight={700}>Tiempos Logísticos</Typography>
            <Typography color="text.secondary">Lead time promedio: 4 días</Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Typography fontWeight={700}>Acciones</Typography>
            <MuiButton fullWidth variant="outlined" sx={{ mt: 1 }}>Ver Compras Pasadas</MuiButton>
            <MuiButton fullWidth variant="contained" sx={{ mt: 1 }}>Emitir Orden Sugerida</MuiButton>
          </Paper>
        </Box>
      </Box>

      {/* Drawer */}
      <HeaderDrawerProducto
        open={openDrawer}
        onClose={handleCloseDrawer}
        onApply={(filtrosAplicados) => setFiltros(filtrosAplicados)}
      />
    </Box>
  );
};

export default AnalisisProductoPage;
