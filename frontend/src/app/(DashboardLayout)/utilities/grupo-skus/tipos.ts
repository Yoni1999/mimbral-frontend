// Tipos y reglas del análisis de un grupo de SKUs (analysis-service:
// GET /api/pv/grupo y GET /api/grupo-skus/inventario).

/** Máximo de SKUs por análisis: el mismo tope que valida el servidor. */
export const MAX_SKUS = 100;

/** Mismo formato que acepta el servidor: alfanumérico con guion, punto o guion bajo. */
const SKU_VALIDO = /^[A-Z0-9._-]{1,50}$/;

export interface ListaSkus {
  /** SKUs válidos, sin repetir, en el orden en que llegaron. */
  skus: string[];
  /** Lo que no tiene forma de SKU. */
  invalidos: string[];
  /** Cuántos venían repetidos. */
  repetidos: number;
  /** Los que quedan fuera por pasar del máximo. */
  sobrantes: string[];
}

/** Separa el texto del usuario (comas, punto y coma, espacios, tabulaciones o
 *  saltos de línea, como sale al pegar una columna de Excel) en SKUs. */
export function leerListaSkus(entrada: string | string[]): ListaSkus {
  const partes = (Array.isArray(entrada) ? entrada : [entrada]).flatMap((t) => String(t ?? "").split(/[\s,;]+/));
  const vistos = new Set<string>();
  const skus: string[] = [];
  const invalidos: string[] = [];
  let repetidos = 0;
  for (const parte of partes) {
    const sku = parte.trim().toUpperCase();
    if (!sku) continue;
    if (!SKU_VALIDO.test(sku)) {
      invalidos.push(parte.trim());
      continue;
    }
    if (vistos.has(sku)) {
      repetidos++;
      continue;
    }
    vistos.add(sku);
    skus.push(sku);
  }
  return { skus: skus.slice(0, MAX_SKUS), invalidos, repetidos, sobrantes: skus.slice(MAX_SKUS) };
}

export interface CanalProducto {
  canal: string;
  venta: number;
  unidades: number;
  costo?: number;
}

export interface ProductoGrupo {
  sku: string;
  existe: boolean;
  nombre: string | null;
  imagen: string | null;
  marca: string | null;
  primerNivel: string | null;
  categoria: string | null;
  subcategoria: string | null;
  precioLista: number | null;
  activo: boolean;
  venta: number;
  ventaAnterior: number | null;
  variacionVenta: number | null;
  unidades: number;
  unidadesAnterior: number | null;
  variacionUnidades: number | null;
  documentos: number;
  documentosAnterior: number | null;
  clientes: number;
  precioPromedio: number | null;
  ticketPromedio: number | null;
  /** Campos de margen: ausentes si el usuario no tiene el permiso de margen. */
  costo?: number;
  margen?: number;
  margenPorcentaje?: number | null;
  costoAnterior?: number | null;
  margenAnterior?: number | null;
  ncDocumentos: number;
  ncUnidades: number;
  ncMonto: number;
  ncMontoAnterior: number | null;
  ventaNeta: number;
  primeraVenta: string | null;
  ultimaVenta: string | null;
  participacion: number;
  canales: CanalProducto[];
}

export interface ResumenGrupo {
  skus: number;
  conVentas: number;
  venta: number;
  ventaAnterior: number | null;
  variacionVenta: number | null;
  unidades: number;
  unidadesAnterior: number | null;
  variacionUnidades: number | null;
  documentos: number;
  documentosAnterior: number | null;
  variacionDocumentos: number | null;
  clientes: number;
  clientesAnterior: number | null;
  ticketPromedio: number | null;
  costo?: number;
  margen?: number;
  margenPorcentaje?: number | null;
  margenPorcentajeAnterior?: number | null;
  ncDocumentos: number;
  ncDocumentosAnterior: number | null;
  ncUnidades: number;
  ncMonto: number;
  ventaNeta: number;
}

export interface MesProducto {
  sku: string;
  mes: string;
  venta: number;
  unidades: number;
  costo?: number;
  margen?: number;
  documentos: number;
}

export interface RespuestaGrupo {
  periodo: { inicio: string; fin: string; anterior: { inicio: string; fin: string } | null; modoComparacion: string };
  skus: string[];
  noEncontrados: string[];
  resumen: ResumenGrupo;
  canales: (CanalProducto & { margen?: number })[];
  mensual: MesProducto[];
  mensualCanal: { mes: string; canal: string; venta: number; unidades: number }[];
  diario: ({ Fecha: string } & Record<string, number | string>)[];
  productos: ProductoGrupo[];
}

export interface BodegaStock {
  stock: number;
  comprometido: number;
  enOc: number;
}

export interface InventarioProducto {
  sku: string;
  bodegas: Record<string, BodegaStock>;
  stockVenta: number;
  stockTotal: number;
  comprometido: number;
  disponible: number;
  unidades30: number;
  unidades90: number;
  promedioDiario30: number;
  coberturaDias: number | null;
  ultimaVenta: string | null;
  ultimaOc: {
    numero: number;
    fecha: string;
    cantidad: number;
    /** Ausente sin el permiso de margen (es el costo de compra). */
    costoUnitario?: number;
    proveedorCodigo: string;
    proveedorNombre: string;
  } | null;
  pendienteOc: number;
  ocAbiertas: number;
  proximaEntrega: string | null;
  ultimaRecepcion: { fecha: string; cantidad: number } | null;
}

export interface RespuestaInventario {
  bodegas: string[];
  bodegasVenta: string[];
  productos: InventarioProducto[];
}

/** Fecha ISO o Date del servidor a dd/mm/aaaa. */
export const fechaCorta = (valor?: string | null) => {
  if (!valor) return "";
  const [a, m, d] = String(valor).slice(0, 10).split("-");
  return d && m && a ? `${d}/${m}/${a}` : "";
};

/** "2026-10" → "oct 2026". */
export const nombreMes = (mes: string) => {
  const [a, m] = mes.split("-").map(Number);
  return new Date(a, (m || 1) - 1, 1).toLocaleDateString("es-CL", { month: "short", year: "numeric" });
};
