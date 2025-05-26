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
  Button
} from '@mui/material';
import { fetchWithToken } from '@/utils/fetchWithToken';
import { BACKEND_URL } from "@/config";
import MetaFormModal from './MetaFormModal';
import PeriodoFormModal from './PeriodoFormModal';
import AsignarMetaModal from './AsignarMetaModal';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import EditarMetaModal from './EditarMetaModal';
import EliminarMetaModal from './EliminarMetaModal';

type Meta = {
  id_meta: number; // <-- NUEVO
  sku: string | null;
  nombre: string | null;
  cantidadMeta: number | null;
  montoMeta: number | null;
  totalVentas: number;
  montoTotal: number;
  tipoMeta: 'cantidad' | 'monto';
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
  Vtex: 5,
  Falabella: 6,
};

const MetasTable = () => {
  const [canal, setCanal] = useState('Empresas');
  const [periodo, setPeriodo] = useState('');
  const [tipoMeta, setTipoMeta] = useState<'cantidad' | 'monto'>('cantidad');
  const [periodosDisponibles, setPeriodosDisponibles] = useState<Periodo[]>([]);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openPeriodoModal, setOpenPeriodoModal] = useState(false);

  const [openAsignarModal, setOpenAsignarModal] = useState(false);
  const [metaSeleccionada, setMetaSeleccionada] = useState<Meta | null>(null);
  const [openEditarModal, setOpenEditarModal] = useState(false);
  const [openEliminarModal, setOpenEliminarModal] = useState(false);

  const fetchPeriodos = async () => {
    try {
      const res = await fetchWithToken(`${BACKEND_URL}/api/periodos`);
      const data = await res!.json();
      const formateados: Periodo[] = data.map((p: any) => ({
        id: p.ID_PERIODO,
        nombre: p.NOMBRE,
        fechaInicio: p.FECHA_INICIO,
        fechaFin: p.FECHA_FIN,
      }));

      setPeriodosDisponibles(formateados);

      const hoy = new Date();
      const actual = formateados.find(p => {
        const inicio = new Date(p.fechaInicio);
        const fin = new Date(p.fechaFin);
        return hoy >= inicio && hoy <= fin;
      });

      if (actual) {
        setPeriodo(actual.id.toString());
      }
    } catch (error) {
      console.error('Error al cargar períodos:', error);
    }
  };

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
        const completado =
          m.TIPO_META === 'cantidad' && m.META_CANTIDAD > 0
            ? (m.TOTAL_VENDIDO / m.META_CANTIDAD) * 100
            : m.TIPO_META === 'monto' && m.MONTO_META > 0
              ? (m.MONTO_TOTAL / m.MONTO_META) * 100
              : 0;

        return {
          id_meta: m.ID_META, // <-- NUEVO
          sku: m.SKU,
          nombre: m.NOMBRE_PRODUCTO,
          cantidadMeta: m.META_CANTIDAD,
          montoMeta: m.MONTO_META,
          totalVentas: m.TOTAL_VENDIDO,
          montoTotal: m.MONTO_TOTAL,
          tipoMeta: m.TIPO_META.toLowerCase(),
          fechaRegistro: new Date().toISOString().split('T')[0],
          completado,
        };
      });

      setMetas(metasAdaptadas);
    } catch (error) {
      console.error('Error al cargar metas:', error);
    }
  };

  useEffect(() => {
    fetchPeriodos();
  }, []);

  useEffect(() => {
    fetchMetas();
  }, [canal, periodo]);

  const periodoSeleccionado = periodosDisponibles.find((p) => p.id.toString() === periodo);
  const metasFiltradas = metas.filter((m) => m.tipoMeta === tipoMeta);

  return (
    <Box className="space-y-4" p={2}>
      {/* Filtros y acciones */}
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" mb={2} gap={2}>
        <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
          <FilterListIcon color="action" />
          <Select value={canal} onChange={(e) => setCanal(e.target.value)} size="small" sx={{ minWidth: 180 }}>
            {Object.keys(canalSlpMap).map((c) => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
            ))}
          </Select>

          <Select value={periodo} onChange={(e) => setPeriodo(e.target.value)} size="small" sx={{ minWidth: 180 }}>
            {periodosDisponibles.map((p) => (
              <MenuItem key={p.id} value={p.id.toString()}>{p.nombre}</MenuItem>
            ))}
          </Select>

          <Select value={tipoMeta} onChange={(e) => setTipoMeta(e.target.value as 'cantidad' | 'monto')} size="small" sx={{ minWidth: 180 }}>
            <MenuItem value="cantidad">Metas por Producto</MenuItem>
            <MenuItem value="monto">Metas por Monto</MenuItem>
          </Select>
        </Box>


        <Box display="flex" gap={1.5}>
          <Button variant="contained" color="primary" size="small" startIcon={<AddIcon />} onClick={() => setDrawerOpen(true)}>Nueva Meta</Button>
          <Button variant="contained" color="secondary" size="small" startIcon={<AddIcon />} onClick={() => setOpenPeriodoModal(true)}>Nuevo Periodo</Button>
          <Button variant="contained" color="success" size="small" startIcon={<FileDownloadIcon />} onClick={() => alert('Exportar datos')}>Exportar</Button>
        </Box>
      </Box>

      {/* Tabla */}
      <Paper elevation={1} sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          {`Metas Registradas ${periodoSeleccionado ? `– ${periodoSeleccionado.nombre}` : ''}`}
        </Typography>

        <Table size="small">
          <TableHead>
            <TableRow>
              {tipoMeta === 'cantidad' ? (
                <>
                  <TableCell><strong>SKU</strong></TableCell>
                  <TableCell><strong>Nombre</strong></TableCell>
                  <TableCell><strong>Cantidad Meta</strong></TableCell>
                  <TableCell><strong>Total Vendido</strong></TableCell>
                </>
              ) : (
                <>
                  <TableCell><strong>Meta Monetaria</strong></TableCell>
                  <TableCell><strong>Total Vendido ($)</strong></TableCell>
                </>
              )}
              <TableCell><strong>Fecha Registro</strong></TableCell>
              <TableCell><strong>Completado</strong></TableCell>
              <TableCell><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {metasFiltradas.map((meta, index) => (
              <TableRow key={index}>
                {tipoMeta === 'cantidad' ? (
                  <>
                    <TableCell>{meta.sku}</TableCell>
                    <TableCell>{meta.nombre}</TableCell>
                    <TableCell>{meta.cantidadMeta}</TableCell>
                    <TableCell>{meta.totalVentas}</TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>${meta.montoMeta?.toLocaleString()}</TableCell>
                    <TableCell>${meta.montoTotal?.toLocaleString()}</TableCell>
                  </>
                )}
                <TableCell>{meta.fechaRegistro}</TableCell>
                <TableCell>
                  <span style={{ fontWeight: 'bold', color: meta.completado >= 100 ? 'green' : meta.completado >= 75 ? 'orange' : 'red' }}>
                    {meta.completado.toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    <Button
                      variant="outlined"
                      size="small"
                      color="primary"
                      onClick={() => {
                        setMetaSeleccionada(meta); // guardar meta actual
                        setOpenAsignarModal(true); // abrir modal
                      }}
                    >
                      Asignar
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      color="warning"
                      onClick={() => {
                        setMetaSeleccionada(meta); 
                        setOpenEditarModal(true);
                      }}
                    >
                      Editar
                    </Button>

                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      onClick={() => {
                        setMetaSeleccionada(meta);
                        setOpenEliminarModal(true);
                      }}
                    >
                      Eliminar
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <MetaFormModal
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onMetaGuardada={() => {
          setDrawerOpen(false);
          fetchMetas();
        }}
      />

      <PeriodoFormModal
        open={openPeriodoModal}
        onClose={() => setOpenPeriodoModal(false)}
        onPeriodoCreado={() => {
          fetchPeriodos();
          setOpenPeriodoModal(false);
        }}
      />

      {metaSeleccionada && (
        <AsignarMetaModal
          open={openAsignarModal}
          onClose={() => setOpenAsignarModal(false)}
          idMeta={metaSeleccionada.id_meta}
          idCanal={canalSlpMap[canal]}
          tipoMeta={metaSeleccionada.tipoMeta}
          metaTotal={
            metaSeleccionada.tipoMeta === 'cantidad'
              ? metaSeleccionada.cantidadMeta || 0
              : metaSeleccionada.montoMeta || 0
          }
          onAsignado={() => {
            fetchMetas();
            setOpenAsignarModal(false);
          }}
        />
      )}
      {metaSeleccionada && (
        <EditarMetaModal
          open={openEditarModal}
          onClose={() => setOpenEditarModal(false)}
          meta={metaSeleccionada}
          onMetaActualizada={() => {
            fetchMetas();
            setOpenEditarModal(false);
          }}
        />
      )}
      {metaSeleccionada && (
        <EliminarMetaModal
          open={openEliminarModal}
          onClose={() => setOpenEliminarModal(false)}
          idMeta={metaSeleccionada.id_meta}
          onMetaEliminada={() => {
            fetchMetas();
            setOpenEliminarModal(false);
          }}
        />
      )}


    </Box>
  );
};

export default MetasTable;
