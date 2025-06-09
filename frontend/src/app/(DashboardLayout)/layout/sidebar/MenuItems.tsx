// src/layout/Menuitems.ts
import {
  IconLayoutDashboard,
  IconReportAnalytics,
  IconChevronRight,
  IconId,
  IconMessage2,
} from "@tabler/icons-react";
import { uniqueId } from "lodash";

const Menuitems = [
  {
    navlabel: true,
    subheader: "Inicio",
    divider: true,
  },
  {
    id: uniqueId(),
    title: "Dashboard",
    icon: IconLayoutDashboard,
    href: "/inicio",
  },
  {
    navlabel: true,
    subheader: "Inventario & Abastecimiento",
    divider: true,
  },

  {
    id: uniqueId(),
    title: "Ventas",
    icon: IconReportAnalytics,
    subMenu: [
      {
        id: uniqueId(),
        title: "Resumen Ventas",
        icon: IconChevronRight,
        href: "/utilities/ventas/resumen-ventas",
      },
      {
        id: uniqueId(),
        title: "Ventas por Canal",
        icon: IconChevronRight,
        href: "/utilities/ventas/ventas-por-canal",
      },
      {
        id: uniqueId(),
        title: "Ventas por Vendedor",
        icon: IconChevronRight,
        href: "/utilities/ventas/ventas-por-vendedor",
      },
    ],
  },
  {
    id: uniqueId(),
    title: "Análisis por Categoría",
    icon: IconReportAnalytics,
    href: "/utilities/analisis-categoria/resumen-categorias",
  },
/*  {
    id: uniqueId(),
    title: "Análisis por Producto",
    icon: IconReportAnalytics,
    href: "/utilities/analisis-producto",
  },
  */
  {
    id: uniqueId(),
    title: "Análisis por Producto ",
    icon: IconReportAnalytics,
    href: "/utilities/analisis-producto1.1",
  },
  {
    navlabel: true,
    subheader: "Reportes & Metas",
    divider: true,
  },
  {
    id: uniqueId(),
    title: "Informes",
    icon: IconReportAnalytics,
    subMenu: [
      {
        id: uniqueId(),
        title: "Productos Detenidos",
        icon: IconChevronRight,
        href: "/informes/productos-detenidos",
      },
      {
        id: uniqueId(),
        title: "Ventas de Productos",
        icon: IconChevronRight,
        href: "/informes/ventas-productos",
      },
      {
        id: uniqueId(),
        title: "Ventas Alta Rotación",
        icon: IconChevronRight,
        href: "/informes/ventas-productos-alta-rotacion",
      },
      {
        id: uniqueId(),
        title: "Tiempo de Entrega Proveedores",
        icon: IconChevronRight,
        href: "/informes/tiempo-entrega-proveedores",
      },
    ],
  },
  {
    id: uniqueId(),
    title: "Metas",
    icon: IconReportAnalytics,
    href: "/metas-general",
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
];

export default Menuitems;
