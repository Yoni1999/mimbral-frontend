// src/layout/Menuitems.ts
import {
  IconLayoutDashboard,
  IconReportAnalytics,
  IconChartBar,
  IconChartDonut,
  IconChartPie,
  IconChartLine,
  IconBoxSeam,
  IconPackages,
  IconHierarchy3,
  IconTruckDelivery,
  IconClipboardCheck,
  IconTargetArrow,
  IconMessage2,
  IconChevronRight,
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
    href: "/utilities/analisis-categoria/resumen-categorias",
  },
  {
    id: uniqueId(),
    title: "Análisis por Producto",
    icon: IconBoxSeam,
    href: "/utilities/analisis-producto1.1",
  },

  {
    navlabel: true,
    subheader: "Inventario & Abastecimiento",
    divider: true,
  },
  {
    id: uniqueId(),
    title: "Supply Chain",
    icon: IconTruckDelivery,
    href: "/utilities/analisis-producto1.1",
  },

  {
    navlabel: true,
    subheader: "Informes & Metas",
    divider: true,
  },
  {
    id: uniqueId(),
    title: "Informes",
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
        title: "Ventas de Productos",
        icon: IconChartBar,
        href: "/informes/ventas-productos",
      },
      {
        id: uniqueId(),
        title: "Ventas Alta Rotación",
        icon: IconChartLine,
        href: "/informes/ventas-productos-alta-rotacion",
      },
      {
        id: uniqueId(),
        title: "Tiempo de Entrega Proveedores",
        icon: IconTruckDelivery,
        href: "/informes/tiempo-entrega-proveedores",
      },
    ],
  },
  {
    id: uniqueId(),
    title: "Metas",
    icon: IconTargetArrow,
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
