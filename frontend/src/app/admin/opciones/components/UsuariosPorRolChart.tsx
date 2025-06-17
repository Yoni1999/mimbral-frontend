'use client';
import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import { fetchWithToken } from '@/utils/fetchWithToken';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import { Typography, Box } from '@mui/material';
import { ApexOptions } from 'apexcharts';
import { BACKEND_URL } from '@/config';

const UsuariosPorRolChart: React.FC = () => {
  const [series, setSeries] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const res = await fetchWithToken(`${BACKEND_URL}/api/admin/usuarios`);
        if (!res?.ok) throw new Error('Error al obtener usuarios');
        const data = await res.json();
        const admins = data.filter((u: any) => u.ROL === 'admin').length;
        const usuarios = data.filter((u: any) => u.ROL === 'usuario').length;
        setSeries([admins, usuarios]);
      } catch (error) {
        console.error('❌ Error al obtener usuarios:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsuarios();
  }, []);

  const options: ApexOptions = {
    chart: { type: 'bar', toolbar: { show: false } },
    plotOptions: { bar: { distributed: true } },
    xaxis: { categories: ['Admins', 'Usuarios'] },
    colors: ['#213663', '#B82222'],
    dataLabels: { enabled: true },
    tooltip: {
      y: {
        formatter: (val: number) => `${val} usuario${val !== 1 ? 's' : ''}`,
      },
    },
    legend: { show: false },
  };

  return (
    <DashboardCard title="Usuarios por Rol" sx={{ maxWidth: 500, mt: 4 }}>
      <Box
        sx={{
          height: 380,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {loading ? (
          <Typography variant="body1">Cargando gráfico...</Typography>
        ) : (
          <Chart
            options={options}
            series={[{ data: series }]}
            type="bar"
            height={380}
            width="100%"
          />
        )}
      </Box>
    </DashboardCard>
  );
};

export default UsuariosPorRolChart;
