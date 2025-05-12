import {
    IconUsersGroup,
    IconUserPlus,
    IconReport,
  } from "@tabler/icons-react";
  import { uniqueId } from "lodash";
  
  const AdminMenuitems = [
    {
      navlabel: true,
      subheader: "Panel de Administración ",
    },
    {
      id: uniqueId(),
      title: "Administra tus Usuarios",
      icon: IconUsersGroup,
      href: "/admin/opciones/usuarios",
    },
    {
      id: uniqueId(),
      title: "Crear Nuevo Usuario",
      icon: IconUserPlus,
      href: "/admin/opciones/crear-usuario",
    },
    {
      id: uniqueId(),
      title: "Revisar Sugerencias",
      icon: IconReport,
      href: "/admin/opciones/sugerencias",
    },
   
  ];
  
  export default AdminMenuitems;
  