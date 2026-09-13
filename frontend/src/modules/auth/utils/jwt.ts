/**
 * Decodifica el payload de un JWT sin verificar la firma. Es solo para leer
 * los claims en el cliente (usuarioId, plataformaId, exp, etc.) — la
 * verificacion real la hace el gateway en cada request.
 */
export function decodeJwtPayload<T = Record<string, unknown>>(token: string): T | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;

    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = typeof window !== "undefined" ? atob(padded) : Buffer.from(padded, "base64").toString("utf-8");

    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/** `exp` del JWT en epoch-segundos, o 0 si no se pudo leer. */
export function decodeJwtExp(token: string): number {
  const payload = decodeJwtPayload<{ exp?: number }>(token);
  return Number(payload?.exp) || 0;
}
