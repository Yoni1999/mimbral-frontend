"use client";

import React, { useState } from "react";
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

type FiltroTiempo = "1M" | "7D" | "14D";

const opcionesComparacion: { value: FiltroTiempo; label: string }[] = [
  { value: "1M", label: "Mes Actual" },
  { value: "7D", label: "Últimos 7 días" },
  { value: "14D", label: "Últimos 14 días" },
];

// 🔹 Datos de ejemplo estáticos
const dataEjemplo = [
  { date: "2025-04-01", chorrillo: 1000000, meli: 700000, falabella: 400000, empresas: 600000, vitex: 200000, balmaceda: 300000 },
  { date: "2025-04-02", chorrillo: 1200000, meli: 750000, falabella: 450000, empresas: 620000, vitex: 210000, balmaceda: 310000 },
  { date: "2025-04-03", chorrillo: 1100000, meli: 720000, falabella: 420000, empresas: 610000, vitex: 220000, balmaceda: 320000 },
  { date: "2025-04-04", chorrillo: 1300000, meli: 780000, falabella: 480000, empresas: 640000, vitex: 230000, balmaceda: 330000 },
];

const VentasChart: React.FC = () => {
  const [filtroTiempo, setFiltroTiempo] = useState<FiltroTiempo>("1M");

  const formatValue = (value: number) => `$${(value / 1_000_000).toFixed(1)}M`;

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
      <ResponsiveContainer width="100%" height={330}>
        <LineChart data={dataEjemplo}>
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
              const date = new Date(`${label}T12:00:00Z`);
              const dia = dias[date.getUTCDay()];
              const mes = meses[parseInt(m, 10) - 1];
              return `${dia}, ${parseInt(d, 10)} ${mes}`;
            }}
          />
          <Legend verticalAlign="top" height={36} />

          {/* 🔹 Líneas de ventas por canal */}
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
    </Paper>
  );
};

export default VentasChart;
