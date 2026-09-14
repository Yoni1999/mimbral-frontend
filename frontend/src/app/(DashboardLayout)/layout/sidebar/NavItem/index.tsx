import React from "react";
import {
  Box,
  ListItemIcon,
  ListItem,
  List,
  styled,
  ListItemText,
  useTheme,
  ListItemButton,
  Collapse,
  Tooltip,
} from "@mui/material";
import Link from "next/link";
import { IconChevronDown, IconChevronRight } from "@tabler/icons-react";

type NavGroup = {
  id?: string;
  title?: string;
  icon?: any;
  href?: string;
  subMenu?: NavGroup[];
  onClick?: React.MouseEvent<HTMLButtonElement, MouseEvent>;
};

interface ItemType {
  item: NavGroup;
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
  pathDirect: string;
  isOpen: boolean;
  /** Riel angosto (solo iconos + tooltip): el rotulo y el submenu en linea no
   * caben ahi. Pasar el mouse sobre TODO el sidebar ya lo expande antes de que
   * se pueda hacer click, asi que ni el click ni el submenu necesitan un
   * comportamiento distinto -solo se oculta el texto. */
  collapsed?: boolean;
}

/** Activo = ruta exacta, o la ruta actual "vive dentro" de esta sección
 *  (ej. href="/metas/periodos" activo también en "/metas/periodos/nuevo"). */
function esRutaActiva(href: string | undefined, pathDirect: string): boolean {
  if (!href) return false;
  return pathDirect === href || pathDirect.startsWith(`${href}/`);
}

// NavItem.tsx
const NavItem = ({ item, pathDirect, onClick, isOpen, collapsed }: ItemType) => {
  const theme = useTheme();
  const activo = esRutaActiva(item.href, pathDirect);
  const hijoActivo = item.subMenu?.some((child) => esRutaActiva(child.href, pathDirect)) ?? false;

  const ListItemStyled = styled(ListItem)(() => ({
    padding: 0,
    ".MuiButtonBase-root": {
      whiteSpace: "normal",
      marginBottom: "2px",
      padding: "10px 12px",
      borderRadius: "10px",
      backgroundColor: "inherit",
      color: "#475569",
      alignItems: "flex-start",
      justifyContent: collapsed ? "center" : "flex-start",
      "&:hover": {
        backgroundColor: theme.palette.action.hover,
        color: theme.palette.text.primary,
      },
      "&.Mui-selected": {
        color: "white",
        backgroundColor: theme.palette.primary.main,
        "&:hover": {
          backgroundColor: theme.palette.primary.main,
          color: "white",
        },
      },
    },
  }));

  const icon = (
    <ListItemIcon sx={{ minWidth: collapsed ? "auto" : "34px", p: "2px 0", mt: "1px", color: "inherit" }}>
      {item.icon && <item.icon size={20} stroke={1.75} />}
    </ListItemIcon>
  );

  const label = !collapsed && (
    <ListItemText
      primaryTypographyProps={{ fontSize: "0.9rem", fontWeight: 500, lineHeight: 1.3 }}
      sx={{ my: 0 }}
    >
      {item.title}
    </ListItemText>
  );

  const button =
    item.subMenu && item.subMenu.length > 0 ? (
      <ListItemButton onClick={onClick} selected={hijoActivo}>
        {icon}
        {label}
        {!collapsed && (
          <Box sx={{ color: hijoActivo ? "inherit" : "#94a3b8", display: "flex", alignItems: "center", mt: "3px" }}>
            {isOpen ? <IconChevronDown size={16} /> : <IconChevronRight size={16} />}
          </Box>
        )}
      </ListItemButton>
    ) : (
      <ListItemButton component={Link} href={item.href || "#"} onClick={onClick} selected={activo}>
        {icon}
        {label}
      </ListItemButton>
    );

  return (
    <>
      <List component="div" disablePadding key={item.id}>
        <ListItemStyled>
          {collapsed ? (
            <Tooltip title={item.title || ""} placement="right">
              <Box sx={{ width: "100%" }}>{button}</Box>
            </Tooltip>
          ) : (
            button
          )}
        </ListItemStyled>
      </List>
      {!collapsed && item.subMenu && item.subMenu.length > 0 && (
        <Collapse in={isOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding sx={{ mb: 0.5 }}>
            {item.subMenu.map((child) => {
              const childActivo = esRutaActiva(child.href, pathDirect);
              return (
                <ListItemButton
                  key={child.id}
                  component={Link}
                  href={child.href || "#"}
                  selected={childActivo}
                  sx={{
                    pl: 5,
                    pr: 1.5,
                    py: "8px",
                    borderRadius: "10px",
                    mb: "2px",
                    color: "#64748b",
                    backgroundColor: "transparent",
                    "&:hover": {
                      backgroundColor: theme.palette.action.hover,
                      color: theme.palette.text.primary,
                    },
                    // MUI aplica su propio ".Mui-selected" con más
                    // especificidad (dos clases) que un backgroundColor plano
                    // en sx (una clase) — sin este anidado, el gris
                    // translúcido por defecto de MUI le ganaba al navy
                    // pensado para "seleccionado" y quedaba casi invisible.
                    "&.Mui-selected": {
                      color: "white",
                      backgroundColor: theme.palette.primary.main,
                      "&:hover": {
                        backgroundColor: theme.palette.primary.main,
                        color: "white",
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: "30px", p: "2px 0", color: "inherit" }}>
                    {child.icon && <child.icon size={17} stroke={1.75} />}
                  </ListItemIcon>
                  <ListItemText primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 500 }}>
                    {child.title}
                  </ListItemText>
                </ListItemButton>
              );
            })}
          </List>
        </Collapse>
      )}
    </>
  );
};
export default NavItem;
