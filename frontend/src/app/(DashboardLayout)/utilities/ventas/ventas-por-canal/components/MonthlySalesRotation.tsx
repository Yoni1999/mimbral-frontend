'use client';

import React from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Box, Skeleton, Typography } from '@mui/material';
import { apiJson } from '@/utils/apiClient';
import { useCargaDatos } from '@/utils/useCargaDatos';
import { BACKEND_URL } from '@/config';
import { CANALES, Panel, cifraSx, formatoMonto, formatoPesos, tarjetaSx, tinta } from '../../components/estilo';

interface Filters {
  canal: string;
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

interface Props {
  filters: Filters;
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

// Color por antigüedad del año: el actual siempre azul, el anterior naranja…
// (paleta validada; no cambia al aparecer o quitarse años con un filtro).
const COLOR_POR_ANTIGUEDAD = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#6250d6', '#94a3b8'];

function TooltipMes({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const filas = [...payload].sort((a: any, b: any) => Number(b.dataKey) - Number(a.dataKey));
  return (
    <Box sx={{ ...tarjetaSx, p: 1.5, minWidth: 200, boxShadow: '0 12px 30px rgba(15,23,42,0.14)' }}>
      <Typography sx={{ fontSize: 12, fontWeight: 700, color: tinta.secundaria, mb: 1 }}>{label}</Typography>
      {filas.map((f: any) => (
        <Box key={f.dataKey} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, fontSize: 12.5, py: 0.25 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: tinta.primaria }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: f.color }} />
            {f.dataKey}
          </Box>
          <Box sx={{ fontWeight: 600, ...cifraSx }}>{f.value ? formatoPesos(f.value) : '—'}</Box>
        </Box>
      ))}
    </Box>
  );
}

/** Venta de cada mes, una línea por año: muestra la estacionalidad del canal
 *  y cómo va el año contra los anteriores. Solo depende del canal. */
const ProductoAnalisisChart: React.FC<Props> = ({ filters }) => {
  const queryParams = new URLSearchParams();
  if (filters.canal) queryParams.append('canal', filters.canal);
  const url = `${BACKEND_URL}/api/ventas-mensuales-por-canal?${queryParams.toString()}`;

  const {
    datos: { dataset, anios },
    cargando,
  } = useCargaDatos(
    url,
    async (signal) => {
      const apiData: ApiDataPoint[] = await apiJson(url, { signal });
      const porMes: Record<string, Record<string, number | string>> = {};
      MESES.forEach((m) => (porMes[m] = { month: m.slice(0, 3) }));
      const unicos = new Set<string>();
      (Array.isArray(apiData) ? apiData : []).forEach((item) => {
        const anio = String(item.Año);
        unicos.add(anio);
        if (porMes[item.Mes]) porMes[item.Mes][anio] = item.TotalVentas;
      });
      return {
        dataset: MESES.map((m) => porMes[m]),
        // Del más reciente al más antiguo.
        anios: Array.from(unicos).sort((a, b) => Number(b) - Number(a)),
      };
    },
    { dataset: [] as Record<string, number | string>[], anios: [] as string[] }
  );

  const canal = CANALES.find((c) => c.clave === filters.canal);

  return (
    <Panel
      titulo="Ventas mensuales por año"
      descripcion={`${canal ? canal.nombre : 'Todos los canales'} · no depende del rango de fechas · el mes en curso llega hasta ayer`}
    >
      {cargando ? (
        <Skeleton variant="rounded" height={320} />
      ) : anios.length === 0 ? (
        <Typography sx={{ color: tinta.tenue, fontSize: 13, py: 8, textAlign: 'center' }}>
          No hay ventas mensuales para el canal.
        </Typography>
      ) : (
        <>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 1 }}>
            {anios.map((a, i) => (
              <Box key={a} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, fontSize: 12.5, color: tinta.secundaria }}>
                <Box sx={{ width: 14, height: i === 0 ? 4 : 3, borderRadius: 2, bgcolor: COLOR_POR_ANTIGUEDAD[i] ?? '#94a3b8' }} />
                {a}
              </Box>
            ))}
          </Box>
          <ResponsiveContainer width="100%" height={310}>
            <LineChart data={dataset} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#eef2f6" />
              <XAxis dataKey="month" tick={{ fontSize: 11.5, fill: tinta.tenue }} axisLine={{ stroke: tinta.borde }} tickLine={false} />
              <YAxis tickFormatter={(v) => formatoMonto(v)} tick={{ fontSize: 11.5, fill: tinta.tenue }} axisLine={false} tickLine={false} width={78} />
              <Tooltip content={<TooltipMes />} cursor={{ stroke: '#cbd5e1', strokeDasharray: '3 3' }} />
              {anios
                .slice()
                .reverse()
                .map((a) => {
                  const i = anios.indexOf(a);
                  return (
                    <Line
                      key={a}
                      type="monotone"
                      dataKey={a}
                      name={a}
                      stroke={COLOR_POR_ANTIGUEDAD[i] ?? '#94a3b8'}
                      strokeWidth={i === 0 ? 3 : 2}
                      dot={{ r: i === 0 ? 3 : 0 }}
                      activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
                      connectNulls={false}
                    />
                  );
                })}
            </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </Panel>
  );
};

export default ProductoAnalisisChart;
