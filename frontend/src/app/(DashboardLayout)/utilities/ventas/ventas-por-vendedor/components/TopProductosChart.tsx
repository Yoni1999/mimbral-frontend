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
  Tooltip,
  TextField,
} from "@mui/material";
import ExpandIcon from "@mui/icons-material/ZoomOutMap";
import CloseIcon from "@mui/icons-material/Close";

interface Producto {
  Codigo_Categoria: string;
  Nombre_Categoria: string;
  Cantidad_Vendida: number;
  Total_Ventas: number;
  Imagen?: string;
}

const TopProductosChart: React.FC = () => {
  const [openModal, setOpenModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const data: Producto[] = [
    { Codigo_Categoria: "001", Nombre_Categoria: "Herramientas", Cantidad_Vendida: 250, Total_Ventas: 25000000 },
    { Codigo_Categoria: "002", Nombre_Categoria: "Pinturas", Cantidad_Vendida: 180, Total_Ventas: 18000000 },
    { Codigo_Categoria: "003", Nombre_Categoria: "Electricidad", Cantidad_Vendida: 150, Total_Ventas: 15000000 },
    { Codigo_Categoria: "004", Nombre_Categoria: "Plomería", Cantidad_Vendida: 120, Total_Ventas: 12000000 },
    { Codigo_Categoria: "005", Nombre_Categoria: "Construcción", Cantidad_Vendida: 100, Total_Ventas: 10000000 },
  ];

  const formatMillones = (valor: number): string =>
    `$${(valor / 1_000_000).toFixed(2)} MM`;

  const filteredData = data.filter((row) =>
    row.Nombre_Categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const TablaSubcategorias = ({ height = 320 }: { height?: number }) => (
    <>
      <Box sx={{ maxHeight: height, overflowY: "auto", overflowX: "auto", mt: 1 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Categorías</TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>Cantidad Vendida</TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>Total Ventas</TableCell>
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
                      <Box sx={{ width: 28, height: 28, backgroundColor: "#eee", borderRadius: 4 }} />
                    )}
                    <Typography variant="body2" fontWeight={500}>
                      {row.Nombre_Categoria}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">{row.Cantidad_Vendida.toLocaleString("es-CL")}</TableCell>
                <TableCell align="right">{formatMillones(row.Total_Ventas)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </>
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
          <Typography variant="h6" color= 'primary' fontWeight={600}>
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
