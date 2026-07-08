"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SugerenciaCard from "./components/SugerenciaCard";
import { apiJson } from "@/utils/apiClient";
import { BACKEND_URL } from "@/config";

const API_URL = `${BACKEND_URL}/api/sugerencias`;

const departamentos = [
  "Ventas",
  "Logística",
  "TI",
  "Adquisiciones",
  "Administración",
  "Marketing",
  "Finanzas",
   "e-commerce",
];

const Page = () => {
  const [sugerencias, setSugerencias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [departamento, setDepartamento] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  // Cargar sugerencias autenticadas
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const data = await apiJson<any[]>(API_URL);
        setSugerencias(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("❌ Error en GET:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  // Enviar sugerencia autenticada
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nueva = {
      departamento,
      mensaje,
    };

    try {
      const data = await apiJson<any>(API_URL, {
        method: "POST",
        body: JSON.stringify(nueva),
      });

      if (data.ID) {
        setSugerencias((prev) => [data, ...prev]);
      } else {
        const actualizadas = await apiJson<any[]>(API_URL);
        setSugerencias(Array.isArray(actualizadas) ? actualizadas : []);
      }

      setSuccess(true);
      setDepartamento("");
      setMensaje("");
      setOpenDialog(false);
    } catch (err) {
      console.error("❌ Error en POST:", err);
      setError(true);
    }
  };

  return (
    <Box sx={{ p: { xs: 1.5, md: 4 } }}>
      <Typography
        variant="h4"
        fontWeight="bold"
        gutterBottom
        sx={{ fontSize: { xs: "1.05rem", md: "h4.fontSize" }, mb: { xs: 0.5, md: 1 } }}
      >
        Sugerencias de Usuarios
      </Typography>

      <Grid container spacing={2} sx={{ mt: { xs: 0.5, md: 2 } }}>
        {loading ? (
          <Box m={2}>
            <CircularProgress />
          </Box>
        ) : sugerencias.length > 0 ? (
          sugerencias.map((sug, i) => (
            <Grid item xs={12} sm={6} md={4} key={sug.ID || i}>
              <SugerenciaCard
                departamento={sug.DEPARTAMENTO}
                mensaje={sug.SUGERENCIA}
                estado={sug.ESTADO}
                fecha={sug.FECHA_REGISTRO}
              />
            </Grid>
          ))
        ) : (
          <Typography color="text.secondary">
            No hay sugerencias registradas.
          </Typography>
        )}
      </Grid>

      <Fab
        color="primary"
        sx={{ position: "fixed", bottom: { xs: 16, sm: 32 }, right: { xs: 16, sm: 32 }, zIndex: 100 }}
        onClick={() => setOpenDialog(true)}
      >
        <AddIcon />
      </Fab>

<Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
  <DialogTitle>Enviar nueva sugerencia</DialogTitle>
  <DialogContent
    sx={{
      maxHeight: "70vh",
      overflowY: "auto",
    }}
  >
    <form onSubmit={handleSubmit}>
      <TextField
        label="Departamento"
        select
        fullWidth
        value={departamento}
        onChange={(e) => setDepartamento(e.target.value)}
        margin="normal"
        required
      >
        {departamentos.map((d) => (
          <MenuItem key={d} value={d}>
            {d}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        label="Escribe tu sugerencia"
        multiline
        fullWidth
        value={mensaje}
        onChange={(e) => setMensaje(e.target.value)}
        margin="normal"
        inputProps={{ maxLength: 700 }}
        helperText={`${mensaje.length}/700 caracteres`}
        required
        minRows={4}
        maxRows={12}
      />

      <DialogActions>
        <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
        <Button type="submit" variant="contained">
          Enviar
        </Button>
      </DialogActions>
    </form>
  </DialogContent>
</Dialog>


      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
      >
        <Alert severity="success" sx={{ width: "100%" }}>
          ¡Gracias por tu sugerencia!
        </Alert>
      </Snackbar>

      <Snackbar
        open={error}
        autoHideDuration={4000}
        onClose={() => setError(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="error" sx={{ width: "100%" }}>
          Ocurrió un error. Intenta nuevamente.
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Page;
