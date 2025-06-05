'use client';

import React, { useState } from "react";
import {
  Box,
  Typography,
  Divider,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
  Button as MuiButton,
  Paper
} from "@mui/material";
import {
  FilterAltOutlined, Close as CloseIcon, Folder as FolderIcon,
  HourglassEmpty as HourglassEmptyIcon, Inventory as InventoryIcon,
  LocalShipping as LocalShippingIcon, CheckCircle as CheckCircleIcon,
  MonetizationOn as MonetizationOnIcon, TrendingUp as TrendingUpIcon,
  CreditCard as CreditCardIcon, PeopleAlt as PeopleAltIcon,
  WarningAmber as WarningAmberIcon, History as HistoryIcon,
  Warehouse as WarehouseIcon, Store as StoreIcon
} from "@mui/icons-material";

import HeaderDrawerProducto from "./components/HeaderDrawerProducto";
import MetricCard from "./components/MetricCard";
import { BACKEND_URL } from "@/config";
import { fetchWithToken } from "@/utils/fetchWithToken";

const AnalisisProductoPage = () => {
  const [openDrawer, setOpenDrawer] = useState(false);

  const handleOpenDrawer = () => setOpenDrawer(true);
  const handleCloseDrawer = () => setOpenDrawer(false);

  return (
    <Box p={1}>
      {/* Header con título y botón de filtros */}
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

      {/* Card principal con imagen y datos del producto */}
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
        <Box
          flexShrink={0}
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
        >
          <img
            src="https://mimbralb2c.vtexassets.com/arquivos/ids/156047-1200-auto?v=638818065559000000&width=1200&height=auto&aspect=true.png"
            alt="Producto"
            style={{ width: 96, height: 96, objectFit: "contain", borderRadius: 8 }}
          />
          <Typography
            variant="caption"
            color="primary"
            fontWeight="bold"
            sx={{ mt: 1 }}
          >
            Seyturario
          </Typography>
        </Box>

        {/* Info del producto y métricas */}
        <Box flex={1}>
          <Typography variant="h6" fontWeight={700}>CEMENTO 25KG POLPAICO</Typography>
          <Typography variant="body2" color="text.secondary" mb={1}>Canal: Todos</Typography>

          <Box display="flex" gap={1.5} flexWrap="wrap">
            <MetricCard icon={<FolderIcon color="primary" />} label="Stock" value="65 UI" variation="-24,44%" variationColor="error" />
            <MetricCard icon={<HourglassEmptyIcon color="success" />} label="Días Inventario" value="65" variation="S Unrt" variationColor="success" />
            <MetricCard icon={<InventoryIcon color="warning" />} label="Unidades" value="Unitas" variation="20,08% plt" variationColor="error" />
            <MetricCard icon={<LocalShippingIcon color="warning" />} label="Stock en tránsito" value="N/A" variation="N/A" variationColor="warning" />
            <MetricCard icon={<CheckCircleIcon color="success" />} label="Vaielo" value="72%" variation="No es necesario" variationColor="success" />
          </Box>
        </Box>
      </Box>

      {/* Fila principal con 3 columnas */}
      <Box display="flex" gap={2} mt={2} alignItems="stretch">
        {/* Columna izquierda */}
        <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} flex={1}>
          {[{
            label: 'Ventas', icon: <MonetizationOnIcon color="primary" />, value: '$24 UL', detail: 'Anterior: $154'
          }, {
            label: 'Margen Bruto', icon: <TrendingUpIcon color="success" />, value: '$249 bk', detail: '$5.7M', detailColor: 'error.main'
          }, {
            label: 'Promedio Ticket', icon: <CreditCardIcon color="error" />, value: '$249.6k', detail: '-20%', detailColor: 'error.main'
          }, {
            label: 'N° Transacciones', icon: <PeopleAltIcon color="primary" />, value: '12,044', detail: '+25%', detailColor: 'success.main'
          }].map((item, i) => (
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

        {/* Columna central */}
        <Box flex={1.2}>
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              height: '100%',
              borderRadius: 3,
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              gap: 3,
              bgcolor: 'background.paper',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e0e0e0'
            }}
          >
            <Box display="flex" flexDirection="column" gap={2} flex={1}>
              <Box display="flex" alignItems="center" gap={1}>
                <InventoryIcon color="info" />
                <Typography fontWeight={700} variant="subtitle1">Detalle de stock</Typography>
              </Box>
              <Box display="flex" flexDirection="column" gap={0.8}>
                <Typography variant="body2"><b>Unidades:</b> 90 <CheckCircleIcon fontSize="small" color="success" sx={{ ml: 0.5 }} /></Typography>
                <Typography variant="body2"><b>Reservado:</b> 40</Typography>
                <Typography variant="body2"><b>Stock en tránsito:</b> 40</Typography>
                <Typography variant="body2"><b>Cobertura:</b> 45 días</Typography>
              </Box>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />

            <Box flex={1}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <WarehouseIcon color="primary" />
                <Typography variant="subtitle1" fontWeight={700}>Stock por almacén</Typography>
              </Box>
              <Box display="flex" flexDirection="column" gap={0.6}>
                {[
                  { code: '01', nombre: 'Comercial Mimbral' },
                  { code: '02', nombre: 'Control de Pérdida' },
                  { code: '03', nombre: 'E-commerce' },
                  { code: '05', nombre: 'Full Mercado Libre' },
                  { code: '07', nombre: 'Balmaceda' },
                  { code: '12', nombre: 'Productos Perdidos' },
                  { code: '13', nombre: 'Bodega Ovalle' }
                ].map(({ code, nombre }) => (
                  <Box key={code} display="flex" alignItems="center" gap={1}>
                    <StoreIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      <b>{nombre}:</b> {Math.floor(Math.random() * 50) + 1} 
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Columna derecha */}
        <Box display="flex" flexDirection="column" gap={2} flex={1}>
          <Paper variant="outlined" sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', borderRadius: 3 }}>
            <WarningAmberIcon color="warning" />
            <Box>
              <Typography fontWeight={700}>Alertas actuales del producto</Typography>
              <Typography color="text.secondary">SIN ALERTAS</Typography>
            </Box>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', borderRadius: 3 }}>
            <HistoryIcon color="action" />
            <Box>
              <Typography fontWeight={700}>Histórico por rotación</Typography>
              <Typography color="text.secondary">Últimos 12 meses</Typography>
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Drawer de filtros */}
      <HeaderDrawerProducto open={openDrawer} onClose={handleCloseDrawer} />
    </Box>
  );
};

export default AnalisisProductoPage;
