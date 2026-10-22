// src/layout/Menuitems.ts
import {IconLayoutDashboard, IconChartBar,IconChartDonut,IconChartPie,IconChartLine,
  IconBoxSeam,IconHierarchy3,IconClipboardCheck,IconMessage2,
  IconChartBarOff,
  IconCashOff,IconUser,IconSettings,IconDatabase,IconTargetArrow,} from "@tabler/icons-react";

import { uniqueId } from "lodash";
const Menuitems = [
  {
    navlabel: true,
    subheader: "Inicio",
    divider: true,
  },
  {
    id: uniqueId(),
    title: "Panel de Control",
    icon: IconLayoutDashboard,
    href: "/inicio",
  },

  {
    navlabel: true,
    subheader: "Analisa tus Ventas",
    divider: true,
  },
  {
    id: uniqueId(),
    title: "Ventas",
    icon: IconChartBar,
    subMenu: [
      {
        id: uniqueId(),
        title: "Resumen Ventas",
        icon: IconChartLine,
        href: "/utilities/ventas/resumen-ventas",
      },
      {
        id: uniqueId(),
        title: "Ventas por Canal",
        icon: IconChartDonut,
        href: "/utilities/ventas/ventas-por-canal",
      },
      {
        id: uniqueId(),
        title: "Ventas por Vendedor",
        icon: IconChartPie,
        href: "/utilities/ventas/ventas-por-vendedor",
      },
    ],
  },
  {
    id: uniqueId(),
    title: "Análisis por Categoría",
    icon: IconHierarchy3,
    href: "/utilities/analisis-categoria",
  },
  {
    id: uniqueId(),
    title: "Análisis por Producto",
    icon: IconBoxSeam,
    href: "/utilities/analisis-producto1.1",
  },
  {
    id: uniqueId(),
    title: "Administrador de Metas",
    icon: IconTargetArrow,
    // Antes vivía como "Administrar Metas" dentro de Configuraciones — se
    // saca a menú principal propio, con sus 3 vistas como submenú (igual
    // patrón que "Ventas" o "Análisis por Categoría" arriba).
    subMenu: [
      {
        id: uniqueId(),
        title: "Resumen",
        icon: IconChartPie,
        href: "/metas",
      },
      {
        id: uniqueId(),
        title: "Periodos",
        icon: IconChartLine,
        href: "/metas/periodos",
      },
      {
        id: uniqueId(),
        title: "Metas",
        icon: IconClipboardCheck,
        href: "/metas/listado",
      },
    ],
  },

  {
    navlabel: true,
    subheader: "Informes",
    divider: true,
  },
  {
    id: uniqueId(),
    title: "Ventas",
    icon: IconClipboardCheck,
    subMenu: [
      {
        id: uniqueId(),
        title: "Ventas de Productos",
        icon: IconChartBar,
        href: "/informes/ventas-productos",
      },
      {
        id: uniqueId(),
        title: "Ventas de productos por canal",
        icon: IconCashOff,
        href: "/informes/ventas-productos-por-canal",
      },
    ],
  },
  {
    id: uniqueId(),
    title: "Inventario",
    icon: IconClipboardCheck,
    subMenu: [
      {
        id: uniqueId(),
        title: "Productos Detenidos",
        icon: IconBoxSeam,
        href: "/informes/productos-detenidos",
      },
      {
        id: uniqueId(),
        title: "Productos menos rentables",
        icon: IconChartBarOff,
        href: "/informes/productos-menos-rentables",
      },
      {
        id: uniqueId(),
        title: "Productos sin ventas",
        icon: IconCashOff,
        href: "/informes/productos-sin-ventas",
      },
    ],
  },
  {
    navlabel: true,
    subheader: "Feedback",
    divider: true,
  },
  {
    id: uniqueId(),
    title: "Sugerencias",
    icon: IconMessage2,
    href: "/sugerencias",
  },
  {
    navlabel: true,
    subheader: "Cuenta",
    divider: true,
  },
  {
    id: uniqueId(),
    title: "Mi Perfil",
    icon: IconUser,
    href: "/perfil",
  },
  {
    id: uniqueId(),
    title: "Configuraciones",
    icon: IconSettings,
    // Un item con subMenu no navega solo: al hacer click despliega estas
    // opciones (igual que "Ventas"), y cada una va DIRECTO a su vista -ya no
    // hay que pasar primero por una pantalla intermedia con 3 tarjetas.
    subMenu: [
      {
        id: uniqueId(),
        title: "Actualizar Base de Datos",
        icon: IconDatabase,
        href: "/configuracion",
      },
      {
        id: uniqueId(),
        title: "Sugerencias",
        icon: IconMessage2,
        href: "/configuracion/sugerencias",
      },
    ],
  },
];


export default Menuitems;
