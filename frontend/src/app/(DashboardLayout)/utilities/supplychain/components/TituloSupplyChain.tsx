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
    <Stack spacing={1}>
      {/* Línea superior: período activo */}
      <Box display="flex" justifyContent="flex-end">
        <Typography variant="subtitle2" color="text.secondary">
          Estás viendo el periodo:{" "}
          <Typography component="span" fontWeight={600} color="text.primary">
            {obtenerDescripcionPeriodo()}
          </Typography>
        </Typography>
      </Box>

      {/* Título + botón */}
      <Paper
        elevation={1}
        sx={{
          p: 3,
          borderRadius: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Typography variant="h5" fontWeight={700} color="text.primary">
          SUPPLY CHAIN DASHBOARD
        </Typography>

        <Button
          variant="outlined"
          startIcon={<FilterAltOutlined />}
          onClick={handleOpenDrawer}
          sx={{
            textTransform: "none",
            fontWeight: 500,
            px: 2.5,
            py: 1,
          }}
        >
          Filtros Avanzados
        </Button>
      </Paper>
    </Stack>
  );
};

export default TituloSupply;
