"use client";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TableContainer,
  Button,
  Popover,
  Typography,
  Box,
  IconButton,
} from "@mui/material";
import { useState } from "react";
import VisibilityIcon from "@mui/icons-material/Visibility";

const cumplePeriodo = (fechaStr: string, periodo: string) => {
  if (!periodo) return true;
  const fecha = new Date(fechaStr);
  const hoy = new Date();
  const meses = { "1M": 1, "3M": 3, "6M": 6 };
  const mesesAtras = new Date();
  mesesAtras.setMonth(hoy.getMonth() - meses[periodo]);
  return fecha >= mesesAtras;
};

const TablaMetasFiltradas = ({ filtros, metas }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [vendedoresSkuSeleccionado, setVendedoresSkuSeleccionado] = useState<{ [key: string]: number } | null>(null);

  const handleOpenPopover = (event: React.MouseEvent<HTMLElement>, vendedores: any) => {
    setAnchorEl(event.currentTarget);
    setVendedoresSkuSeleccionado(vendedores);
  };

  const handleClosePopover = () => {
    setAnchorEl(null);
    setVendedoresSkuSeleccionado(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? "popover-vendedores" : undefined;

  const metasFiltradas = metas.filter((meta) => {
    const coincideBusqueda =
      meta.sku.toLowerCase().includes(filtros.busqueda.toLowerCase()) ||
      meta.nombre.toLowerCase().includes(filtros.busqueda.toLowerCase());
    const coincideCanal = filtros.canal === "" || meta.canal === filtros.canal;
    const coincidePeriodo = cumplePeriodo(meta.fechaCreacion, filtros.periodo);
    return coincideBusqueda && coincideCanal && coincidePeriodo;
  });

  return (
    <>
      <TableContainer component={Paper} elevation={0}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>SKU</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Meta Asignada</TableCell>
              <TableCell>Ventas</TableCell>
              <TableCell>Fecha Creación</TableCell>
              <TableCell align="center">Ver Vendedores</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {metasFiltradas.map((meta) => (
              <TableRow key={meta.id}>
                <TableCell>{meta.sku}</TableCell>
                <TableCell>{meta.nombre}</TableCell>
                <TableCell>{meta.metaAsignada}</TableCell>
                <TableCell>{meta.metaAlcanzada}</TableCell>
                <TableCell>{meta.fechaCreacion}</TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={(e) => handleOpenPopover(e, meta.ventasPorVendedor)}
                    disabled={!meta.ventasPorVendedor || Object.keys(meta.ventasPorVendedor).length === 0}
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}

            {metasFiltradas.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No se encontraron resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 🔍 Popover por SKU */}
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        PaperProps={{ sx: { p: 2, minWidth: 250 } }}
      >
        <Typography variant="h6" gutterBottom>
          Ventas por Vendedor
        </Typography>
        {vendedoresSkuSeleccionado &&
          Object.entries(vendedoresSkuSeleccionado).map(([nombre, cantidad]) => (
            <Typography key={nombre} variant="body2">
              {nombre}: <strong>{cantidad}</strong> unidades
            </Typography>
          ))}
        {!vendedoresSkuSeleccionado ||
          Object.keys(vendedoresSkuSeleccionado).length === 0 && (
            <Typography variant="body2">No hay datos para mostrar.</Typography>
          )}
      </Popover>
    </>
  );
};

export default TablaMetasFiltradas;
