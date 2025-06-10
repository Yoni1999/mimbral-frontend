"use client";
import { useState } from "react";
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  Alert,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  FormControlLabel,
  Switch,
  CircularProgress,
  Fade,
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
    estado: true,
  });

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: any) => {
    setFormData((prev) => ({ ...prev, rol: e.target.value }));
  };

  const handleEstadoToggle = () => {
    setFormData((prev) => ({ ...prev, estado: !prev.estado }));
  };

  const handleSubmit = async () => {
    const { nombre, email, password, confirmPassword, telefono, direccion, rol, estado } = formData;

    if (!nombre || !email || !password || !confirmPassword || !telefono || !direccion) {
      setError("❌ Todos los campos son obligatorios");
      setMensaje("");
      return;
    }

    if (password !== confirmPassword) {
      setError("❌ Las contraseñas no coinciden");
      setMensaje("");
      return;
    }

    setError("");
    setMensaje("");
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/crearusuarioadmin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, password, telefono, direccion, rol, estado }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al registrar usuario");

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
      setError(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" noValidate autoComplete="off">
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Datos del nuevo usuario
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            label="Nombre completo"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            fullWidth
            required
            variant="outlined"
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            label="Correo electrónico"
            name="email"
            value={formData.email}
            onChange={handleChange}
            fullWidth
            required
            type="email"
          />
        </Grid>

        <Grid item xs={6}>
          <TextField
            label="Contraseña"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            fullWidth
            required
          />
        </Grid>

        <Grid item xs={6}>
          <TextField
            label="Confirmar contraseña"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            fullWidth
            required
          />
        </Grid>

        <Grid item xs={6}>
          <TextField
            label="Teléfono"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            fullWidth
            required
          />
        </Grid>

        <Grid item xs={6}>
          <TextField
            label="Dirección"
            name="direccion"
            value={formData.direccion}
            onChange={handleChange}
            fullWidth
            required
          />
        </Grid>

        <Grid item xs={6}>
          <FormControl fullWidth required>
            <InputLabel>Rol</InputLabel>
            <Select value={formData.rol} onChange={handleSelectChange} label="Rol">
              <MenuItem value="usuario">Usuario</MenuItem>
              <MenuItem value="admin">Administrador</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={6} display="flex" alignItems="center">
          <FormControlLabel
            control={<Switch checked={formData.estado} onChange={handleEstadoToggle} />}
            label={formData.estado ? "Activo" : "Inactivo"}
          />
        </Grid>

        <Grid item xs={12}>
          <Button
            variant="contained"
            size="large"
            onClick={handleSubmit}
            disabled={loading}
            fullWidth
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Registrar usuario"}
          </Button>
        </Grid>

        <Grid item xs={12}>
          <Fade in={!!mensaje}>
            <Alert severity="success">{mensaje}</Alert>
          </Fade>
          <Fade in={!!error}>
            <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>
          </Fade>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CrearUsuarioForm;
