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
  CircularProgress,
} from "@mui/material";
import { useApiDatos } from "@/utils/useCargaDatos";
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

  const handleSort = (key: OrderBy) => {
    if (orderBy === key) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setOrderBy(key);
      setOrder("desc");
    }
  };

  // Al cambiar un filtro se limpia al instante y solo queda la última respuesta.
  const params = new URLSearchParams();
  if (filters.itemCode) params.append("itemCode", filters.itemCode);
  if (filters.canal) params.append("canal", filters.canal);
  if (filters.periodo) params.append("periodo", filters.periodo);
  if (filters.fechaInicio) params.append("fechaInicio", filters.fechaInicio);
  if (filters.fechaFin) params.append("fechaFin", filters.fechaFin);
  const url = filters.itemCode ? `${BACKEND_URL}/api/canal-vendedor?${params.toString()}` : null;
  const { datos: data, cargando } = useApiDatos<Vendedor[]>(url, []);

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const valA = a[orderBy] ?? 0;
      const valB = b[orderBy] ?? 0;
      return order === "asc" ? valA - valB : valB - valA;
    });
  }, [data, order, orderBy]);

return (
  <Card elevation={1} sx={{ borderRadius: 0, backgroundColor: "transparent", boxShadow: "none" }}>
    <CardContent sx={{ p: 0 }}>
      <Typography variant="h6" fontWeight="bold" mb={2}>
        Top  10 Vendedores del Producto
      </Typography>

      <Box
        sx={{
            maxHeight: 320,
            minHeight: 200, 
            overflowY: "auto",
            overflowX: "auto",
            width: "100%",
        }}
        >
        <Table size="small" stickyHeader sx={{ minWidth: 600 }}>
          <TableHead>
            <TableRow>
              <TableCell>Nombre Vendedores</TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={orderBy === "CantidadVendida"}
                  direction={order}
                  onClick={() => handleSort("CantidadVendida")}
                >
                  Unidades vendidas
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
            {cargando && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            )}
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

