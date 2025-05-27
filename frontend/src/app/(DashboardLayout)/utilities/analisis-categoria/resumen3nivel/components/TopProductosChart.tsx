"use client";
import React, { useEffect, useState } from "react";
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
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";

interface Filters {
  temporada: string;
  periodo: string;
  fechaInicio: string;
  fechaFin: string;
  subcategoria?: string;
}

interface Producto {
  Nombre_Producto: string;
  Imagen: string;
  Cantidad_Vendida: number;
  Total_Ventas: number;
}

interface Props {
  filters: Filters;
}

const TopProductosChart: React.FC<Props> = ({ filters }) => {
  const [data, setData] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  const buildQuery = () => {
    const params = new URLSearchParams();

    if (filters.fechaInicio) params.append("fechaInicio", filters.fechaInicio);
    if (filters.fechaFin) params.append("fechaFin", filters.fechaFin);
    if (filters.subcategoria) params.append("subcategoria", filters.subcategoria);

    if (filters.periodo) {
      const mapPeriodo: Record<string, string> = {
        "Hoy": "1d",
        "Ultimos 7 días": "7d",
        "Ultimos 14 días": "14d",
        "Ultimo mes": "1m",
        "3 meses": "3m",
        "6 meses": "6m",
      };
      params.append("periodo", mapPeriodo[filters.periodo] || "7d");
    }

    return params.toString();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const query = buildQuery();
        const response = await fetchWithToken(
          `${BACKEND_URL}/api/tercer-nivel/top-productos-subcategoria?${query}`
        );

        if (!response || !response.ok)
          throw new Error("Error al obtener datos");

        const result = await response.json();

        const datosFiltrados = Array.isArray(result)
          ? result.filter(
              (item) =>
                item.Nombre_Producto !== null &&
                item.Cantidad_Vendida !== null &&
                item.Total_Ventas !== null
            )
          : [];

        datosFiltrados.sort((a, b) => b.Total_Ventas - a.Total_Ventas);
        setData(datosFiltrados);
      } catch (error) {
        console.error("❌ Error al obtener productos más vendidos:", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  const formatMillones = (valor: number): string =>
    `$${(valor / 1_000_000).toFixed(2)} MM`;

  const TablaProductos = ({ height = 320 }: { height?: number }) => (
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
            <TableCell sx={{ fontWeight: "bold" }}>Producto</TableCell>
            <TableCell align="right" sx={{ fontWeight: "bold" }}>
              Cantidad Vendida
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: "bold" }}>
              Total Ventas
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={index}>
              <TableCell>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {row.Imagen && (
                    <img
                      src={row.Imagen}
                      alt={row.Nombre_Producto}
                      style={{
                        width: 40,
                        height: 40,
                        objectFit: "cover",
                        borderRadius: 4,
                      }}
                    />
                  )}
                  <Typography variant="body2">
                    {row.Nombre_Producto}
                  </Typography>
                </Box>
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
          minHeight: 460,
          borderRadius: 2,
          border: "1px solid #e0e0e0",
          transition: "0.3s",
          "&:hover": {
            transform: "translateY(-3px)",
            boxShadow: 3,
          },
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
              py:1,
              borderLeft: "5px solid #d93a3a", 
              backgroundColor: "#ffffff",
              borderRadius: 1,
              color: "primary.main",
              width: "fit-content"
            }}
          >
            Top 10 Productos Más Vendidos
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
            <TablaProductos />
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
              Top 10 Productos Más Vendidos
            </Typography>
            <IconButton onClick={() => setOpenModal(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <TablaProductos height={460} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TopProductosChart;
