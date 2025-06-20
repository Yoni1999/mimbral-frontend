// ProductoAnalisisChart.tsx
'use client';

import * as React from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import { Box, Typography, CircularProgress, Paper } from '@mui/material';
import { formatUnidades } from '@/utils/format'; // Asegúrate de que esta ruta sea correcta para tus utilidades de formato

// Define la interfaz de los datos que esperas recibir de la API
interface UnidadesMes {
  Año: string; // Puede ser string o number dependiendo de tu API, ajusta si es necesario
  Mes: string;
  NumeroMes: number;
  UnidadesVendidas: number;
}

// Define la interfaz de los props para este componente de gráfico
interface ProductoAnalisisChartProps {
  data: UnidadesMes[]; // Un array de objetos UnidadesMes
  isLoading: boolean; // Para mostrar un spinner mientras los datos cargan
}

// Define el formato esperado para el dataset del gráfico después de la transformación
interface ChartMonthData {
  month: string;
  [year: string]: number | string; // Propiedades dinámicas para los años y el mes
}

const valueFormatter = (value: number | null) => {
  if (value === null) {
    return 'N/A'; // O cualquier otro string que desees para valores nulos
  }
  return `${formatUnidades(value)} uds`;
};

const chartSettings = {
  yAxis: [{ label: 'Unidades', width: 60 }],
  height: 450,
  margin: { left: 70, right: 20, top: 20, bottom: 60 }, // Ajusta los márgenes si los labels se cortan
};

// Mapeo de colores para los años (puedes expandirlo o hacerlo dinámico si tienes muchos años)
const yearColors: { [key: string]: string } = {
  '2025': '#6BAAF7',
  '2024': '#FF914A',
  '2023': '#9583FF',
  '2022': '#459148',
  // Añade más años si los esperas
};


export default function ProductoAnalisisChart({ data, isLoading }: ProductoAnalisisChartProps) {
  // 1. Prepara los datos para el gráfico
  const prepareChartData = (apiData: UnidadesMes[]): { dataset: ChartMonthData[]; seriesKeys: string[] } => {
    if (!apiData || apiData.length === 0) {
      return { dataset: [], seriesKeys: [] };
    }

    const monthsOrder = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    // Mapa temporal para construir el dataset, agrupado por mes
    const chartDataMap: { [month: string]: ChartMonthData } = {};
    const yearsSet = new Set<string>(); // Para recolectar todos los años presentes

    apiData.forEach(item => {
      if (!chartDataMap[item.Mes]) {
        chartDataMap[item.Mes] = { month: item.Mes };
      }
      const yearKey = item.Año.toString(); // Asegura que el año sea una string para la key
      chartDataMap[item.Mes][yearKey] = item.UnidadesVendidas;
      yearsSet.add(yearKey);
    });

    // Convierte el mapa a un array y ordena por mes
    const sortedDataset = monthsOrder
      .map(month => chartDataMap[month] || { month }) // Asegura que todos los meses estén presentes
      .filter(item => Object.keys(item).length > 1); // Filtra meses que no tienen datos de unidades (solo la propiedad 'month')

    const sortedYears = Array.from(yearsSet).sort().reverse(); // Ordena los años de forma descendente

    return { dataset: sortedDataset, seriesKeys: sortedYears };
  };

  const { dataset, seriesKeys } = React.useMemo(() => prepareChartData(data), [data]);

  // Prepara las series para el gráfico
  const chartSeries = seriesKeys.map(year => ({
    dataKey: year,
    label: year,
    color: yearColors[year] || '#A0A0A0', // Color por defecto si no está mapeado
    valueFormatter: valueFormatter, // Aplica el formateador a cada serie
  }));


  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Rotación Mensual del Producto
      </Typography>

      {isLoading ? (
        <Paper sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: chartSettings.height, borderRadius: 3 }}>
          <CircularProgress />
        </Paper>
      ) : dataset && dataset.length > 0 ? (
        <BarChart
          dataset={dataset}
          xAxis={[
            {
              dataKey: 'month',
              label: 'Mes',
              scaleType: 'band',
              tickLabelStyle: {
                angle: -45, // Rota las etiquetas del eje X para evitar solapamiento
                textAnchor: 'end',
                fontSize: 10,
              },
            },
          ]}
          series={chartSeries}
          {...chartSettings}
        />
      ) : (
        <Paper sx={{ p: 2, height: chartSettings.height, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 3, border: '1px dashed #ccc' }}>
          <Typography variant="body1" color="text.secondary">
            No hay datos disponibles para la rotación mensual del producto.
          </Typography>
        </Paper>
      )}
    </Box>
  );
}