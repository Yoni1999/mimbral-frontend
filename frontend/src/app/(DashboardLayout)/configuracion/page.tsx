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
import { apiJson } from "@/utils/apiClient";
import { notifyError, notifySuccess } from "@/components/ui/toast/notify";

/**
 * Lo que corre cada "Actualizar Ahora" (analysis-service/src/services/actualizar.service.js,
 * PROCEDIMIENTOS_GENERALES). El backend solo expone una fecha/hora de la
 * ULTIMA corrida completa -no una por procedimiento-, pero como todos corren
 * seguidos en el mismo lote, esa misma fecha aplica a los 17 igual: no es un
 * dato inventado, es el resultado real repetido donde corresponde.
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
  { codigo: "ACTUALIZAR_OPCH_PCH1", nombre: "Facturas de Proveedor" },
  { codigo: "ACTUALIZAR_OINM", nombre: "Movimientos de Inventario" },
  { codigo: "Actualizar_OCRD", nombre: "Clientes y Proveedores" },
  { codigo: "Actualizar_ODLN_DLN1", nombre: "Guías de Despacho" },
  { codigo: "Actualizar_OBNK", nombre: "Bancos" },
  { codigo: "Actualizar_ORIN_RIN1", nombre: "Notas de Crédito" },
  { codigo: "ActualizarDatosTransacciones", nombre: "Transacciones" },
  { codigo: "Actualizar_OUSR", nombre: "Usuarios SAP" },
  { codigo: "Sync_OCTG", nombre: "Catálogos (UDO)" },
];

export default function ConfiguracionPage() {
  const [ultimaFecha, setUltimaFecha] = useState<string | null>(null);
  const [ultimaHora, setUltimaHora] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);

  const fetchUltimaActualizacion = async () => {
    try {
      const data = await apiJson<{ ultimaFecha: string; ultimaHora: string }>("/api/ultima-actualizacion");
      setUltimaFecha(data.ultimaFecha);
      setUltimaHora(data.ultimaHora);
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
  const ultimaSincronizacion = sincronizado ? `${ultimaFecha} a las ${ultimaHora}` : "Aún no se ha sincronizado";

  return (
    <Box p={{ xs: 2, md: 4 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2} mb={1}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Actualizar Base de Datos
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {cargando ? "Cargando..." : `Última sincronización: ${ultimaSincronizacion}`}
          </Typography>
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
        Todo corre en un solo lote cada vez que se presiona &quot;Actualizar Ahora&quot;, así que la fecha de la
        última corrida aplica a los {PROCEDIMIENTOS.length} procesos por igual.
      </Typography>

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Dato</TableCell>
              <TableCell>Procedimiento</TableCell>
              <TableCell>Última sincronización</TableCell>
              <TableCell>Estado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {PROCEDIMIENTOS.map((proc) => (
              <TableRow key={proc.codigo} hover>
                <TableCell>{proc.nombre}</TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                    {proc.codigo}
                  </Typography>
                </TableCell>
                <TableCell>{sincronizado ? ultimaSincronizacion : "—"}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    icon={sincronizado ? <CheckCircleIcon /> : <HourglassEmptyIcon />}
                    label={sincronizado ? "Sincronizado" : "Pendiente"}
                    color={sincronizado ? "success" : "default"}
                    variant="outlined"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
