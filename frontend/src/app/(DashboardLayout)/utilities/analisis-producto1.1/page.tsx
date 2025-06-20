'use client';

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button as MuiButton,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from "@mui/material";
import {
  FilterAltOutlined, Folder as FolderIcon,
  HourglassEmpty as HourglassEmptyIcon, Inventory as InventoryIcon,
  LocalShipping as LocalShippingIcon, CheckCircle as CheckCircleIcon,
  MonetizationOn as MonetizationOnIcon, TrendingUp as TrendingUpIcon,
  CreditCard as CreditCardIcon, PeopleAlt as PeopleAltIcon,
  WarningAmber as WarningAmberIcon, History as HistoryIcon,
  Warehouse as WarehouseIcon, Store as ErrorIcon,
  ReportProblem as ReportProblemIcon
} from "@mui/icons-material";
import HeaderDrawerProducto from "./components/HeaderDrawerProducto";
import HistorialVentasModal from "./components/HistorialVentasModal";
import HistorialOrdenesCompraModal from "./components/HistorialOrdenesCompraModal.tsx";
import MetricCard from "./components/MetricCard";
import dynamic from "next/dynamic";
const VentasCanalChart = dynamic(() => import("./components/VentasCanalChart"), { ssr: false });
import VentasChart from "./components/VentasChart";
import TopVendedoresChart from "./components/TopVendedoresChart";
import ModalProveedor from './components/ModalProveedor'; 
import FechaRotacion from "./components/FechaRotacion";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";
import { formatVentas, formatUnidades, calcularVariacion  } from "@/utils/format";

type UnidadesMes = {
  Año: string;
  Mes: string;
  NumeroMes: number;
  UnidadesVendidas: number;
};

type Producto = {
  itemcode: string;
  itemname: string;
  U_Imagen: string;
};
type ResumenProducto = {
  itemCode: string;
  stockTotal: {
    ItemCode: string;
    ItemName: string;
    StockTotal: number;
  };
  cobertura: {
    ItemCode: string;
    ItemName: string;
    Stock: number;
    VentasUltimas2Semanas: number;
    VentasMismoPeriodoAnterior: number;
    PromedioDiario: number;
    CoberturaEnDias: number;
  };
  stockTransito: number;
  costos: {
    ItemCode: string;
    UltimoCosto: number;
    FechaUltimaOC: string;
    CostoAnterior: number;
    FechaOCAnterior: string;
    MonedaUltima: string;
    MonedaAnterior: string;
    TipoCambioAnterior: number;
    TipoCambioUltima: number;
  };
  ultimaVenta: {
    ItemCode: string;
    FechaUltimaVenta: string; 
    HoraUltimaVenta: number;  
  } | null;
};



