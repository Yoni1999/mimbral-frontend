"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TableContainer,
  IconButton,
  TextField,
  Select,
  MenuItem,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
} from "@mui/material";
import { fetchWithToken } from "@/utils/fetchWithToken";

import {
  Edit as EditIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Lock as LockIcon,
  AccessTime as AccessTimeIcon,
  VerifiedUser as VerifiedUserIcon,
  Numbers as NumbersIcon,
} from "@mui/icons-material";
import { BACKEND_URL } from "@/config";

const UsuariosPage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [editedData, setEditedData] = useState<any>({});
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [pendingActionId, setPendingActionId] = useState<number | null>(null);

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const response = await fetchWithToken(`${BACKEND_URL}/api/admin/usuarios`);
        if (!response) return;
        const data = await response.json();
        if (Array.isArray(data)) {
          // Aseguramos que los estados estén correctamente casteados
          const parsed = data.map((user) => ({
            ...user,
            ESTADO: Number(user.ESTADO) === 1 ? 1 : 0
          }));
          setUsers(parsed);
        } else {
          console.error("❌ La respuesta no es un array:", data);
        }
      } catch (error) {
        console.error("❌ Error al cargar usuarios:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsuarios();
  }, []);

  const handleEdit = (user: any) => {
    setEditId(user.ID);
    setEditedData(user);
  };

  const handleCancel = () => {
    setEditId(null);
    setEditedData({});
  };

  const handleInputChange = (field: string, value: any) => {
    setEditedData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (id: number) => {
    try {
      const dataToSend = {
        nombre: editedData.NOMBRE,
        email: editedData.EMAIL,
        telefono: editedData.TELEFONO,
        rol: editedData.ROL,
        estado: editedData.ESTADO,
      };

      const res = await fetchWithToken(`${BACKEND_URL}/api/admin/usuarios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      if (!res?.ok) throw new Error("Error al actualizar usuario");

      const updatedUser = await res.json();
      setUsers((prev) =>
        prev.map((user) => (user.ID === id ? { ...user, ...editedData } : user))
      );
      setEditId(null);
      setEditedData({});
    } catch (error) {
      console.error("❌ Error actualizando usuario:", error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetchWithToken(`${BACKEND_URL}/api/admin/usuarios/${id}`, {
        method: "DELETE",
      });

      if (!res?.ok) throw new Error("Error al eliminar el usuario");

      setUsers((prev) => prev.filter((user) => user.ID !== id));
    } catch (error) {
      console.error("❌ Error eliminando usuario:", error);
    }
  };

  const getEstadoChip = (estado: number) => (
    <Chip
      label={estado === 1 ? "Activo" : "Inactivo"}
      color={estado === 1 ? "success" : "default"}
      size="small"
    />
  );

  const getRolChip = (rol: string) => (
    <Chip
      label={rol}
      color={rol === "admin" ? "secondary" : "primary"}
      size="small"
    />
  );

  return (
    <Box p={4}>
      {loading ? (
        <CircularProgress />
      ) : (
        <Typography variant="subtitle1" mb={2}>
          Total de usuarios: {users.length}
        </Typography>
      )}

      {!loading && (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell><Tooltip title="ID"><NumbersIcon fontSize="small" /></Tooltip></TableCell>
                <TableCell><Tooltip title="Nombre"><PersonIcon fontSize="small" /></Tooltip></TableCell>
                <TableCell><Tooltip title="Correo Electrónico"><EmailIcon fontSize="small" /></Tooltip></TableCell>
                <TableCell><Tooltip title="Teléfono"><PhoneIcon fontSize="small" /></Tooltip></TableCell>
                <TableCell><Tooltip title="Rol"><LockIcon fontSize="small" /></Tooltip></TableCell>
                <TableCell><Tooltip title="Estado"><VerifiedUserIcon fontSize="small" /></Tooltip></TableCell>
                <TableCell><Tooltip title="Fecha de creación"><AccessTimeIcon fontSize="small" /></Tooltip></TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.ID} hover>
                  <TableCell>{user.ID}</TableCell>
                  <TableCell>
                    {editId === user.ID ? (
                      <TextField
                        value={editedData.NOMBRE}
                        onChange={(e) => handleInputChange("NOMBRE", e.target.value)}
                        size="small"
                      />
                    ) : (
                      user.NOMBRE
                    )}
                  </TableCell>
                  <TableCell>
                    {editId === user.ID ? (
                      <TextField
                        value={editedData.EMAIL}
                        onChange={(e) => handleInputChange("EMAIL", e.target.value)}
                        size="small"
                      />
                    ) : (
                      user.EMAIL
                    )}
                  </TableCell>
                  <TableCell>
                    {editId === user.ID ? (
                      <TextField
                        value={editedData.TELEFONO}
                        onChange={(e) => handleInputChange("TELEFONO", e.target.value)}
                        size="small"
                      />
                    ) : (
                      user.TELEFONO
                    )}
                  </TableCell>
                  <TableCell>
                    {editId === user.ID ? (
                      <Select
                        value={editedData.ROL}
                        onChange={(e) => handleInputChange("ROL", e.target.value)}
                        size="small"
                      >
                        <MenuItem value="admin">admin</MenuItem>
                        <MenuItem value="usuario">usuario</MenuItem>
                      </Select>
                    ) : (
                      getRolChip(user.ROL)
                    )}
                  </TableCell>
                  <TableCell>
                    {editId === user.ID ? (
                      <Select
                        value={editedData.ESTADO}
                        onChange={(e) => handleInputChange("ESTADO", Number(e.target.value))}
                        size="small"
                      >
                        <MenuItem value={1}>activo</MenuItem>
                        <MenuItem value={0}>inactivo</MenuItem>
                      </Select>
                    ) : (
                      getEstadoChip(user.ESTADO)
                    )}
                  </TableCell>
                  <TableCell>{new Date(user.FECHA_CREACION).toLocaleDateString()}</TableCell>
                  <TableCell align="center">
                    {editId === user.ID ? (
                      <>
                        <IconButton
                          color="success"
                          onClick={() => {
                            setPendingActionId(user.ID);
                            setConfirmSaveOpen(true);
                          }}
                        >
                          <SaveIcon />
                        </IconButton>
                        <IconButton onClick={handleCancel}>
                          <CancelIcon />
                        </IconButton>
                      </>
                    ) : (
                      <>
                        <IconButton
                          color="primary"
                          onClick={() => handleEdit(user)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => {
                            setPendingActionId(user.ID);
                            setConfirmDeleteOpen(true);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Confirmar guardado */}
      <Dialog open={confirmSaveOpen} onClose={() => setConfirmSaveOpen(false)}>
        <DialogTitle>Confirmar cambios</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas guardar los cambios?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <IconButton onClick={() => setConfirmSaveOpen(false)}><CancelIcon /></IconButton>
          <IconButton
            color="success"
            onClick={() => {
              if (pendingActionId !== null) handleSave(pendingActionId);
              setConfirmSaveOpen(false);
              setPendingActionId(null);
            }}
          >
            <SaveIcon />
          </IconButton>
        </DialogActions>
      </Dialog>

      {/* Confirmar eliminación */}
      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
        <DialogTitle>Eliminar usuario</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <IconButton onClick={() => setConfirmDeleteOpen(false)}><CancelIcon /></IconButton>
          <IconButton
            color="error"
            onClick={() => {
              if (pendingActionId !== null) handleDelete(pendingActionId);
              setConfirmDeleteOpen(false);
              setPendingActionId(null);
            }}
          >
            <DeleteIcon />
          </IconButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsuariosPage;