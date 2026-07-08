import { Card, CardContent, Typography, Box, Avatar, Fab } from "@mui/material";
import { ReactNode } from "react";
import { IconArrowUpLeft, IconArrowDownRight, IconCurrencyDollar } from '@tabler/icons-react'; // Importación de íconos

interface MetricCardProps {
  title: string;
  value: string;
  description?: ReactNode;
  icon: ReactNode;
  percentageChange?: number;
  small?: boolean;
  onClick?: () => void;
}

const MetricCard = ({
  title,
  value,
  description,
  icon,
  percentageChange,
  small = false,
  onClick,
}: MetricCardProps) => {
  const isNegative = percentageChange !== undefined && percentageChange < 0;

  return (
    <Card
      sx={{
        elevation: 0,
        borderRadius: 2, // Borde más redondeado para un diseño más moderno
        boxShadow: 1, // Sombra más suave y profesional
        background: "#ffffff", // Fondo blanco
        border: "none",
        transition: "0.3s ease-in-out", 
        cursor: onClick ? "pointer" : "default",
        "&:hover": {
          transform: "translateY(-8px)", // Se mueve más al hacer hover para un efecto más impactante
          boxShadow: 1, // Aumenta la sombra en hover
        },
        height: small ? "200px" : "auto", // Ajuste de tamaño para tarjetas pequeñas
        position: "relative", // Necesario para el ícono flotante
      }}
      onClick={onClick}
    >
      <CardContent
        sx={{
          padding: small ? "16px" : "24px", // Espaciado cómodo en la tarjeta
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {/* 🔹 Icono */}
        <Box mb={2} sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Avatar
            sx={{
              bgcolor: "#1976d2", // Color de fondo azul para íconos
              color: "white",
              width: 50, // Íconos más grandes
              height: 50,
              borderRadius: "50%",
              boxShadow: 3, // Sombra sutil para el ícono
            }}
          >
            {icon}
          </Avatar>
        </Box>

        {/* 🔹 Título */}
        <Typography variant="h6" fontWeight="bold" color="text.primary" sx={{ fontSize: small ? "1rem" : "1.2rem" }}>
          {title}
        </Typography>

        {/* 🔹 Valor y % cambio */}
        <Box display="flex" alignItems="center" justifyContent="center" mt={2} flexWrap="wrap">
          <Typography variant={small ? "h6" : "h4"} fontWeight="bold" color="primary">
            {value}
          </Typography>

          {/* 🔹 Cambio porcentual */}
          {percentageChange !== undefined && (
            <Box
              display="flex"
              alignItems="center"
              color={isNegative ? "error.main" : "success.main"}
              ml={2}
              sx={{
                fontWeight: "bold",
                fontSize: small ? "0.8rem" : "1rem",
                display: "flex",
                alignItems: "center",
              }}
            >
              {isNegative ? <IconArrowDownRight width={20} color="#FF4C4C" /> : <IconArrowUpLeft width={20} color="#39B69A" />}
              {Math.abs(percentageChange)}%
            </Box>
          )}

        </Box>

        {/* 🔹 Descripción */}
        {description && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2, fontSize: small ? "0.8rem" : "0.9rem" }}>
            {description}
          </Typography>
        )}

        {/* 🔹 Ícono flotante de acción */}
        {percentageChange !== undefined && (
          <Fab
            color={isNegative ? "error" : "success"}
            size="small"
            sx={{
              position: "absolute",
              top: 10,
              right: 10,
              boxShadow: 3,
            }}
          >
            <IconCurrencyDollar width={20} />
          </Fab>
        )}

      </CardContent>
    </Card>
  );
};

export default MetricCard;



