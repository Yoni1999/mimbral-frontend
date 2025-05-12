"use client";
import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Box,
  Stack,
  Typography,
  Dialog,
  DialogContent,
  IconButton,
  Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";

type Filters = {
  temporada: string;
  periodo: string;
  fechaInicio: string;
  fechaFin: string;
  primer_nivel?: string;
};

type Props = {
  filters: Filters;
};

const VentasChart: React.FC<Props> = ({ filters }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  const formatValue = (value: number) => `$${(value / 1_000_000).toFixed(1)}M`;

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (filters.fechaInicio) params.append("fechaInicio", filters.fechaInicio);
    if (filters.fechaFin) params.append("fechaFin", filters.fechaFin);
    if (filters.primer_nivel) params.append("primerNivel", filters.primer_nivel);
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
    return params.toString();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const query = buildQuery();
        const response = await fetchWithToken(`${BACKEND_URL}/api/primer-nivel/ventas-fecha-primer-nivel?${query}`);
        if (!response) throw new Error("Error al cargar datos del servidor");

        const raw = await response.json();
        const procesado = raw.map((item: any) => {
          const fechaISO = item.Fecha;
          return {
            date: fechaISO.slice(0, 10),
            chorrillo: item.Chorrillo || 0,
            meli: item.Meli || 0,
            falabella: item.Falabella || 0,
            empresas: item.Empresas || 0,
            vitex: item.Vitex || 0,
            balmaceda: item.Balmaceda || 0,
            orden: new Date(fechaISO).getTime(),
          };
        });
        procesado.sort((a: any, b: any) => a.orden - b.orden);
        setData(procesado);
      } catch (error) {
        console.error("❌ Error al cargar ventas por canal:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  const ChartComponent = (height: number) => (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: "#666" }}
          tickFormatter={(dateStr: string) => {
            const [y, m, d] = dateStr.split("-");
            return `${d}/${m}`;
          }}
        />
        <YAxis tick={{ fontSize: 12, fill: "#666" }} tickFormatter={formatValue} />
        <Tooltip
          formatter={formatValue}
          labelFormatter={(label: string) => {
            const dias = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
            const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
            const [y, m, d] = label.split("-");
            const date = new Date(`${label}T12:00:00Z`);
            const dia = dias[date.getUTCDay()];
            const mes = meses[parseInt(m, 10) - 1];
            return `${dia}, ${parseInt(d, 10)} ${mes}`;
          }}
        />
        <Legend verticalAlign="top" height={36} />
        {[ 
          { key: "chorrillo", color: "#173b61", name: "Chorrillo" },
          { key: "meli", color: "#17616e", name: "Mercado Libre" },
          { key: "falabella", color: "#7697a0", name: "Falabella" },
          { key: "empresas", color: "#fd8916", name: "Empresas" },
          { key: "vitex", color: "#ffebd0", name: "Vitex" },
          { key: "balmaceda", color: "#bf360c", name: "Balmaceda" },
        ].map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            stroke={line.color}
            strokeWidth={1.5}
            dot={false}
            name={line.name}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );

  return (
    <>
      <Box
        sx={{
          width: "100%",
          p: 3,
          background: "#ffffff",
          borderRadius: 2,
          border: "1px solid #e0e0e0",
          boxShadow: 3,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          position: "relative",
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 500,
            fontSize: "1rem",
            pl: 2,
            py: 1,
            backgroundColor: "#ffffff",
            borderLeft: "5px solid #d93a3a",
            borderRadius: 1,
            color: "primary.main",
            display: "inline-block",
            width: "fit-content"
          }}
        >
          Historico por Canal
        </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setOpenModal(true)}
            startIcon={<FullscreenIcon />} // ✅ Ícono a la izquierda
          >
            Expandir
          </Button>
        </Stack>

        {loading ? (
          <Typography align="center">Cargando datos...</Typography>
        ) : (
          ChartComponent(330)
        )}
      </Box>

      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        fullWidth
        maxWidth="lg"
        PaperProps={{ sx: { p: 2 } }}
      >
        <DialogContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Ventas por Canal (expandido)</Typography>
            <IconButton onClick={() => setOpenModal(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          {ChartComponent(500)}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VentasChart;