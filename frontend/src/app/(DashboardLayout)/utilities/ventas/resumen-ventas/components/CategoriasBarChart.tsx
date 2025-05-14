"use client";

import React, { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Divider,
  Grid,
  Avatar,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableSortLabel,
} from "@mui/material";
import { formatVentas } from "@/utils/format"; // ✅ Importación agregada

interface Categoria {
  Categoria: string;
  U_Imagen?: string;
  MargenAbsoluto: number;
  TotalVentas: number;
  MargenPorcentaje: number;
}

interface Props {
  data: Categoria[];
  height?: number;
}

type OrderBy = "MargenAbsoluto" | "TotalVentas" | "MargenPorcentaje";
type Order = "asc" | "desc";

const CategoriasTableChart: React.FC<Props> = ({ data, height = 400 }) => {
  const [orderBy, setOrderBy] = useState<OrderBy>("MargenAbsoluto");
  const [order, setOrder] = useState<Order>("desc");

  const handleSort = (key: OrderBy) => {
    if (orderBy === key) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setOrderBy(key);
      setOrder("desc");
    }
  };

  const sortedData = useMemo(() => {
    const cleaned = Array.isArray(data)
      ? data.filter(
          (item) =>
            !!item.Categoria &&
            item.MargenAbsoluto > 0 &&
            item.TotalVentas > 0 &&
            item.MargenPorcentaje !== undefined
        )
      : [];

    const sorted = [...cleaned].sort((a, b) => {
      const valA = a[orderBy];
      const valB = b[orderBy];
      return order === "asc" ? valA - valB : valB - valA;
    });

    return sorted.slice(0, 10);
  }, [data, orderBy, order]);

  return (
    <Card
      elevation={1}
      sx={{
        borderRadius: 2,
        background: "#fff",
        border: "1px solid #e0e0e0",
        p: 2,
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" fontWeight="bold" color="text.primary">
            Top 10 Categorías con Mejor Margen Bruto
          </Typography>
        </Box>

        <Divider sx={{ mb: 1 }} />

        <Box sx={{ maxHeight: height, overflowY: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Imagen</TableCell>
                <TableCell>Categoría</TableCell>

                <TableCell align="right" sortDirection={orderBy === "TotalVentas" ? order : false}>
                  <TableSortLabel
                    active={orderBy === "TotalVentas"}
                    direction={orderBy === "TotalVentas" ? order : "asc"}
                    onClick={() => handleSort("TotalVentas")}
                  >
                    Ventas
                  </TableSortLabel>
                </TableCell>

                <TableCell align="right" sortDirection={orderBy === "MargenAbsoluto" ? order : false}>
                  <TableSortLabel
                    active={orderBy === "MargenAbsoluto"}
                    direction={orderBy === "MargenAbsoluto" ? order : "asc"}
                    onClick={() => handleSort("MargenAbsoluto")}
                  >
                    Margen Bruto
                  </TableSortLabel>
                </TableCell>

                <TableCell align="right" sortDirection={orderBy === "MargenPorcentaje" ? order : false}>
                  <TableSortLabel
                    active={orderBy === "MargenPorcentaje"}
                    direction={orderBy === "MargenPorcentaje" ? order : "asc"}
                    onClick={() => handleSort("MargenPorcentaje")}
                  >
                    % Margen
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {sortedData.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <Avatar
                      src={item.U_Imagen}
                      alt={item.Categoria}
                      sx={{ width: 36, height: 36 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {item.Categoria}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{formatVentas(item.TotalVentas)}</TableCell>
                  <TableCell align="right">{formatVentas(item.MargenAbsoluto)}</TableCell>
                  <TableCell align="right">{item.MargenPorcentaje.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CategoriasTableChart;
