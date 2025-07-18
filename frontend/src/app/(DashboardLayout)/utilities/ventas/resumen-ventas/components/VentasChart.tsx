"use client";

import React, { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import {
  Paper,
  Box,
  Typography,
} from "@mui/material";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";
import { formatVentas } from "@/utils/format"; // ✅ Tu función de formato

export interface Filters {
  periodo: string;
  fechaInicio: string;
  fechaFin: string;
  temporada: string;
}

interface Props {
  filtros: Filters;
}

const VentasChart: React.FC<Props> = ({ filtros }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const getPeriodoParam = () => {
    switch (filtros.periodo) {
      case "Hoy": return "1D";
      case "Ultimos 7 días": return "7D";
      case "Ultimos 14 días": return "14D";
      case "Ultimo mes": return "1M";
      case "3 meses": return "3M";
      case "6 meses": return "6M";
      default: return "1D";
    }
  };

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (filtros.fechaInicio) params.append("fechaInicio", filtros.fechaInicio);
    if (filtros.fechaFin) params.append("fechaFin", filtros.fechaFin);
    if (filtros.periodo) params.append("periodo", getPeriodoParam());
    if (filtros.temporada) params.append("temporada", filtros.temporada);
    return params.toString();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetchWithToken(`${BACKEND_URL}/api/primer-nivel/ventas-fecha-primer-nivel?${buildQuery()}`);
        if (!response) throw new Error("No se pudo cargar el gráfico de ventas");
        const raw = await response.json();

        interface ProcesadoItem {
          date: string;
          chorrillo: number;
          meli: number;
          falabella: number;
          empresas: number;
          vitex: number;
          balmaceda: number;
          orden: number;
        }

        const procesado: ProcesadoItem[] = raw.map((item: any) => {
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

        procesado.sort((a: ProcesadoItem, b: ProcesadoItem) => a.orden - b.orden);
        setData(procesado);
      } catch (error) {
        console.error("❌ Error al cargar ventas por canal:", error);
      } finally {
        setLoading(false);
      }
    };
      fetchData();
  }, [filtros]);

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
      <Typography variant="h6" sx={{ fontWeight: 600, color: "#333" }}>
        Ventas por Canal
      </Typography>

      {loading ? (
        <Typography align="center">Cargando datos...</Typography>
      ) : (
        <ResponsiveContainer width="100%" height={335}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: "#666" }}
              tickFormatter={(d) => d.split("-").reverse().join("/")}
            />
            <YAxis tick={{ fontSize: 12, fill: "#666" }} tickFormatter={formatVentas} />
            <Tooltip formatter={formatVentas} />
            <Legend verticalAlign="top" height={36} />
            {[
              { key: "chorrillo", color: "#284270", name: "Chorrillo" },
              { key: "meli", color: "#d93a3a", name: "Mercado Libre" },
              { key: "falabella", color: "#f0d45f", name: "Falabella" },
              { key: "empresas", color: "#45914b", name: "Empresas" },
              { key: "vitex", color: "#9583ff", name: "Vtex" },
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
