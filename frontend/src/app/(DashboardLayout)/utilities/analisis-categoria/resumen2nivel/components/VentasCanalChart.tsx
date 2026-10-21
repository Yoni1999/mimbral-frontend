"use client";
import React, { useState } from "react";
import Chart from "react-apexcharts";
import {
  Typography,
  Dialog,
  DialogContent,
  IconButton,
  Box,
  Button,
} from "@mui/material";
import DashboardCard from "@/app/(DashboardLayout)/components/shared/DashboardCard";
import { ApexOptions } from "apexcharts";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/config";
import type { Filters } from "./HeaderCategoria";
import CloseIcon from "@mui/icons-material/Close";
import { apiJson } from "@/utils/apiClient";
import { useCargaDatos } from "@/utils/useCargaDatos";
import FullscreenIcon from "@mui/icons-material/Fullscreen";

// ✅ Mapeo para mostrar nombres legibles
const canalNameMap: Record<string, string> = {
  empresas: "Empresas",
  chorrillo: "Chorrillo",
  balmaceda: "Balmaceda",
  vitex: "Vtex",
  meli: "Mercado Libre",
  falabella: "Falabella",
};

interface Props {
  filters: Filters;
}

interface VentasCanalData {
  [key: string]: number;
}

const VentasCanalChart: React.FC<Props> = ({ filters }) => {
  const [openModal, setOpenModal] = useState<boolean>(false);

  const router = useRouter();

  const buildQuery = () => {
    const params = new URLSearchParams();

    if (filters.fechaInicio) params.append("fechaInicio", filters.fechaInicio);
    if (filters.fechaFin) params.append("fechaFin", filters.fechaFin);

    if (filters.periodo) {
      const mapPeriodo: Record<string, string> = {
        "Hoy": "1d",
        "Ultimos 7 días": "7d",
        "Ultimos 14 días": "14d",
        "Ultimo mes": "1m",
        "3 meses": "3m",
        "6 meses": "6m",
      };
      params.append("periodo", mapPeriodo[filters.periodo] || "1d");
    }

    if (filters.categoria) {
      params.append("categoria", filters.categoria);
    }

    return params.toString();
  };

  // Al cambiar un filtro se limpia al instante y solo queda la última respuesta.
  const url = `${BACKEND_URL}/api/resumen-categoria/ventas-canal-chart?${buildQuery()}`;
  const {
    datos: { chartData, labels, rawLabels },
    cargando: loading,
  } = useCargaDatos<{ chartData: number[]; labels: string[]; rawLabels: string[] }>(
    url,
    async (signal) => {
      const json = await apiJson(url, { signal });

      if (!json || (Array.isArray(json) && json.length === 0)) {
        return { chartData: [], labels: [], rawLabels: [] };
      }

      const data: VentasCanalData = Array.isArray(json) ? json[0] : json;
      const keys = Object.keys(data);
      const mappedKeys = keys.map(key => canalNameMap[key.toLowerCase()] || key);

      return {
        rawLabels: keys, // para navegación
        labels: mappedKeys, // para mostrar
        chartData: Object.values(data),
      };
    },
    { chartData: [], labels: [], rawLabels: [] }
  );

  const options: ApexOptions = {
    chart: {
      type: "donut",
      toolbar: { show: false },
      events: {
        dataPointSelection: (event, chartContext, config) => {
          const indexClicked = config.dataPointIndex;
          const canalOriginal = rawLabels[indexClicked];
          router.push(`/utilities/ventas/ventas-por-canal?canal=${encodeURIComponent(canalOriginal)}`);
        },
      },
    },
    labels: labels,
    colors: [
      "#1E88E5", "#43A047", "#FDD835", "#E53935", "#8E24AA", "#FB8C00", "#546E7A",
    ],
    tooltip: {
      y: {
        formatter: (val: number) => val.toLocaleString("es-CL"),
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: { width: 200 },
          legend: { position: "bottom" },
        },
      },
    ],
  };

  return (
    <>
      <DashboardCard
        elevation={0}
        sx={{
          borderRadius: 2,
          border: "1px solid #e0e0e0",
          transition: "0.3s",
          "&:hover": {
            transform: "translateY(-3px)",
            boxShadow: 3,
          },
          height: 460,
        }}
        title={
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              pl: 2,
              borderLeft: "4px solid #d93a3a",
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                color: "primary.main",
                textTransform: "uppercase",
                fontSize: "0.85rem",
              }}
            >
              Ventas por Canal
            </Typography>
          </Box>
        }
      >
        <Box>
          {loading ? (
            <Typography variant="body1">Cargando gráfico...</Typography>
          ) : (
            <>
              <Chart options={options} series={chartData} type="donut" width="100%" height={300} />
              <Box mt={2} textAlign="right">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setOpenModal(true)}
                  startIcon={<FullscreenIcon />}
                >
                  Expandir
                </Button>
              </Box>
            </>
          )}
        </Box>
      </DashboardCard>

      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { p: 2 } }}
      >
        <DialogContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Ventas por Canal (expandido)</Typography>
            <IconButton onClick={() => setOpenModal(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Chart options={options} series={chartData} type="donut" width="100%" height={400} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VentasCanalChart;

