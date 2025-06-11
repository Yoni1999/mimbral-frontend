"use client";
import React from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Box,
  Breadcrumbs,
  Chip,
} from "@mui/material";
import { emphasize, styled } from "@mui/material/styles";
import HomeIcon from "@mui/icons-material/Home";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

// Etiquetas personalizadas para los segmentos de la URL
const customLabels: Record<string, string> = {
  utilities: "Analisa tus ventas",
  ventas: "Ventas",
  "ventas-por-canal": "Ventas por Canal",
  "crear-usuario": "Crear Usuario",
  "resumen-categorias": "Primer Nivel",
  "resumen2nivel": "Categorías",
  "resumen3nivel": "Subcategorías",
  opciones: "Opciones",
  usuarios: "Usuarios",
  roles: "Roles",
  permisos: "Permisos",
  admin: "Administrador",
  inicio: "Dashboard",
};

// Estilo visual como Chip personalizado
const StyledBreadcrumb = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.grey[100],
  height: theme.spacing(3),
  color: theme.palette.text.primary,
  fontWeight: theme.typography.fontWeightRegular,
  '&:hover, &:focus': {
    backgroundColor: emphasize(theme.palette.grey[100], 0.06),
    ...theme.applyStyles?.("dark", {
      backgroundColor: emphasize(theme.palette.grey[800], 0.06),
    }),
  },
  '&:active': {
    boxShadow: theme.shadows[1],
    backgroundColor: emphasize(theme.palette.grey[100], 0.12),
    ...theme.applyStyles?.("dark", {
      backgroundColor: emphasize(theme.palette.grey[800], 0.12),
    }),
  },
  ...theme.applyStyles?.("dark", {
    backgroundColor: theme.palette.grey[800],
  }),
})) as typeof Chip;

const AdminBreadcrumb = () => {
  const pathname = usePathname();
  const router = useRouter();
  const pathSegments = pathname.split("/").filter(Boolean);

  const formatLabel = (segment: string) =>
    customLabels[decodeURIComponent(segment)] || segment.replace(/-/g, " ");

  const handleInicioClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push("/inicio");
  };

  return (
    <Box py={1.5} px={3} sx={{ backgroundColor: "#FEFEFE" }}>
      <Breadcrumbs
        separator={<ChevronRightIcon fontSize="small" sx={{ color: "#bdbdbd" }} />}
        aria-label="breadcrumb"
      >
        {/* Inicio clickeable */}
        <StyledBreadcrumb
          label="Inicio"
          icon={<HomeIcon fontSize="small" />}
          component="a"
          href="/inicio"
          onClick={handleInicioClick}
        />

        {/* Resto no clickeables y omitir 'utilities' */}
        {pathSegments.map((segment, index) => {
          if (segment === "utilities") return null;
          const label = formatLabel(segment);
          return (
            <StyledBreadcrumb
              key={index}
              label={label}
              // Desactivado: no clickeable
              sx={{ pointerEvents: "none", cursor: "default" }}
            />
          );
        })}
      </Breadcrumbs>
    </Box>
  );
};

export default AdminBreadcrumb;
