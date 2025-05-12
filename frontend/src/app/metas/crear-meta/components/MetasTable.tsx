'use client';
import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Select,
  MenuItem,
  Paper,
  Typography,
  Button,
} from '@mui/material';
import { fetchWithToken } from '@/utils/fetchWithToken';
import { BACKEND_URL } from "@/config";

type Meta = {
  sku: string;
  nombre: string;
  cantidadMeta: number;
  totalVentas: number;
  fechaRegistro: string;
  completado: number;
};

type Periodo = {
  id: number;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
};

const canalSlpMap: Record<string, number> = {
  Mercado_Libre: 4,
  Chorrillo: 2,
  Balmaceda: 3,
  Empresas: 1,
  Vitex: 5,
  Falabella: 6,
};

const MetasTable = () => {
  const [canal, setCanal] = useState('');
  const [periodo, setPeriodo] = useState('');
  const [periodosDisponibles, setPeriodosDisponibles] = useState<Periodo[]>([]);
  const [metas, setMetas] = useState<Meta[]>([]);

  // Cargar períodos dinámicamente
  useEffect(() => {
    const fetchPeriodos = async () => {
      try {
        const res = await fetchWithToken(`${BACKEND_URL}/api/periodos`);
        if (!res || !res.ok) throw new Error('Error al obtener los períodos');

        const data = await res.json();

        const formateados: Periodo[] = data.map((p: any) => ({
          id: p.ID_PERIODO,
          nombre: p.NOMBRE,
          fechaInicio: p.FECHA_INICIO,
          fechaFin: p.FECHA_FIN,
        }));

        setPeriodosDisponibles(formateados);
        setCanal('Empresas');

        // Seleccionar automáticamente el período actual
        const hoy = new Date();
        const periodoActual = formateados.find((p) => {
          const inicio = new Date(p.fechaInicio);
          const fin = new Date(p.fechaFin);
          return hoy >= inicio && hoy <= fin;
        });

        if (periodoActual) {
          setPeriodo(periodoActual.id.toString());
        }
      } catch (error) {
        console.error('Error al cargar períodos:', error);
      }
    };

    fetchPeriodos();
  }, []);

  // Cargar metas según filtro
  useEffect(() => {
    const fetchMetas = async () => {
      if (!canal || !periodo) return;

      try {
        const canalId = canalSlpMap[canal];
        const res = await fetchWithToken(
          `${BACKEND_URL}/api/metas?idPeriodo=${periodo}&idCanal=${canalId}`
        );

        if (!res || !res.ok) throw new Error('Error al obtener las metas');

        const data = await res.json();

        const metasAdaptadas: Meta[] = data.map((m: any) => {
          const porcentaje = m.META_CANTIDAD > 0
            ? (m.TOTAL_VENDIDO / m.META_CANTIDAD) * 100
            : 0;

          return {
            sku: m.SKU,
            nombre: m.NOMBRE_PRODUCTO,
            cantidadMeta: m.META_CANTIDAD,
            totalVentas: m.TOTAL_VENDIDO,
            fechaRegistro: new Date().toISOString().split('T')[0],
            completado: porcentaje,
          };
        });

        setMetas(metasAdaptadas);
      } catch (error) {
        console.error('Error al cargar metas:', error);
      }
    };

    fetchMetas();
  }, [canal, periodo]);

  const periodoSeleccionado = periodosDisponibles.find((p) => p.id.toString() === periodo);

  return (
    <Box className="space-y-4">
      {/* Filtros */}
      <Box display="flex" gap={2} mb={2}>
        <Select
          value={canal}
          onChange={(e) => setCanal(e.target.value)}
          displayEmpty
          size="small"
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">Todos los canales</MenuItem>
          <MenuItem value="Empresas">Empresas</MenuItem>
          <MenuItem value="Chorrillo">Chorrillo</MenuItem>
          <MenuItem value="Balmaceda">Balmaceda</MenuItem>
          <MenuItem value="Vitex">Vitex</MenuItem>
          <MenuItem value="Falabella">Falabella</MenuItem>
          <MenuItem value="Mercado_Libre">Mercado Libre</MenuItem>

        </Select>

        <Select
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          displayEmpty
          size="small"
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">Todos los períodos</MenuItem>
          {periodosDisponibles.map((p) => (
            <MenuItem key={p.id} value={p.id.toString()}>
              {p.nombre}
            </MenuItem>
          ))}
        </Select>
      </Box>

      {/* Tabla */}
      <Paper elevation={2} className="p-4">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="subtitle1">Metas Registradas</Typography>
          {periodoSeleccionado && (
            <Typography variant="subtitle2" color="text.secondary">
              Período seleccionado: <strong>{periodoSeleccionado.nombre}</strong>
            </Typography>
          )}
        </Box>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>SKU</strong></TableCell>
              <TableCell><strong>Nombre</strong></TableCell>
              <TableCell><strong>Cantidad Meta</strong></TableCell>
              <TableCell><strong>Total Ventas</strong></TableCell>
              <TableCell><strong>Fecha Registro</strong></TableCell>
              <TableCell><strong>Completado</strong></TableCell>
              <TableCell><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {metas.map((meta, index) => (
              <TableRow key={index}>
                <TableCell>{meta.sku}</TableCell>
                <TableCell>{meta.nombre}</TableCell>
                <TableCell>{meta.cantidadMeta}</TableCell>
                <TableCell>{meta.totalVentas}</TableCell>
                <TableCell>{meta.fechaRegistro}</TableCell>
                <TableCell>
                  <span
                    style={{
                      fontWeight: 'bold',
                      color:
                        meta.completado >= 100
                          ? 'green'
                          : meta.completado >= 75
                          ? 'orange'
                          : 'red',
                    }}
                  >
                    {meta.completado.toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell>
                  <Button variant="outlined" size="small" onClick={() => alert(`Ver ventas de ${meta.sku}`)}>
                    Ver ventas
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default MetasTable;