const AnalisisProductoPage = () => {
  const [openDrawer, setOpenDrawer] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [resumenProducto, setResumenProducto] = useState<ResumenProducto | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [ventasMensuales, setVentasMensuales] = useState([]);
  const [modalOrdenesOpen, setModalOrdenesOpen] = useState(false);
  const [ordenesCompra, setOrdenesCompra] = useState([]);
  const [modalProveedorOpen, setModalProveedorOpen] = useState(false);
  const [proveedorInfo, setProveedorInfo] = useState<
  { Proveedor_Codigo: string; Proveedor_Nombre: string; Promedio_Dias_Entrega: number }[]
>([]);

  const [stockPorAlmacen, setStockPorAlmacen] = useState<null | Record<string, {
  unidades: number;
  notasVenta: number;
  oc: number;
  disponible: number;}>>(null);
  const [unidadesMesData, setUnidadesMesData] = useState<UnidadesMes[]>([]); 


  const handleOpenProveedorModal = () => {
  setModalProveedorOpen(true);
};


  const [margenTotal, setMargenTotal] = useState({
    MargenBrutoPeriodo: 0,
    MargenBrutoAnterior: 0,
    PorcentajeCambio: 0
  });
  const [ventasTotal, setVentasTotal] = useState({
  TotalVentasPeriodo: 0,
  TotalVentasAnterior: 0,
  PorcentajeCambio: 0
  });
  const[promedioTicket, setPromedioTicket] = useState({
    PromedioPorTicket: 0,
    PromedioAnterior: 0,
    PorcentajeCambio: 0,
  });
  const [nTransacciones, setNTransacciones] = useState({
  CantidadTransaccionesPeriodo: 0,
  CantidadTransaccionesAnterior: 0,
  PorcentajeCambio: 0,
  });
  const [unidadesVendidas, setUnidadesVendidas] = useState({
  CantidadVendida: 0,
  CantidadVendidaAnterior: 0,
  PorcentajeCambio: 0,
});
const [detalleStock, setDetalleStock] = useState<{
  detalleInventario: {
    UltimoCosto: number;
    TotalUnidades: number;
    ValorInventario: number;
  };
  notasVenta: number;
  unidadesConFallas: number;
} | null>(null);
const [vendedores, setVendedores] = useState<any[]>([]);

const parseFechaHoraLocal = (fechaISO: string, horaSAP: number): string => {
  try {
    // Separar componentes de la fecha
    const [year, month, day] = fechaISO.split("T")[0].split("-");

    // Convertir DocTime(ej: 941 → 09:41)
    const horaStr = horaSAP.toString().padStart(4, "0");
    const horas = horaStr.slice(0, 2);
    const minutos = horaStr.slice(2, 4);

    // Crear objeto Date manualmente
    const fecha = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(horas),
      Number(minutos)
    );

    // Formatear en formato local CL
    return fecha.toLocaleString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.error("❌ Error formateando fecha/hora:", error);
    return "Fecha inválida";
  }
};


const getDiasDesdeVenta = (fecha: string): number => {
  const hoy = new Date();
  const fechaVenta = new Date(fecha);
  const diff = hoy.getTime() - fechaVenta.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

const dias = resumenProducto && resumenProducto.ultimaVenta
  ? getDiasDesdeVenta(resumenProducto.ultimaVenta.FechaUltimaVenta)
  : null;

let Icono = null;
let color = "default";
let textoEstado = "Sin registros";

if (dias !== null) {
  if (dias <= 7) {
    Icono = <CheckCircleIcon color="success" />;
    color = "success";
    textoEstado = "Venta reciente";
  } else if (dias <= 20) {
    Icono = <WarningAmberIcon color="warning" />;
    color = "warning";
    textoEstado = `Sin venta hace ${dias} días`;
  } else {
    Icono = <ReportProblemIcon color="error" />;
    color = "error";
    textoEstado = `Más de ${dias} días sin vender`;
  }
}
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
    periodo: "",
    fechaInicio: "",
    fechaFin: "",
    canal: "Todos",
    modoComparacion: "",
  });

const buildQueryFromFiltros = (f: typeof filtros): string => {
  const params = new URLSearchParams({
    itemCode: f.itemCode || '',
    temporada: f.temporada || '',
    periodo: f.periodo || '',
    fechaInicio: f.fechaInicio || '',
    fechaFin: f.fechaFin || '',
    canal: f.canal || '',
    modoComparacion: f.modoComparacion || '',
  });
  return params.toString();
};

const handleCanalSeleccionado = (canalSeleccionado: string) => {
  setFiltros((prev) => ({
    ...prev,
    canal: canalSeleccionado,
  }));
};


