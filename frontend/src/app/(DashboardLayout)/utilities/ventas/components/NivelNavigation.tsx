'use client';

import React from "react";
import { Box, Chip } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";

const niveles = [
  { label: "Resumen Ventas", path: "/utilities/ventas/resumen-ventas" },
  { label: "Ventas por Canal", path: "/utilities/ventas/ventas-por-canal" },
  { label: "Ventas por Vendedor", path: "/utilities/ventas/ventas-por-vendedor" },
];

const NivelNavigation = () => {
  const pathname = usePathname();

  return (
    <Box
      sx={{
        display: "flex",
        gap: 1,
        padding: "8px 24px",
        backgroundColor: "transparent",
        flexWrap: "wrap",
      }}
    >
      {niveles.map((nivel) => {
        const isActive = pathname.includes(nivel.path);
        return (
          <Link href={nivel.path} key={nivel.label} passHref>
            <Chip
              label={nivel.label}
              clickable
              variant={isActive ? "filled" : "outlined"}
              sx={{
                borderRadius: "16px",
                backgroundColor: isActive ? "#5d87ff" : "transparent",
                color: isActive ? "#fff" : "#5d87ff",
                border: isActive ? "none" : "1px solid #5d87ff",
                fontWeight: 500,
                "&:hover": {
                  backgroundColor: isActive ? "#4c76e8" : "#e3f0ff",
                },
              }}
            />
          </Link>
        );
      })}
    </Box>
  );
};

export default NivelNavigation;
