// Lista de SKU para el informe de ventas por canal y marca: pegada a mano o
// cargada desde la plantilla Excel. El back acepta hasta MAX_SKUS en el cuerpo
// de un POST (una URL no aguanta 1.000 códigos).

export const MAX_SKUS = 1000;
const SKU_VALIDO = /^[A-Za-z0-9._-]{1,50}$/;

export interface ResultadoLista {
  skus: string[];
  invalidos: string[];
  excedidos: number;
}

/** Normaliza una lista: mayúsculas, sin repetidos, solo códigos válidos, hasta MAX_SKUS. */
export function normalizarSkus(valores: unknown[]): ResultadoLista {
  const vistos = new Set<string>();
  const invalidos: string[] = [];
  for (const v of valores) {
    const s = String(v ?? "").trim().toUpperCase();
    if (!s) continue;
    if (!SKU_VALIDO.test(s)) {
      invalidos.push(s);
      continue;
    }
    vistos.add(s);
  }
  const todos = [...vistos];
  return { skus: todos.slice(0, MAX_SKUS), invalidos, excedidos: Math.max(0, todos.length - MAX_SKUS) };
}

/** Texto pegado (uno por línea, o separados por coma, punto y coma o espacio). */
export const skusDeTexto = (texto: string) => normalizarSkus(texto.split(/[\s,;]+/));

/** Primera columna del Excel (se salta el encabezado "SKU" si está). */
export async function skusDeExcel(archivo: File): Promise<ResultadoLista> {
  const XLSX = await import("xlsx");
  const libro = XLSX.read(await archivo.arrayBuffer(), { type: "array" });
  const hoja = libro.Sheets[libro.SheetNames[0]];
  const filas = XLSX.utils.sheet_to_json<unknown[]>(hoja, { header: 1, raw: false, blankrows: false });
  const valores = filas.map((f) => (Array.isArray(f) ? f[0] : null));
  if (valores.length && /^\s*sku\s*$/i.test(String(valores[0] ?? ""))) valores.shift();
  return normalizarSkus(valores);
}

/** Descarga la plantilla: una columna SKU, un código por fila. */
export async function descargarPlantillaSkus() {
  const XLSX = await import("xlsx");
  const hoja = XLSX.utils.aoa_to_sheet([["SKU"], ["001001016"], ["555225021"]]);
  hoja["!cols"] = [{ wch: 16 }];
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "SKU");
  XLSX.writeFile(libro, "plantilla_skus_ventas_por_canal.xlsx");
}

/** Huella corta de la lista: distingue consultas en la caché y enlaza el tablero. */
export function huellaSkus(skus: string[]): string {
  let h = 5381;
  for (const c of skus.join(",")) h = ((h << 5) + h + c.charCodeAt(0)) | 0;
  return `${skus.length}-${(h >>> 0).toString(36)}`;
}

const CLAVE = (huella: string) => `ventas-por-canal:skus:${huella}`;

/** Guarda la lista para que el tablero la lea (la URL solo lleva la huella). */
export function guardarSkusParaTablero(skus: string[]): string {
  const huella = huellaSkus(skus);
  try {
    sessionStorage.setItem(CLAVE(huella), JSON.stringify(skus));
  } catch {
    /* sin sessionStorage el tablero muestra todo, sin lista */
  }
  return huella;
}

export function leerSkusDelTablero(huella: string | null): string[] | null {
  if (!huella) return null;
  try {
    const crudo = sessionStorage.getItem(CLAVE(huella));
    const lista = crudo ? JSON.parse(crudo) : null;
    return Array.isArray(lista) ? lista.map(String) : null;
  } catch {
    return null;
  }
}
