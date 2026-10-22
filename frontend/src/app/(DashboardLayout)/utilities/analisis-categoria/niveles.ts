// Los dos árboles de artículos de SAP por los que se puede mirar la venta, y
// los endpoints de analysis-service que atienden cada nivel. Todos filtran
// por CÓDIGO del nivel.
//
// - Categorías: primer nivel → categoría → subcategoría (U_Primer_Nivel,
//   U_Categoria, U_Subcategoria). Cada nivel tiene sus propios endpoints.
// - Familias: familia → subfamilia (U_Nombre_Fam, U_Nombre_SubFam, que pese
//   al nombre guardan códigos). Usan los endpoints de Resumen de ventas con
//   los filtros `familia` y `subfamilia`.
//
// El nivel 0 es "todo": la venta de la compañía.

export type Arbol = "categorias" | "familias";
export type Nivel = 0 | 1 | 2 | 3;

/** Un paso de la ruta: el nivel elegido y cuál. */
export interface Paso {
  nivel: 1 | 2 | 3;
  codigo: string;
  nombre: string;
}

type Tarjeta = "ventas" | "margen" | "transacciones" | "notas" | "items" | "unidades";

/** Fila del desglose: una parte del nivel actual con su venta. */
export interface FilaDesglose {
  codigo: string;
  nombre: string;
  venta: number;
  unidades?: number;
  transacciones?: number;
  cambio?: number | null;
}

interface ConfigNivel {
  etiqueta: string;
  /** Parámetro de query con el código del nivel. */
  parametro: string;
  tarjetas: Record<Tarjeta, string>;
  tendencia: string;
  /** Hijos del nivel con su venta (null en el último nivel). */
  hijos: { url: string; fila: (h: any) => FilaDesglose } | null;
}

interface ConfigArbol {
  etiqueta: string;
  niveles: Partial<Record<1 | 2 | 3, ConfigNivel>>;
  /** Último nivel del árbol. */
  hoja: 1 | 2 | 3;
  /** Venta por cada parte del primer nivel, cuando hay un endpoint que la
   *  entregue de una vez (en categorías no lo hay: se pide una por una). */
  raiz: ConfigNivel["hijos"];
  /** true: los filtros suman todos los pasos (subfamilia va con su familia,
   *  porque los endpoints de Resumen filtran por ambos). */
  acumulaFiltros: boolean;
}

const filaCategoria = (codigo: string, nombre: string) => (h: any): FilaDesglose => ({
  codigo: String(h[codigo]),
  nombre: h[nombre] || "Sin nombre",
  venta: Number(h.Total_Ventas) || 0,
  unidades: Number(h.Cantidad_Vendida) || 0,
  transacciones: Number(h.NumTransacciones) || 0,
});

const filaFamilia = (h: any): FilaDesglose => ({
  codigo: String(h.codigo),
  nombre: h.nombre || String(h.codigo),
  venta: Number(h.Total_Ventas) || 0,
  unidades: Number(h.Cantidad_Vendida) || 0,
  transacciones: Number(h.NumTransacciones) || 0,
  cambio: h.PorcentajeCambio ?? null,
});

// Tarjetas de Resumen de ventas: aceptan familia y subfamilia.
const TARJETAS_RESUMEN: Record<Tarjeta, string> = {
  ventas: "/api/ventas-periodo",
  margen: "/api/margen-ventas",
  transacciones: "/api/transacciones-periodo",
  notas: "/api/notascredito",
  items: "/api/productos-distintos-periodo",
  unidades: "/api/unidades-vendidas-periodo",
};

