import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Box
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { formatUnidades, formatVentas } from "@/utils/format";

interface Props {
  open: boolean;
  onClose: () => void;
  data?: {
    Mes: string; // formato: "2024-06"
    UnidadesVendidas: number;
    TotalVentas: number;
  }[];
}

const getNombreMes = (mesYYYYMM: string) => {
  const [year, month] = mesYYYYMM.split("-");
  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const mesNombre = meses[parseInt(month) - 1];
  return `${mesNombre} ${year}`;
};

const HistorialVentasModal: React.FC<Props> = ({ open, onClose, data }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={600}>
            Historial de Ventas (últimos 12 meses)
          </Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><b>Mes</b></TableCell>
              <TableCell align="right"><b>Unidades Vendidas</b></TableCell>
              <TableCell align="right"><b>Total Ventas</b></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {Array.isArray(data) && data.length > 0 ? (
              data.map((row, i) => (
                <TableRow key={i}>
                  <TableCell>{getNombreMes(row.Mes)}</TableCell>
                  <TableCell align="right">{formatUnidades(row.UnidadesVendidas)}</TableCell>
                  <TableCell align="right">{formatVentas(row.TotalVentas)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  No hay datos disponibles.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
};

export default HistorialVentasModal;
