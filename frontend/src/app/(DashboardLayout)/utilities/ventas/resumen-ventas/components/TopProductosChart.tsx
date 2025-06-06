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

interface Props {
  data: Vendedor[];
}

const TopVendedoresChart: React.FC<Props> = ({ data }) => {
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
