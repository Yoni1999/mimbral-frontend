"use client";

import React, { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Stack,
  TableSortLabel,
} from "@mui/material";

type Order = "asc" | "desc";
type OrderBy = "numeroCompras" | "totalComprado" | "ticketPromedio" | "ultimaCompra";

interface ClienteFrecuente {
  clienteId: string;
  nombre: string;
  imagen?: string; // avatar opcional
  numeroCompras: number;
  totalComprado: number;
  ticketPromedio: number;
  ultimaCompra: string; // formato YYYY-MM-DD
}

const ClientesFrecuentesTable = () => {
  const [order, setOrder] = useState<Order>("desc");
  const [orderBy, setOrderBy] = useState<OrderBy>("totalComprado");

  const data: ClienteFrecuente[] = [
    {
      clienteId: "C001",
      nombre: "Juan Pérez",
      imagen: "/avatars/avatar1.png",
      numeroCompras: 8,
      totalComprado: 950000,
      ticketPromedio: 118750,
      ultimaCompra: "2025-06-15",
    },
    {
      clienteId: "C002",
      nombre: "Comercial Lara SPA",
      imagen: "/avatars/avatar2.png",
      numeroCompras: 5,
      totalComprado: 600000,
      ticketPromedio: 120000,
      ultimaCompra: "2025-06-18",
    },
    {
      clienteId: "C003",
      nombre: "María González",
      imagen: "/avatars/avatar3.png",
      numeroCompras: 4,
      totalComprado: 420000,
      ticketPromedio: 105000,
      ultimaCompra: "2025-06-17",
    },
    {
      clienteId: "C004",
      nombre: "Ferretería El Puente",
      imagen: "/avatars/avatar4.png",
      numeroCompras: 10,
      totalComprado: 1250000,
      ticketPromedio: 125000,
      ultimaCompra: "2025-06-19",
    },
        {
      clienteId: "C004",
      nombre: "Ferretería El Puente",
      imagen: "/avatars/avatar4.png",
      numeroCompras: 10,
      totalComprado: 1250000,
      ticketPromedio: 125000,
      ultimaCompra: "2025-06-19",
    },
        {
      clienteId: "C004",
      nombre: "Ferretería El Puente",
      imagen: "/avatars/avatar4.png",
      numeroCompras: 10,
      totalComprado: 1250000,
      ticketPromedio: 125000,
      ultimaCompra: "2025-06-19",
    },
        {
      clienteId: "C004",
      nombre: "Ferretería El Puente",
      imagen: "/avatars/avatar4.png",
      numeroCompras: 10,
      totalComprado: 1250000,
      ticketPromedio: 125000,
      ultimaCompra: "2025-06-19",
    },
        {
      clienteId: "C004",
      nombre: "Ferretería El Puente",
      imagen: "/avatars/avatar4.png",
      numeroCompras: 10,
      totalComprado: 1250000,
      ticketPromedio: 125000,
      ultimaCompra: "2025-06-19",
    },
        {
      clienteId: "C004",
      nombre: "Ferretería El Puente",
      imagen: "/avatars/avatar4.png",
      numeroCompras: 10,
      totalComprado: 1250000,
      ticketPromedio: 125000,
      ultimaCompra: "2025-06-19",
    },
        {
      clienteId: "C004",
      nombre: "Ferretería El Puente",
      imagen: "/avatars/avatar4.png",
      numeroCompras: 10,
      totalComprado: 1250000,
      ticketPromedio: 125000,
      ultimaCompra: "2025-06-19",
    },
        {
      clienteId: "C004",
      nombre: "Ferretería El Puente",
      imagen: "/avatars/avatar4.png",
      numeroCompras: 10,
      totalComprado: 1250000,
      ticketPromedio: 125000,
      ultimaCompra: "2025-06-19",
    },
        {
      clienteId: "C004",
      nombre: "Ferretería El Puente",
      imagen: "/avatars/avatar4.png",
      numeroCompras: 10,
      totalComprado: 1250000,
      ticketPromedio: 125000,
      ultimaCompra: "2025-06-19",
    },
        {
      clienteId: "C004",
      nombre: "Ferretería El Puente",
      imagen: "/avatars/avatar4.png",
      numeroCompras: 10,
      totalComprado: 1250000,
      ticketPromedio: 125000,
      ultimaCompra: "2025-06-19",
    },
  ];

  const handleSort = (key: OrderBy) => {
    if (orderBy === key) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setOrderBy(key);
      setOrder("desc");
    }
  };

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      if (orderBy === "ultimaCompra") {
        return order === "asc"
          ? new Date(a.ultimaCompra).getTime() - new Date(b.ultimaCompra).getTime()
          : new Date(b.ultimaCompra).getTime() - new Date(a.ultimaCompra).getTime();
      }
      // For numeric fields, safely cast to number
      const valA = Number(a[orderBy] ?? 0);
      const valB = Number(b[orderBy] ?? 0);
      return order === "asc" ? valA - valB : valB - valA;
    });
  }, [data, order, orderBy]);

  return (
    <Card elevation={1} sx={{ borderRadius: 2,minHeight: "480px", p: 2, background: "#fff" }}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Clientes Frecuentes
        </Typography>

        <Box sx={{ maxHeight: 380, overflowY: "auto" }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Cliente</TableCell>

                <TableCell align="center" sortDirection={orderBy === "numeroCompras" ? order : false}>
                  <TableSortLabel
                    active={orderBy === "numeroCompras"}
                    direction={order}
                    onClick={() => handleSort("numeroCompras")}
                  >
                    Compras
                  </TableSortLabel>
                </TableCell>

                <TableCell align="right" sortDirection={orderBy === "totalComprado" ? order : false}>
                  <TableSortLabel
                    active={orderBy === "totalComprado"}
                    direction={order}
                    onClick={() => handleSort("totalComprado")}
                  >
                    Total Comprado
                  </TableSortLabel>
                </TableCell>

                <TableCell align="right" sortDirection={orderBy === "ticketPromedio" ? order : false}>
                  <TableSortLabel
                    active={orderBy === "ticketPromedio"}
                    direction={order}
                    onClick={() => handleSort("ticketPromedio")}
                  >
                    Ticket Promedio
                  </TableSortLabel>
                </TableCell>

                <TableCell align="center" sortDirection={orderBy === "ultimaCompra" ? order : false}>
                  <TableSortLabel
                    active={orderBy === "ultimaCompra"}
                    direction={order}
                    onClick={() => handleSort("ultimaCompra")}
                  >
                    Última Compra
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {sortedData.map((cliente) => (
                <TableRow key={cliente.clienteId}>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar src={cliente.imagen} alt={cliente.nombre} />
                      <Typography variant="body2" fontWeight={500}>
                        {cliente.nombre}
                      </Typography>
                    </Stack>
                  </TableCell>

                  <TableCell align="center">{cliente.numeroCompras}</TableCell>

                  <TableCell align="right">
                    ${cliente.totalComprado.toLocaleString("es-CL")}
                  </TableCell>

                  <TableCell align="right">
                    ${cliente.ticketPromedio.toLocaleString("es-CL")}
                  </TableCell>

                  <TableCell align="center">
                    {new Date(cliente.ultimaCompra).toLocaleDateString("es-CL")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ClientesFrecuentesTable;
