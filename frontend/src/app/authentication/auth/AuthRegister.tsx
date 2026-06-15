"use client";
import React from "react";
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
import { useAuthRegister } from "@/modules/auth/hooks/useAuthRegister";

interface RegisterProps {
  title?: string;
  subtitle?: JSX.Element | JSX.Element[];
  subtext?: JSX.Element | JSX.Element[];
}

const DEPARTAMENTOS = [
  "Adquisiciones",
  "Administracion",
  "Cajas",
  "Contabilidad",
  "Despacho",
  "Ecommerce",
  "Informatica",
  "Logistica",
  "Prevencion",
  "Reposicion",
  "RRHH",
  "Seguridad",
  "Ventas",
];

const AuthRegister = ({ title, subtitle, subtext }: RegisterProps) => {
  const router = useRouter();
  const {
    values,
    showPassword,
    showConfirm,
    errors,
    loading,
    openDialog,
    setField,
    setTelefono,
    setOpenDialog,
    setShowPassword,
    setShowConfirm,
    handleRegister,
  } = useAuthRegister();

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
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, borderRadius: 2, border: "1px solid #ddd", backgroundColor: "#f9f9f9" }}>
                <Typography variant="subtitle2" mb={1} fontWeight="bold" color="text.secondary">
                  Informacion personal
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    label="Nombre y Apellido"
                    fullWidth
                    value={values.nombre}
                    onChange={(e) => setField("nombre", e.target.value)}
                    error={!!errors.nombre}
                    helperText={errors.nombre}
                  />
                  <TextField
                    label="Correo"
                    fullWidth
                    value={values.email}
                    onChange={(e) => setField("email", e.target.value)}
                    error={!!errors.email}
                    helperText={errors.email}
                  />
                  <TextField
                    label="Telefono"
                    fullWidth
                    value={values.telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    error={!!errors.telefono}
                    helperText={errors.telefono || "Ej: 12345678"}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">+569</InputAdornment>,
                    }}
                    inputProps={{
                      maxLength: 8,
                      inputMode: "numeric",
                    }}
                  />
                </Stack>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, borderRadius: 2, border: "1px solid #ddd", backgroundColor: "#f9f9f9" }}>
                <Typography variant="subtitle2" mb={1} fontWeight="bold" color="text.secondary">
                  Departamento
                </Typography>
                <FormControl fullWidth error={!!errors.departamento}>
                  <InputLabel id="departamento-label">Departamento</InputLabel>
                  <Select
                    labelId="departamento-label"
                    value={values.departamento}
                    onChange={(e) => setField("departamento", e.target.value)}
                    label="Departamento"
                  >
                    {DEPARTAMENTOS.map((dep) => (
                      <MenuItem key={dep} value={dep}>
                        {dep}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.departamento && <FormHelperText>{errors.departamento}</FormHelperText>}
                </FormControl>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ p: 2, borderRadius: 2, border: "1px solid #ddd", backgroundColor: "#f9f9f9" }}>
                <Typography variant="subtitle2" mb={1} fontWeight="bold" color="text.secondary">
                  Seguridad
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    label="Contrasena"
                    type={showPassword ? "text" : "password"}
                    fullWidth
                    value={values.password}
                    onChange={(e) => setField("password", e.target.value)}
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
                    label="Repetir contrasena"
                    type={showConfirm ? "text" : "password"}
                    fullWidth
                    value={values.confirmPassword}
                    onChange={(e) => setField("confirmPassword", e.target.value)}
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

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Cuenta creada exitosamente</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tus datos de acceso han sido enviados a tu correo electronico.
            Deberas esperar que un administrador habilite tu cuenta antes de
            poder iniciar sesion.
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
