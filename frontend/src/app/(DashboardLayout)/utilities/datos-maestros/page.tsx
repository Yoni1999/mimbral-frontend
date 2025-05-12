"use client";

import { useEffect, useState } from "react";
import {
  IconChartBar,
  IconPackages,
  IconCurrencyDollar,
  IconThumbUp,
} from "@tabler/icons-react";
import MetricCard from "./components/MetricCard";
import { useRouter } from "next/navigation";
import { Grid, Typography, Box } from "@mui/material";
import { fetchWithToken } from "@/utils/fetchWithToken"; // 👈 asegúrate de importar esto

interface VentasMesData {
  VentasMesActual: number;
  VentasMismoPeriodoMesAnterior: number;
  PorcentajeCambio: number;
}

interface MargenData {
  Año: number;
  Porcentaje_Margen: number;
  Variacion_Respecto_Anterior: number;
}

export default function DatosMaestros() {
  const router = useRouter();

  const [ventasMes, setVentasMes] = useState<VentasMesData>({
    VentasMesActual: 0,
    VentasMismoPeriodoMesAnterior: 0,
    PorcentajeCambio: 0,
  });

  const [margen, setMargen] = useState<MargenData>({
    Año: 2025,
    Porcentaje_Margen: 0,
    Variacion_Respecto_Anterior: 0,
  });

  // ✅ Ahora usamos fetchWithToken
  const fetchData = async (endpoint: string, setData: (data: any) => void) => {
    try {
      const response = await fetchWithToken(`http://192.168.0.118:3001/api/${endpoint}`);
      if (!response){
        console.error('No se pueden obtener los datos de ${endpoint}');
        return
      }
      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error(`❌ Error al obtener datos de ${endpoint}:`, error);
    }
  };

  useEffect(() => {
    fetchData("ventas-mes", setVentasMes);
    fetchData("margen", (data: MargenData[]) => {
      const añoActual = 2025;
      const margenActual = data.find((item) => item.Año === añoActual);
      if (margenActual) setMargen(margenActual);
    });
  }, []);

  const formatCurrency = (val: number) => {
    const millones = val / 1_000_000;
    return `$${millones.toFixed(1)}M`;
  };

  const formatPercentage = (val: number) => `${val.toFixed(1)}%`;

  const getCambioColor = (valor: number) =>
    valor >= 0 ? "text-green-600" : "text-red-600";

  return (
    <Box sx={{ p: 4, textAlign: "center" }}>
      <Typography variant="h5" fontWeight="bold" mb={2}>
        Selecciona la KPI que quieres analizar
      </Typography>

      <Grid container spacing={2} justifyContent="center">
        <Grid item xs={12} sm={6}>
          <MetricCard
            title="Ventas"
            value={formatCurrency(ventasMes.VentasMesActual)}
            description={`${ventasMes.PorcentajeCambio >= 0 ? "+" : ""}${ventasMes.PorcentajeCambio}% vs mes anterior`}
            icon={<IconChartBar size={32} className="text-blue-600" />}
            onClick={() => router.push("/utilities/datos-maestros/productos-ventas")}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <MetricCard
            title="Inventario"
            value="325 SKUs"
            description="24 en quiebre"
            icon={<IconPackages size={32} className="text-green-600" />}
            onClick={() => router.push("/utilities/datos-maestros/inventario")}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <MetricCard
            title="Rentabilidad"
            value={formatPercentage(margen.Porcentaje_Margen)}
            description={
              <span className={getCambioColor(margen.Variacion_Respecto_Anterior)}>
                {margen.Variacion_Respecto_Anterior >= 0 ? "+" : ""}
                {margen.Variacion_Respecto_Anterior}% vs año anterior
              </span>
            }
            icon={<IconCurrencyDollar size={32} className="text-yellow-600" />}
            onClick={() => router.push("/utilities/datos-maestros/rentabilidad")}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <MetricCard
            title="Calidad y Servicio"
            value="98% OK"
            description="2 reclamos este mes"
            icon={<IconThumbUp size={32} className="text-red-600" />}
            onClick={() => router.push("/productos/calidad")}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
