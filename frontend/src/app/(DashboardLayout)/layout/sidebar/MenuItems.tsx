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
  IconStar,
  IconDatabase,
  IconMessage2,
  IconShoppingBag,
  IconTrophy,
  IconPackageImport,
  IconCash,
  IconClockDollar,
  IconAlertCircle,
  IconArrowsExchange,
  IconTag,
  IconArrowBackUp,
  IconStack2,
} from "@tabler/icons-react";

export type Pagina = {
  titulo: string;
  href: string;
  icon: any;
  /** Páginas dentro de un desplegable (p. ej. Informes → Mercado Libre). El href del desplegable no se navega: identifica el grupo. */
  hijos?: Pagina[];
};
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
  /** Rutas del módulo que no están en el menú (p. ej. una ficha): lo mantienen marcado. */
  rutasExtra?: string[];
};

export const MODULOS: Modulo[] = [
  { id: "inicio", titulo: "Inicio", icon: IconHome2, href: "/inicio" },
  {
    id: "ventas",
    titulo: "Ventas",
    descripcion: "Cómo vamos vendiendo, por canal, por vendedor, en Mercado Libre y en Falabella",
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
      {
        titulo: "Falabella",
        paginas: [{ titulo: "Productos y rentabilidad", href: "/utilities/falabella/productos", icon: IconShoppingBag }],
      },
    ],
  },
  {
    id: "categorias",
    titulo: "Categorías",
    descripcion: "Venta, margen y crecimiento por categoría: las de Mimbral, Mercado Libre y Falabella",
    icon: IconCategory2,
    rutasExtra: ["/utilities/categorias/mercado-libre"],
    grupos: [
      {
        titulo: "",
        paginas: [{ titulo: "Categorías Mimbral", href: "/utilities/analisis-categoria", icon: IconCategory2 }],
      },
      {
        titulo: "Mercado Libre",
        paginas: [
          { titulo: "Informe de categorías", href: "/utilities/categorias/mercado-libre/informe", icon: IconChartBar },
          { titulo: "Ganadores y perdedores", href: "/utilities/categorias/mercado-libre/ganadores", icon: IconArrowsExchange },
          { titulo: "Mercado y tendencias", href: "/utilities/categorias/mercado-libre/mercado", icon: IconTrophy },
          // La ficha de una categoría no va en el menú: se llega desde el informe.
        ],
      },
      {
        titulo: "Falabella",
        paginas: [{ titulo: "Informe de categorías", href: "/utilities/falabella/informe", icon: IconChartBar }],
      },
    ],
  },
  {
    id: "productos",
    titulo: "Productos",
    descripcion: "Un producto en detalle, o un grupo de hasta 100 SKUs comparados",
    icon: IconPackage,
    grupos: [
      {
        titulo: "",
        paginas: [
          { titulo: "Por SKU", href: "/utilities/analisis-producto1.1", icon: IconPackage },
          { titulo: "Grupo de SKUs", href: "/utilities/grupo-skus", icon: IconStack2 },
        ],
      },
    ],
  },
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
          {
            titulo: "Mercado Libre",
            href: "/informes/mercado-libre",
            icon: IconShoppingBag,
            hijos: [
              { titulo: "Más vendidos", href: "/informes/mas-vendidos-mercado-libre", icon: IconTrophy },
              { titulo: "Reposición", href: "/informes/reposicion-mercado-libre", icon: IconPackageImport },
              { titulo: "Rentabilidad por producto", href: "/informes/mercado-libre/rentabilidad", icon: IconCash },
              { titulo: "Stock Full que cuesta", href: "/informes/mercado-libre/stock-full", icon: IconClockDollar },
              { titulo: "Publicaciones con problemas", href: "/informes/mercado-libre/publicaciones", icon: IconAlertCircle },
              { titulo: "Full contra Colecta", href: "/informes/mercado-libre/full-vs-colecta", icon: IconArrowsExchange },
              { titulo: "Precio y competencia", href: "/informes/mercado-libre/precios", icon: IconTag },
              { titulo: "Devoluciones y cancelaciones", href: "/informes/mercado-libre/devoluciones", icon: IconArrowBackUp },
            ],
          },
          {
            titulo: "Falabella",
            href: "/informes/falabella",
            icon: IconShoppingBag,
            hijos: [
              { titulo: "Precio y margen de hoy", href: "/informes/falabella/publicaciones", icon: IconTag },
              { titulo: "Publicaciones con problemas", href: "/informes/falabella/publicaciones?vista=problemas", icon: IconAlertCircle },
              { titulo: "Stock Full y reposición", href: "/informes/falabella/stock-full", icon: IconPackageImport },
              { titulo: "Devoluciones y cancelaciones", href: "/informes/falabella/devoluciones", icon: IconArrowBackUp },
            ],
          },
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
    descripcion: "Base de datos, sugerencias recibidas y nota de Falabella",
    icon: IconSettings,
    grupos: [
      {
        titulo: "",
        paginas: [
          { titulo: "Actualizar base de datos", href: "/configuracion", icon: IconDatabase },
          { titulo: "Sugerencias recibidas", href: "/configuracion/sugerencias", icon: IconMessage2 },
          { titulo: "Nota de Falabella", href: "/configuracion/falabella", icon: IconStar },
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

/** Páginas navegables del módulo (los desplegables aportan sus hijos). */
export function paginasDe(m: Modulo): Pagina[] {
  return (m.grupos ?? []).flatMap((g) => g.paginas.flatMap((p) => p.hijos ?? [p]));
}

/** Un desplegable está activo si la ruta actual es una de sus páginas. */
export const desplegableActivo = (p: Pagina, path: string) => (p.hijos ?? []).some((h) => esRutaActiva(h.href, path));

/** Módulo de la ruta actual: el de la página que calza más largo ("/metas/periodos" gana a "/metas"). */
export function moduloActivo(path: string): Modulo | undefined {
  let mejor: { m: Modulo; largo: number } | undefined;
  for (const m of MODULOS) {
    for (const href of [m.href, ...paginasDe(m).map((p) => p.href), ...(m.rutasExtra ?? [])]) {
      if (href && esRutaActiva(href, path) && (!mejor || href.length > mejor.largo)) mejor = { m, largo: href.length };
    }
  }
  return mejor?.m;
}
