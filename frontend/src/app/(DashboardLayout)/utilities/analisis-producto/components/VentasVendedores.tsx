"use client";

import React, { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { Typography, Box, Modal } from "@mui/material";
import DashboardCard from "@/app/(DashboardLayout)/components/shared/DashboardCard";
import { ApexOptions } from "apexcharts";
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";
import { Filters } from "./HeaderProductos";

interface Props {
  filtros: Filters;
}

const VentasVendedor: React.FC<Props> = ({ filtros }) => {
  const [labels, setLabels] = useState<string[]>([]);
  const [chartData, setChartData] = useState<number[]>([]);
  const [showModal, setShowModal] = useState(false);

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (filtros.periodo) {
      params.append("periodo", filtros.periodo);
    } else {
      if (filtros.fechaInicio) params.append("fechaInicio", filtros.fechaInicio);
      if (filtros.fechaFin) params.append("fechaFin", filtros.fechaFin);
    }

    if (filtros.canal) params.append("canal", filtros.canal);
    if (filtros.itemCode) params.append("itemCode", filtros.itemCode);

    return params.toString();
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!filtros.itemCode || (!filtros.periodo && (!filtros.fechaInicio || !filtros.fechaFin))) {
        console.warn("⚠️ Filtros insuficientes:", filtros);
        return;
      }

      try {
        const query = buildQuery();
        const url = `${BACKEND_URL}/api/canal-vendedor?${query}`;
        console.log("🌐 URL solicitada:", url);
        console.log("🧩 Filtros enviados:", filtros);

        const response = await fetchWithToken(url);
        if (!response || !response.ok) {
          console.error("❌ Error en respuesta:", response?.status);
          return;
        }

        const data = await response.json();
        console.log("✅ Datos recibidos:", data);

        const nombres = data.map((d: any) => d.Nombre_Vendedor);
        const porcentajes = data.map((d: any) => Number(d.Porcentaje));

        setLabels(nombres);
        setChartData(porcentajes);
      } catch (error) {
        console.error("❌ Error al obtener datos de vendedores:", error);
        setLabels([]);
        setChartData([]);
      }
    };

    fetchData();
  }, [filtros]);

  const options: ApexOptions = {
    chart: {
      type: "donut",
      toolbar: { show: false },
    },
    labels: labels.slice(0, 10),
    colors: ["#1E88E5", "#43A047", "#FDD835", "#E53935", "#8E24AA", "#FB8C00", "#546E7A", "#00ACC1", "#C2185B", "#7E57C2"],
    tooltip: {
      y: {
        formatter: (val: number) => `${val.toFixed(1)}%`,
      },
    },
    legend: {
      position: "bottom",
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: { width: 250 },
          legend: { position: "bottom" },
        },
      },
    ],
  };

  return (
    <>
      <DashboardCard
        title="Vendedores"
        elevation={0}
        sx={{
          backgroundColor: "#fff",
          borderRadius: 2,
          border: "1px solid #e0e0e0",
          p: 0,
          height: 460,
        }}
      >
        {chartData.length > 0 ? (
          <>
            <Chart
              options={{ ...options, labels: labels.slice(0, 10) }}
              series={chartData.slice(0, 10)}
              type="donut"
              width="90%"
            />
            {labels.length > 10 && (
              <Typography
                align="center"
                onClick={() => setShowModal(true)}
                sx={{
                  mt: 1,
                  cursor: "pointer",
                  color: "#1E88E5",
                  fontSize: "0.85rem",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                Ver más
              </Typography>
            )}
          </>
        ) : (
          <Typography align="center" sx={{ mt: 10, fontSize: "0.9rem", color: "#777" }}>
            No hay datos para los filtros seleccionados.
          </Typography>
        )}
      </DashboardCard>

      {/* Modal con gráfico completo */}
      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "#fff",
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
            width: "90%",
            maxWidth: 900,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Participación de Vendedores
          </Typography>
          <Chart
            options={{ ...options, labels }}
            series={chartData}
            type="donut"
            width="100%"
          />
        </Box>
      </Modal>
    </>
  );
};

export default VentasVendedor;
