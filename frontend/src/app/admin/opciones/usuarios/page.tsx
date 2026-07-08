"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Typography } from "@mui/material";
import TablaUsuarios from "./components/TablaUsuarios";

const UsuariosAdminPage = () => {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const rol = localStorage.getItem("rol");
    if (rol === "admin") {
      setIsAuthorized(true);
    } else {
      router.push("/no-autorizado");
    }
  }, [router]);

  if (!isAuthorized) return null;

  return (
    <>
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <Typography variant="h4" fontWeight="bold" mb={2}>
          Administración de Usuarios
        </Typography>
        <TablaUsuarios />
      </Box>
    </>
  );
};

export default UsuariosAdminPage;
