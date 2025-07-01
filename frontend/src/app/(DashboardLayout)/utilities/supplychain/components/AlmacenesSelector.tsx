"use client";

import React, { useState } from "react";
import { Box, Typography, Paper } from "@mui/material";
import { BiHome } from "react-icons/bi";

const almacenes = [
  { id: 1, nombre: "Almacén 1", color: "#5B67F0" },
  { id: 2, nombre: "Almacén 2", color: "#F36CA8" },
  { id: 3, nombre: "Almacén 3", color: "#1DD9D3" },
  { id: 4, nombre: "Almacén 4", color: "#A174F8" },
  { id: 5, nombre: "Almacén 5", color: "#6CB8F4" },
  { id: 6, nombre: "Almacén 6", color: "#FFD057" },
  { id: 7, nombre: "Almacén 7", color: "#5B67F0" },
  { id: 8, nombre: "Almacén 8", color: "#F36CA8" },
  { id: 10, nombre: "Almacén 10", color: "#1DD9D3" },
  { id: 12, nombre: "Almacén 12", color: "#A174F8" },
  { id: 13, nombre: "Almacén 13", color: "#6CB8F4" },
];

const AlmacenesSelector = () => {
  const [selectedAlmacen, setSelectedAlmacen] = useState<number | null>(null);

  // Define a consistent color for selection
  const selectionColor = "#B82222"; // Example: Material-UI's primary blue

  return (
    <Paper
      elevation={1}
      sx={{
        p: 0,
        borderRadius: 3,
        width: "100%",
        backgroundColor: "#fdfdfd",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      <Typography
        variant="subtitle1"
        fontWeight={600}
        color="text.primary"
        mb={2}
      >
        Almacenes
      </Typography>

      <Box
        sx={{
          display: "flex",
          overflowX: "auto",
          gap: 3,
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        {almacenes.map((almacen) => (
          <Box
            key={almacen.id}
            textAlign="center"
            sx={{
              cursor: "pointer",
              color:
                selectedAlmacen === almacen.id
                  ? selectionColor // Use the consistent selection color
                  : "text.secondary", // Default color when not selected
              flex: "1 1 auto",
              transition: "color 0.3s ease",
              "&:hover": {
                color: selectedAlmacen === almacen.id ? selectionColor : almacen.color, // Hover color: maintain selection color if selected, otherwise use original almacen color
              },
            }}
            onClick={() => {
              // Toggle selection: if already selected, deselect; otherwise, select
              setSelectedAlmacen(
                selectedAlmacen === almacen.id ? null : almacen.id
              );
            }}
          >
            <BiHome size={32} />
            <Typography variant="body2" fontWeight={500}>
              33%
            </Typography>
            <Typography variant="caption">{almacen.nombre}</Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default AlmacenesSelector;