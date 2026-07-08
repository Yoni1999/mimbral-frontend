import { Box, Typography } from "@mui/material";
import { ReactNode } from "react";

interface Props {
  title: string;
  icon?: ReactNode;
  infoRight?: string; // NUEVA PROP
}

const SeccionTitulo: React.FC<Props> = ({ title, icon, infoRight }) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between", // Distribuye el contenido
        alignItems: "center",
        width: "100%",
        mb: { xs: 1, md: 2 },
        pl: { xs: 0.8, md: 1.2 },
        pr: { xs: 1, md: 2 },
        py: { xs: 0.25, md: 0.5 },
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
      {/* Lado izquierdo: línea + título + ícono */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          sx={{
            width: 4,
            height: { xs: 18, md: 24 },
            backgroundColor: "primary.main",
            borderRadius: 1,
          }}
        />

        <Typography
          variant="subtitle1"
          fontWeight="bold"
          color="text.primary"
          sx={{
            textTransform: "uppercase",
            letterSpacing: { xs: 0.5, md: 1 },
            fontSize: { xs: "0.85rem", md: "1rem" },
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

      {/* Lado derecho: info contextual */}
      {infoRight && (
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            fontStyle: "italic",
            display: { xs: "none", md: "block" },
          }}
        >
          {infoRight}
        </Typography>
      )}
    </Box>
  );
};

export default SeccionTitulo;
