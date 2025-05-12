"use client";
import { Gauge, gaugeClasses } from "@mui/x-charts/Gauge";
import {
  Box,
  Typography,
  Stack,
  IconButton,
  Tooltip,
} from "@mui/material";
import CircleIcon from "@mui/icons-material/Circle";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useRouter } from "next/navigation";

interface Props {
  value?: number;
  total?: number;
  title?: string;
  detalleRuta?: string;
}

const ProgressGauge = ({
  value = 720,
  total = 1000,
  title = "Producto W",
  detalleRuta = "/detalle-progreso", // 🔹 Ruta por defecto
}: Props) => {
  const porcentaje = Math.round((value / total) * 100);
  const restante = 100 - porcentaje;

  const router = useRouter();

  return (
      <Box
        sx={{
          border: "1px solid #e0e0e0",
          borderRadius: 2,
          p: 2,
          background: "#fff",
          boxShadow: 3,
          width: "100%", // ← NO poner width fija de 300px
          minWidth: 150, // ← Mínimo para que no colapse
          maxWidth: 220, // ← Máximo para que no se haga enorme
          height: "auto",
          flexGrow: 1, // ← Que crezca si hay espacio
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >

      {/* 🔹 Botón de opciones */}
      <Tooltip title="Ver informe detallado" arrow>
        <IconButton
          size="small"
          onClick={() => router.push(detalleRuta)}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            color: "#888",
            "&:hover": { color: "primary.main" },
          }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {/* 🔹 Título */}
      <Typography
        variant="subtitle2"
        align="center"
        fontWeight={500}
        color="text.secondary"
        gutterBottom
      >
        {title}
      </Typography>

      {/* 🔹 Gauge */}
      <Gauge
        value={porcentaje}
        startAngle={-110}
        endAngle={110}
        sx={{
          height: 200,
          [`& .${gaugeClasses.valueText}`]: {
            fontSize: 18,
            transform: "translate(0px, -8px)",
            fontWeight: "bold",
          },
        }}
        text={({ value, valueMax }) => `${value} / ${valueMax}`}
      />

      {/* 🔹 Leyenda */}
      <Stack direction="row" justifyContent="space-around" mt={1.5}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <CircleIcon sx={{ fontSize: 10, color: "#e91e63" }} />
          <Typography variant="caption" fontWeight="bold">
            Completado
          </Typography>
          <Typography variant="caption">{porcentaje}%</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <CircleIcon sx={{ fontSize: 10, color: "#d1c4e9" }} />
          <Typography variant="caption" fontWeight="bold">
            Restante
          </Typography>
          <Typography variant="caption">{restante}%</Typography>
        </Stack>
      </Stack>
    </Box>
  );
};

export default ProgressGauge;