const calcularPromedioGlobal = () => {
  if (proveedorInfo.length === 0) return null;
  const total = proveedorInfo.reduce((acc, p) => acc + p.Promedio_Dias_Entrega, 0);
  return (total / proveedorInfo.length).toFixed(1);
};
useEffect(() => {
  const fetchUnidadesVendidas = async () => {
    try {
      const query = buildQueryFromFiltros(filtros);
      const response = await fetchWithToken(`${BACKEND_URL}/api/pv/unidadesvendidas?${query}`);
      if (!response) throw new Error("Error al obtener unidades vendidas");
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        setUnidadesVendidas({
          CantidadVendida: data[0].CantidadVendida ?? 0,
          CantidadVendidaAnterior: data[0].CantidadVendidaAnterior ?? 0,
          PorcentajeCambio: data[0].PorcentajeCambio ?? 0
        });
      } else {
        setUnidadesVendidas({
          CantidadVendida: 0,
          CantidadVendidaAnterior: 0,
          PorcentajeCambio: 0
        });
      }
    } catch (error) {
      console.error("❌ Error al obtener unidades vendidas:", error);
    }
  };

  if (filtros.itemCode) {
    fetchUnidadesVendidas();
  }
}, [filtros]);

  
useEffect(() => {
    const fetchMargenTotal = async () => {
    try {
        const query = buildQueryFromFiltros(filtros);
        const response = await fetchWithToken(`${BACKEND_URL}/api/pv/margentotal?${query}`);

        if (!response) throw new Error("Error al obtener margen total");

        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
        setMargenTotal({
            MargenBrutoPeriodo: data[0].MargenBrutoPeriodo ?? 0,
            MargenBrutoAnterior: data[0].MargenBrutoAnterior ?? 0,
            PorcentajeCambio: data[0].PorcentajeCambio ?? 0
        });

        } else {
        setMargenTotal({ MargenBrutoPeriodo: 0, MargenBrutoAnterior: 0, PorcentajeCambio: 0 });
        }
    } catch (error) {
        console.error("❌ Error al obtener margen total:", error);
    }
    };


  // Solo ejecutar si hay un itemCode seleccionado
  if (filtros.itemCode) {
    fetchMargenTotal();
  }
}, [filtros]);

useEffect(() => {
  const fetchVentasTotal = async () => {
    try {
      const query = buildQueryFromFiltros(filtros);
      const response = await fetchWithToken(`${BACKEND_URL}/api/pv/ventastotal?${query}`);
      if (!response) throw new Error("Error al obtener ventas total");
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setVentasTotal({
            TotalVentasPeriodo: data[0].TotalVentasPeriodo ?? 0,
            TotalVentasAnterior: data[0].TotalVentasAnterior ?? 0,
            PorcentajeCambio: data[0].PorcentajeCambio ?? 0
        });

      } else {
        setVentasTotal({
          TotalVentasPeriodo: 0,
          TotalVentasAnterior: 0,
          PorcentajeCambio: 0
        });
      }
    } catch (error) {
      console.error("❌ Error al obtener ventas total:", error);
    }
  };

  if (filtros.itemCode) {
    fetchVentasTotal();
  }
}, [filtros]);
useEffect(() => {
  const fetchPromedioTicket = async () => {
    try {
      const query = buildQueryFromFiltros(filtros);
      const response = await fetchWithToken(`${BACKEND_URL}/api/pv/ticketpromedio?${query}`);
      if (!response) throw new Error("Error al obtener ticket promedio");
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setPromedioTicket({
            PromedioPorTicket: data[0].PromedioPorTicket ?? 0,
            PromedioAnterior: data[0].PromedioAnterior ?? 0,
            PorcentajeCambio: data[0].PorcentajeCambio ?? 0
        });

      } else {
        setPromedioTicket({
          PromedioPorTicket: 0,
          PromedioAnterior: 0,
          PorcentajeCambio: 0
        });
      }
    } catch (error) {
      console.error("❌ Error al obtener ticket promedio:", error);
    }
  };

  if (filtros.itemCode) {
    fetchPromedioTicket();
  }
}, [filtros]);

useEffect(() => {
  const fetchTransacciones = async () => {
    try {
      const params = new URLSearchParams({
        itemCode: filtros.itemCode || '',
        canal: filtros.canal || '',
        periodo: filtros.periodo || '',
        fechaInicio: filtros.fechaInicio || '',
        fechaFin: filtros.fechaFin || '',
        modoComparacion: filtros.modoComparacion || ''
      }).toString();

      const res = await fetchWithToken(`${BACKEND_URL}/api/pv/transacciones?${params}`);
      const data = await res!.json();
      console.log("🔍 Transacciones:", data);

      // ✅ Manejo como array (como en los demás useEffect)
      if (Array.isArray(data) && data.length > 0) {
        setNTransacciones({
          CantidadTransaccionesPeriodo: data[0].CantidadTransaccionesPeriodo ?? 0,
          CantidadTransaccionesAnterior: data[0].CantidadTransaccionesAnterior ?? 0,
          PorcentajeCambio: data[0].PorcentajeCambio ?? 0
        });
      } else {
        setNTransacciones({
          CantidadTransaccionesPeriodo: 0,
          CantidadTransaccionesAnterior: 0,
          PorcentajeCambio: 0
        });
      }

    } catch (error) {
      console.error("❌ Error al obtener transacciones:", error);
    }
  };

  if (filtros.itemCode) {
    fetchTransacciones();
  }
}, [filtros]);

