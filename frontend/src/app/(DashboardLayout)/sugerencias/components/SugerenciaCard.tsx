import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useState } from "react";

const estados = {
  pendiente: { color: "warning", label: "Pendiente" },
  leida: { color: "info", label: "Leída" },
  completado: { color: "success", label: "Completado" },
};

interface Props {
  departamento: string;
  mensaje: string;
  estado: "pendiente" | "leida" | "completado";
  fecha?: string;
}

const SugerenciaCard = ({ departamento, mensaje, estado, fecha }: Props) => {
  const [open, setOpen] = useState(false);
  const config = estados[estado] || { color: "default", label: "Desconocido" };

  const fechaFormateada = fecha
    ? new Date(fecha).toLocaleDateString("es-CL", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <>
      <Card elevation={4} sx={{ borderRadius: 3, height: "100%", position: "relative" }}>
        <CardContent>
          <Box mb={1} display="flex" justifyContent="space-between" alignItems="center">
            <Chip label={config.label} color={config.color as any} size="small" />
            <IconButton onClick={() => setOpen(true)} size="small">
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Box>

          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Departamento: {departamento}
          </Typography>

          {fechaFormateada && (
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Registrado el {fechaFormateada}
            </Typography>
          )}

          <Typography
            variant="body2"
            sx={{
              mt: 1,
              whiteSpace: "pre-line",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 5,
              WebkitBoxOrient: "vertical",
            }}
          >
            {mensaje}
          </Typography>
        </CardContent>
      </Card>

      {/* Modal de mensaje completo */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Sugerencia completa</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
            {mensaje}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SugerenciaCard;
