"use client";
import { useState } from "react";
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  Alert,
  Paper,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { BACKEND_URL } from "@/config";

const CrearUsuarioForm = () => {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    confirmPassword: "",
    telefono: "",
    direccion: "",
    rol: "usuario",
    estado: true, // true = activo
  });

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (e: any) => {
    setFormData({ ...formData, rol: e.target.value });
  };

  const handleEstadoToggle = () => {
    setFormData({ ...formData, estado: !formData.estado });
  };

  const handleSubmit = async () => {
    const { nombre, email, password, confirmPassword, telefono, direccion, rol, estado } = formData;

    if (!nombre || !email || !password || !confirmPassword || !telefono || !direccion) {
      setError("Completa todos los campos");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setError("");
    setMensaje("");
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/crearusuarioadmin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre,
          email,
          password,
          telefono,
          direccion,
          rol,
          estado,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Error al registrar usuario");
      }

      setMensaje("✅ Usuario creado exitosamente");
      setFormData({
        nombre: "",
        email: "",
        password: "",
        confirmPassword: "",
        telefono: "",
        direccion: "",
        rol: "usuario",
        estado: true,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 4, mt: 4, maxWidth: 600 }}>
      <Typography variant="h6" fontWeight="bold" mb={2}>
        Crear nuevo usuario
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField label="Nombre" name="nombre" value={formData.nombre} onChange={handleChange} fullWidth />
        </Grid>
        <Grid item xs={12}>
          <TextField label="Correo electrónico" name="email" value={formData.email} onChange={handleChange} fullWidth />
        </Grid>
        <Grid item xs={6}>
          <TextField label="Contraseña" type="password" name="password" value={formData.password} onChange={handleChange} fullWidth />
        </Grid>
        <Grid item xs={6}>
          <TextField label="Confirmar contraseña" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} fullWidth />
        </Grid>
        <Grid item xs={6}>
          <TextField label="Teléfono" name="telefono" value={formData.telefono} onChange={handleChange} fullWidth />
        </Grid>
        <Grid item xs={6}>
          <TextField label="Dirección" name="direccion" value={formData.direccion} onChange={handleChange} fullWidth />
        </Grid>

        {/* ROL */}
        <Grid item xs={6}>
          <FormControl fullWidth>
            <InputLabel>Rol</InputLabel>
            <Select value={formData.rol} onChange={handleSelectChange}>
              <MenuItem value="usuario">Usuario</MenuItem>
              <MenuItem value="admin">Administrador</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* ESTADO */}
        <Grid item xs={6} display="flex" alignItems="center">
          <FormControlLabel
            control={
              <Switch checked={formData.estado} onChange={handleEstadoToggle} />
            }
            label={formData.estado ? "Activo" : "Inactivo"}
          />
        </Grid>

        <Grid item xs={12}>
          <Button variant="contained" onClick={handleSubmit} disabled={loading} fullWidth>
            {loading ? "Creando..." : "Crear Usuario"}
          </Button>
        </Grid>

        {mensaje && (
          <Grid item xs={12}>
            <Alert severity="success">{mensaje}</Alert>
          </Grid>
        )}

        {error && (
          <Grid item xs={12}>
            <Alert severity="error">{error}</Alert>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
};

export default CrearUsuarioForm;
