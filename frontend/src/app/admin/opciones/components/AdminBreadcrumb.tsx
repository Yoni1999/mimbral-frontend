"use client";
import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Box,
  Breadcrumbs,
  Typography,
  Link as MuiLink,
  Menu,
  MenuItem,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

// Nombres personalizados para mostrar
const customLabels: Record<string, string> = {
  utilities: "Inventario y Abastecimiento",
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
  inicio: "Dasboard",
};

// Submenús por segmento de ruta
const subMenus: Record<string, { label: string; path: string }[]> = {
  utilities: [
    { label: "Análisis de Quiebre", path: "/utilities/analisis-quiebre"},
    { label: "Ventas", path: "/utilities/ventas" },
    { label: "Datos Maestros", path: "/utilities/datos-maestros" },
  ],
};

const AdminBreadcrumb = () => {
  const pathname = usePathname();
  const router = useRouter();
  const pathSegments = pathname.split("/").filter(Boolean);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activeSegment, setActiveSegment] = useState<string | null>(null);

  const buildPath = (index: number) => {
    return "/" + pathSegments.slice(0, index + 1).join("/");
  };

  const formatLabel = (segment: string) => {
    const decoded = decodeURIComponent(segment);
    return customLabels[decoded] || decoded.replace(/-/g, " ");
  };

  const handleOpenSubMenu = (
    event: React.MouseEvent<HTMLElement>,
    segment: string
  ) => {
    setAnchorEl(event.currentTarget);
    setActiveSegment(segment);
  };

  const handleCloseSubMenu = () => {
    setAnchorEl(null);
    setActiveSegment(null);
  };

  const handleSubItemClick = (path: string) => {
    router.push(path);
    handleCloseSubMenu();
  };

  return (
    <Box
      py={1.5}
      px={3}
      sx={{
        backgroundColor: "#f0f0f0",
      }}
    >
      <Breadcrumbs
        separator={<ChevronRightIcon fontSize="small" sx={{ color: "#9e9e9e" }} />}
        aria-label="breadcrumb"
        sx={{ fontSize: "0.9rem" }}
      >
        <MuiLink
          underline="hover"
          color="inherit"
          href="/inicio"
          sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
        >
          <HomeIcon fontSize="small" />
          Inicio
        </MuiLink>

        {pathSegments.map((segment, index) => {
          const path = buildPath(index);
          const label = formatLabel(segment);
          const isLast = index === pathSegments.length - 1;
          const hasSubMenu = subMenus[segment];

          if (hasSubMenu && !isLast) {
            return (
              <Box
                key={index}
                onMouseEnter={(e) => handleOpenSubMenu(e, segment)}
                onMouseLeave={handleCloseSubMenu}
                sx={{ display: "inline-block" }}
              >
                <MuiLink
                  underline="hover"
                  color="inherit"
                  href={path}
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(path);
                  }}
                  sx={{
                    cursor: "pointer",
                    textTransform: "capitalize",
                    fontWeight: 500,
                  }}
                >
                  {label}
                </MuiLink>

                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl) && activeSegment === segment}
                  onClose={handleCloseSubMenu}
                  MenuListProps={{ onMouseLeave: handleCloseSubMenu }}
                  anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                  transformOrigin={{ vertical: "top", horizontal: "left" }}
                  sx={{
                    "& .MuiPaper-root": {
                      borderRadius: 2,
                      minWidth: 200,
                      boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
                      mt: 1,
                    },
                  }}
                >
                  {subMenus[segment].map((item) => (
                    <MenuItem
                      key={item.path}
                      onClick={() => handleSubItemClick(item.path)}
                      sx={{
                        fontSize: "0.9rem",
                        py: 1,
                        px: 2,
                        transition: "all 0.2s ease",
                        "&:hover": {
                          backgroundColor: "#f0f4ff",
                          color: "primary.main",
                          pl: 2.5,
                        },
                      }}
                    >
                      {item.label}
                    </MenuItem>
                  ))}
                </Menu>

              </Box>
            );
          }

          return isLast ? (
            <Typography
              key={index}
              color="text.primary"
              sx={{ fontWeight: 500, textTransform: "capitalize" }}
            >
              {label}
            </Typography>
          ) : (
            <MuiLink
              key={index}
              underline="hover"
              color="inherit"
              href={path}
              sx={{ textTransform: "capitalize" }}
            >
              {label}
            </MuiLink>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
};

export default AdminBreadcrumb;

