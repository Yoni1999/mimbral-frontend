'use client';
import React, { useState, useEffect } from 'react';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  Button,
  Typography,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { fetchWithToken } from '@/utils/fetchWithToken';
import { BACKEND_URL } from "@/config";

type Periodo = {
  idPeriodo: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
};

const PeriodosTable = () => {
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [periodoEditado, setPeriodoEditado] = useState<Omit<Periodo, 'idPeriodo'> | null>(null);
  const [nuevoPeriodo, setNuevoPeriodo] = useState<Omit<Periodo, 'idPeriodo'>>({
    nombre: '',
    fechaInicio: '',
    fechaFin: '',
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [periodoAEliminar, setPeriodoAEliminar] = useState<Periodo | null>(null);

  const fetchPeriodos = async () => {
    try {
      const res = await fetchWithToken(`${BACKEND_URL}/api/periodos`);
      if (!res || !res.ok) throw new Error('Error en la respuesta de la API');

      const data = await res.json();
      const adaptados: Periodo[] = data.map((p: any) => ({
        idPeriodo: p.ID_PERIODO.toString(),
        nombre: p.NOMBRE,
        fechaInicio: p.FECHA_INICIO.split('T')[0],
        fechaFin: p.FECHA_FIN.split('T')[0],
      }));
      setPeriodos(adaptados);
    } catch (error) {
      console.error('Error al obtener los periodos:', error);
    }
  };

  useEffect(() => {
    fetchPeriodos();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNuevoPeriodo({ ...nuevoPeriodo, [e.target.name]: e.target.value });
  };

  const handleAgregar = async () => {
    const { nombre, fechaInicio, fechaFin } = nuevoPeriodo;
    if (!nombre || !fechaInicio || !fechaFin) return;

    try {
      const res = await fetchWithToken(`${BACKEND_URL}/api/periodos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, fechaInicio, fechaFin }),
      });

      if (!res || !res.ok) {
        console.error('Error al agregar el periodo');
        return;
      }

      await fetchPeriodos();
      setNuevoPeriodo({ nombre: '', fechaInicio: '', fechaFin: '' });
    } catch (error) {
      console.error('Error en la petición POST:', error);
    }
  };

  const handleDialogOpen = (periodo: Periodo) => {
    setPeriodoAEliminar(periodo);
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setPeriodoAEliminar(null);
  };

  const handleConfirmarEliminar = async () => {
    if (!periodoAEliminar) return;

    try {
      const res = await fetchWithToken(`${BACKEND_URL}/api/periodos/${periodoAEliminar.idPeriodo}`, {
        method: 'DELETE',
      });

      if (!res || !res.ok) {
        console.error('Error al eliminar el periodo');
        return;
      }

      await fetchPeriodos();
    } catch (error) {
      console.error('Error en la eliminación:', error);
    } finally {
      handleDialogClose();
    }
  };

  const handleEditar = (periodo: Periodo) => {
    setEditandoId(periodo.idPeriodo);
    setPeriodoEditado({
      nombre: periodo.nombre,
      fechaInicio: periodo.fechaInicio,
      fechaFin: periodo.fechaFin,
    });
  };

  const handleGuardar = async (id: string) => {
    if (!periodoEditado) return;

    try {
      const res = await fetchWithToken(`${BACKEND_URL}/api/periodos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(periodoEditado),
      });

      if (!res || !res.ok) {
        console.error('Error al actualizar el periodo');
        return;
      }

      await fetchPeriodos();
    } catch (error) {
      console.error('Error al actualizar el periodo:', error);
    } finally {
      setEditandoId(null);
      setPeriodoEditado(null);
    }
  };

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-wrap items-end gap-6">
        <TextField label="Nombre" name="nombre" value={nuevoPeriodo.nombre} onChange={handleChange} variant="outlined" size="small" sx={{ mr: 2 }}/>
        <TextField label="Fecha Inicio" name="fechaInicio" type="date" InputLabelProps={{ shrink: true }} value={nuevoPeriodo.fechaInicio} onChange={handleChange} variant="outlined" size="small" sx={{ mr: 2 }} />
        <TextField label="Fecha Fin" name="fechaFin" type="date" InputLabelProps={{ shrink: true }} value={nuevoPeriodo.fechaFin} onChange={handleChange} variant="outlined" size="small" sx={{ mr: 2 }}/>
        <Button variant="contained" color="primary" onClick={handleAgregar} size="medium" style={{ height: '40px' }}>
          Agregar Periodo
        </Button>
      </div>

      <Paper elevation={2} className="p-4 rounded-lg border border-gray-100">
        <Typography variant="subtitle1" className="mb-2 font-semibold">Periodos creados</Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>ID Periodo</strong></TableCell>
              <TableCell><strong>Nombre</strong></TableCell>
              <TableCell><strong>Fecha Inicio</strong></TableCell>
              <TableCell><strong>Fecha Fin</strong></TableCell>
              <TableCell><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {periodos.map((p, idx) => (
              <TableRow key={idx} hover>
                <TableCell>{p.idPeriodo}</TableCell>
                <TableCell>
                  {editandoId === p.idPeriodo ? (
                    <TextField size="small" value={periodoEditado?.nombre || ''} onChange={(e) => setPeriodoEditado(prev => ({ ...prev!, nombre: e.target.value }))} />
                  ) : (
                    p.nombre
                  )}
                </TableCell>
                <TableCell>
                  {editandoId === p.idPeriodo ? (
                    <TextField size="small" type="date" value={periodoEditado?.fechaInicio || ''} onChange={(e) => setPeriodoEditado(prev => ({ ...prev!, fechaInicio: e.target.value }))} />
                  ) : (
                    p.fechaInicio
                  )}
                </TableCell>
                <TableCell>
                  {editandoId === p.idPeriodo ? (
                    <TextField size="small" type="date" value={periodoEditado?.fechaFin || ''} onChange={(e) => setPeriodoEditado(prev => ({ ...prev!, fechaFin: e.target.value }))} />
                  ) : (
                    p.fechaFin
                  )}
                </TableCell>
                <TableCell>
                  {editandoId === p.idPeriodo ? (
                    <Button variant="contained" size="small" onClick={() => handleGuardar(p.idPeriodo)}>Guardar</Button>
                  ) : (
                    <>
                      <Button variant="outlined" color="primary" size="small" onClick={() => handleEditar(p)} style={{ marginRight: '0.5rem' }}>
                        Editar
                      </Button>
                      <Button variant="outlined" color="error" size="small" onClick={() => handleDialogOpen(p)}>
                        Eliminar
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={openDialog} onClose={handleDialogClose}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro que deseas eliminar el periodo{' '}
            <strong>{periodoAEliminar?.nombre}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="primary">Cancelar</Button>
          <Button onClick={handleConfirmarEliminar} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default PeriodosTable;
