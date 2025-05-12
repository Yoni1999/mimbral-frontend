import { Card, CardContent, Typography, Box } from "@mui/material";
import { ReactNode } from "react";

interface UsuarioKpiCardProps {
  title: string;
  value: number;
  icon?: ReactNode;
  color?: string;
  onClick?: () => void;
}

const UsuarioKpiCard = ({
  title,
  value,
  icon,
  color = "#1976d2",
  onClick,
}: UsuarioKpiCardProps) => {
  return (
    <Card
      sx={{
        borderRadius: 1,
        boxShadow: 1,
        background: "#ffffff",
        border: "1px solid #e0e0e0",
        transition: "0.2s",
        cursor: onClick ? "pointer" : "default",
        "&:hover": { transform: "translateY(-3px)", boxShadow: 4 },
      }}
      onClick={onClick}
    >
      <CardContent
        sx={{
          p: 2,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {/* Icono (opcional) */}
        {icon && <Box mb={1}>{icon}</Box>}

        {/* Título */}
        <Typography
          variant="subtitle1"
          fontWeight="bold"
          color="text.secondary"
          sx={{ fontSize: "1rem" }}
        >
          {title}
        </Typography>

        {/* Valor numérico */}
        <Typography
          variant="h4"
          fontWeight="bold"
          color={color}
          mt={0.5}
        >
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default UsuarioKpiCard;
