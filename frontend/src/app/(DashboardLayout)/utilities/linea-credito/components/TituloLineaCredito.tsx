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
    <Stack spacing={{ xs: 0.5, md: 1 }}>
      <Box display="flex" justifyContent="flex-end">
        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{ fontSize: { xs: "0.7rem", md: "0.875rem" }, lineHeight: { xs: 1.3, md: 1.57 } }}
        >
          Estás viendo el periodo: <strong>{obtenerDescripcionPeriodo()}</strong>
        </Typography>
      </Box>

      <Paper
        elevation={1}
        sx={{
          p: { xs: 1.5, md: 3 },
          borderRadius: 3,
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          flexWrap: "wrap",
          gap: { xs: 1, md: 2 },
          backgroundColor: "background.paper",
          border: "1px solid",
          borderColor: "divider"
        }}
      >
        <MuiButton
          variant="outlined"
          startIcon={<FilterAltOutlined />}
          onClick={handleOpenDrawer}
          sx={{
            textTransform: "none",
            fontWeight: 500,
            fontSize: { xs: "0.78rem", md: "0.875rem" },
            py: { xs: 0.4, md: 0.75 },
            px: { xs: 1.25, md: 2 },
          }}
        >
          Filtros Avanzados
        </MuiButton>
      </Paper>
    </Stack>
  );
};

export default HeaderLineaCredito;
