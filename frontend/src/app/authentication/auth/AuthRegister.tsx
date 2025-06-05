"use client";
import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  IconButton,
  InputAdornment,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  FormHelperText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/config";

interface registerType {
  title?: string;
  subtitle?: JSX.Element | JSX.Element[];
  subtext?: JSX.Element | JSX.Element[];
}

const AuthRegister = ({ title, subtitle, subtext }: registerType) => {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  const router = useRouter();

  const validate = () => {
    const newErrors: any = {};
    if (!nombre.trim()) newErrors.nombre = "Campo requerido";
    if (!email.trim()) newErrors.email = "Campo requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Correo no válido";
    if (!telefono.trim()) newErrors.telefono = "Campo requerido";
    if (!departamento) newErrors.departamento = "Campo requerido";
    if (!password) newErrors.password = "Campo requerido";
    if (password !== confirmPassword)
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    return newErrors;
  };

  const obtenerIP = async (): Promise<string | null> => {
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      const data = await res.json();
      return data.ip;
    } catch (error) {
      console.error("Error al obtener IP:", error);
      return null;
    }
  };

  const obtenerGeolocalizacion = async (): Promise<{
    ciudad: string;
    region: string;
    pais: string;
    latitud: number | null;
    longitud: number | null;
  }> => {
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();
      return {
        ciudad: data.city || "",
        region: data.region || "",
        pais: data.country_name || "",
        latitud: data.latitude || null,
        longitud: data.longitude || null,
      };
    } catch (error) {
      console.error("Error al obtener ubicación:", error);
      return {
        ciudad: "",
        region: "",
        pais: "",
        latitud: null,
        longitud: null,
      };
    }
  };

  const handleRegister = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const ip = await obtenerIP();
      const ubicacion = await obtenerGeolocalizacion();

      const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          email,
          password,
          telefono,
          direccion: departamento,
          ip_registro: ip || "",
          ciudad: ubicacion.ciudad,
          region: ubicacion.region,
          pais: ubicacion.pais,
          latitud: ubicacion.latitud,
          longitud: ubicacion.longitud,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al registrar");

      setOpenDialog(true);
    } catch (err: any) {
      setErrors({ email: err.message });
    } finally {
      setLoading(false);
    }
  };

  const departamentos = [
    "Adquisiciones", "Administración", "Cajas", "Contabilidad", "Despacho",
    "Ecommerce", "Informática", "Logística", "Prevención", "Reposición",
    "RRHH", "Seguridad", "Ventas",
  ];

  return (
    <>
      {title && (
        <Typography fontWeight="700" variant="h2" mb={1}>
          {title}
        </Typography>
      )}
      {subtext}

      <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <Box sx={{ width: "100%", maxWidth: "1000px" }}>
          <Grid container spacing={2} mb={4}>
            {/* Información Personal (izquierda) */}
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, borderRadius: 2, border: "1px solid #ddd", backgroundColor: "#f9f9f9" }}>
                <Typography variant="subtitle2" mb={1} fontWeight="bold" color="text.secondary">
                  Información personal
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    label="Nombre y Apellido"
                    fullWidth
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    error={!!errors.nombre}
                    helperText={errors.nombre}
                  />
                  <TextField
                    label="Correo"
                    fullWidth
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={!!errors.email}
                    helperText={errors.email}
                  />
                  <TextField
                    label="Teléfono"
                    fullWidth
                    value={telefono}
                    onChange={(e) => {
                      const soloNumeros = e.target.value.replace(/\D/g, ""); // quitar letras
                      if (soloNumeros.length <= 8) setTelefono(soloNumeros);
                    }}
                    error={!!errors.telefono}
                    helperText={errors.telefono || "Ej: 12345678"}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          +569
                        </InputAdornment>
                      ),
                    }}
                    inputProps={{
                      maxLength: 8,
                      inputMode: "numeric",
                    }}
                  />

                </Stack>
              </Box>
            </Grid>

            {/* Departamento (derecha) */}
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, borderRadius: 2, border: "1px solid #ddd", backgroundColor: "#f9f9f9" }}>
                <Typography variant="subtitle2" mb={1} fontWeight="bold" color="text.secondary">
                  Departamento
                </Typography>
                <FormControl fullWidth error={!!errors.departamento}>
                  <InputLabel id="departamento-label">Departamento</InputLabel>
                  <Select
                    labelId="departamento-label"
                    value={departamento}
                    onChange={(e) => setDepartamento(e.target.value)}
                    label="Departamento"
                  >
                    {departamentos.map((dep) => (
                      <MenuItem key={dep} value={dep}>
                        {dep}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.departamento && (
                    <FormHelperText>{errors.departamento}</FormHelperText>
                  )}
                </FormControl>
              </Box>
            </Grid>

            {/* Seguridad (centrado abajo) */}
            <Grid item xs={12}>
              <Box sx={{ p: 2, borderRadius: 2, border: "1px solid #ddd", backgroundColor: "#f9f9f9" }}>
                <Typography variant="subtitle2" mb={1} fontWeight="bold" color="text.secondary">
                  Seguridad
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    label="Contraseña"
                    type={showPassword ? "text" : "password"}
                    fullWidth
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={!!errors.password}
                    helperText={errors.password}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword((prev) => !prev)} edge="end">
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    label="Repetir contraseña"
                    type={showConfirm ? "text" : "password"}
                    fullWidth
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowConfirm((prev) => !prev)} edge="end">
                            {showConfirm ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Stack>
              </Box>
            </Grid>

            {/* Botón debajo de todo */}
            <Grid item xs={12}>
              <Button
                color="primary"
                variant="contained"
                size="large"
                fullWidth
                onClick={handleRegister}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? "Registrando..." : "Registrarme"}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Box>



      {/* Modal de confirmación */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Cuenta creada exitosamente</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tus datos de acceso han sido enviados a tu correo electrónico.
            Deberás esperar que un administrador habilite tu cuenta antes de
            poder iniciar sesión.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => router.push("/authentication/login")} autoFocus>
            Ir al inicio
          </Button>
        </DialogActions>
      </Dialog>

      {subtitle}
    </>
  );
};

export default AuthRegister;
