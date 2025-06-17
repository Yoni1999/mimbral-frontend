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
  "resumen3nivel": "Sub-Categorías",
  opciones: "Opciones",
  usuarios: "Usuarios",
  roles: "Roles",
  permisos: "Permisos",
  admin: "Administrador",
  inicio: "Dashboard",
  "analisis-producto1.1": "Análisis por Producto",
  "metas-general": "Inspección de Metas Comerciales", 

};

// Segmentos que NO deben ser clickeables
const nonClickableSegments = ["ventas", "informes", "analisis-categoria"];

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

        {/* Segmentos personalizados */}
        {pathSegments.map((segment, index) => {
          if (segment === "utilities") return null;

          const label = formatLabel(segment);
          const fullPath = "/" + pathSegments.slice(0, index + 1).join("/");
          const isNonClickable = nonClickableSegments.includes(segment);

          return (
            <StyledBreadcrumb
              key={index}
              label={label}
              {...(!isNonClickable
                ? {
                    component: "a",
                    href: fullPath,
                    onClick: (e: React.MouseEvent) => {
                      e.preventDefault();
                      router.push(fullPath);
                    },
                  }
                : {
                    sx: {
                      pointerEvents: "none",
                      cursor: "default",
                      color: "#9e9e9e",
                      fontStyle: "italic",
                    },
                  })}
            />
          );
        })}
      </Breadcrumbs>
    </Box>
  );
};

export default AdminBreadcrumb;
// Este componente Breadcrumb muestra una navegación jerárquica basada en la URL actual.