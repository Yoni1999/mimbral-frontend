"use client";
import React, { useState, useEffect } from "react";
import {
  Select,
  MenuItem,
  Typography,
  Stack,
  Box,
  Paper,
  CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  LabelList,
} from "recharts";
import { fetchWithToken } from "@/utils/fetchWithToken"; // ✅ IMPORTAR
import { BACKEND_URL } from "@/config"; // ✅ IMPORTAR URL DEL BACKEND

// 🔹 Definir tipos
type FiltroTiempo = "1D" | "7D" | "14D" | "1M" | "3M" | "6M" | "1A";
type Canal = "Meli" | "Falabella" | "Balmaceda" | "Vitex" | "Chorrillo" | "Empresas";

// 🔹 Opciones disponibles con etiquetas más descriptivas
const opcionesComparacion: { value: FiltroTiempo; label: string }[] = [
  { value: "1D", label: "Hoy" },
  { value: "7D", label: "Hace 7 días" },
  { value: "14D", label: "Hace 14 días" },
  { value: "1M", label: "Hace 1 mes" },
  { value: "3M", label: "Hace 3 meses" },
  { value: "6M", label: "Hace 6 meses" },
  { value: "1A", label: "Hace 1 año" },
];

const opcionesCanales: Canal[] = ["Meli", "Falabella", "Balmaceda", "Vitex", "Chorrillo", "Empresas"];

const VentasBarChart = () => {
  const theme = useTheme();
  const [comparacion, setComparacion] = useState<FiltroTiempo>("1D");
  const [canalSeleccionado, setCanalSeleccionado] = useState<Canal>("Meli");
  const [ventasActual, setVentasActual] = useState<number>(0);
  const [ventasAnterior, setVentasAnterior] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchComparacionVentas = async () => {
      if (!canalSeleccionado) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetchWithToken(
          `${BACKEND_URL}/api/comparacion?canal=${canalSeleccionado}&periodo=${comparacion}`
        );

        if (!response) return;

        const data = await response.json();

        if (data && typeof data.Ventas_Actual === "number" && typeof data.Ventas_Anterior === "number") {
          setVentasActual(Number(data.Ventas_Actual) || 0);
          setVentasAnterior(Number(data.Ventas_Anterior) || 0);
        } else {
          setError("No se encontraron datos.");
          setVentasActual(0);
          setVentasAnterior(0);
        }
      } catch (err) {
        console.error("❌ Error al obtener la comparación de ventas:", err);
        setError("Error al cargar los datos.");
        setVentasActual(0);
        setVentasAnterior(0);
      }

      setLoading(false);
    };

    fetchComparacionVentas();
  }, [canalSeleccionado, comparacion]);

  const data = [
    { name: "Ventas Actual", Ventas_Actual: ventasActual > 0 ? ventasActual : null, Ventas_Anterior: null },
    { name: "Ventas Anterior", Ventas_Actual: null, Ventas_Anterior: ventasAnterior > 0 ? ventasAnterior : null },
  ];

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
    if (active && payload && payload.length) {
      const filteredPayload = payload.filter((entry) => entry.value > 0);

      if (filteredPayload.length === 0) return null;

      return (
        <Box
          sx={{
            background: "#fff",
            padding: "10px",
            borderRadius: "8px",
            boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
            fontSize: "14px",
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          {filteredPayload.map((entry, index) => (
            <Typography key={index} sx={{ color: entry.color, marginBottom: "4px" }}>
              {entry.name}: <b>${(entry.value / 1_000_000).toFixed(2)}M</b>
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  return (
    <Paper
      elevation={1}
      sx={{
        borderRadius: 3,
        p: 3,
        background: "#ffffff",
        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" fontWeight="bold" color="text.primary">
          📊 Ventas ({canalSeleccionado}) vs periodo 
        </Typography>

        <Stack direction="row" spacing={2} alignItems="center">
          <Select
            value={canalSeleccionado}
            onChange={(e) => setCanalSeleccionado(e.target.value as Canal)}
            size="small"
            sx={{
              fontSize: "14px",
              fontWeight: "bold",
              backgroundColor: "#f5f5f5",
              borderRadius: 2,
            }}
          >
            {opcionesCanales.map((canal) => (
              <MenuItem key={canal} value={canal}>
                {canal}
              </MenuItem>
            ))}
          </Select>

          <Select
            value={comparacion}
            onChange={(e) => setComparacion(e.target.value as FiltroTiempo)}
            size="small"
            sx={{
              fontSize: "14px",
              fontWeight: "bold",
              backgroundColor: "#f5f5f5",
              borderRadius: 2,
            }}
          >
            {opcionesComparacion.map((opcion) => (
              <MenuItem key={opcion.value} value={opcion.value}>
                {opcion.label}
              </MenuItem>
            ))}
          </Select>
        </Stack>
      </Stack>

      <Box sx={{ width: "100%", minHeight: 320 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height={300}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" align="center">
            {error}
          </Typography>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="vertical" barGap={3} barCategoryGap="10%">
              <CartesianGrid strokeDasharray="2 2" stroke="#ddd" />
              <XAxis
                type="number"
                tick={{ fontSize: 14, fill: "#555" }}
                tickFormatter={(value: number) => `$${(value / 1_000_000).toFixed(2)}M`}
              />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 14, fill: "#555" }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="Ventas_Actual" fill="#1E88E5" radius={[8, 8, 8, 8]} name="Ventas Actual" />
              <Bar dataKey="Ventas_Anterior" fill="#BBDEFB" radius={[8, 8, 8, 8]} name="Ventas Anterior" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Box>
    </Paper>
  );
};

export default VentasBarChart;
