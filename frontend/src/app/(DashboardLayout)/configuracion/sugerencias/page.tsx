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
  IconButton,
  TablePagination,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useEffect, useState } from "react";
import { apiJson } from "@/utils/apiClient";
import { BACKEND_URL } from "@/config";
import { notifySuccess, notifyError } from "@/components/ui/toast/notify";
import { TarjetasMovil, useEsCelular } from "../../utilities/ventas/components/movil";

const API_URL = `${BACKEND_URL}/api/sugerencias`;

const estados = ["pendiente", "leida", "completado"];

const SugerenciasPage = () => {
  const [sugerencias, setSugerencias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagina, setPagina] = useState(0);
  const sugerenciasPorPagina = 8;
  const esCelular = useEsCelular();

  useEffect(() => {
    const fetchSugerencias = async () => {
      try {
        const data = await apiJson<any[]>(API_URL);
        setSugerencias(data);
      } catch (err) {
        console.error("❌ Error en GET sugerencias:", err);
        notifyError("Error al cargar sugerencias");
      } finally {
        setLoading(false);
      }
    };

    fetchSugerencias();
  }, []);

  const handleEstadoChange = async (id: number, nuevoEstado: string) => {
    try {
      await apiJson(`${API_URL}/${id}`, {
        method: "PUT",
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      setSugerencias((prev) =>
        prev.map((s) => (s.ID === id ? { ...s, ESTADO: nuevoEstado } : s))
      );

      notifySuccess("Operación realizada correctamente.");
    } catch (err) {
      console.error("❌ Error al actualizar estado:", err);
      notifyError("Error. Intenta nuevamente.");
    }
  };

  const eliminarSugerencia = async (id: number) => {
    try {
      await apiJson(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      setSugerencias((prev) => prev.filter((s) => s.ID !== id));
      notifySuccess("Operación realizada correctamente.");
    } catch (err) {
      console.error("❌ Error al eliminar sugerencia:", err);
      notifyError("Error. Intenta nuevamente.");
    }
  };

  return (
    <Box px={{ xs: 0, sm: 4 }} py={{ xs: 2, sm: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Gestión de Sugerencias
      </Typography>

      {/* En celular las tarjetas van sin el papel de fondo de la tabla. */}
      <Paper sx={{ mt: 3, overflowX: "auto", ...(esCelular ? { bgcolor: "transparent", boxShadow: "none" } : {}) }}>
        {loading ? (
          <Box p={4} display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        ) : (
          <>
            {esCelular ? (
              <TarjetasMovil
                vacio="No hay sugerencias."
                filas={sugerencias
                  .slice(pagina * sugerenciasPorPagina, (pagina + 1) * sugerenciasPorPagina)
                  .map((sug) => ({
                    clave: String(sug.ID),
                    titulo: sug.SUGERENCIA,
                    meta: `#${sug.ID} · ${sug.DEPARTAMENTO ?? "—"} · ${new Date(sug.FECHA_REGISTRO).toLocaleDateString("es-CL")}`,
                    // Los controles no deben abrir la hoja al tocarlos: cortan el clic (también el del menú, que sube por el árbol de React).
                    principales: [
                      {
                        titulo: "Estado",
                        prefijo: false,
                        valor: (
                          <Box component="span" onClick={(e) => e.stopPropagation()} sx={{ display: "inline-block" }}>
                            <Select value={sug.ESTADO} onChange={(e) => handleEstadoChange(sug.ID, e.target.value)} size="small" sx={{ minWidth: 150 }}>
                              {estados.map((estado) => (
                                <MenuItem key={estado} value={estado}>
                                  {estado}
                                </MenuItem>
                              ))}
                            </Select>
                          </Box>
                        ),
                      },
                      {
                        titulo: "Eliminar",
                        prefijo: false,
                        valor: (
                          <Box component="span" onClick={(e) => e.stopPropagation()} sx={{ display: "inline-block" }}>
                            <IconButton color="error" aria-label="Eliminar sugerencia" onClick={() => eliminarSugerencia(sug.ID)}>
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        ),
                      },
                    ],
                  }))}
              />
            ) : (
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
            )}

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
    </Box>
  );
};

export default SugerenciasPage;