export const ARBOLES: Record<Arbol, ConfigArbol> = {
  categorias: {
    etiqueta: "Categorías",
    hoja: 3,
    raiz: null,
    acumulaFiltros: false,
    niveles: {
      1: {
        etiqueta: "Primer nivel",
        parametro: "primerNivel",
        tarjetas: {
          ventas: "/api/primer-nivel/ventas-primer-nivel",
          margen: "/api/primer-nivel/margen-primer-nivel",
          transacciones: "/api/primer-nivel/cantidad-ventas-primer-nivel",
          notas: "/api/primer-nivel/notas-credito-primer-nivel",
          items: "/api/primer-nivel/items-vendidos-primer-nivel",
          unidades: "/api/primer-nivel/unidades-vendidas-primer-nivel",
        },
        tendencia: "/api/primer-nivel/ventas-fecha-primer-nivel",
        hijos: {
          url: "/api/primer-nivel/categorias-mas-vendidas-primer-nivel",
          fila: filaCategoria("Codigo_Categoria", "Nombre_Categoria"),
        },
      },
      2: {
        etiqueta: "Categoría",
        parametro: "categoria",
        tarjetas: {
          ventas: "/api/resumen-categoria/ventas-categoria",
          margen: "/api/resumen-categoria/margen-categoria",
          transacciones: "/api/resumen-categoria/transacciones-categoria",
          notas: "/api/resumen-categoria/notas-credito-categoria",
          items: "/api/resumen-categoria/productos-distintos-categoria",
          unidades: "/api/resumen-categoria/unidades-vendidas-categoria",
        },
        tendencia: "/api/resumen-categoria/ventas-canal-fecha",
        hijos: {
          url: "/api/resumen-categoria/top-subcategorias",
          fila: filaCategoria("Codigo_SubCategoria", "Nombre_SubCategoria"),
        },
      },
      3: {
        etiqueta: "Subcategoría",
        parametro: "subcategoria",
        tarjetas: {
          ventas: "/api/tercer-nivel/ventas-subcategoria",
          margen: "/api/tercer-nivel/margen-subcategoria",
          transacciones: "/api/tercer-nivel/cantidad-ventas-subcategoria",
          notas: "/api/tercer-nivel/notas-credito-subcategoria",
          items: "/api/tercer-nivel/items-vendidos-subcategoria",
          unidades: "/api/tercer-nivel/unidades-vendidas-subcategoria",
        },
        tendencia: "/api/tercer-nivel/ventas-lineas-subcategoria",
        hijos: null,
      },
    },
  },
  familias: {
    etiqueta: "Familias",
    hoja: 2,
    raiz: { url: "/api/familias/desglose", fila: filaFamilia },
    acumulaFiltros: true,
    niveles: {
      1: {
        etiqueta: "Familia",
        parametro: "familia",
        tarjetas: TARJETAS_RESUMEN,
        tendencia: "/api/primer-nivel/ventas-fecha-primer-nivel",
        hijos: { url: "/api/familias/desglose", fila: filaFamilia },
      },
      2: {
        etiqueta: "Subfamilia",
        parametro: "subfamilia",
        tarjetas: TARJETAS_RESUMEN,
        tendencia: "/api/primer-nivel/ventas-fecha-primer-nivel",
        hijos: null,
      },
    },
  },
};

/** Compatibilidad: los niveles del árbol de categorías. */
export const NIVELES = ARBOLES.categorias.niveles as Record<1 | 2 | 3, ConfigNivel>;

/** Listas del árbol de categorías, para buscar y nombrar los niveles. */
export const CATALOGOS = {
  1: "/api/resumen-categoria/primer-nivel",
  2: "/api/resumen-categoria/mostrar-categorias",
  3: "/api/resumen-categoria/tercer-nivel",
} as const;

/** Árbol de familias con sus subfamilias. */
export const CATALOGO_FAMILIAS = "/api/familias/catalogo";

/** Configuración que atiende la ruta actual: la del último paso, o la del
 *  primer nivel sin filtro cuando no hay ninguno (la compañía completa). */
export const configDe = (arbol: Arbol, ruta: Paso[]) => {
  const a = ARBOLES[arbol];
  const ultimo = ruta[ruta.length - 1];
  const nivel: Nivel = ultimo?.nivel ?? 0;
  const config = a.niveles[ultimo?.nivel ?? 1]!;
  const pasos = a.acumulaFiltros ? ruta : ultimo ? [ultimo] : [];
  const filtro: Record<string, string> = Object.fromEntries(pasos.map((p) => [a.niveles[p.nivel]!.parametro, p.codigo]));
  return { arbol: a, nivel, ultimo, config, filtro, esHoja: nivel === a.hoja };
};
