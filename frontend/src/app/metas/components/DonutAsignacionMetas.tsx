'use client';
import React from 'react';
import Chart from 'react-apexcharts';
import { Box, Typography, Card, CardContent } from '@mui/material';

type Props = {
  asignadas: number;
  noAsignadas: number;
};

const DonutAsignacionMetas: React.FC<Props> = ({ asignadas, noAsignadas }) => {
  const total = asignadas + noAsignadas;

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: 'donut',
    },
    labels: ['Asignadas', 'No Asignadas'],
    colors: ['#4caf50', '#f44336'],
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`
    },
    legend: {
      position: 'bottom',
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val} metas`
      }
    }
  };

  const series = [
    (asignadas / total) * 100,
    (noAsignadas / total) * 100
  ];

  return (
    <Card elevation={1}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Distribución de Metas
        </Typography>
        <Box>
          <Chart options={options} series={series} type="donut" width="100%" height={300} />
        </Box>
      </CardContent>
    </Card>
  );
};

export default DonutAsignacionMetas;
