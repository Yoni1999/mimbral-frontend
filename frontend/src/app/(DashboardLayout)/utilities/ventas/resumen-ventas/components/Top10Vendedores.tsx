"use client";
import React, { useMemo, useState } from "react";
import { Avatar, Box, Table, TableBody, TableCell, TableHead, TableRow, TableSortLabel, Typography } from "@mui/material";
import { BarraParticipacion, ChipMargen, formatoMonto, tablaSx, tinta, Panel, Columnas, TextoCelda } from "../../components/estilo";

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

const iniciales = (nombre: string) =>
  nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

const TopVendedoresChart: React.FC<Props> = ({ data }) => {
  const [order, setOrder] = useState<Order>("desc");
  const [orderBy, setOrderBy] = useState<OrderBy>("TotalVentas");

  const handleSort = (key: OrderBy) => {
    if (orderBy === key) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setOrderBy(key);
      setOrder("desc");
    }
  };

  const sortedData = useMemo(() => {
    return [...(Array.isArray(data) ? data : [])].sort((a, b) => {
      const valA = a[orderBy] ?? 0;
      const valB = b[orderBy] ?? 0;
      return order === "asc" ? valA - valB : valB - valA;
    });
  }, [data, order, orderBy]);

  const maxVenta = Math.max(0, ...sortedData.map((v) => v.TotalVentas ?? 0));

  const columna = (key: OrderBy, label: string, ultima = false) => (
    <TableCell align="right" sx={ultima ? { pr: 2.5 } : undefined} sortDirection={orderBy === key ? order : false}>
      <TableSortLabel active={orderBy === key} direction={orderBy === key ? order : "desc"} onClick={() => handleSort(key)}>
        {label}
      </TableSortLabel>
    </TableCell>
  );

  return (
    <Panel titulo="Top 10 vendedores" descripcion="Ordenable por cualquier columna">
      <Box sx={{ maxHeight: 360, overflowY: "auto", overflowX: "hidden", mx: -2.5 }}>
        <Table size="small" stickyHeader sx={tablaSx}>
          <Columnas anchos={[30, 18, 13, 10, 15, 14]} />
          <TableHead>
            <TableRow>
              <TableCell sx={{ pl: 2.5 }}>Vendedor</TableCell>
              {columna("TotalVentas", "Ventas")}
              {columna("UnidadesVendidas", "Unidades")}
              {columna("Items", "Ítems")}
              {columna("MargenBruto", "Margen bruto")}
              {columna("MargenPorcentaje", "% Margen", true)}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData.map((vendedor) => (
              <TableRow key={vendedor.Nombre}>
                <TableCell sx={{ pl: 2.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar
                      src={vendedor.Imagen || undefined}
                      alt={vendedor.Nombre}
                      sx={{ width: 26, height: 26, fontSize: 11, fontWeight: 700, bgcolor: "#eff4ff", color: tinta.acento, flexShrink: 0 }}
                    >
                      {iniciales(vendedor.Nombre || "")}
                    </Avatar>
                    <TextoCelda texto={vendedor.Nombre} />
                  </Box>
                </TableCell>
                <TableCell align="right">
                  {vendedor.TotalVentas ? formatoMonto(vendedor.TotalVentas) : "—"}
                  <Box sx={{ mt: 0.5 }}>
                    <BarraParticipacion valor={vendedor.TotalVentas ?? 0} maximo={maxVenta} />
                  </Box>
                </TableCell>
                <TableCell align="right">{(vendedor.UnidadesVendidas ?? 0).toLocaleString("es-CL")}</TableCell>
                <TableCell align="right">{(vendedor.Items ?? 0).toLocaleString("es-CL")}</TableCell>
                <TableCell align="right">{formatoMonto(vendedor.MargenBruto)}</TableCell>
                <TableCell align="right" sx={{ pr: 2.5 }}>
                  <ChipMargen valor={vendedor.MargenPorcentaje} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Panel>
  );
};

export default TopVendedoresChart;
