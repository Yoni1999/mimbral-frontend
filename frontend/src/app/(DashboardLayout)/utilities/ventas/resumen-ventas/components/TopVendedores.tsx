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
import { formatVentas } from "@/utils/format";

interface Vendedor {
  Nombre: string;
  Imagen: string;
  UnidadesVendidas: number;
  Items: number;
  MargenBruto: number;
  MargenPorcentaje: number;
  TotalVentas?: number;
  
}

type Order = "asc" | "desc";
type OrderBy = "UnidadesVendidas" | "Items" | "MargenBruto" | "MargenPorcentaje" | "TotalVentas";

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
      const valA = a[orderBy] ?? 0;
      const valB = b[orderBy] ?? 0;
      return order === "asc" ? valA - valB : valB - valA;
    });
  }, [data, order, orderBy]);

  return (
    <Card elevation={1} sx={{ borderRadius: 2, p: 2, background: "#fff" }}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Top 10 Vendedores
        </Typography>

        <Box sx={{ maxHeight: 307.5, overflowY: "auto" }}>
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

                <TableCell align="right" sortDirection={orderBy === "TotalVentas" ? order : false}>
                  <TableSortLabel
                    active={orderBy === "TotalVentas"}
                    direction={order}
                    onClick={() => handleSort("TotalVentas")}
                  >
                    Total Ventas
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

                  <TableCell align="right">
                    {vendedor.TotalVentas ? formatVentas(vendedor.TotalVentas) : "-"}
                  </TableCell>

                  <TableCell align="right">{vendedor.Items}</TableCell>

                  <TableCell align="right">
                    {formatVentas(vendedor.MargenBruto)}
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
