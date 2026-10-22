"use client";
import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Divider,
  CircularProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
} from "@mui/material";
import SystemUpdateAltIcon from "@mui/icons-material/SystemUpdateAlt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import SyncIcon from "@mui/icons-material/Sync";
import Tooltip from "@mui/material/Tooltip";
import { apiJson } from "@/utils/apiClient";
import { notifyError, notifySuccess } from "@/components/ui/toast/notify";
import { olvidarDatosCargados } from "@/utils/memoriaDatos";

/**
 * Lo que corre cada carga (analysis-service/src/services/actualizar.service.js,
 * PROCEDIMIENTOS_GENERALES). La fecha y el estado de cada fila salen del
 * registro de corridas (dbo.REGISTRO_ACTUALIZACION) que entrega
 * /api/ultima-actualizacion: es la última ejecución real de ese procedimiento.
 */
const PROCEDIMIENTOS = [
  { codigo: "ACTUALIZAR_FAMILIA_SUBFAMILIA", nombre: "Familias y Subfamilias" },
  { codigo: "ACTUALIZAR_CATEGORIA_SUBCATEGORIA", nombre: "Categorías y Subcategorías" },
  { codigo: "ACTUALIZAR_OITM_ITM1", nombre: "Artículos e Ítems" },
  { codigo: "ACTUALIZAR_OSLP", nombre: "Vendedores" },
  { codigo: "ACTUALIZAR_OITW", nombre: "Stock por Bodega" },
  { codigo: "ACTUALIZAR_OPOR_POR1", nombre: "Órdenes de Compra" },
  { codigo: "ACTUALIZAR_OPDN_PDN1", nombre: "Recepción de Mercadería" },
  { codigo: "ACTUALIZAR_OINV_INV1", nombre: "Facturas de Venta" },
  { codigo: "Actualizar_Resumen_Producto", nombre: "Resumen por Producto (informes)" },
  { codigo: "ACTUALIZAR_OPCH_PCH1", nombre: "Facturas de Proveedor" },
  { codigo: "ACTUALIZAR_OINM", nombre: "Movimientos de Inventario" },
  { codigo: "Actualizar_OCRD", nombre: "Clientes y Proveedores" },
  { codigo: "Actualizar_ODLN_DLN1", nombre: "Guías de Despacho" },
  { codigo: "Actualizar_OBNK", nombre: "Bancos" },
  { codigo: "Actualizar_ORIN_RIN1", nombre: "Notas de Crédito" },
  { codigo: "ActualizarDatosTransacciones", nombre: "Transacciones" },
  { codigo: "Sync_OUSR", nombre: "Usuarios SAP" },
  { codigo: "Sync_OCTG", nombre: "Catálogos (UDO)" },
];

type EstadoProcedimiento = {
  procedimiento: string;
  origen: string;
  inicio: string;
  fin: string | null;
  estado: "ok" | "error" | "en_curso";
  error: string | null;
};

type EstadoCarga = {
  ultimaFecha: string | null;
  ultimaHora: string | null;
  ultimaCorrida: { origen: string; inicio: string; fin: string | null; estado: string; fallidos: number } | null;
  procedimientos: EstadoProcedimiento[];
};

const ORIGEN: Record<string, string> = {
  "cron-general": "Carga de las 04:00",
  "cron-inventario": "Inventario (cada 20 min)",
  manual: "Manual",
};

// Las fechas del registro vienen en UTC: se muestran en hora local (Chile).
const fechaHora = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

function ChipEstado({ p }: { p?: EstadoProcedimiento }) {
  if (!p) return <Chip size="small" icon={<HourglassEmptyIcon />} label="Sin registro" variant="outlined" />;
  if (p.estado === "en_curso") return <Chip size="small" icon={<SyncIcon />} label="En curso" color="info" variant="outlined" />;
  if (p.estado === "error")
    return (
      <Tooltip title={p.error || "Error sin detalle"} arrow>
        <Chip size="small" icon={<ErrorOutlineIcon />} label="Con error" color="error" variant="outlined" />
      </Tooltip>
    );
  return <Chip size="small" icon={<CheckCircleIcon />} label="Correcto" color="success" variant="outlined" />;
}

