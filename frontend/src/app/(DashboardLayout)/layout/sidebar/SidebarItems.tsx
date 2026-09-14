// SidebarItems.tsx

import React, { useEffect, useState } from "react";
import Menuitems from "./MenuItems";
import { usePathname } from "next/navigation";
import { Box, List } from "@mui/material";
import NavItem from "./NavItem";
import NavGroup from "./NavGroup/NavGroup";

function esRutaActiva(href: string | undefined, pathDirect: string): boolean {
  if (!href) return false;
  return pathDirect === href || pathDirect.startsWith(`${href}/`);
}

/** ids de los items con subMenu que contienen la ruta actual — para que, por
 *  ejemplo, entrar directo a /metas/periodos por URL abra "Administrador de
 *  Metas" solo, sin depender de que el usuario haya hecho click. */
function idsConHijoActivo(pathDirect: string): string[] {
  return Menuitems.filter(
    (item) => item.subMenu?.some((child) => esRutaActiva(child.href, pathDirect))
  ).map((item) => item.id || "default-id");
}

// SidebarItems.tsx
const SidebarItems = ({ collapsed = false }: { collapsed?: boolean }) => {
  const pathname = usePathname();
  const pathDirect = pathname ?? "";

  // Estado para manejar la apertura de submenús. Arranca ya expandido en el
  // que corresponda a la ruta actual (ver idsConHijoActivo) para que no haya
  // un parpadeo "cerrado -> abierto" al entrar directo por URL.
  const [openSubMenus, setOpenSubMenus] = useState<string[]>(() => idsConHijoActivo(pathDirect));

  // Si la ruta cambia (navegación por link, no sólo el primer render) y el
  // submenú del destino todavía no está abierto, se agrega — sin cerrar los
  // que el usuario haya abierto a mano.
  useEffect(() => {
    const conHijoActivo = idsConHijoActivo(pathDirect);
    setOpenSubMenus((prevOpen) => {
      const faltantes = conHijoActivo.filter((id) => !prevOpen.includes(id));
      return faltantes.length > 0 ? [...prevOpen, ...faltantes] : prevOpen;
    });
  }, [pathDirect]);

  // Función para alternar la visibilidad de los submenús
  const toggleSubMenu = (id: string) => {
    setOpenSubMenus((prevOpen) =>
      prevOpen.includes(id) ? prevOpen.filter((item) => item !== id) : [...prevOpen, id]
    );
  };

  return (
    <Box sx={{ px: collapsed ? 1 : 3 }}>
      <List sx={{ pt: 0 }} className="sidebarNav" component="div">
        {Menuitems.map((item) => {
          if (item.subheader) {
            return <NavGroup item={item} key={item.subheader || "default-subheader"} collapsed={collapsed} />;
          }

          return (
            <NavItem
              item={item}
              key={item.id || "default-id"}
              pathDirect={pathDirect}
              onClick={() => toggleSubMenu(item.id || "default-id")}
              isOpen={openSubMenus.includes(item.id || "default-id")}
              collapsed={collapsed}
            />
          );
        })}
      </List>
    </Box>
  );
};


export default SidebarItems;
