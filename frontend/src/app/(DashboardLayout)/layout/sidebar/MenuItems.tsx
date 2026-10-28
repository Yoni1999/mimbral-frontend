// Menú de Análisis 360: la misma forma que el rail de FrontOms (módulo con
// nombre corto de una palabra; el submenú se abre como panel al costado).
// MODULOS es la única fuente: la usan el rail de escritorio (RailSidebar) y la
// barra de celular (MobileBottomNav).
import {
  IconHome2,
  IconTrendingUp,
  IconChartLine,
  IconChartDonut,
  IconUsers,
  IconCategory2,
  IconPackage,
  IconTarget,
  IconCalendarStats,
  IconListCheck,
  IconReportAnalytics,
  IconChartBar,
  IconCoinOff,
  IconPackageOff,
  IconBulb,
  IconSettings,
  IconDatabase,
  IconMessage2,
  IconShoppingBag,
  IconTrophy,
} from "@tabler/icons-react";

export type Pagina = { titulo: string; href: string; icon: any };
export type Grupo = { titulo: string; paginas: Pagina[] };
export type Modulo = {
  id: string;
  /** Nombre corto: una palabra, entra en una línea bajo el ícono del rail. */
  titulo: string;
  /** Una línea bajo el nombre en el panel del módulo. */
  descripcion?: string;
  icon: any;
  /** Módulo sin submenú: navega directo. */
  href?: string;
  /** Módulo con submenú: sus páginas, agrupadas (un grupo sin título = lista simple). */
  grupos?: Grupo[];
};

export const MODULOS: Modulo[] = [
  { id: "inicio", titulo: "Inicio", icon: IconHome2, href: "/inicio" },
  {
    id: "ventas",
    titulo: "Ventas",
    descripcion: "Cómo vamos vendiendo, por canal, por vendedor y en Mercado Libre",
    icon: IconTrendingUp,
    grupos: [
      {
        titulo: "",
        paginas: [
          { titulo: "Resumen de ventas", href: "/utilities/ventas/resumen-ventas", icon: IconChartLine },
          { titulo: "Ventas por canal", href: "/utilities/ventas/ventas-por-canal", icon: IconChartDonut },
          { titulo: "Ventas por vendedor", href: "/utilities/ventas/ventas-por-vendedor", icon: IconUsers },
        ],
      },
      {
        titulo: "Mercado Libre",
        paginas: [{ titulo: "Datos de ventas", href: "/utilities/ventas/mercado-libre", icon: IconShoppingBag }],
      },
    ],
  },
  { id: "categorias", titulo: "Categorías", icon: IconCategory2, href: "/utilities/analisis-categoria" },
  { id: "productos", titulo: "Productos", icon: IconPackage, href: "/utilities/analisis-producto1.1" },
  {
    id: "metas",
    titulo: "Metas",
    descripcion: "Períodos, metas y cómo vamos contra ellas",
    icon: IconTarget,
    grupos: [
      {
        titulo: "",
        paginas: [
          { titulo: "Resumen", href: "/metas", icon: IconChartDonut },
          { titulo: "Períodos", href: "/metas/periodos", icon: IconCalendarStats },
          { titulo: "Metas", href: "/metas/listado", icon: IconListCheck },
        ],
      },
    ],
  },
  {
    id: "informes",
    titulo: "Informes",
    descripcion: "Listados para revisar y descargar",
    icon: IconReportAnalytics,
    grupos: [
      {
        titulo: "Ventas",
        paginas: [
          { titulo: "Ventas de productos", href: "/informes/ventas-productos", icon: IconChartBar },
          { titulo: "Ventas de productos por canal y marca", href: "/informes/ventas-productos-por-canal", icon: IconChartDonut },
          { titulo: "Más vendidos Mercado Libre", href: "/informes/mas-vendidos-mercado-libre", icon: IconTrophy },
        ],
      },
      {
        titulo: "Inventario",
        paginas: [
          { titulo: "Productos detenidos", href: "/informes/productos-detenidos", icon: IconPackageOff },
          { titulo: "Productos menos rentables", href: "/informes/productos-menos-rentables", icon: IconCoinOff },
          { titulo: "Productos sin ventas", href: "/informes/productos-sin-ventas", icon: IconPackage },
        ],
      },
    ],
  },
  { id: "sugerencias", titulo: "Sugerencias", icon: IconBulb, href: "/sugerencias" },
  {
    id: "ajustes",
    titulo: "Ajustes",
    descripcion: "Base de datos y sugerencias recibidas",
    icon: IconSettings,
    grupos: [
      {
        titulo: "",
        paginas: [
          { titulo: "Actualizar base de datos", href: "/configuracion", icon: IconDatabase },
          { titulo: "Sugerencias recibidas", href: "/configuracion/sugerencias", icon: IconMessage2 },
        ],
      },
    ],
  },
];

/** Activo = ruta exacta, o la ruta actual vive dentro de esa página. */
export function esRutaActiva(href: string | undefined, path: string): boolean {
  if (!href) return false;
  return path === href || path.startsWith(`${href}/`);
}

export function paginasDe(m: Modulo): Pagina[] {
  return (m.grupos ?? []).flatMap((g) => g.paginas);
}

/** Módulo de la ruta actual: el de la página que calza más largo ("/metas/periodos" gana a "/metas"). */
export function moduloActivo(path: string): Modulo | undefined {
  let mejor: { m: Modulo; largo: number } | undefined;
  for (const m of MODULOS) {
    for (const href of [m.href, ...paginasDe(m).map((p) => p.href)]) {
      if (href && esRutaActiva(href, path) && (!mejor || href.length > mejor.largo)) mejor = { m, largo: href.length };
    }
  }
  return mejor?.m;
}
