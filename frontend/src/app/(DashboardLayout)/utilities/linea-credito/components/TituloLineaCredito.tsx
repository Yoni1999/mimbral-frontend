"use client";

import React from "react";
import { Box, Typography, Stack, Paper } from "@mui/material";
import { FilterAltOutlined } from "@mui/icons-material";
import MuiButton from "@mui/material/Button";

interface Props {
  obtenerDescripcionPeriodo: () => string;
  handleOpenDrawer: () => void;
}

const HeaderLineaCredito: React.FC<Props> = ({ obtenerDescripcionPeriodo, handleOpenDrawer }) => {
  return (
    <Stack spacing={1}>
      <Box display="flex" justifyContent="flex-end">
        <Typography variant="subtitle2" color="text.secondary">
          Estás viendo el periodo: <strong>{obtenerDescripcionPeriodo()}</strong>
        </Typography>
      </Box>

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
          borderColor: "divider"
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700} color="text.primary">
            LÍNEA DE CRÉDITO CLIENTES
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Visualiza, filtra y analiza los datos financieros de tus clientes.
          </Typography>
        </Box>

        <MuiButton
          variant="outlined"
          startIcon={<FilterAltOutlined />}
          onClick={handleOpenDrawer}
          sx={{ textTransform: "none", fontWeight: 500 }}
        >
          Filtros Avanzados
        </MuiButton>
      </Paper>
    </Stack>
  );
};

export default HeaderLineaCredito;