useEffect(() => {
  const fetchResumenProducto = async () => {
    try {
      const response = await fetchWithToken(`${BACKEND_URL}/api/resumen-producto?itemCode=${filtros.itemCode}`);
      if (!response) throw new Error("Error al obtener el resumen del producto");

      const data = await response.json();
      setResumenProducto(data);
    } catch (error) {
      console.error("❌ Error al obtener resumen del producto:", error);
    }
  };

  if (filtros.itemCode) {
    fetchResumenProducto();
  }
}, [filtros.itemCode]);
useEffect(() => {
  const fetchDetalleStock = async () => {
    try {
      const response = await fetchWithToken(`${BACKEND_URL}/api/detalle-stock?itemCode=${filtros.itemCode}`);
      if (!response) throw new Error("Error al obtener el detalle de stock");

      const data = await response.json();
      setDetalleStock(data);
    } catch (error) {
      console.error("❌ Error al obtener detalle de stock:", error);
    }
  };

  if (filtros.itemCode) {
    fetchDetalleStock();
  }
}, [filtros.itemCode]);
  const handleOpenModal = async () => {
    try {
      const response = await fetchWithToken(
        `${BACKEND_URL}/api/ventas-mensuales?itemCode=${filtros.itemCode}`
      );
      if (!response) throw new Error('Error al obtener las ventas mensuales');
      const data = await response.json();
      setVentasMensuales(data);
      setModalOpen(true);
    } catch (error) {
      console.error('❌ Error al abrir modal de ventas mensuales:', error);
    }
  };
  const handleOpenOrdenesCompra = async () => {
  try {
    const response = await fetchWithToken(`${BACKEND_URL}/api/historico-ordenes-compra?itemCode=${filtros.itemCode}`);
    if (!response) throw new Error("Error al obtener órdenes de compra");
    const data = await response.json();
    setOrdenesCompra(data);
    setModalOrdenesOpen(true);
  } catch (error) {
    console.error("❌ Error al cargar órdenes de compra:", error);
  }
};
useEffect(() => {
  const fetchStockPorAlmacen = async () => {
    console.log("🚀 Ejecutando fetchStockPorAlmacen con:", filtros.itemCode);

    try {
      const url = `${BACKEND_URL}/api/stock-por-almacen?itemCode=${filtros.itemCode}`;
      const res = await fetchWithToken(url);

      if (!res || !res.ok) {
        const text = res ? await res.text() : "No response";
        console.error("❌ Error HTTP:", res ? res.status : "No status", text);
        return;
      }

      const data = await res.json();

      // 🔄 Transformar la respuesta al formato esperado por tu tabla
      const transformed: Record<string, { unidades: number; notasVenta: number; oc: number; disponible: number }> = {};

      Object.entries(data).forEach(([codigo, valores]: [string, any]) => {
        const key = `Almacen_${codigo.padStart(2, "0")}`; // Asegura nombres como Almacen_01
        const stock = valores.Stock ?? 0;
        const nc = valores.NC ?? 0;
        const oc = valores.OC ?? 0;

        transformed[key] = {
          unidades: stock,
          notasVenta: nc,
          oc: oc,
          disponible: stock - nc,
        };
      });

      setStockPorAlmacen(transformed);

    } catch (error) {
      console.error("❌ Error al obtener stock por almacén:", error);
    }
  };

  if (filtros.itemCode) {
    console.log("🧪 useEffect ACTIVO con itemCode:", filtros.itemCode);
    fetchStockPorAlmacen();
  }
}, [filtros.itemCode]);


