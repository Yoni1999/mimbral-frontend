"use client";

import * as React from "react";
import {
  GaugeContainer,
  GaugeValueArc,
  GaugeReferenceArc,
  useGaugeState,
} from "@mui/x-charts/Gauge";
import { Box, Typography, Grid } from "@mui/material";

// Puntero personalizado
function GaugePointer() {
  const { valueAngle, outerRadius, cx, cy } = useGaugeState();

  if (valueAngle === null) return null;

  const target = {
    x: cx + outerRadius * Math.sin(valueAngle),
    y: cy - outerRadius * Math.cos(valueAngle),
  };

  return (
    <g>
      <circle cx={cx} cy={cy} r={4} fill="currentColor" />
      <path d={`M ${cx} ${cy} L ${target.x} ${target.y}`} stroke="currentColor" strokeWidth={3} />
    </g>
  );
}

// Componente de Riesgo
interface Props {
  value: number;
  montoUtilizado: number;
  montoLimite: number;
}

const RiesgoCreditoGauge: React.FC<Props> = ({ value, montoUtilizado, montoLimite }) => {
  // Color según riesgo
  let color = "success.main"; // verde
  if (value > 70) color = "error.main"; // rojo
  else if (value > 40) color = "warning.main"; // amarillo

  return (
    <Grid container spacing={1} alignItems="center">
      {/* Gauge */}
      <Grid item xs={5}>
        <GaugeContainer
          width={100}
          height={100}
          startAngle={-110}
          endAngle={110}
          value={value}
          sx={{ color }}
        >
          <GaugeReferenceArc />
          <GaugeValueArc />
          <GaugePointer />
        </GaugeContainer>
      </Grid>

      {/* Texto al lado */}
      <Grid item xs={7}>
        <Typography variant="subtitle2" color="text.secondary">
          Riesgo de Crédito
        </Typography>
        <Typography variant="body1" fontWeight={700}>
          {value}%
        </Typography>
        <Typography variant="caption" color="text.secondary">
          ${montoUtilizado.toLocaleString("es-CL")} / ${montoLimite.toLocaleString("es-CL")}
        </Typography>
      </Grid>
    </Grid>
  );
};

export default RiesgoCreditoGauge;
