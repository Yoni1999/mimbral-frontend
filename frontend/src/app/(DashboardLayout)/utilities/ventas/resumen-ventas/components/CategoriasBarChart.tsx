"use client";

import React, { useMemo } from "react";
import { Card, CardContent, Typography, Box, Divider, Grid } from "@mui/material";

// Tipado de datos
interface Categoria {
  Categoria: string;
  TotalVentas: number;
}

interface Props {
  data: Categoria[];
  height?: number; // NUEVO: altura máxima para scroll (ej: 300)
}

const CategoriasTableChart: React.FC<Props> = ({ data, height = 350 }) => {
  const safeData = useMemo(() => {
    const cleaned = Array.isArray(data)
      ? data.filter((item) => !!item.Categoria && item.TotalVentas > 0)
      : [];

    const deduplicated = Array.from(new Map(cleaned.map(item => [item.Categoria, item])).values());

    return deduplicated
      .sort((a, b) => b.TotalVentas - a.TotalVentas)
      .slice(0, 10);
  }, [data]);

  const formatCLP = (value: number) =>
    `$${value.toLocaleString("es-CL", { minimumFractionDigits: 0 })}`;

  return (
    <Card elevation={1} sx={{ borderRadius: 2, background: "#fff", border: "1px solid #e0e0e0", p: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" fontWeight="bold" color="text.primary">
            Categorías con mayor margen bruto total
          </Typography>
        </Box>

        {/* Encabezado */}
        <Grid container px={1} py={1}>
          <Grid item xs={8}>
            <Typography variant="subtitle2" color="text.secondary">
              Categoría
            </Typography>
          </Grid>
          <Grid item xs={4} textAlign="right">
            <Typography variant="subtitle2" color="text.secondary">
              Margen Bruto Total
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 1 }} />

        {/* Contenedor con scroll */}
        <Box sx={{ maxHeight: height, overflowY: "auto" }}>
          {safeData.map((item, index) => (
            <Box key={index} px={1} py={1}>
              <Grid container>
                <Grid item xs={8}>
                  <Typography variant="body1" color="text.primary">
                    {item.Categoria}
                  </Typography>
                </Grid>
                <Grid item xs={4} textAlign="right">
                  <Typography variant="body1" color="text.primary">
                    {formatCLP(item.TotalVentas)}
                  </Typography>
                </Grid>
              </Grid>
              {index < safeData.length - 1 && <Divider sx={{ my: 1 }} />}
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export default CategoriasTableChart;
