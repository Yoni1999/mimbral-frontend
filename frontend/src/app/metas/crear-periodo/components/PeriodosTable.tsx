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
import { apiJson } from '@/utils/apiClient';

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
      const data = await apiJson<any[]>(`/api/periodos`);
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
      await apiJson(`/api/periodos/${periodoAEliminar.idPeriodo}`, { method: 'DELETE' });
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
      await apiJson(`/api/periodos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(periodoEditado),
      });
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

      <Paper elevation={1} sx={{backgroundColor: '#FEFEFE',p: 0, borderRadius: 1,}}>
        <Typography variant="subtitle1" className="mb-2 font-semibold">Periodos creados</Typography>
        <Box sx={{ overflowX: "auto" }}>
        <Table
          sx={{
            minWidth: { xs: 0, md: 650 },
            "& .MuiTableCell-root": { px: { xs: 1, md: 2 } },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}><strong>ID Periodo</strong></TableCell>
              <TableCell><strong>Nombre</strong></TableCell>
              <TableCell><strong>Fecha Inicio</strong></TableCell>
              <TableCell><strong>Fecha Fin</strong></TableCell>
              <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}><strong>Acciones</strong></TableCell>
              <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}><strong>Estado</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {periodos.map((p, idx) => (
              <TableRow key={idx} hover>
                <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>{p.idPeriodo}</TableCell>
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
                <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
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
        </Box>
      </Paper>

      <Dialog open={openDialog} onClose={handleDialogClose} fullWidth maxWidth="xs">
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
