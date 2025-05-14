"use client";
import React, { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import {
  Box, Stack, Typography, Dialog,
  DialogContent, IconButton, Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";
import { Filters } from "./HeaderProductos";
import { formatVentas} from "@/utils/format";

interface Props {
  filtros: Filters;
}
const VentasChart: React.FC<Props> = ({ filtros }) => {
  const { canal, itemCode, periodo, fechaInicio, fechaFin } = filtros;
  
  const formatValue = formatVentas;
  
  const buildQuery = () => {
    const params = new URLSearchParams();
    if (periodo) {
      params.append("periodo", periodo);
    } else {
      if (fechaInicio) params.append("fechaInicio", fechaInicio);
      if (fechaFin) params.append("fechaFin", fechaFin);
    }
  
    if (canal) params.append("canal", canal);
    if (itemCode) params.append("itemCode", itemCode);
  
    return params.toString();
  };
  const [data, setData] = useState<any[]>([]);            // ← para el gráfico
  const [loading, setLoading] = useState(false);          // ← para el estado de carga
  const [openModal, setOpenModal] = useState(false);      // ← para el modal


  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const query = buildQuery();
        const response = await fetchWithToken(`${BACKEND_URL}/api/pv/historico?${query}`);
        if (!response) throw new Error("Error al cargar datos");
  
        const raw = await response.json();
  
        const procesado = raw.map((item: any) => {
          const fechaISO = item.Fecha;
          return {
            date: fechaISO.slice(0, 10),
            meli: item.Meli || 0,
            falabella: item.Falabella || 0,
            balmaceda: item.Balmaceda || 0,
            vitex: item.Vitex || 0,
            chorrillo: item.Chorrillo || 0,
            empresas: item.Empresas || 0,
            orden: new Date(fechaISO).getTime(),
          };
        });
  
        procesado.sort((a: { orden: number }, b: { orden: number }) => a.orden - b.orden);
        setData(procesado);
      } catch (err) {
        console.error("❌ Error al obtener histórico:", err);
      } finally {
        setLoading(false);
      }
    };
  
    // Solo ejecutar si hay filtros válidos
    if (itemCode ) {
      fetchData();
    }
  }, [canal, itemCode, periodo, fechaInicio, fechaFin]);
  

  const ChartComponent = (height: number) => (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: "#666" }}
          tickFormatter={(d) => d.split("-").reverse().join("/")}
        />
        <YAxis tick={{ fontSize: 12, fill: "#666" }} tickFormatter={formatValue} />
        <Tooltip
          formatter={formatValue}
          labelFormatter={(label: string) => {
            const date = new Date(`${label}T12:00:00Z`);
            return date.toLocaleDateString("es-CL", {
              weekday: "short",
              day: "numeric",
              month: "short",
            });
          }}
        />
        <Legend verticalAlign="top" height={36} />
        {[
          { key: "chorrillo", color: "#284270", name: "Chorrillo" },
          { key: "meli", color: "#d93a3a", name: "Mercado Libre" },
          { key: "falabella", color: "#f0d45f", name: "Falabella" },
          { key: "empresas", color: "#45914b", name: "Empresas" },
          { key: "vitex", color: "#9583ff", name: "Vitex" },
          { key: "balmaceda", color: "#ff914a", name: "Balmaceda" },
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
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1rem", color: "#333" }}>
            Histórico por Canal
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setOpenModal(true)}
            startIcon={<FullscreenIcon />}
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
            <Typography variant="h6">Histórico por Canal (Expandido)</Typography>
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
