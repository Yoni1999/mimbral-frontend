'use client';

import React from "react";
import { Box, Chip } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";

const niveles = [
  { label: "Metas", path: "/metas" },
  { label: "Análitica", path: "/metas/crear-periodo" },
  { label: "Metas sin asignar", path: "metas/crear-meta" },
];

const NivelNavigation = () => {
  const pathname = usePathname();

  return (
    <Box
      sx={{
        display: "flex",
        gap: { xs: 0.75, md: 1 },
        padding: { xs: "4px 0", md: "8px" },
        backgroundColor: "transparent",
        flexWrap: "wrap",
      }}
    >
      {niveles.map((nivel) => {
        const isActive = pathname?.includes(nivel.path) ?? false;
        return (
          <Link href={nivel.path} key={nivel.label} passHref>
            <Chip
              label={nivel.label}
              clickable
              variant={isActive ? "filled" : "outlined"}
              sx={{
                borderRadius: "16px",
                height: { xs: 26, md: 32 },
                fontSize: { xs: "0.75rem", md: "0.8125rem" },
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
