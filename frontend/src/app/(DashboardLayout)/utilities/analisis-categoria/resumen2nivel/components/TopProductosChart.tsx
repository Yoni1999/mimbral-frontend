"use client";
import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Dialog,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import ExpandIcon from "@mui/icons-material/ZoomOutMap";
import CloseIcon from "@mui/icons-material/Close";
import { apiJson } from "@/utils/apiClient";
import { useCargaDatos } from "@/utils/useCargaDatos";
import { BACKEND_URL } from "@/config";

interface Filters {
  temporada: string;
  periodo: string;
  fechaInicio: string;
  fechaFin: string;
  categoria?: string;
}

interface Producto {
  Codigo_SubCategoria: string;
  Nombre_SubCategoria: string;
  Cantidad_Vendida: number;
  Total_Ventas: number;
  NumTransacciones: number;
  Imagen_URL: string;
}

interface Props {
  filters: Filters;
}

const TopProductosChart: React.FC<Props> = ({ filters }) => {
  const [openModal, setOpenModal] = useState(false);
  const [sortField, setSortField] = useState<"Cantidad_Vendida" | "Total_Ventas" | "Nombre_SubCategoria" | "NumTransacciones" | "">("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");


  const handleSort = (field: typeof sortField) => {
  if (sortField === field) {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  } else {
    setSortField(field);
    setSortDirection("desc");
  }
};


  const mapPeriodo = (nombre: string): string => {
    const mapa: Record<string, string> = {
      "Hoy": "1D",
      "Ultimos 7 días": "7D",
      "Ultimos 14 días": "14D",
      "Ultimo mes": "1M",
      "3 meses": "3M",
      "6 meses": "6M",
      "1D": "1D",
      "7D": "7D",
      "14D": "14D",
      "1M": "1M",
      "3M": "3M",
      "6M": "6M",
    };
    return mapa[nombre] || "7D";
  };

  // ✅ Redirección con formato correcto
  const handleRedirect = (codigoSubcategoria: string) => {
    const params = new URLSearchParams();
    params.append("subcategoria", codigoSubcategoria);
    if (filters.temporada) params.append("temporada", filters.temporada);
    if (filters.periodo) params.append("periodo", mapPeriodo(filters.periodo));
    if (filters.fechaInicio) params.append("fechaInicio", filters.fechaInicio);
    if (filters.fechaFin) params.append("fechaFin", filters.fechaFin);

    window.open(`/utilities/analisis-categoria/resumen3nivel?${params.toString()}`, "_blank");
  };

  // ✅ Consulta al backend usando la misma lógica
  const buildQuery = () => {
    const params = new URLSearchParams();
    if (filters.fechaInicio) params.append("fechaInicio", filters.fechaInicio);
    if (filters.fechaFin) params.append("fechaFin", filters.fechaFin);
    if (filters.periodo) params.append("periodo", mapPeriodo(filters.periodo));
    if (filters.categoria) params.append("categoria", filters.categoria);
    return params.toString();
  };

  // Al cambiar un filtro se limpia al instante y solo queda la última respuesta.
  const url = `${BACKEND_URL}/api/resumen-categoria/top-subcategorias?${buildQuery()}`;
  const { datos: data, cargando: loading } = useCargaDatos<Producto[]>(
    url,
    async (signal) => {
      const result = await apiJson(url, { signal });

      const datosFiltrados: Producto[] = Array.isArray(result)
        ? result.filter(
            (item) =>
              item.Nombre_SubCategoria !== null &&
              item.Cantidad_Vendida !== null &&
              item.Total_Ventas !== null &&
              item.Codigo_SubCategoria !== null
          )
        : [];

      datosFiltrados.sort((a, b) => b.Total_Ventas - a.Total_Ventas);
      return datosFiltrados;
    },
    []
  );

const sortedData = [...data].sort((a, b) => {
  if (!sortField) return 0;

  const valA = a[sortField];
  const valB = b[sortField];

  if (typeof valA === "string" && typeof valB === "string") {
    return sortDirection === "asc"
      ? valA.localeCompare(valB)
      : valB.localeCompare(valA);
  }

  return sortDirection === "asc"
    ? (valA as number) - (valB as number)
    : (valB as number) - (valA as number);
});

  const formatMillones = (valor: number): string =>
    `$${(valor / 1_000_000).toFixed(2)} MM`;

  const TablaSubcategorias = ({ height = 320 }: { height?: number }) => (
    <Box
      sx={{
        maxHeight: height,
        overflowY: "auto",
        overflowX: "auto",
        mt: 2,
      }}
    >
      <Table stickyHeader size="small">
      <TableHead>
        <TableRow>
          <TableCell
            onClick={() => handleSort("Nombre_SubCategoria")}
            sx={{ fontWeight: "bold", cursor: "pointer" }}
          >
            Subcategoría{" "}
            {sortField === "Nombre_SubCategoria" &&
              (sortDirection === "asc" ? "▲" : "▼")}
          </TableCell>

          <TableCell
            align="right"
            onClick={() => handleSort("NumTransacciones")}
            sx={{ fontWeight: "bold", cursor: "pointer" }}
          >
            Transacciones{" "}
            {sortField === "NumTransacciones" &&
              (sortDirection === "asc" ? "▲" : "▼")}
          </TableCell>

          <TableCell
            align="right"
            onClick={() => handleSort("Cantidad_Vendida")}
            sx={{ fontWeight: "bold", cursor: "pointer" }}
          >
            Cantidad Vendida{" "}
            {sortField === "Cantidad_Vendida" &&
              (sortDirection === "asc" ? "▲" : "▼")}
          </TableCell>

          <TableCell
            align="right"
            onClick={() => handleSort("Total_Ventas")}
            sx={{ fontWeight: "bold", cursor: "pointer" }}
          >
            Total Ventas{" "}
            {sortField === "Total_Ventas" && (sortDirection === "asc" ? "▲" : "▼")}
          </TableCell>
        </TableRow>
      </TableHead>

        <TableBody>
          {sortedData.map((row, index) => (
            <TableRow
              key={index}
              hover
              sx={{ cursor: "pointer" }}
              onClick={() => handleRedirect(row.Codigo_SubCategoria)}
            >
              <TableCell>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    component="img"
                    src={row.Imagen_URL}
                    alt={row.Nombre_SubCategoria}
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: 1,
                      objectFit: "cover",
                      flexShrink: 0,
                      backgroundColor: "#f5f5f5",
                      border: "1px solid #ddd",
                    }}
                  />
                  <Typography variant="body2" fontWeight={500}>
                    {row.Nombre_SubCategoria}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell align="right">
                {row.NumTransacciones.toLocaleString("es-CL")}
              </TableCell>
              <TableCell align="right">
                {row.Cantidad_Vendida.toLocaleString("es-CL")}
              </TableCell>
              <TableCell align="right">
                {formatMillones(row.Total_Ventas)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );

  return (
    <>
      <Card
        elevation={0}
        sx={{
          borderRadius: 2,
          height: 460,
          background: "#fff",
          border: "1px solid #e0e0e0",
          p: 2,
        }}
      >
        <CardContent>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 500,
                fontSize: "1rem",
                mb: 2.5,
                p: 2.5,
                pl: 3,
                py: 1,
                borderLeft: "5px solid #d93a3a",
                backgroundColor: "#ffffff",
                borderRadius: 1,
                color: "#primary.main",
                width: "fit-content",
              }}
            >
              Sub-Categorías Asociadas
            </Typography>
            <IconButton onClick={() => setOpenModal(true)} size="small">
              <ExpandIcon />
            </IconButton>
          </Box>

          {loading ? (
            <Typography mt={2}>Cargando datos...</Typography>
          ) : data.length === 0 ? (
            <Typography mt={2}>
              No hay datos disponibles para los filtros seleccionados.
            </Typography>
          ) : (
            <TablaSubcategorias />
          )}
        </CardContent>
      </Card>

      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogContent>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6">
              Top 10 Sub-Categorías Más Vendidas
            </Typography>
            <IconButton onClick={() => setOpenModal(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <TablaSubcategorias height={500} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TopProductosChart;

