import { Card, CardContent, Typography, Box, Skeleton } from "@mui/material";
import { IconArrowUpRight, IconArrowDownRight } from "@tabler/icons-react";

const MetricCard = ({
  title,
  value,
  subtitle,
  percentageChange,
  icon,
  elevation = 0, // Elevación por defecto
  cargando = false,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  percentageChange?: number;
  icon?: React.ReactNode;
  elevation?: number;
  /** Mientras llegan los datos del filtro actual: sin valor viejo ni ceros. */
  cargando?: boolean;
}) => {
  const isNegative = percentageChange !== undefined && percentageChange < 0;

  return (
    <Card
      elevation={elevation}
      sx={{
        borderRadius: 2,
        border: "1px solid #e0e0e0",
        transition: "0.3s",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: elevation < 1 ? elevation + 2 : elevation,
        },
      }}
    >
      <CardContent>
        {/* 🔹 Título con ícono */}
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: "rgba(41, 98, 255, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "primary.main",
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Typography variant="subtitle2" color="text.secondary" fontWeight="bold">
            {title}
          </Typography>
        </Box>

        {/* 🔹 Valor + Porcentaje */}
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              letterSpacing: "-0.5px",
              color: "text.primary",
              lineHeight: 1.2,
            }}
          >
            {cargando ? <Skeleton width={120} /> : value}
          </Typography>

          {!cargando && percentageChange !== undefined && (
            <Box
              px={1}
              py={0.3}
              ml={1}
              borderRadius={12}
              bgcolor={isNegative ? "error.light" : "success.light"}
              color={isNegative ? "error.main" : "success.main"}
              fontSize="0.8rem"
              fontWeight="bold"
              display="flex"
              alignItems="center"
            >
              {isNegative ? <IconArrowDownRight size={16} /> : <IconArrowUpRight size={16} />}
              &nbsp;{Math.abs(percentageChange).toFixed(2)}%
            </Box>
          )}
        </Box>

        {/* 🔹 Subtítulo estilizado */}
        {cargando ? (
          <Skeleton width="60%" sx={{ mt: 1.5 }} />
        ) : subtitle && (
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              fontStyle: "italic",
              fontWeight: 400,
              mt: 1.5,
              pl: 0.5,
              fontSize: "0.85rem",
            }}
          >
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard;
