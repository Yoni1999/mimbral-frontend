'use client';
import * as React from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import { Box, Typography, Card, CardContent } from '@mui/material';

const sampleDataset = [
  { month: 'Enero', 2025: 120, 2024: 80, 2023: 10, 2022: 5 },
  { month: 'Febrero', 2025: 140, 2024: 70, 2023: 12, 2022: 6 },
  { month: 'Marzo', 2025: 100, 2024: 60, 2023: 8, 2022: 4 },
  { month: 'Abril', 2025: 160, 2024: 90, 2023: 15, 2022: 7 },
  { month: 'Mayo', 2025: 130, 2024: 75, 2023: 9, 2022: 3 },
  { month: 'Junio', 2025: 110, 2024: 85, 2023: 7, 2022: 2 },
  { month: 'Julio', 2025: 150, 2024: 95, 2023: 13, 2022: 8 },
  { month: 'Agosto', 2025: 125, 2024: 70, 2023: 11, 2022: 1 },
  { month: 'Septiembre', 2025: 170, 2024: 100, 2023: 14, 2022: 9 },
  { month: 'Octubre', 2025: 160, 2024: 90, 2023: 12, 2022: 10 },
  { month: 'Noviembre', 2025: 145, 2024: 85, 2023: 10, 2022: 2 },
  { month: 'Diciembre', 2025: 155, 2024: 95, 2023: 13, 2022: 11 },
];

const chartSettings = {
  yAxis: [{ label: 'Unidades', width: 60 }],
  height: 420,
};

export default function ProductoAnalisisChart() {
  return (
    <Card
      sx={{
        borderRadius: 4,
        boxShadow: '0px 4px 20px rgba(0,0,0,0.1)',
        background: '#fff',
        p: 2,
      }}
    >
      <CardContent>
        <Typography variant="h6" fontWeight="bold" color="text.primary" mb={2}>
          Ventas Mensual del Canal
        </Typography>

        <Box sx={{ overflow: 'hidden' }}>
          <BarChart
            dataset={sampleDataset}
            xAxis={[
              {
                dataKey: 'month',
                label: 'Mes',
                scaleType: 'band',
              },
            ]}
            series={[
              { dataKey: '2025', label: '2025', color: '#6BAAF7' },
              { dataKey: '2024', label: '2024', color: '#FF914A' },
              { dataKey: '2023', label: '2023', color: '#9583FF' },
              { dataKey: '2022', label: '2022', color: '#459148' },
            ]}
            {...chartSettings}
          />
        </Box>
      </CardContent>
    </Card>
  );
}
