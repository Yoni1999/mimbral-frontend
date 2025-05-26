'use client';
import React, { useState, useEffect } from 'react';
import {
  Table, TableHead, TableRow, TableCell, TableBody,
  TextField, Button, Typography, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PeriodoFormModal from '../../crear-meta/components/PeriodoFormModal';
import { fetchWithToken } from '@/utils/fetchWithToken';
import { BACKEND_URL } from "@/config";

// Tipado
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
  const [openDialog, setOpenDialog] = useState(false);
  const [periodoAEliminar, setPeriodoAEliminar] = useState<Periodo | null>(null);
  const [openPeriodoModal, setOpenPeriodoModal] = useState(false);

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

  useEffect(() => { fetchPeriodos(); }, []);

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
      const res = await fetchWithToken(`${BACKEND_URL}/api/periodos/${periodoAEliminar.idPeriodo}`, { method: 'DELETE' });
      if (!res || !res.ok) return;
      await fetchPeriodos();
    } catch (error) {
      console.error('Error al eliminar el periodo:', error);
    } finally {
      handleDialogClose();
    }
  };

  const handleEditar = (periodo: Periodo) => {
    setEditandoId(periodo.idPeriodo);
    setPeriodoEditado({ nombre: periodo.nombre, fechaInicio: periodo.fechaInicio, fechaFin: periodo.fechaFin });
  };
  const handleGuardar = async (id: string) => {
    if (!periodoEditado) return;
    try {
      const res = await fetchWithToken(`${BACKEND_URL}/api/periodos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(periodoEditado),
      });
      if (!res || !res.ok) return;
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
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button
          variant="contained"
          color="secondary"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setOpenPeriodoModal(true)}
        >
          Nuevo Periodo
        </Button>
      </Box>

      <Paper elevation={1} sx={{backgroundColor: '#f5f5f5',p: 0, borderRadius: 1,}}>
        <Typography variant="subtitle1" className="mb-2 font-semibold">Periodos creados</Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>ID Periodo</strong></TableCell>
              <TableCell><strong>Nombre</strong></TableCell>
              <TableCell><strong>Fecha Inicio</strong></TableCell>
              <TableCell><strong>Fecha Fin</strong></TableCell>
              <TableCell><strong>Acciones</strong></TableCell>
              <TableCell><strong>Estado</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {periodos.map((p, idx) => (
              <TableRow key={idx} hover>
                <TableCell>{p.idPeriodo}</TableCell>
                <TableCell>
                  {editandoId === p.idPeriodo ? (
                    <TextField size="small" value={periodoEditado?.nombre || ''} onChange={(e) => setPeriodoEditado(prev => ({ ...prev!, nombre: e.target.value }))} />
                  ) : p.nombre}
                </TableCell>
                <TableCell>
                  {editandoId === p.idPeriodo ? (
                    <TextField size="small" type="date" value={periodoEditado?.fechaInicio || ''} onChange={(e) => setPeriodoEditado(prev => ({ ...prev!, fechaInicio: e.target.value }))} />
                  ) : p.fechaInicio}
                </TableCell>
                <TableCell>
                  {editandoId === p.idPeriodo ? (
                    <TextField size="small" type="date" value={periodoEditado?.fechaFin || ''} onChange={(e) => setPeriodoEditado(prev => ({ ...prev!, fechaFin: e.target.value }))} />
                  ) : p.fechaFin}
                </TableCell>
                <TableCell>
                  {editandoId === p.idPeriodo ? (
                    <Button variant="contained" size="small" onClick={() => handleGuardar(p.idPeriodo)}>Guardar</Button>
                  ) : (
                    <>
                      <Button variant="outlined" color="warning" size="small" onClick={() => handleEditar(p)} style={{ marginRight: '0.5rem' }}>
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
          <Button onClick={handleConfirmarEliminar} color="error" variant="contained">Eliminar</Button>
        </DialogActions>
      </Dialog>

      <PeriodoFormModal
        open={openPeriodoModal}
        onClose={() => setOpenPeriodoModal(false)}
        onPeriodoCreado={() => {
          fetchPeriodos();
          setOpenPeriodoModal(false);
        }}
      />
    </div>
  );
};

export default PeriodosTable;