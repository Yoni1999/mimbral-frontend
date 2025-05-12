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
  Paper,
  Box,
  MenuItem,
  Select,
  FormControl,
  Stack,
  Typography,
} from "@mui/material";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";

type FiltroTiempo = "1M" | "7D" | "14D";

const opcionesComparacion: { value: FiltroTiempo; label: string }[] = [
  { value: "1M", label: "Mes Actual" },
  { value: "7D", label: "Últimos 7 días" },
  { value: "14D", label: "Últimos 14 días" },
];

const VentasChart = () => {
  const [filtroTiempo, setFiltroTiempo] = useState<FiltroTiempo>("1M");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const formatValue = (value: number) => `$${(value / 1_000_000).toFixed(1)}M`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetchWithToken(
          `${BACKEND_URL}/api/ventas-canal-fecha?periodo=${filtroTiempo}`
        );

        if (!response) throw new Error("Error al cargar datos del servidor");
        const raw = await response.json();

        const procesado = raw.map((item: any) => {
          const fechaISO = item.Fecha; // ejemplo: "2025-04-07T00:00:00.000Z"
          return {
            date: fechaISO.slice(0, 10), // YYYY-MM-DD, sin desfase de zona horaria
            chorrillo: item.Chorrillo || 0,
            meli: item.Meli || 0,
            falabella: item.Falabella || 0,
            empresas: item.Empresas || 0,
            vitex: item.Vitex || 0,
            balmaceda: item.Balmaceda || 0,
            orden: new Date(fechaISO).getTime(), // ordenar por fecha real
          };
        });

        procesado.sort((a:any, b:any) => a.orden - b.orden);
        setData(procesado);
      } catch (error) {
        console.error("❌ Error al cargar ventas por canal:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filtroTiempo]);

  return (
    <Paper
      elevation={1}
      sx={{
        width: "100%",
        p: 3,
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
  
      {/* 🔹 Título y Selector de Período */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: "#333" }}>
          Ventas ($)
        </Typography>
        <FormControl sx={{ minWidth: 160 }}>
          <Select
            value={filtroTiempo}
            onChange={(e) => setFiltroTiempo(e.target.value as FiltroTiempo)}
            size="small"
          >
            {opcionesComparacion.map((opcion) => (
              <MenuItem key={opcion.value} value={opcion.value}>
                {opcion.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {/* 🔹 Gráfico */}
      {loading ? (
        <Typography align="center">Cargando datos...</Typography>
      ) : (
        <ResponsiveContainer width="100%" height={330}>
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
                const meses = [
                  "ene", "feb", "mar", "abr", "may", "jun",
                  "jul", "ago", "sep", "oct", "nov", "dic"
                ];

                const [y, m, d] = label.split("-");
                const date = new Date(`${label}T12:00:00Z`); // Usamos 12:00 UTC para evitar desfase
                const dia = dias[date.getUTCDay()];
                const mes = meses[parseInt(m, 10) - 1];

                return `${dia}, ${parseInt(d, 10)} ${mes}`;
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
      )}
    </Paper>
  );
};

export default VentasChart;
