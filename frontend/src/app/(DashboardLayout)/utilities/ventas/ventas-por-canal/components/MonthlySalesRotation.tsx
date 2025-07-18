'use client';
import React, { useEffect, useState } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material';
import { formatVentas } from '@/utils/format';
import { fetchWithToken } from '@/utils/fetchWithToken';
import { BACKEND_URL } from '@/config';

// --- INTERFACES ---
interface Filters {
  canal: string;
  periodo: string;
  fechaInicio: string;
  fechaFin: string;
  vendedor?: number | null;
}

interface ApiDataPoint {
  Año: string;
  Mes: string;
  NumeroMes: number;
  Canal: string;
  TotalVentas: number;
}

interface ChartDatasetItem {
  month: string;
  [year: string]: number | string;
}

interface Props {
  filters: Filters;
}

// --- CONSTANTES ---
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const coloresPorAño: { [key: string]: string } = {
  '2022': '#6BAAF7',
  '2023': '#FF914A',
  '2024': '#9583FF',
  '2025': '#459148',
  '2026': '#DA3636',
};

// 🆕 Mapeo visual de nombre de canales
const canalNameMap: Record<string, string> = {
  empresas: "Empresas",
  chorrillo: "Chorrillo",
  balmaceda: "Balmaceda",
  vitex: "Vtex",
  meli: "Mercado Libre",
  falabella: "Falabella",
};

const ProductoAnalisisChart: React.FC<Props> = ({ filters }) => {
  const [dataset, setDataset] = useState<ChartDatasetItem[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayedCanal, setDisplayedCanal] = useState<string>('Todos los Canales');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
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

        const apiData: ApiDataPoint[] = await res.json();

        // 🆕 Mapeo visual del canal mostrado en subtítulo
        const canalKey = filters.canal?.toLowerCase();
        const canalNombreLegible = canalNameMap[canalKey] || "Todos los Canales";
        setDisplayedCanal(canalNombreLegible);

        const processedData: { [month: string]: ChartDatasetItem } = {};
        const uniqueYears = new Set<string>();

        MESES.forEach(month => {
          processedData[month] = { month };
        });

        apiData.forEach(item => {
          const year = item.Año.toString();
          uniqueYears.add(year);
          if (!processedData[item.Mes]) {
            processedData[item.Mes] = { month: item.Mes };
          }
          processedData[item.Mes][year] = item.TotalVentas;
        });

        const finalDataset = MESES.map(month => {
          const item: ChartDatasetItem = { month };
          Array.from(uniqueYears).sort().forEach(year => {
            item[year] = (processedData[month]?.[year] as number) || 0;
          });
          return item;
        });

        const newSeries = Array.from(uniqueYears).sort().map(year => ({
          dataKey: year,
          label: year,
          color: coloresPorAño[year] || '#CCCCCC',
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
  }, [filters.canal]);

  return (
    <Card
      sx={{
        borderRadius: 4,
        boxShadow: '0px 4px 20px rgba(0,0,0,0.1)',
        background: '#fff',
        p: 2,
        minHeight: 300
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
          <Box sx={{ overflowX: 'auto', width: '100%' }}>
            <BarChart
              dataset={dataset}
              xAxis={[{
                dataKey: 'month',
                label: 'Mes',
                scaleType: 'band',
              }]}
              series={series}
              yAxis={[{
                label: '',
                valueFormatter: (value: number) => formatVentas(value),
              }]}
              margin={{ left: 80, right: 10, top: 30, bottom: 60 }}
              height={330}
              skipAnimation={false}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductoAnalisisChart;
