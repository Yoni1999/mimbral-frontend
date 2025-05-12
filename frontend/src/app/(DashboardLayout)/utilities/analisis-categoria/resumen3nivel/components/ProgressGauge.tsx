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
        borderRadius: 3,
        p: 2,
        background: "#fff",
        boxShadow: 3,
        width: 180,
        position: "relative", // 🔹 Para posicionar el botón flotante
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
          height: 100,
          [`& .${gaugeClasses.valueText}`]: {
            fontSize: 18,
            transform: "translate(0px, -8px)",
            fontWeight: "bold",
          },
        }}
        text={({ value, valueMax }) => `${value} / ${valueMax}`}
      />

    </Box>
  );
};

export default ProgressGauge;
