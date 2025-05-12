import React from "react";
import { Stack, Typography, Divider, Box } from "@mui/material";
import Link from "next/link";

const Header = () => {
  return (
    <Box width="75%">
      <Stack
        direction="row" // 🔹 Alineación horizontal
        justifyContent="flex-start" // 🔹 Alineado a la izquierda
        alignItems="center"
        spacing={1} // 🔹 Espaciado entre elementos
        sx={{
          padding: "15px 20px", // 🔹 Espaciado interno
          borderRadius: "8px", // 🔹 Bordes redondeados
          backgroundColor: "rgba(255, 255, 255, 0.8)", // 🔹 Fondo con transparencia
          backdropFilter: "blur(10px)", // 🔹 Suaviza el fondo (efecto vidrio)
        }}
      >
        <Typography variant="body1" fontWeight="500" color="textPrimary">
          ¿Necesitas crear una cuenta?
        </Typography>
        <Typography
          component={Link}
          href="/authentication/register"
          sx={{
            textDecoration: "none",
            color: "primary.main",
            fontWeight: "bold",
            "&:hover": { textDecoration: "underline" },
          }}
        >
          Regístrate aquí
        </Typography>
      </Stack>
    </Box>
  );
};

export default Header;
