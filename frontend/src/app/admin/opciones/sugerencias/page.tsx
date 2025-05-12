"use client";

import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  MenuItem,
  Select,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  TablePagination,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useEffect, useState } from "react";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";

const API_URL = `${BACKEND_URL}/api/sugerencias`;

const estados = ["pendiente", "leida", "completado"];

const AdminSugerenciasPage = () => {
  const [sugerencias, setSugerencias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [pagina, setPagina] = useState(0);
  const sugerenciasPorPagina = 8;

  useEffect(() => {
    const fetchSugerencias = async () => {
      try {
        const res = await fetchWithToken(API_URL);
        if (!res) return;

        const data = await res.json();
        setSugerencias(data);
      } catch (err) {
        console.error("❌ Error en GET sugerencias:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchSugerencias();
  }, []);

  const handleEstadoChange = async (id: number, nuevoEstado: string) => {
    try {
      const res = await fetchWithToken(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (!res || !res.ok) throw new Error("Error al actualizar estado");

      setSugerencias((prev) =>
        prev.map((s) => (s.ID === id ? { ...s, ESTADO: nuevoEstado } : s))
      );

      setSuccess(true);
    } catch (err) {
      console.error("❌ Error al actualizar estado:", err);
      setError(true);
    }
  };

  const eliminarSugerencia = async (id: number) => {
    try {
      const res = await fetchWithToken(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      if (!res || !res.ok) throw new Error("Error al eliminar sugerencia");

      setSugerencias((prev) => prev.filter((s) => s.ID !== id));
      setSuccess(true);
    } catch (err) {
      console.error("❌ Error al eliminar sugerencia:", err);
      setError(true);
    }
  };

  return (
    <Box p={4}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Gestión de Sugerencias
      </Typography>

      <Paper sx={{ mt: 3, overflowX: "auto" }}>
        {loading ? (
          <Box p={4} display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Departamento</TableCell>
                  <TableCell>Sugerencia</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sugerencias
                  .slice(
                    pagina * sugerenciasPorPagina,
                    (pagina + 1) * sugerenciasPorPagina
                  )
                  .map((sug) => (
                    <TableRow key={sug.ID}>
                      <TableCell>{sug.ID}</TableCell>
                      <TableCell>{sug.DEPARTAMENTO}</TableCell>
                      <TableCell>{sug.SUGERENCIA}</TableCell>
                      <TableCell>
                        <Select
                          value={sug.ESTADO}
                          onChange={(e) =>
                            handleEstadoChange(sug.ID, e.target.value)
                          }
                          size="small"
                        >
                          {estados.map((estado) => (
                            <MenuItem key={estado} value={estado}>
                              {estado}
                            </MenuItem>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell>
                        {new Date(sug.FECHA_REGISTRO).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          color="error"
                          onClick={() => eliminarSugerencia(sug.ID)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>

            <TablePagination
              component="div"
              count={sugerencias.length}
              page={pagina}
              onPageChange={(_, nuevaPagina) => setPagina(nuevaPagina)}
              rowsPerPage={sugerenciasPorPagina}
              rowsPerPageOptions={[sugerenciasPorPagina]}
            />
          </>
        )}
      </Paper>

      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
      >
        <Alert severity="success" sx={{ width: "100%" }}>
          Operación realizada correctamente.
        </Alert>
      </Snackbar>

      <Snackbar
        open={error}
        autoHideDuration={4000}
        onClose={() => setError(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="error" sx={{ width: "100%" }}>
          Error. Intenta nuevamente.
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminSugerenciasPage;
