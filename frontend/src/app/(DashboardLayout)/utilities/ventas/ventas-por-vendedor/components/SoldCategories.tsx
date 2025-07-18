"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  TableSortLabel,
} from "@mui/material";
import {
  ArrowDropUp as ArrowDropUpIcon,
  ArrowDropDown as ArrowDropDownIcon,
} from "@mui/icons-material";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";
import { formatVentas, formatUnidades } from "@/utils/format";


interface Producto {
  Codigo_Categoria: string;
  Nombre_Categoria: string;
  Cantidad_Vendida: number;
  Total_Ventas: number;
  Imagen?: string;
  Ventas_Anterior: number;
  Unidades_Anterior: number;
  MargenBruto_Actual: number;
  MargenBruto_Anterior: number;
  PorcentajeCambioVentas: number;
  PorcentajeCambioUnidades: number;
  MargenBruto_Actual_Porcentaje: number;
  MargenBruto_Anterior_Porcentaje: number;
}

interface Filters {
  vendedorEmpresa: string;
  temporada: string;
  periodo: string;
  fechaInicio: string;
  fechaFin: string;
  modoComparacion: string;
  canal: string;
}

interface Props {
  filtros: Filters;
}

const TopProductosChart: React.FC<Props> = ({ filtros }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState<Producto[]>([]);
  const [sortBy, setSortBy] = useState<"unidades" | "ventas" | "margen" | "">("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const getPeriodoParam = (periodo: string) => {
    switch (periodo) {
      case "1D": return "1d";
      case "7D": return "7d";
      case "14D": return "14d";
      case "1M": return "1m";
      case "3M": return "3m";
      case "6M": return "6m";
      default: return "1d";
    }
  };

  useEffect(() => {
    const buildQuery = () => {
      const params = new URLSearchParams();

      if (filtros.periodo) {
        params.append("periodo", getPeriodoParam(filtros.periodo));
      } else {
        if (filtros.fechaInicio) params.append("fechaInicio", filtros.fechaInicio);
        if (filtros.fechaFin) params.append("fechaFin", filtros.fechaFin);
      }

      if (filtros.modoComparacion) params.append("modoComparacion", filtros.modoComparacion);
      if (filtros.vendedorEmpresa) params.append("vendedorEmpresa", filtros.vendedorEmpresa);
      if (filtros.canal) params.append("canal", filtros.canal);

      return params.toString();
    };

    const fetchData = async () => {
      try {
        const query = buildQuery();
        const url = `${BACKEND_URL}/api/pv/ventascategoria?${query}`;
        const res = await fetchWithToken(url);
        const json = await res!.json();

        const mapped: Producto[] = json.map((item: any) => ({
          Codigo_Categoria: item.code,
          Nombre_Categoria: item.Categoria,
          Cantidad_Vendida: item.Unidades_Actual,
          Total_Ventas: item.Ventas_Actual,
          Imagen: item.U_Imagen,
          Ventas_Anterior: item.Ventas_Anterior,
          Unidades_Anterior: item.Unidades_Anterior,
          MargenBruto_Actual: item.MargenBruto_Actual,
          MargenBruto_Anterior: item.MargenBruto_Anterior,
          PorcentajeCambioVentas: item.PorcentajeCambioVentas,
          PorcentajeCambioUnidades: item.PorcentajeCambioUnidades,
          MargenBruto_Actual_Porcentaje: item.MargenBruto_Actual_Porcentaje,
          MargenBruto_Anterior_Porcentaje: item.MargenBruto_Anterior_Porcentaje,
        }));

        setData(mapped);
      } catch (error) {
        console.error("Error al obtener datos de categoría:", error);
        setData([]);
      }
    };

    fetchData();
  }, [filtros]);

  const handleSort = (column: "unidades" | "ventas" | "margen") => {
    if (sortBy === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDirection("desc");
    }
  };

  const formatMillones = (valor: number): string => `$${(valor / 1_000_000).toFixed(2)} MM`;

  const sortedData = [...data].sort((a, b) => {
    let fieldA = 0;
    let fieldB = 0;

    switch (sortBy) {
      case "unidades":
        fieldA = a.Cantidad_Vendida;
        fieldB = b.Cantidad_Vendida;
        break;
      case "ventas":
        fieldA = a.Total_Ventas;
        fieldB = b.Total_Ventas;
        break;
      case "margen":
        fieldA = a.MargenBruto_Actual_Porcentaje;
        fieldB = b.MargenBruto_Actual_Porcentaje;
        break;
      default:
        return 0;
    }

    return sortDirection === "asc" ? fieldA - fieldB : fieldB - fieldA;
  });

  const filteredData = sortedData.filter((row) =>
    row.Nombre_Categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2,
        background: "#fff",
        border: "1px solid #e0e0e0",
        height: 490,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
          <Typography variant="h6" color="primary" fontWeight={600}>
            Categorías Vendidas
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <TextField
            placeholder="Buscar categoría..."
            size="small"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: "200px" }}
          />
        </Box>

        <Box sx={{ flex: 1, overflowY: "auto", overflowX: "auto", mt: 1 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Categoría</TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                  <TableSortLabel
                    active={sortBy === "unidades"}
                    direction={sortDirection}
                    onClick={() => handleSort("unidades")}
                  >
                    Unidades
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                  <TableSortLabel
                    active={sortBy === "ventas"}
                    direction={sortDirection}
                    onClick={() => handleSort("ventas")}
                  >
                    Ventas
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                  <TableSortLabel
                    active={sortBy === "margen"}
                    direction={sortDirection}
                    onClick={() => handleSort("margen")}
                  >
                    Margen Bruto
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {row.Imagen ? (
                        <img
                          src={row.Imagen}
                          alt={row.Nombre_Categoria}
                          style={{
                            width: 38,
                            height: 38,
                            objectFit: "cover",
                            borderRadius: 6,
                          }}
                        />
                      ) : (
                        <Box sx={{ width: 38, height: 38, backgroundColor: "#eee", borderRadius: 4 }} />
                      )}
                      <Typography variant="body2" fontWeight={500}>
                        {row.Nombre_Categoria}
                      </Typography>
                    </Box>
                  </TableCell>

                  <TableCell align="right">
                    <Typography fontWeight={500}>{formatUnidades(row.Cantidad_Vendida)}</Typography>
                    <Box display="flex" justifyContent="flex-end" alignItems="center" gap={0.5}>
                      {row.PorcentajeCambioUnidades > 0 ? (
                        <ArrowDropUpIcon sx={{ color: "success.main", fontSize: 20 }} />
                      ) : row.PorcentajeCambioUnidades < 0 ? (
                        <ArrowDropDownIcon sx={{ color: "error.main", fontSize: 20 }} />
                      ) : null}
                      <Typography
                        variant="caption"
                        sx={{
                          color:
                            row.PorcentajeCambioUnidades > 0
                              ? "success.main"
                              : row.PorcentajeCambioUnidades < 0
                                ? "error.main"
                                : "text.secondary",
                          fontWeight: 500,
                        }}
                      >
                        {row.PorcentajeCambioUnidades?.toFixed(1)}%
                      </Typography>
                    </Box>
                  </TableCell>

                  <TableCell align="right">
                    <Typography fontWeight={500}>{formatVentas(row.Total_Ventas)}</Typography>
                  </TableCell>

                  <TableCell align="right">
                    <Box display="flex" flexDirection="column" alignItems="flex-end">
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Typography fontWeight={500}>
                          {row.MargenBruto_Actual_Porcentaje?.toFixed(2)}%
                        </Typography>
                        {row.PorcentajeCambioVentas > 0 ? (
                          <ArrowDropUpIcon sx={{ color: "success.main", fontSize: 20 }} />
                        ) : row.PorcentajeCambioVentas < 0 ? (
                          <ArrowDropDownIcon sx={{ color: "error.main", fontSize: 20 }} />
                        ) : null}
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color:
                            row.PorcentajeCambioVentas > 0
                              ? "success.main"
                              : row.PorcentajeCambioVentas < 0
                                ? "error.main"
                                : "text.secondary",
                          fontWeight: 500,
                        }}
                      >
                        {row.PorcentajeCambioVentas?.toFixed(1)}%
                      </Typography>
                    </Box>
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

export default TopProductosChart;
