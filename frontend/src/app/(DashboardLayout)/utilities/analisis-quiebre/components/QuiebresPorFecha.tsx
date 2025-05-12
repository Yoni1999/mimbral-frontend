'use client';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import { Typography } from '@mui/material';

const QuiebresPorFecha = () => {
  return (
    <DashboardCard title="Quiebres por Fecha">
      <Typography variant="h4">Aquí va el análisis de quiebres por fecha.</Typography>
    </DashboardCard>
  );
};

export default QuiebresPorFecha;
