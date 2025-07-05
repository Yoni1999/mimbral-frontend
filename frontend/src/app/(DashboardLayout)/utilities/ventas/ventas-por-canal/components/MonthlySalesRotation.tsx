'use client';
import React, { useEffect, useState } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material';
import { formatVentas } from '@/utils/format';
import { fetchWithToken } from '@/utils/fetchWithToken'; // Importamos la utilidad
import { BACKEND_URL } from '@/config'; // Importamos la URL base

// --- INTERFACES ---

// Reutilizamos la interfaz de filtros del componente padre
interface Filters {
  canal: string;
  periodo: string;
  fechaInicio: string;
  fechaFin: string;
  vendedor?: number | null; // Aunque este componente solo use 'canal', lo mantenemos consistente
}

// Interfaz para un elemento de dato de la API
interface ApiDataPoint {
  Año: string;
  Mes: string;
  NumeroMes: number;
  Canal: string;
  TotalVentas: number;
}

// Interfaz para el dataset transformado para el BarChart
interface ChartDatasetItem {
  month: string;
  [year: string]: number | string; // Permite propiedades dinámicas como '2022', '2023', etc.
}

interface Props {
  filters: Filters;
}

// --- CONSTANTES ---
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Colores fijos para los años (puedes ajustarlos o hacerlos dinámicos si tienes muchos años)
const coloresPorAño: { [key: string]: string } = {
  '2022': '#6BAAF7',
  '2023': '#FF914A',
  '2024': '#9583FF',
  '2025': '#459148',
  '2026': '#DA3636', // Añade más si esperas más años
  // Agrega más colores para más años si es necesario
};

const ProductoAnalisisChart: React.FC<Props> = ({ filters }) => {
  const [dataset, setDataset] = useState<ChartDatasetItem[]>([]);
  const [series, setSeries] = useState<any[]>([]); // Array de objetos de serie para el BarChart
  const [loading, setLoading] = useState(true);
  const [displayedCanal, setDisplayedCanal] = useState<string>(''); // Para mostrar el canal actual

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Construye los parámetros de la URL. Solo incluimos 'canal' si está presente.
        const queryParams = new URLSearchParams();
        if (filters.canal && filters.canal !== '') {
          queryParams.append('canal', filters.canal);
        }

        const url = `${BACKEND_URL}/api/ventas-mensuales-por-canal?${queryParams.toString()}`;
        const res = await fetchWithToken(url);

        if (!res?.ok) {
          console.error(`Error HTTP: ${res?.status} ${res?.statusText}`);
          setDataset([]);
          setSeries([]);
          return;
        }

        const apiData: ApiDataPoint[] = await res?.json();

        // 1. Determinar el nombre del canal a mostrar
        setDisplayedCanal(filters.canal && filters.canal !== '' ? filters.canal : 'Todos los Canales');

        // 2. Procesar los datos para el formato del gráfico
        const processedData: { [month: string]: ChartDatasetItem } = {};
        const uniqueYears = new Set<string>();

        // Inicializar processedData con todos los meses y valores por defecto
        MESES.forEach(month => {
          processedData[month] = { month: month };
        });

        apiData.forEach(item => {
          const year = item.Año.toString();
          uniqueYears.add(year);
          // Asegúrate de que el mes exista en processedData
          if (!processedData[item.Mes]) {
            processedData[item.Mes] = { month: item.Mes };
          }
          processedData[item.Mes][year] = item.TotalVentas;
        });

        // Convertir el objeto a un array, asegurando el orden de los meses
        const finalDataset = MESES.map(month => {
          // Asegura que todos los años tengan un valor (o 0 si no hay datos para ese mes/año)
          const item: ChartDatasetItem = { month: month };
          Array.from(uniqueYears).sort().forEach(year => { // Ordenar años para consistencia
            item[year] = (processedData[month] ? processedData[month][year] : 0) || 0;
          });
          return item;
        });

        // 3. Crear las series para el gráfico
        const newSeries = Array.from(uniqueYears).sort().map(year => ({
          dataKey: year,
          label: year,
          color: coloresPorAño[year] || '#CCCCCC', // Color por defecto si no está definido
        }));

        setDataset(finalDataset);
        setSeries(newSeries);

      } catch (error) {
        console.error("❌ Error al obtener datos de ventas mensuales:", error);
        setDataset([]);
        setSeries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters.canal]); // Solo volvemos a cargar si cambia el canal

  return (
    <Card
      sx={{
        borderRadius: 4,
        boxShadow: '0px 4px 20px rgba(0,0,0,0.1)',
        background: '#fff',
        p: 2,
        minHeight: 300 // Para que tenga una altura mínima consistente
      }}
    >
      <CardContent>
        <Typography variant="h6" fontWeight="bold" color="text.primary" mb={0.5}>
          Ventas Mensuales por Canal
        </Typography>

        <Typography variant="subtitle1" color="text.secondary" mb={2}>
          Canal: <strong>{displayedCanal}</strong>
        </Typography>

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
            <CircularProgress />
          </Box>
        ) : dataset.length === 0 || series.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
            <Typography variant="body2" color="text.secondary">
              No se encontraron datos de ventas mensuales para los filtros aplicados.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto', width: '100%' }}> {/* Permite scroll horizontal si hay muchos meses/barras */}
            <BarChart
              dataset={dataset}
              xAxis={[
                {
                  dataKey: 'month',
                  label: 'Mes',
                  scaleType: 'band',
                  // Puedes ajustar la rotación de las etiquetas si hay muchos meses y se superponen
                  // tickLabelStyle: { angle: -45, textAnchor: 'end' }, 
                },
              ]}
              series={series}
              yAxis={[
                {
                  label: '', // Etiqueta del eje Y
                  valueFormatter: (value: number) => formatVentas(value),
                },
              ]}
              margin={{ left: 80, right: 10, top: 30, bottom: 60 }} // Aumentar bottom para etiquetas X rotadas
              height={330} // Ajustar altura para acomodar todo
              skipAnimation={false} // Mantener animaciones
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default ProductoAnalisisChart;