// SidebarItems.tsx

import React, { useState } from "react";
import Menuitems from "./MenuItems";
import { usePathname } from "next/navigation";
import { Box, List } from "@mui/material";
import NavItem from "./NavItem";
import NavGroup from "./NavGroup/NavGroup";

// SidebarItems.tsx
const SidebarItems = ({ toggleMobileSidebar }: any) => {
  const pathname = usePathname();
  const pathDirect = pathname;

  // Estado para manejar la apertura de submenús
  const [openSubMenus, setOpenSubMenus] = useState<string[]>([]);

  // Función para alternar la visibilidad de los submenús
  const toggleSubMenu = (id: string) => {
    console.log("Toggling subMenu ID:", id);  // Aquí agregas el log
    setOpenSubMenus((prevOpen) =>
      prevOpen.includes(id) ? prevOpen.filter((item) => item !== id) : [...prevOpen, id]
    );
  };

  return (
    <Box sx={{ px: 3 }}>
      <List sx={{ pt: 0 }} className="sidebarNav" component="div">
        {Menuitems.map((item) => {
          
          if (item.subheader) {
            return <NavGroup item={item} key={item.subheader || "default-subheader"} />;
          } else {
          
            return (
              <NavItem
                item={item}
                key={item.id || "default-id"}
                pathDirect={pathDirect}
                onClick={() => toggleSubMenu(item.id || "default-id")}
                isOpen={openSubMenus.includes(item.id || "default-id")} 
              />
            );
          }
        })}
      </List>
    </Box>
  );
};


export default SidebarItems;
