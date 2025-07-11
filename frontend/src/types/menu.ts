// src/types/menu.ts

import { Icon } from "@tabler/icons-react"; // Importa Icon si es necesario para tus iconos

export interface MenuItem {
  id?: string;
  permisoId?: string; // <-- ¡Esta propiedad es CRUCIAL para tus permisos!
  title?: string;
  icon?: Icon; 
  href?: string;
  subMenu?: MenuItem[]; 
  
  navlabel?: boolean; 
  subheader?: string;
  divider?: boolean; 
}