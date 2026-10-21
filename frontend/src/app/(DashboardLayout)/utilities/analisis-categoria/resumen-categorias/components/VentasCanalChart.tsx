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

// ✅ Mapeo visual de nombre de canales
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
        "Hoy": "1D",
        "Ultimos 7 días": "7D",
        "Ultimos 14 días": "14D",
        "Ultimo mes": "1M",
        "3 meses": "3M",
        "6 meses": "6M",
      };
      params.append("periodo", mapPeriodo[filters.periodo] || "1D");
    }

    if (filters.primer_nivel) {
      params.append("primerNivel", filters.primer_nivel);
    }

    return params.toString();
  };

  // Al cambiar un filtro se limpia al instante y solo queda la última respuesta.
  const url = `${BACKEND_URL}/api/primer-nivel/ventas-canal-primer-nivel?${buildQuery()}`;
  const vacio = { labels: [] as string[], rawLabels: [] as string[], chartData: [] as number[] };
  const { datos: canales, cargando: loading } = useCargaDatos(
    url,
    async (signal) => {
      const json = await apiJson(url, { signal });
      if (!json || (Array.isArray(json) && json.length === 0)) return vacio;
      const data: VentasCanalData = Array.isArray(json) ? json[0] : json;
      const rawKeys = Object.keys(data);
      return {
        rawLabels: rawKeys, // para navegación
        labels: rawKeys.map((key) => canalNameMap[key.toLowerCase()] || key), // para mostrar en gráfico
        chartData: Object.values(data) as number[],
      };
    },
    vacio
  );
  const { labels, rawLabels, chartData } = canales;

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
          height: 435,
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
          <Chart options={options} series={chartData} type="donut" width="100%" height={500} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VentasCanalChart;

