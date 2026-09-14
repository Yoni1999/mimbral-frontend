/**
 * Formato e identificador de login (correo o RUT), portado tal cual de
 * FrontOmsMimbral/features/auth/types/auth.ts — id-service acepta cualquiera
 * de los dos en `correo`, asi que el frontend decide cual es y lo normaliza
 * antes de mandarlo.
 */

export function normalizeRut(value: string): string {
  return value.replace(/[^0-9kK]/g, "").toUpperCase();
}

/** RUT con puntos de miles y guion antes del DV, para mostrar mientras se escribe. */
export function formatRutForInput(value: string): string {
  const clean = normalizeRut(value);
  if (clean.length <= 1) return clean;

  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${formattedBody}-${dv}`;
}

/** RUT sin puntos, con guion antes del DV — el formato que espera la API. */
export function normalizeRutForApi(value: string): string {
  const clean = normalizeRut(value);
  if (clean.length <= 1) return clean;
  return `${clean.slice(0, -1)}-${clean.slice(-1)}`;
}

export function isValidRut(value: string): boolean {
  const clean = normalizeRut(value);
  if (!/^\d{7,8}[0-9K]$/.test(clean)) return false;

  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i -= 1) {
    sum += Number(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);
  const expectedDv = remainder === 11 ? "0" : remainder === 10 ? "K" : String(remainder);
  return dv === expectedDv;
}

function isValidEmailFormat(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidLoginIdentifier(value: string): boolean {
  const trimmed = value.trim();
  return isValidEmailFormat(trimmed) || isValidRut(trimmed);
}

/** El usuario esta escribiendo un RUT (solo digitos/k/puntos/guion), no un correo. */
export function looksLikeRutInput(value: string): boolean {
  return /^[0-9kK.\-\s]*$/.test(value);
}

/** Normaliza lo que se manda a la API: RUT sin puntos, o el correo tal cual. */
export function normalizeIdentifierForApi(value: string): string {
  const trimmed = value.trim();
  return isValidRut(trimmed) ? normalizeRutForApi(trimmed) : trimmed;
}
