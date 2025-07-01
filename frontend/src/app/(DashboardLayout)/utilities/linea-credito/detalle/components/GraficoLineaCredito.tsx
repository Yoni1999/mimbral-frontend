"use client";

import * as React from "react";
import { LineChart } from "@mui/x-charts/LineChart";

interface Props {
  gastos: number[];         // array de montos gastados por fecha
  etiquetas: string[];      // fechas o nombres del eje X
  lineaCredito: number;     // monto fijo de línea de crédito
}

const GraficoLineaCredito: React.FC<Props> = ({ gastos, etiquetas, lineaCredito }) => {
  // Calcular gasto acumulado
  const gastoAcumulado = gastos.reduce<number[]>((acc, curr, i) => {
    const suma = (acc[i - 1] || 0) + curr;
    acc.push(suma);
    return acc;
  }, []);

  // Línea constante del crédito
  const lineaConstante = etiquetas.map(() => lineaCredito);

  return (
    <LineChart
      height={355}
      xAxis={[{ scaleType: 'point', data: etiquetas }]}
      yAxis={[{}]}
      series={[
        {
          data: lineaConstante,
          label: "Línea de Crédito",
          color: "#d32f2f", // rojo
          showMark: false,
        },
        {
          data: gastoAcumulado,
          label: "Gasto Acumulado",
          color: "#388e3c", // verde
        },
      ]}
      margin={{ right: 20, left: 80 }}
    />
  );
};

export default GraficoLineaCredito;
