"use client";

import React from "react";
import { Box, Typography, Stack, Paper, Button } from "@mui/material";
import { FilterAltOutlined } from "@mui/icons-material";

interface Props {
  obtenerDescripcionPeriodo: () => string;
  handleOpenDrawer: () => void;
}

const TituloSupply: React.FC<Props> = ({
  obtenerDescripcionPeriodo,
  handleOpenDrawer,
}) => {
  return (
    <Stack spacing={{ xs: 0.5, md: 1 }}>
      {/* Línea superior: período activo */}
      <Box display="flex" justifyContent="flex-end">
        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{ fontSize: { xs: "0.7rem", md: "0.875rem" }, lineHeight: { xs: 1.3, md: 1.57 } }}
        >
          Estás viendo el periodo:{" "}
          <Typography
            component="span"
            fontWeight={600}
            color="text.primary"
            sx={{ fontSize: "inherit" }}
          >
            {obtenerDescripcionPeriodo()}
          </Typography>
        </Typography>
      </Box>

      {/* Título + botón */}
      <Paper
        elevation={1}
        sx={{
          p: { xs: 1.5, md: 3 },
          borderRadius: 3,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          backgroundColor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          flexWrap: "wrap",
          gap: { xs: 1, md: 2 },
        }}
      >
        <Button
          variant="outlined"
          startIcon={<FilterAltOutlined />}
          onClick={handleOpenDrawer}
          sx={{
            textTransform: "none",
            fontWeight: 500,
            px: { xs: 1.25, md: 2.5 },
            py: { xs: 0.4, md: 1 },
            fontSize: { xs: "0.78rem", md: "0.875rem" },
          }}
        >
          Filtros Avanzados
        </Button>
      </Paper>
    </Stack>
  );
};

export default TituloSupply;