useEffect(() => {
  const fetchProveedores = async () => {
    try {
      const response = await fetchWithToken(`${BACKEND_URL}/api/tiempo-entrega-proveedores?itemCode=${filtros.itemCode}`);
      if (!response) throw new Error("Error al obtener proveedores");
      const data = await response.json();

      if (Array.isArray(data)) {
        setProveedorInfo(
          data.map((prov: any) => ({
            Proveedor_Codigo: prov.Proveedor_Codigo,
            Proveedor_Nombre: prov.Proveedor_Nombre,
            Promedio_Dias_Entrega: prov.Promedio_Dias_Entrega,
            Total_Ordenes_Validas: prov.Total_Ordenes_Validas ?? 0
          }))
        );
      } else {
        setProveedorInfo([]);
      }
    } catch (error) {
      console.error("❌ Error al obtener proveedores:", error);
    }
  };

  if (filtros.itemCode) {
    fetchProveedores();
  }
}, [filtros.itemCode]);

useEffect(() => {
  const fetchUnidadesVendidasMes = async () => {
    try {
      // Reutiliza la función buildQueryFromFiltros para construir la URL
      const query = buildQueryFromFiltros(filtros);
      const response = await fetchWithToken(`${BACKEND_URL}/api/unidades-vendidas?${query}`);

      if (!response || !response.ok) {
        throw new Error("Error al obtener unidades vendidas por mes");
      }

      const data = await response.json();
      console.log("📊 Unidades Vendidas por Mes:", data);

      if (Array.isArray(data)) {
        setUnidadesMesData(data); // Actualiza el estado con los datos de la API
      } else {
        setUnidadesMesData([]); // Si no es un array, setea a vacío
        console.warn("⚠️ Formato de datos inesperado para unidades vendidas por mes:", data);
      }
    } catch (error) {
      console.error("❌ Error al obtener unidades vendidas por mes:", error);
      setUnidadesMesData([]); // En caso de error, limpia los datos
    }
  };

  // Solo ejecutar si hay un itemCode seleccionado
  if (filtros.itemCode) {
    fetchUnidadesVendidasMes();
  }
  // Añade 'filtros' como dependencia para que se re-ejecute cuando los filtros cambien
}, [filtros]); // <--- Dependencia importante





  const handleOpenDrawer = () => setOpenDrawer(true);
  const handleCloseDrawer = () => setOpenDrawer(false);
 
  const obtenerDescripcionPeriodo = () => {
    if (filtros.periodo) {
      switch (filtros.periodo) {
        case "1D": return "Hoy";
        case "7D": return "Últimos 7 días";
        case "14D": return "Últimos 14 días";
        case "1M": return "Últimos 30 días";
        case "3M": return "Últimos 3 meses";
        case "6M": return "Últimos 6 meses";
        default: return filtros.periodo;
      }
    }

    if (filtros.fechaInicio && filtros.fechaFin) {
      const formatter = new Intl.DateTimeFormat("es-CL", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone: "America/Santiago"
      });
      const inicio = formatter.format(new Date(`${filtros.fechaInicio}T00:00:00`));
      const fin = formatter.format(new Date(`${filtros.fechaFin}T00:00:00`));
      return `Del ${inicio} al ${fin}`;
    }

    if (filtros.temporada) {
      return `Temporada: ${filtros.temporada}`;
    }

    return "Sin período definido";
  };

  return (
    <Box p={0}>
      <Box display="flex" justifyContent="flex-end" mb={1}>
        <Typography variant="subtitle2" color="text.secondary">
          Estás viendo el período: <strong>{obtenerDescripcionPeriodo()}</strong>
        </Typography>
      </Box>
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
            src={productoSeleccionado?.U_Imagen || "/no-image.png"}
            alt="Producto"
            style={{ width: 96, height: 96, objectFit: "contain", borderRadius: 8 }}
          />
          <Typography variant="caption" color="primary" fontWeight="bold" sx={{ mt: 1 }}>SKU:
            {productoSeleccionado?.itemcode || "Sin producto seleccionado"}
          </Typography>
        </Box>

        <Box flex={1}>
          <Typography variant="h6" fontWeight={700}>{productoSeleccionado?.itemname || "Debes seleccionar un producto"}</Typography>
          <Typography variant="body2" color="text.secondary" mb={1}>Canal: {filtros.canal}</Typography>

          <Box display="flex" gap={1.5} flexWrap="wrap">
            <MetricCard
            icon={<FolderIcon color="primary" />}
            label="Stock"
            value={`${formatUnidades(resumenProducto?.stockTotal?.StockTotal)} ud`}
            variation={`${resumenProducto?.cobertura?.CoberturaEnDias ? resumenProducto.cobertura.CoberturaEnDias.toFixed(1) : 0} días de cobertura`}
            variationColor="primary"
            />

            <MetricCard
            icon={<HourglassEmptyIcon color="success" />}
            label="Días Inventario"
            value={resumenProducto?.cobertura?.CoberturaEnDias?.toFixed(1) ?? "0"}
            variation={`Promedio diario Ventas: ${formatUnidades(resumenProducto?.cobertura?.PromedioDiario)} ud`}
            variationColor="success"
            />

            <MetricCard
            icon={<InventoryIcon color="warning" />}
            label="Unidades Vendidas"
            value={formatUnidades(unidadesVendidas.CantidadVendida)}
            variation={
                `Anterior: ${formatUnidades(unidadesVendidas.CantidadVendidaAnterior)} (${unidadesVendidas.PorcentajeCambio > 0 ? '+' : ''}${unidadesVendidas.PorcentajeCambio.toFixed(1)}%)`
            }
            variationColor={unidadesVendidas.PorcentajeCambio >= 0 ? "success" : "error"}
            />
            <MetricCard
            icon={<LocalShippingIcon color="warning" />}
            label="Stock en tránsito"
            value={`${formatUnidades(resumenProducto?.stockTransito ?? 0)} ud`}
            variationColor="warning"
            />
            <MetricCard
              icon={<CheckCircleIcon color="success" />}
              label="Último $ Compra"
              value={
                resumenProducto?.costos?.UltimoCosto !== undefined
                  ? `$${(
                      resumenProducto.costos.MonedaUltima === "USD"
                        ? resumenProducto.costos.UltimoCosto * resumenProducto.costos.TipoCambioUltima
                        : resumenProducto.costos.UltimoCosto
                    ).toLocaleString("es-CL", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} CLP`
                  : "0"
              }
              variation={
                resumenProducto?.costos?.CostoAnterior
                  ? `$${(
                      resumenProducto.costos.MonedaAnterior === "USD"
                        ? resumenProducto.costos.CostoAnterior * resumenProducto.costos.TipoCambioAnterior
                        : resumenProducto.costos.CostoAnterior
                    ).toLocaleString("es-CL", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} CLP, 
                      (${calcularVariacion(
                        resumenProducto.costos.MonedaUltima === "USD"
                          ? resumenProducto.costos.UltimoCosto * resumenProducto.costos.TipoCambioUltima
                          : resumenProducto.costos.UltimoCosto,
                        resumenProducto.costos.MonedaAnterior === "USD"
                          ? resumenProducto.costos.CostoAnterior * resumenProducto.costos.TipoCambioAnterior
                          : resumenProducto.costos.CostoAnterior
                      )})`
                  : "Sin orden anterior"
              }
              variationColor={
                resumenProducto?.costos &&
                (resumenProducto.costos.MonedaUltima === "USD"
                  ? resumenProducto.costos.UltimoCosto * resumenProducto.costos.TipoCambioUltima
                  : resumenProducto.costos.UltimoCosto) >
                  (resumenProducto.costos.MonedaAnterior === "USD"
                    ? resumenProducto.costos.CostoAnterior * resumenProducto.costos.TipoCambioAnterior
                    : resumenProducto.costos.CostoAnterior)
                  ? "error"
                  : "success"
              }
            />
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
            value: (
                <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="h6" fontWeight={700}>
                    {formatVentas(ventasTotal.TotalVentasPeriodo)}
                </Typography>
                <Typography
                    variant="body2"
                    fontWeight={500}
                    color={ventasTotal.PorcentajeCambio >= 0 ? 'success.main' : 'error.main'}
                >
                    ({ventasTotal.PorcentajeCambio > 0 ? '+' : ''}
                    {ventasTotal.PorcentajeCambio.toFixed(1)}%)
                </Typography>
                </Box>
            ),
            detail: `Anterior: ${formatVentas(ventasTotal.TotalVentasAnterior)}`,
            detailColor: 'text.secondary'
            },

            
            {
            label: 'Margen Bruto',
            icon: <TrendingUpIcon color="success" />,
            value: (
                <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="h6" fontWeight={700}>
                    {formatVentas(margenTotal.MargenBrutoPeriodo)}
                </Typography>
                <Typography
                    variant="body2"
                    fontWeight={500}
                    color={margenTotal.PorcentajeCambio >= 0 ? 'success.main' : 'error.main'}
                >
                    ({margenTotal.PorcentajeCambio > 0 ? '+' : ''}
                    {margenTotal.PorcentajeCambio.toFixed(1)}%)
                </Typography>
                </Box>
            ),
            detail: `Anterior: ${formatVentas(margenTotal.MargenBrutoAnterior)}`,
            detailColor: 'text.secondary'
            },
            {
            label: 'N° Transacciones',
            icon: <PeopleAltIcon color="primary" />,
            value: (
                <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="h6" fontWeight={700}>
                    {nTransacciones.CantidadTransaccionesPeriodo.toLocaleString("es-CL")}
                </Typography>
                <Typography
                    variant="body2"
                    fontWeight={500}
                    color={nTransacciones.PorcentajeCambio >= 0 ? 'success.main' : 'error.main'}
                >
                    ({nTransacciones.PorcentajeCambio > 0 ? '+' : ''}
                    {nTransacciones.PorcentajeCambio.toFixed(1)}%)
                </Typography>
                </Box>
            ),
            detail: `Anterior: ${nTransacciones.CantidadTransaccionesAnterior.toLocaleString("es-CL")}`,
            detailColor: 'text.secondary'
            },
            {
            label: 'Ticket Promedio',
            icon: <CreditCardIcon color="action" />,
            value: (
                <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="h6" fontWeight={700}>
                    {formatVentas(promedioTicket.PromedioPorTicket)}
                </Typography>
                <Typography
                    variant="body2"
                    fontWeight={500}
                    color={promedioTicket.PorcentajeCambio >= 0 ? 'success.main' : 'error.main'}
                >
                    ({promedioTicket.PorcentajeCambio > 0 ? '+' : ''}
                    {promedioTicket.PorcentajeCambio.toFixed(1)}%)
                </Typography>
                </Box>
            ),
            detail: `Anterior: ${formatVentas(promedioTicket.PromedioAnterior)}`,
            detailColor: 'text.secondary'
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
          <Paper
            elevation={3}
            sx={{
              p: 3,
              borderRadius: 4,
              height: 250, // 🔹 Tamaño fijo del panel
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'background.paper',
            }}
          >
            <Typography variant="h6" fontWeight={600} gutterBottom>
              🏬 Detalle Completo por Almacén
            </Typography>

            <TableContainer
              component={Box}
              sx={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'auto',
              }}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell><b>Código</b></TableCell>
                    <TableCell><b>Nombre</b></TableCell>
                    <TableCell align="right"><b>Unidades</b></TableCell>
                    <TableCell align="right"><b>Notas de Venta</b></TableCell>
                    <TableCell align="right"><b>OC</b></TableCell>
                    <TableCell align="right"><b>Disponible</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[
                    { code: '01', name: 'Centro Comercial' },
                    { code: '03', name: 'Comercio Electrónico' },
                    { code: '04', name: 'Control de Pérdida' },
                    { code: '05', name: 'Envíos Full' },
                    { code: '07', name: 'Balmaceda' },
                    { code: '08', name: 'Lo Ovalle' },
                    { code: '10', name: 'Reservado con Abono' },
                    { code: '12', name: 'Producto con Falla' },
                    { code: '13', name: 'Reservado Full' },
                  ].map(({ code, name }) => {
                    const key = `Almacen_${code}`;
                    const almacen = stockPorAlmacen?.[key] as { unidades?: number; notasVenta?: number; oc?: number; disponible?: number } || {};
                    const unidades = almacen.unidades ?? 0;
                    const notasVenta = almacen.notasVenta ?? 0;
                    const oc = almacen.oc ?? 0;
                    const disponible = (unidades + oc - notasVenta);

                    return (
                      <TableRow key={code}>
                        <TableCell>{code}</TableCell>
                        <TableCell>{name}</TableCell>
                        <TableCell align="right" sx={{ color: unidades > 0 ? 'text.primary' : 'text.disabled' }}>
                          {unidades.toLocaleString("es-CL")}
                        </TableCell>
                        <TableCell align="right">{notasVenta.toLocaleString("es-CL")}</TableCell>
                        <TableCell align="right">{oc.toLocaleString("es-CL")}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 500, color: disponible === 0 ? 'error.main' : 'success.main' }}>
                          {disponible.toLocaleString("es-CL")}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>


        {/* Columna derecha */}
        <Box flex={1} display="flex" flexDirection="column" gap={2}>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
          {Icono}
          <Typography fontWeight={700}>Última venta</Typography>
          <Typography>
            Última venta: {resumenProducto?.ultimaVenta?.FechaUltimaVenta
              ? parseFechaHoraLocal(
                  resumenProducto.ultimaVenta.FechaUltimaVenta,
                  resumenProducto.ultimaVenta.HoraUltimaVenta 
                )
              : "Sin ventas registradas"}
          </Typography>

          <Typography color={`${color}.main`} fontWeight={500}>
            {textoEstado}
          </Typography>
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
            <>
            <Paper
                variant="outlined"
                sx={{ p: 2, borderRadius: 3, cursor: 'pointer', '&:hover': { bgcolor: 'grey.100' } }}
                onClick={handleOpenModal}
            >
                <Typography fontWeight={700}>Histórico de Ventas</Typography>
                <Typography color="text.secondary">Últimos 12 meses</Typography>
            </Paper>

            <HistorialVentasModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                data={ventasMensuales}
            />
            </>


          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Typography fontWeight={700}>Sugerencia de Compra</Typography>
            <Typography color="success.main">SIN ALERTAS</Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Typography fontWeight={700}>Tiempos Logísticos</Typography>
            <Typography color="text.secondary">
              Lead time promedio: {calcularPromedioGlobal() ?? 'Sin datos'} días
            </Typography>
            <MuiButton
              fullWidth
              variant="outlined"
              sx={{ mt: 1 }}
              onClick={handleOpenProveedorModal}
            >
              Ver Detalle Por Proveedor
            </MuiButton>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Typography fontWeight={700}>Historico Ordenes de Compras Últimos 12 Meses</Typography>
            <MuiButton fullWidth variant="outlined" sx={{ mt: 1 }} onClick={handleOpenOrdenesCompra}>
            Ver Compras Pasadas
            </MuiButton>

          </Paper>
        </Box>
      </Box>

      {/* Gráfico de ventas por canal */}
      <Box display="flex" gap={2} mt={3}>
        {/* Gráfico de ventas por canal */}
        <Box flex={0.4}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <VentasCanalChart
              filters={filtros}
              onSelectCanal={(canal) =>
                setFiltros((prev) => ({
                  ...prev,
                  canal: canal,
                }))
              }
            />
          </Paper>
        </Box>

        {/* Gráfico de top vendedores */}
        <Box flex={0.6}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
           <TopVendedoresChart filters={filtros} />
            
          </Paper>
        </Box>
      </Box>
      {/* NUEVO COMPONENTE: Análisis por Producto */}
      <Box mt={3}>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
          <FechaRotacion data={unidadesMesData} isLoading={false} />
        </Paper>
      </Box>
            
      {/* Drawer */}
      <HeaderDrawerProducto
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        onApply={(filtros, producto) => {
            setFiltros(filtros);
            if (producto) {
            setProductoSeleccionado(producto); // guarda itemname y U_Imagen
            }
        }}
      />
      <HistorialOrdenesCompraModal
        open={modalOrdenesOpen}
        onClose={() => setModalOrdenesOpen(false)}
        data={ordenesCompra}
      />

      <ModalProveedor
        open={modalProveedorOpen}
        onClose={() => setModalProveedorOpen(false)}
        data={proveedorInfo}
      />



    </Box>
  );
};

export default AnalisisProductoPage;
