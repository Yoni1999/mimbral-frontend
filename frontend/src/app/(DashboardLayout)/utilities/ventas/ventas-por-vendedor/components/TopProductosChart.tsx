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
  Tooltip,
  TextField,
} from "@mui/material";
import ExpandIcon from "@mui/icons-material/ZoomOutMap";
import CloseIcon from "@mui/icons-material/Close";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";
import { formatVentas } from "@/utils/format";

interface Producto {
  Codigo_Categoria: string;
  Nombre_Categoria: string;
  Cantidad_Vendida: number;
  Total_Ventas: number;
  Imagen?: string;
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
  const [openModal, setOpenModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState<Producto[]>([]);

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

      if (filtros.modoComparacion) {
        params.append("modoComparacion", filtros.modoComparacion);
      }

      if (filtros.vendedorEmpresa) {
        params.append("vendedorEmpresa", filtros.vendedorEmpresa);
      }

      if (filtros.canal) {
        params.append("canal", filtros.canal);
      }

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
        }));

        setData(mapped);
      } catch (error) {
        console.error("Error al obtener datos de categoría:", error);
        setData([]); // en caso de error, también limpiamos
      }
    };

    fetchData();
  }, [filtros]);


  const formatMillones = (valor: number): string =>
    `$${(valor / 1_000_000).toFixed(2)} MM`;

  const filteredData = data.filter((row) =>
    row.Nombre_Categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const TablaSubcategorias = ({ height = 320 }: { height?: number }) => (
    <Box sx={{ maxHeight: height, overflowY: "auto", overflowX: "auto", mt: 1 }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: "bold" }}>Categoría</TableCell>
            <TableCell align="right" sx={{ fontWeight: "bold" }}>Unidades</TableCell>
            <TableCell align="right" sx={{ fontWeight: "bold" }}>Ventas</TableCell>
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
          background: "#fff",
          border: "1px solid #e0e0e0",
          p: 2,
          height: 460,
        }}
      >
        <CardContent>
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
            <Tooltip title="Expandir">
              <IconButton onClick={() => setOpenModal(true)} size="small">
                <ExpandIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <TablaSubcategorias />
        </CardContent>
      </Card>

      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="md">
        <DialogContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight={600}>
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
