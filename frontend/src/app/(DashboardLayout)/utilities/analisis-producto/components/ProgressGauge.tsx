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
  height?: number; // 🔥 Añadimos este nuevo prop
}

const ProgressGauge = ({
  value = 720,
  total = 1000,
  title = "Producto W",
  height = 200, 
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
        minWidth: 150,
        maxWidth: 300,
        elevation: 0,
        height: height, 
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >

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

      {/* 🔹 Leyenda mejorada */}
      <Stack direction="column" spacing={0.5} mt={1}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <CircleIcon sx={{ fontSize: 10, color: "#e91e63" }} />
          <Typography variant="caption" fontWeight="bold">
            Completado:
          </Typography>
          <Typography variant="caption">{porcentaje}%</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <CircleIcon sx={{ fontSize: 10, color: "#d1c4e9" }} />
          <Typography variant="caption" fontWeight="bold">
            Restante:
          </Typography>
          <Typography variant="caption">{restante}%</Typography>
        </Stack>
      </Stack>

    </Box>
  );
};

export default ProgressGauge;
