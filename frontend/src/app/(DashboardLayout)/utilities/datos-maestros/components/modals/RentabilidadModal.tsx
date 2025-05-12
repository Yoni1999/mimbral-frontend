"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Button,
  Paper,
} from "@mui/material";
import "@/lib/chartjs-setup";
import { Line } from "react-chartjs-2";
import { X } from "lucide-react";
import { useState } from "react";

interface RentabilidadModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  data: number[];
  labels: string[];
}

const RentabilidadModal = ({
  open,
  onClose,
  title,
  data,
  labels,
}: RentabilidadModalProps) => {
  const [filtro, setFiltro] = useState("1M");

  const chartData = {
    labels,
    datasets: [
      {
        label: "Margen (%)",
        data,
        borderColor: "#3f51b5",
        backgroundColor: "rgba(63, 81, 181, 0.1)",
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const getFiltroLabel = () => {
    switch (filtro) {
      case "1M":
        return "Último Mes";
      case "3M":
        return "Últimos 3 Meses";
      case "6M":
        return "Últimos 6 Meses";
      case "12M":
        return "Últimos 12 Meses";
      default:
        return `Año ${filtro}`;
    }
  };

  const handleLimpiar = () => {
    setFiltro("1M");
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {title} - {getFiltroLabel()}
          </Typography>
          <IconButton onClick={onClose}>
            <X />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* 🔹 Filtro combinado */}
        <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <Select
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
              >
                <MenuItem value="1M">Último Mes</MenuItem>
                <MenuItem value="3M">Últimos 3 Meses</MenuItem>
                <MenuItem value="6M">Últimos 6 Meses</MenuItem>
                <MenuItem value="12M">Últimos 12 Meses</MenuItem>
                <MenuItem disabled>────────</MenuItem>
                <MenuItem value="2025">Año 2025</MenuItem>
                <MenuItem value="2024">Año 2024</MenuItem>
                <MenuItem value="2023">Año 2023</MenuItem>
              </Select>
            </FormControl>

            <Button variant="contained" color="primary">
              Aplicar Filtros
            </Button>

            <Button variant="outlined" onClick={handleLimpiar}>
              Limpiar
            </Button>
          </Box>
        </Paper>

        {/* 🔹 Gráfico */}
        <Line data={chartData} />
      </DialogContent>
    </Dialog>
  );
};

export default RentabilidadModal;
