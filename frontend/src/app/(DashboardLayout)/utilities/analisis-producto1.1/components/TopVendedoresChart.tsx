"use client";

import React, { useMemo, useState, useEffect } from "react";
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
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";
import { formatVentas } from "@/utils/format";

type Order = "asc" | "desc";
type OrderBy = "CantidadVendida" | "TotalVentas" | "MargenBruto" | "Porcentaje";

interface Vendedor {
  Codigo_Vendedor: number;
  Nombre_Vendedor: string;
  Imagen: string;
  CantidadVendida: number;
  TotalVentas: number;
  MargenBruto: number;
  MargenPorcentaje: number;
  Porcentaje: number;
}

interface Props {
  filters: {
    temporada: string;
    periodo: string;
    fechaInicio: string;
    fechaFin: string;
    canal?: string;
    itemCode?: string;
  };
}

const TopVendedoresChart: React.FC<Props> = ({ filters }) => {
  const [order, setOrder] = useState<Order>("desc");
  const [orderBy, setOrderBy] = useState<OrderBy>("MargenBruto");
  const [data, setData] = useState<Vendedor[]>([]);

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

  useEffect(() => {
    const fetchVendedores = async () => {
      if (!filters.itemCode) return;

      try {
        const params = new URLSearchParams();
        params.append("itemCode", filters.itemCode);
        if (filters.canal) params.append("canal", filters.canal);
        if (filters.periodo) params.append("periodo", filters.periodo);
        if (filters.fechaInicio) params.append("fechaInicio", filters.fechaInicio);
        if (filters.fechaFin) params.append("fechaFin", filters.fechaFin);

        const url = `${BACKEND_URL}/api/canal-vendedor?${params.toString()}`;
        const response = await fetchWithToken(url);

        if (!response) throw new Error("Error al obtener datos de vendedores");

        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("❌ Error al obtener top vendedores:", error);
        setData([]);
      }
    };

    fetchVendedores();
  }, [filters]);

return (
  <Card elevation={1} sx={{ borderRadius: 0, backgroundColor: "transparent", boxShadow: "none" }}>
    <CardContent sx={{ p: 0 }}>
      <Typography variant="h6" fontWeight="bold" mb={2}>
        Top Vendedores por Producto
      </Typography>

      <Box
        sx={{
            maxHeight: 320,
            minHeight: 200, // asegura que siempre se vea "relleno"
            overflowY: "auto",
            overflowX: "auto",
            width: "100%",
        }}
        >
        <Table size="small" stickyHeader sx={{ minWidth: 600 }}>
          <TableHead>
            <TableRow>
              <TableCell>Vendedor</TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === "CantidadVendida"}
                  direction={order}
                  onClick={() => handleSort("CantidadVendida")}
                >
                  Unidades
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === "TotalVentas"}
                  direction={order}
                  onClick={() => handleSort("TotalVentas")}
                >
                  Total $
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === "MargenBruto"}
                  direction={order}
                  onClick={() => handleSort("MargenBruto")}
                >
                  Margen
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === "Porcentaje"}
                  direction={order}
                  onClick={() => handleSort("Porcentaje")}
                >
                  % Participación
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {sortedData.map((vendedor, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar src={vendedor.Imagen} alt={vendedor.Nombre_Vendedor} />
                    <Typography variant="body2" fontWeight={500}>
                      {vendedor.Nombre_Vendedor}
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell align="right">{vendedor.CantidadVendida}</TableCell>
                <TableCell align="right">{formatVentas(vendedor.TotalVentas)}</TableCell>
                <TableCell align="right">
                  <Stack spacing={0}>
                    <Typography variant="body2" fontWeight={500}>
                      {formatVentas(vendedor.MargenBruto)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {vendedor.MargenPorcentaje.toFixed(1).replace(".", ",")}% 
                    </Typography>
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  {vendedor.Porcentaje.toFixed(1).replace(".", ",")}%
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
