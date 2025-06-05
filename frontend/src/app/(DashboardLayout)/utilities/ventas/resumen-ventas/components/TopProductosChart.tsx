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

interface Vendedor {
  Nombre: string;
  Imagen: string;
  UnidadesVendidas: number;
  Items: number;
  MargenBruto: number;
  MargenPorcentaje: number;
}

type Order = "asc" | "desc";
type OrderBy = "UnidadesVendidas" | "Items" | "MargenBruto" | "MargenPorcentaje";

const data: Vendedor[] = [
  {
    Nombre: "Juan Pérez",
    Imagen: "/avatars/juan.png",
    UnidadesVendidas: 620,
    Items: 150,
    MargenBruto: 2540000,
    MargenPorcentaje: 28.5,
  },
  {
    Nombre: "María Gómez",
    Imagen: "/avatars/maria.png",
    UnidadesVendidas: 580,
    Items: 135,
    MargenBruto: 2130000,
    MargenPorcentaje: 25.1,
  },
  {
    Nombre: "David López",
    Imagen: "/avatars/david.png",
    UnidadesVendidas: 565,
    Items: 145,
    MargenBruto: 2210000,
    MargenPorcentaje: 26.2,
  },
  {
    Nombre: "Ana Martínez",
    Imagen: "/avatars/ana.png",
    UnidadesVendidas: 530,
    Items: 130,
    MargenBruto: 1980000,
    MargenPorcentaje: 28.9,
  },
  {
    Nombre: "Carlos Sánchez",
    Imagen: "/avatars/carlos.png",
    UnidadesVendidas: 510,
    Items: 125,
    MargenBruto: 1870000,
    MargenPorcentaje: 24.5,
  },
  {
    Nombre: "Laura Torres",
    Imagen: "/avatars/laura.png",
    UnidadesVendidas: 495,
    Items: 120,
    MargenBruto: 1650000,
    MargenPorcentaje: 23.2,
  },
  {
    Nombre: "Pedro Ruiz",
    Imagen: "/avatars/pedro.png",
    UnidadesVendidas: 475,
    Items: 116,
    MargenBruto: 1590000,
    MargenPorcentaje: 24.7,
  },
  {
    Nombre: "Sandra Fernández",
    Imagen: "/avatars/sandra.png",
    UnidadesVendidas: 460,
    Items: 114,
    MargenBruto: 1480000,
    MargenPorcentaje: 25.1,
  },
  {
    Nombre: "Javier Morales",
    Imagen: "/avatars/javier.png",
    UnidadesVendidas: 450,
    Items: 110,
    MargenBruto: 1430000,
    MargenPorcentaje: 22.8,
  },
  {
    Nombre: "Patricia Castro",
    Imagen: "/avatars/patricia.png",
    UnidadesVendidas: 440,
    Items: 108,
    MargenBruto: 1320000,
    MargenPorcentaje: 21.5,
  },
];

const TopVendedoresChart: React.FC = () => {
  const [order, setOrder] = useState<Order>("desc");
  const [orderBy, setOrderBy] = useState<OrderBy>("MargenBruto");

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
      const valA = a[orderBy];
      const valB = b[orderBy];
      return order === "asc" ? valA - valB : valB - valA;
    });
  }, [data, order, orderBy]);

  return (
    <Card elevation={1} sx={{ borderRadius: 2, p: 2, background: "#fff" }}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Top 10 Vendedores
        </Typography>

        <Box sx={{ maxHeight: 415, overflowY: "auto" }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Vendedor</TableCell>

                <TableCell align="right" sortDirection={orderBy === "UnidadesVendidas" ? order : false}>
                  <TableSortLabel
                    active={orderBy === "UnidadesVendidas"}
                    direction={order}
                    onClick={() => handleSort("UnidadesVendidas")}
                  >
                    Unidades
                  </TableSortLabel>
                </TableCell>

                <TableCell align="right" sortDirection={orderBy === "Items" ? order : false}>
                  <TableSortLabel
                    active={orderBy === "Items"}
                    direction={order}
                    onClick={() => handleSort("Items")}
                  >
                    Ítems
                  </TableSortLabel>
                </TableCell>

                <TableCell align="right" sortDirection={orderBy === "MargenBruto" ? order : false}>
                  <TableSortLabel
                    active={orderBy === "MargenBruto"}
                    direction={order}
                    onClick={() => handleSort("MargenBruto")}
                  >
                    Margen Bruto
                  </TableSortLabel>
                </TableCell>

                <TableCell align="right" sortDirection={orderBy === "MargenPorcentaje" ? order : false}>
                  <TableSortLabel
                    active={orderBy === "MargenPorcentaje"}
                    direction={order}
                    onClick={() => handleSort("MargenPorcentaje")}
                  >
                    %
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {sortedData.map((vendedor, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar src={vendedor.Imagen} alt={vendedor.Nombre} />
                      <Typography variant="body2" fontWeight={500}>
                        {vendedor.Nombre}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align="right">{vendedor.UnidadesVendidas}</TableCell>
                  <TableCell align="right">{vendedor.Items}</TableCell>
                  <TableCell align="right">
                    ${vendedor.MargenBruto.toLocaleString("es-CL")}
                  </TableCell>
                  <TableCell align="right">
                    {vendedor.MargenPorcentaje.toFixed(1).replace(".", ",")}
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

export default TopVendedoresChart;
