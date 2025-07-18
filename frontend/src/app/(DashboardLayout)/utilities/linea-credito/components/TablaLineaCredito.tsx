"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Avatar,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  CircularProgress,
  Typography
} from "@mui/material";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";

export interface ClienteCredito {
  cliente: string;
  rut: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  razonSocial: string;
  categoria: string;
  fechaApertura: string;
  limiteCredito: number;
  creditoDisponible: number;
  estado: string;
  ultimaModificacion: string;
  pagoPredeterminado: string;
}

interface Props {
  filters: {
    rut?: string;
    estado?: string;
    tieneDeuda?: string;
    tipoCliente?: string[];
    montoInicio?: number;
    montoFin?: number;
  };
}

const TablaLineaCredito: React.FC<Props> = ({ filters }) => {
  const [data, setData] = useState<ClienteCredito[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchClientes = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();

        if (filters?.rut) params.append("rut", filters.rut);
        if (filters?.estado) params.append("estado", filters.estado);
        if (filters?.tieneDeuda !== undefined && filters.tieneDeuda !== "")
          params.append("tieneDeuda", filters.tieneDeuda);
        if (filters?.tipoCliente && filters.tipoCliente.length > 0)
          params.append("groupCodes", filters.tipoCliente.join(","));
        if (typeof filters.montoInicio === "number")
          params.append("montoInicio", filters.montoInicio.toString());
        if (typeof filters.montoFin === "number")
          params.append("montoFin", filters.montoFin.toString());

        const url = `${BACKEND_URL}/api/lineacredito/clientes?${params.toString()}`;
        console.log("🔗 Consultando:", url);

        const res = await fetchWithToken(url);
        if (!res) {
          console.error("❌ La respuesta de la API es null.");
          setData([]);
          setLoading(false);
          return;
        }
        const rawData = await res.json();

        if (!Array.isArray(rawData)) {
          console.error("❌ Respuesta inesperada:", rawData);
          setData([]);
          return;
        }

        const mapped: ClienteCredito[] = rawData.map((item: any) => ({
          cliente: item.Nombre || "-",
          rut: item.Rut || "-",
          telefono: item.Telefono || "-",
          direccion: item.Direccion || "-",
          ciudad: item.Ciudad || "-",
          razonSocial: item.Email || "-", // usamos Email como razon social
          categoria: item.TipoCliente?.toString() || "-",
          fechaApertura: item.FechaApertura?.split("T")[0] || "-",
          limiteCredito: item.LimiteCredito || 0,
          creditoDisponible: item.CreditoDisponible || 0,
          estado: item.EstadoCliente || "-",
          ultimaModificacion: item.UltimaModificacion?.split("T")[0] || "-",
          pagoPredeterminado: item.PagoPredeterminado || "-"
        }));

        setData(mapped);
      } catch (error) {
        console.error("❌ Error al obtener datos de línea de crédito:", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClientes();
  }, [filters]);

  return (
    <TableContainer component={Paper} sx={{ mt: 3 }}>
      {loading ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      ) : data.length === 0 ? (
        <Box display="flex" justifyContent="center" p={3}>
          <Typography variant="body2" color="text.secondary">No hay resultados</Typography>
        </Box>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Avatar</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>RUT</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Dirección</TableCell>
              <TableCell>Razón Social</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell>Fecha Apertura</TableCell>
              <TableCell>Límite Crédito</TableCell>
              <TableCell>Crédito Disponible</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Última Modificación</TableCell>
              <TableCell>Pago Predeterminado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={index}>
                <TableCell><Avatar>{row.cliente.charAt(0)}</Avatar></TableCell>
                <TableCell>{row.cliente}</TableCell>
                <TableCell>{row.rut}</TableCell>
                <TableCell>{row.telefono}</TableCell>
                <TableCell>{row.direccion}, {row.ciudad}</TableCell>
                <TableCell>{row.razonSocial}</TableCell>
                <TableCell>{row.categoria}</TableCell>
                <TableCell>{row.fechaApertura}</TableCell>
                <TableCell>${row.limiteCredito.toLocaleString("es-CL")}</TableCell>
                <TableCell>${row.creditoDisponible.toLocaleString("es-CL")}</TableCell>
                <TableCell>{row.estado}</TableCell>
                <TableCell>{row.ultimaModificacion}</TableCell>
                <TableCell>{row.pagoPredeterminado}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </TableContainer>
  );
};

export default TablaLineaCredito;
