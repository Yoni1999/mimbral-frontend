// Datos ya cargados, por clave (URL con filtros). Al volver a una vista con
// los mismos filtros se muestran al instante. La copia de SAP cambia de
// madrugada, así que 15 minutos de vigencia no ocultan nada nuevo. Vive en
// memoria: se pierde al recargar o cerrar la pestaña, y al cerrar sesión.
const VIGENCIA_MS = 15 * 60 * 1000;
const MAXIMO_ENTRADAS = 300;
const memoria = new Map<string, { datos: unknown; en: number }>();

export const enMemoria = (clave: string | null) => {
  if (clave === null) return undefined;
  const e = memoria.get(clave);
  if (!e) return undefined;
  if (Date.now() - e.en > VIGENCIA_MS) {
    memoria.delete(clave);
    return undefined;
  }
  return e;
};

export const recordar = (clave: string, datos: unknown) => {
  memoria.delete(clave);
  memoria.set(clave, { datos, en: Date.now() });
  // Se descarta lo más antiguo (el Map conserva el orden de inserción).
  while (memoria.size > MAXIMO_ENTRADAS) memoria.delete(memoria.keys().next().value as string);
};

export function olvidarDatosCargados() {
  memoria.clear();
}
