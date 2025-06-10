import { Card, CardContent, Typography, Chip, Box } from "@mui/material";

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
  const config = estados[estado] || { color: "default", label: "Desconocido" };

  const fechaFormateada = fecha
    ? new Date(fecha).toLocaleDateString("es-CL", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <Card elevation={4} sx={{ borderRadius: 3, height: "100%" }}>
      <CardContent>
        <Box mb={1}>
          <Chip label={config.label} color={config.color as any} size="small" />
        </Box>

        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Departamento: {departamento}
        </Typography>

        {fechaFormateada && (
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Registrado el {fechaFormateada}
          </Typography>
        )}

        <Typography variant="body2">{mensaje}</Typography>
      </CardContent>
    </Card>
  );
};

export default SugerenciaCard;
