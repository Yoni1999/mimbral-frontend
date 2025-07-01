"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Paper, Typography, Box } from "@mui/material";

// Datos extendidos: 18 categorías
const data = [
  { categoria: "Aire Libre y Mascotas", almacen1: 20, almacen2: 30, almacen3: 10, almacen4: 40 },
  { categoria: "Automóvil", almacen1: 25, almacen2: 15, almacen3: 35, almacen4: 25 },
  { categoria: "Baño", almacen1: 30, almacen2: 20, almacen3: 20, almacen4: 30 },
  { categoria: "Cocina y Menaje", almacen1: 15, almacen2: 25, almacen3: 30, almacen4: 30 },
  { categoria: "Decoración e Iluminación", almacen1: 10, almacen2: 40, almacen3: 20, almacen4: 30 },
  { categoria: "Dormitorio", almacen1: 20, almacen2: 20, almacen3: 40, almacen4: 20 },
  { categoria: "Electrohogar", almacen1: 35, almacen2: 15, almacen3: 25, almacen4: 25 },
  { categoria: "Ferretería", almacen1: 25, almacen2: 25, almacen3: 25, almacen4: 25 },
  { categoria: "Gasfitería", almacen1: 10, almacen2: 30, almacen3: 30, almacen4: 30 },
  { categoria: "Herramientas", almacen1: 30, almacen2: 30, almacen3: 20, almacen4: 20 },
  { categoria: "Jardín", almacen1: 40, almacen2: 20, almacen3: 10, almacen4: 30 },
  { categoria: "Construcción", almacen1: 35, almacen2: 25, almacen3: 25, almacen4: 15 },
  { categoria: "Muebles", almacen1: 25, almacen2: 35, almacen3: 20, almacen4: 20 },
  { categoria: "Limpieza", almacen1: 20, almacen2: 20, almacen3: 40, almacen4: 20 },
  { categoria: "Pintura", almacen1: 10, almacen2: 40, almacen3: 30, almacen4: 20 },
  { categoria: "Pisos y Alfombras", almacen1: 30, almacen2: 20, almacen3: 30, almacen4: 20 },
  { categoria: "Puertas y Ventanas", almacen1: 20, almacen2: 30, almacen3: 25, almacen4: 25 },
  { categoria: "Cumpleaños", almacen1: 25, almacen2: 25, almacen3: 25, almacen4: 25 },
];

// Colores por almacén
const almacenes = [
  { key: "almacen1", color: "#5B67F0" },
  { key: "almacen2", color: "#F36CA8" },
  { key: "almacen3", color: "#1DD9D3" },
  { key: "almacen4", color: "#FFD057" },
];

const CategoriasPorTiendaChart = () => {
  const alturaGrafico = data.length * 28; // ~28px por categoría (ajustable)

  return (
    <Paper sx={{ p: 3, borderRadius: 4 }}>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h6" fontWeight={600}>
          Categorías por Tienda
        </Typography>
        <Typography variant="body2" color="primary" sx={{ cursor: "pointer" }}>
          Ver más
        </Typography>
      </Box>

      <ResponsiveContainer width="100%" height={alturaGrafico}>
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 0, right: 0, left: 20, bottom: 0 }}
          barCategoryGap={4}
        >
          <XAxis type="number" hide />
          <YAxis dataKey="categoria" type="category" width={200} />
          <Tooltip />

          {almacenes.map((almacen) => (
            <Bar
              key={almacen.key}
              dataKey={almacen.key}
              stackId="a"
              fill={almacen.color}
              radius={[0, 4, 4, 0]}
              barSize={20}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default CategoriasPorTiendaChart;
