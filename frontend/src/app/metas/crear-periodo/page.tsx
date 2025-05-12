// src/app/metas/crear-periodo/page.tsx
'use client';
import React from 'react';
import PeriodosTable from './components/PeriodosTable';
import AddIcon from '@mui/icons-material/Add';

const CrearPeriodoPage = () => {
  return (
    <div className="relative p-8">
      <h1 className="text-2xl font-bold mb-6">Crear y Administrar Periodos</h1>
      <PeriodosTable />

      
    </div>
  );
};

export default CrearPeriodoPage;
// Compare this snippet from frontend/src/app/metas/crear-periodo/components/PeriodosTable.tsx: