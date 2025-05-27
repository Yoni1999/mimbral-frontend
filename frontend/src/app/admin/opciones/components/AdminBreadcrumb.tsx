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

// Etiquetas personalizadas para los segmentos de la URL
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
  inicio: "Dashboard",
};

// Submenús por segmento
const subMenus: Record<
  string,
  {
    label: string;
    path?: string;
    children?: { label: string; path: string }[];
  }[]
> = {
  utilities: [
    {
      label: "Ventas",
      children: [
        { label: "Resumen Ventas", path: "/utilities/ventas/resumen-ventas" },
        { label: "Ventas por Canal", path: "/utilities/ventas/ventas-por-canal" },
        { label: "Ventas por Vendedor", path: "/utilities/ventas/ventas-por-vendedor" },
      ],
    },
    {
      label: "Análisis por Categoría",
      path: "/utilities/analisis-categoria/resumen-categorias",
    },
    {
      label: "Análisis por Producto",
      path: "/utilities/analisis-producto",
    },
  ],
};

const AdminBreadcrumb = () => {
  const pathname = usePathname();
  const router = useRouter();
  const pathSegments = pathname.split("/").filter(Boolean);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const [subAnchorEl, setSubAnchorEl] = useState<null | HTMLElement>(null);
  const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);

  const buildPath = (index: number) => "/" + pathSegments.slice(0, index + 1).join("/");

  const formatLabel = (segment: string) =>
    customLabels[decodeURIComponent(segment)] || segment.replace(/-/g, " ");

  const handleOpenSubMenu = (event: React.MouseEvent<HTMLElement>, segment: string) => {
    setAnchorEl(event.currentTarget);
    setActiveSegment(segment);
  };

  const handleCloseSubMenu = () => {
    setAnchorEl(null);
    setActiveSegment(null);
    setSubAnchorEl(null);
    setActiveSubMenu(null);
  };

  const handleSubItemClick = (path: string) => {
    router.push(path);
    handleCloseSubMenu();
  };

  return (
    <Box py={1.5} px={3} sx={{ backgroundColor: "#FEFEFE" }}>
      <Breadcrumbs
        separator={<ChevronRightIcon fontSize="small" sx={{ color: "#bdbdbd" }} />}
        aria-label="breadcrumb"
        sx={{
          fontSize: "0.95rem",
          color: "text.secondary",
        }}
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
                    e.preventDefault();
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
                  anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                  transformOrigin={{ vertical: "top", horizontal: "left" }}
                  MenuListProps={{ onMouseLeave: handleCloseSubMenu }}
                  sx={{
                    "& .MuiPaper-root": {
                      borderRadius: 2,
                      minWidth: 220,
                      boxShadow: "0px 6px 20px rgba(0, 0, 0, 0.12)",
                      border: "1px solid #e0e0e0",
                      py: 1,
                    },
                  }}
                >
                  {subMenus[segment].map((item) => (
                    <Box
                      key={item.label}
                      onMouseEnter={
                        item.children
                          ? (e) => {
                              setSubAnchorEl(e.currentTarget);
                              setActiveSubMenu(item.label);
                            }
                          : undefined
                      }
                      onMouseLeave={() => {
                        setSubAnchorEl(null);
                        setActiveSubMenu(null);
                      }}
                    >
                      <MenuItem
                        onClick={
                          item.path ? () => handleSubItemClick(item.path!) : undefined
                        }
                        sx={{
                          fontWeight: 500,
                          fontSize: "0.95rem",
                          px: 2.5,
                          py: 1.2,
                          transition: "all 0.2s",
                          "&:hover": {
                            backgroundColor: "#f0f4ff",
                            color: "primary.main",
                            pl: 3,
                          },
                        }}
                      >
                        {item.label}
                      </MenuItem>

                      {item.children && activeSubMenu === item.label && (
                        <Menu
                          anchorEl={subAnchorEl}
                          open={Boolean(subAnchorEl)}
                          onClose={() => setSubAnchorEl(null)}
                          anchorOrigin={{ vertical: "top", horizontal: "right" }}
                          transformOrigin={{ vertical: "top", horizontal: "left" }}
                          MenuListProps={{ onMouseLeave: () => setSubAnchorEl(null) }}
                          sx={{
                            "& .MuiPaper-root": {
                              borderRadius: 2,
                              minWidth: 200,
                              boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.08)",
                              border: "1px solid #e0e0e0",
                              py: 1,
                            },
                          }}
                        >
                          {item.children.map((child) => (
                            <MenuItem
                              key={child.path}
                              onClick={() => handleSubItemClick(child.path)}
                              sx={{
                                fontSize: "0.85rem",
                                pl: 3,
                                py: 1.1,
                                "&:hover": {
                                  backgroundColor: "#f7faff",
                                  color: "primary.main",
                                },
                              }}
                            >
                              {child.label}
                            </MenuItem>
                          ))}
                        </Menu>
                      )}
                    </Box>
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