export default function ConfiguracionPage() {
  const [ultimaFecha, setUltimaFecha] = useState<string | null>(null);
  const [ultimaHora, setUltimaHora] = useState<string | null>(null);
  const [ultimaCorrida, setUltimaCorrida] = useState<EstadoCarga["ultimaCorrida"]>(null);
  const [porProcedimiento, setPorProcedimiento] = useState<Record<string, EstadoProcedimiento>>({});
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);

  const fetchUltimaActualizacion = async () => {
    try {
      const data: EstadoCarga = await apiJson("/api/ultima-actualizacion");
      setUltimaFecha(data.ultimaFecha);
      setUltimaHora(data.ultimaHora);
      setUltimaCorrida(data.ultimaCorrida ?? null);
      setPorProcedimiento(
        Object.fromEntries((data.procedimientos ?? []).map((p) => [p.procedimiento.toLowerCase(), p]))
      );
    } catch (error) {
      console.error("Error al obtener la ultima actualizacion:", error);
    } finally {
      setCargando(false);
    }
  };

  const handleActualizarDatos = async () => {
    setActualizando(true);
    try {
      await apiJson("/api/actualizar-datos", { method: "POST" });
      // Lo cargado antes de actualizar ya no vale: las vistas lo pedirán de nuevo.
      olvidarDatosCargados();
      await fetchUltimaActualizacion();
      notifySuccess("Base de datos actualizada correctamente.");
    } catch (error) {
      console.error("Error al actualizar los datos:", error);
      notifyError("No se pudo actualizar la base de datos.");
    } finally {
      setActualizando(false);
    }
  };

  useEffect(() => {
    fetchUltimaActualizacion();
  }, []);

  const sincronizado = Boolean(ultimaFecha && ultimaHora);
  const ultimaSincronizacion = sincronizado
    ? `${ultimaFecha?.split("-").reverse().join("/")} a las ${ultimaHora}`
    : "Aún no hay una carga de facturas registrada";
  const estadoCorrida =
    ultimaCorrida &&
    (ultimaCorrida.estado === "en_curso"
      ? "en curso"
      : ultimaCorrida.estado === "con_errores"
      ? `con ${ultimaCorrida.fallidos} ${ultimaCorrida.fallidos === 1 ? "error" : "errores"}`
      : "correcta");

  return (
    <Box p={{ xs: 2, md: 4 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2} mb={1}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Actualizar Base de Datos
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {cargando ? "Cargando..." : `Datos de ventas al ${ultimaSincronizacion}`}
          </Typography>
          {!cargando && ultimaCorrida && (
            <Typography variant="body2" color="text.secondary">
              Última carga general ({ORIGEN[ultimaCorrida.origen] ?? ultimaCorrida.origen}): {fechaHora(ultimaCorrida.inicio)},{" "}
              {estadoCorrida}
            </Typography>
          )}
        </Box>

        <Button
          variant="contained"
          color="warning"
          size="large"
          startIcon={actualizando ? <CircularProgress size={18} color="inherit" /> : <SystemUpdateAltIcon />}
          onClick={handleActualizarDatos}
          disabled={actualizando}
        >
          {actualizando ? "Actualizando..." : "Actualizar Ahora"}
        </Button>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" fontWeight={700} mb={1}>
        Qué se actualiza
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Los {PROCEDIMIENTOS.length} procesos corren cada día a las 04:00 (artículos y stock, además, cada 20
        minutos) y cuando se presiona &quot;Actualizar Ahora&quot;. Cada fila muestra su última ejecución real.
      </Typography>

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Dato</TableCell>
              <TableCell>Procedimiento</TableCell>
              <TableCell>Última ejecución</TableCell>
              <TableCell>Origen</TableCell>
              <TableCell>Estado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {PROCEDIMIENTOS.map((proc) => {
              const p = porProcedimiento[proc.codigo.toLowerCase()];
              return (
              <TableRow key={proc.codigo} hover>
                <TableCell>{proc.nombre}</TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                    {proc.codigo}
                  </Typography>
                </TableCell>
                <TableCell>{p ? fechaHora(p.fin ?? p.inicio) : "—"}</TableCell>
                <TableCell>{p ? ORIGEN[p.origen] ?? p.origen : "—"}</TableCell>
                <TableCell>
                  <ChipEstado p={p} />
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
