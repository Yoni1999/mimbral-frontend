"use client";
import React from "react";
import { Stack, Typography, Box, useMediaQuery, useTheme } from "@mui/material";
import Link from "next/link";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

const Header = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // 📱 Detecta celular

  return (
    <Box width="100%">
      <Stack
        direction={isMobile ? "column" : "row"} // 🧠 Cambio de layout en móvil
        justifyContent="space-between"
        alignItems={isMobile ? "flex-start" : "center"}
        spacing={isMobile ? 2 : 0}
        sx={{
          padding: "15px 20px",
          borderRadius: "8px",
          backgroundColor: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(10px)",
          flexWrap: "wrap",
        }}
      >
        {/* 🔹 Botón: Ir a App de Pricing */}
        <Box
          component="a"
          href="https://pricing.cmimbral.cl/"
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            px: 3,
            py: 1.5,
            borderRadius: "8px",
            backgroundColor: "primary.main",
            color: "#fff",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            textDecoration: "none",
            transition: "all 0.3s ease",
            "&:hover": {
              backgroundColor: "primary.dark",
              transform: "scale(1.03)",
              boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
            },
          }}
        >
          Ir a App de Pricing <OpenInNewIcon sx={{ fontSize: 18 }} />
        </Box>

        {/* 🔹 Enlace de registro */}
        <Typography
          variant="body1"
          color="textPrimary"
          sx={{
            textAlign: isMobile ? "left" : "right",
            fontSize: isMobile ? "0.95rem" : "1rem",
          }}
        >
          ¿Necesitas crear una cuenta?{" "}
          <Box
            component={Link}
            href="/authentication/register"
            sx={{
              color: "primary.main",
              fontWeight: "bold",
              textDecoration: "none",
              ml: 0.5,
              "&:hover": { textDecoration: "underline" },
            }}
          >
            Regístrate aquí
          </Box>
        </Typography>
      </Stack>
    </Box>
  );
};

export default Header;
