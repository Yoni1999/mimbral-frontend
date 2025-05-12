import { Box, Typography } from "@mui/material";
import { ReactNode } from "react";

interface Props {
  title: string;
  icon?: ReactNode;
}

const SeccionTitulo: React.FC<Props> = ({ title, icon }) => {
  return (
    <Box
      sx={{
        display: "flex",
        elevation: 1,
        alignItems: "center",
        gap: 1.5,
        width: "100%",
        mb: 2,
        pl: 1.2,
        py: 0.5,
        borderRadius: 2,
        transition: "all 0.3s ease",
        cursor: "default",
        "&:hover": {
          boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
          backgroundColor: "#f9f9f9",
          transform: "translateY(-2px)",
        },
      }}
    >
      {/* Línea vertical decorativa */}
      <Box
        sx={{
          width: 4,
          height: 24,
          backgroundColor: "primary.main",
          borderRadius: 1,
        }}
      />

      {/* Título + ícono opcional */}
      <Typography
        variant="subtitle1"
        fontWeight="bold"
        color="text.primary"
        sx={{
          textTransform: "uppercase",
          letterSpacing: 1,
          transition: "color 0.3s ease",
          "&:hover": {
            color: "primary.main",
          },
        }}
      >
        {title}
      </Typography>

      {icon && <Box color="primary.main">{icon}</Box>}
    </Box>
  );
};

export default SeccionTitulo;
