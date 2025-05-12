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
  FormHelperText,
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
  const [direccion, setDireccion] = useState(""); // Se mantiene como 'direccion' para la base de datos
  const [departamento, setDepartamento] = useState(""); // Usamos el nombre "departamento" en la UI
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const router = useRouter();

  const validate = () => {
    const newErrors: any = {};
    if (!nombre.trim()) newErrors.nombre = "Campo requerido";
    if (!email.trim()) newErrors.email = "Campo requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Correo no válido";
    if (!telefono.trim()) newErrors.telefono = "Campo requerido";
    if (!direccion.trim()) newErrors.direccion = "Campo requerido";
    if (!departamento) newErrors.departamento = "Campo requerido"; // Validación para Departamento
    if (!password) newErrors.password = "Campo requerido";
    if (password !== confirmPassword)
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    return newErrors;
  };

  const handleRegister = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Aquí enviamos "direccion" con el valor de "departamento" en la solicitud
        body: JSON.stringify({ nombre, email, password, telefono, direccion: departamento }), 
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al registrar");

      alert("✅ Registro exitoso. Debes esperar la aprobación del administrador para poder ingresar al sistema.");
      router.push("/authentication/login");
    } catch (err: any) {
      setErrors({ email: err.message });
    }
  };

  const departamentos = [
    "Adquisiciones",
    "Administración",
    "Cajas",
    "Contabilidad",
    "Despacho",
    "Ecommerce",
    "Informática",
    "Logística",
    "Prevención",
    "Reposición",
    "RRHH",
    "Seguridad",
    "Ventas",
  ];

  return (
    <>
      {title && (
        <Typography fontWeight="700" variant="h2" mb={1}>
          {title}
        </Typography>
      )}

      {subtext}

      <Box>
        <Stack spacing={2} mb={3}>
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
            onChange={(e) => setTelefono(e.target.value)}
            error={!!errors.telefono}
            helperText={errors.telefono}
          />

          {/* Campo Departamento (lo mostramos como 'Departamento', pero lo guardamos como 'direccion' */}
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
            {errors.departamento && <FormHelperText>{errors.departamento}</FormHelperText>}
          </FormControl>

          <TextField
            label="Dirección"
            fullWidth
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            error={!!errors.direccion}
            helperText={errors.direccion}
            disabled // No editable directamente por el usuario
          />

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

        <Button
          color="primary"
          variant="contained"
          size="large"
          fullWidth
          onClick={handleRegister}
        >
          Registrarme
        </Button>
      </Box>

      {subtitle}
    </>
  );
};

export default AuthRegister;
