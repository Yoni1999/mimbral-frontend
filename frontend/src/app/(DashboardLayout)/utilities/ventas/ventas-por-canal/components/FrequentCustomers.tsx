"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  Card, CardContent, Typography, Box, Avatar,
  Table, TableBody, TableCell, TableHead, TableRow,
  Stack, TableSortLabel, CircularProgress
} from "@mui/material";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { formatearRUTDesdeSAP } from "@/utils/formatearRUTDesdeSAP";
import { formatVentas } from "@/utils/format";
import { BACKEND_URL } from "@/config";

type Order = "asc" | "desc";
type OrderBy = "cantidad_compras" | "total_comprado" | "ticket_promedio" | "ultima_compra";

interface ClienteFrecuente {
  cardcode: string;
  cardname: string;
  imagen?: string;
  ciudad?: string;
  linea_credito?: number;
  balance?: number;
  cantidad_compras: number;
  total_comprado: number;
  ticket_promedio: number;
  ultima_compra: string;
}

interface ClientesFrecuentesTableProps {
  filters: {
    canal: string;
    periodo: string;
    fechaInicio: string;
    fechaFin: string;
    vendedor?: number | null;
  };
}

const ClientesFrecuentesTable: React.FC<ClientesFrecuentesTableProps> = ({ filters }) => {
  const [clientes, setClientes] = useState<ClienteFrecuente[]>([]);
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order>("desc");
  const [orderBy, setOrderBy] = useState<OrderBy>("total_comprado");

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        setLoading(true);
        const query = new URLSearchParams(
          Object.entries(filters)
            .filter(([_, v]) => v !== "" && v !== null) // Añadir `v !== null` para limpiar más los filtros
            .map(([k, v]) => [k, String(v)])
        ).toString();

        const res = await fetchWithToken(`${BACKEND_URL}/api/top10clientes?${query}`);
        
        if (!res?.ok) { // Manejo básico de errores HTTP
            console.error(`Error al obtener clientes frecuentes: ${res?.status} ${res?.statusText}`);
            setClientes([]); // Asegura que la lista esté vacía en caso de error
            return;
        }

        const raw = await res?.json();

        const normalizados: ClienteFrecuente[] = raw.map((c: any) => ({
          cardcode: c.CardCode,
          cardname: c.CardName,
          imagen: c.Imagen || "",
          ciudad: c.CITY || "",
          linea_credito: c.CreditLine || 0,
          balance: c.Balance || 0,
          cantidad_compras: c.Cantidad_Compras,
          total_comprado: c.Total_Comprado,
          ticket_promedio: c.Ticket_Promedio,
          // Asegurarse de que ultima_compra sea una cadena válida antes de pasarla
          ultima_compra: c.Ultima_Compra ? String(c.Ultima_Compra) : new Date(0).toISOString(),
        }));

        setClientes(normalizados);
      } catch (err) {
        console.error("❌ Error al obtener clientes frecuentes:", err);
        setClientes([]); // En caso de cualquier otro error, también vaciar la lista
      } finally {
        setLoading(false);
      }
    };

    fetchClientes();
  }, [filters]); // Dependencia del `useEffect`

  const handleSort = (key: OrderBy) => {
    if (orderBy === key) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setOrderBy(key);
      setOrder("desc"); // Por defecto, ordenar descendente al cambiar de columna
    }
  };

  const sortedData = useMemo(() => {
    // Si no hay clientes, no necesitamos ordenar
    if (!clientes || clientes.length === 0) {
      return [];
    }
    return [...clientes].sort((a, b) => {
      if (orderBy === "ultima_compra") {
        const dateA = new Date(a.ultima_compra).getTime();
        const dateB = new Date(b.ultima_compra).getTime();
        return order === "asc" ? dateA - dateB : dateB - dateA;
      }
      const valA = Number(a[orderBy] ?? 0);
      const valB = Number(b[orderBy] ?? 0);
      return order === "asc" ? valA - valB : valB - valA;
    });
  }, [clientes, order, orderBy]);

return (
  <Card elevation={1} sx={{ borderRadius: 2, p: 2, background: "#fff" }}>
    <CardContent>
      <Typography variant="h6" fontWeight="bold" mb={2}>
        Clientes Frecuentes
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <CircularProgress />
        </Box>
      ) : (
        <>
          {sortedData.length === 0 ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <Typography variant="body1" color="text.secondary">
                No hay datos de clientes frecuentes para el período seleccionado.
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                maxHeight: sortedData.length > 5 ? 480 : "auto",
                overflowY: sortedData.length > 5 ? "auto" : "visible",
                transition: "max-height 0.3s ease-in-out",
              }}
            >
              <Table size="small" stickyHeader={sortedData.length > 5}>
                <TableHead>
                  <TableRow>
                    <TableCell>Cliente</TableCell>
                    <TableCell align="center">
                      <TableSortLabel
                        active={orderBy === "cantidad_compras"}
                        direction={order}
                        onClick={() => handleSort("cantidad_compras")}
                      >
                        Transacciones
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">
                      <TableSortLabel
                        active={orderBy === "total_comprado"}
                        direction={order}
                        onClick={() => handleSort("total_comprado")}
                      >
                        Total Comprado
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="right">
                      <TableSortLabel
                        active={orderBy === "ticket_promedio"}
                        direction={order}
                        onClick={() => handleSort("ticket_promedio")}
                      >
                        Ticket Promedio
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="center">
                      <TableSortLabel
                        active={orderBy === "ultima_compra"}
                        direction={order}
                        onClick={() => handleSort("ultima_compra")}
                      >
                        Última Compra
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align="center">Pendiente de pago</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {sortedData.map((cliente) => {
                    const excedente =
                      cliente.balance && cliente.linea_credito && cliente.balance > cliente.linea_credito
                        ? cliente.balance - cliente.linea_credito
                        : 0;

                    return (
                      <TableRow key={cliente.cardcode}>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="flex-start">
                            <Avatar src={cliente.imagen} alt={cliente.cardname} />
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {cliente.cardname}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                {formatearRUTDesdeSAP(cliente.cardcode)}
                              </Typography>
                              {cliente.ciudad && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Ciudad: {cliente.ciudad}
                                </Typography>
                              )}
                              <Typography variant="caption" color="text.secondary" display="block">
                                {cliente.linea_credito === 0
                                  ? "Sin crédito"
                                  : `Línea de crédito: ${formatVentas(cliente.linea_credito ?? 0)}`}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>

                        <TableCell align="center">{cliente.cantidad_compras}</TableCell>
                        <TableCell align="right">{formatVentas(cliente.total_comprado)}</TableCell>
                        <TableCell align="right">{formatVentas(cliente.ticket_promedio)}</TableCell>
                        <TableCell align="center">
                          {cliente.ultima_compra && !isNaN(new Date(cliente.ultima_compra).getTime())
                            ? new Date(cliente.ultima_compra).toLocaleDateString("es-CL")
                            : "N/A"}
                        </TableCell>
                        <TableCell align="center">
                          {cliente.balance !== undefined && cliente.balance !== null
                            ? formatVentas(cliente.balance) +
                              (excedente > 0 ? ` ⚠️ Excede: ${formatVentas(excedente)}` : "")
                            : "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          )}
        </>
      )}
    </CardContent>
  </Card>
);

};

export default ClientesFrecuentesTable;