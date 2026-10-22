"use client";
import React, { useMemo, useState } from "react";
import { Avatar, Box, Table, TableBody, TableCell, TableHead, TableRow, TableSortLabel, Typography } from "@mui/material";
import { BarraParticipacion, ChipMargen, formatoMonto, tablaSx, tinta, Panel, Columnas, TextoCelda } from "../../components/estilo";

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

const CategoriasTableChart: React.FC<Props> = ({ data, height = 360 }) => {
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

  const maxVenta = Math.max(0, ...sortedData.map((c) => c.TotalVentas));

  const columna = (key: OrderBy, label: string) => (
    <TableCell align="right" sortDirection={orderBy === key ? order : false}>
      <TableSortLabel active={orderBy === key} direction={orderBy === key ? order : "desc"} onClick={() => handleSort(key)}>
        {label}
      </TableSortLabel>
    </TableCell>
  );

  return (
    <Panel titulo="Top 10 categorías por margen bruto" descripcion="Categorías con mejor margen en el período">
      <Box sx={{ maxHeight: height, overflowY: "auto", overflowX: "hidden", mx: -2.5 }}>
        <Table size="small" stickyHeader sx={tablaSx}>
          <Columnas anchos={[40, 22, 20, 18]} />
          <TableHead>
            <TableRow>
              <TableCell sx={{ pl: 2.5 }}>Categoría</TableCell>
              {columna("TotalVentas", "Ventas")}
              {columna("MargenAbsoluto", "Margen bruto")}
              <TableCell align="right" sx={{ pr: 2.5 }} sortDirection={orderBy === "MargenPorcentaje" ? order : false}>
                <TableSortLabel
                  active={orderBy === "MargenPorcentaje"}
                  direction={orderBy === "MargenPorcentaje" ? order : "desc"}
                  onClick={() => handleSort("MargenPorcentaje")}
                >
                  % Margen
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData.map((item) => (
              <TableRow key={item.Categoria}>
                <TableCell sx={{ pl: 2.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar src={item.U_Imagen} alt={item.Categoria} variant="rounded" sx={{ width: 26, height: 26, bgcolor: "#f1f5f9", flexShrink: 0 }} />
                    <TextoCelda texto={item.Categoria} />
                  </Box>
                </TableCell>
                <TableCell align="right">
                  {formatoMonto(item.TotalVentas)}
                  <Box sx={{ mt: 0.5 }}>
                    <BarraParticipacion valor={item.TotalVentas} maximo={maxVenta} />
                  </Box>
                </TableCell>
                <TableCell align="right">{formatoMonto(item.MargenAbsoluto)}</TableCell>
                <TableCell align="right" sx={{ pr: 2.5 }}>
                  <ChipMargen valor={item.MargenPorcentaje} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Panel>
  );
};

export default CategoriasTableChart;
