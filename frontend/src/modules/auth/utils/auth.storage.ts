import { PLATAFORMA_ID } from "@/config";
import { AUTH_STORAGE_KEYS } from "../constants/auth.constants";
import type { IdServiceLoginResponse, IdServiceSession } from "../types/auth.types";
import { decodeJwtPayload } from "./jwt";

/**
 * `middleware.ts` protege las rutas leyendo la cookie `token` (no
 * localStorage), pero nada la escribia: toda navegacion a una ruta protegida
 * rebotaba a /authentication/login aunque hubiera sesion. No es httpOnly
 * -la escribe el propio browser, no un servidor- pero alcanza para que ese
 * guard, que ya existia, funcione.
 */
function setTokenCookie(token: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") return;
  const maxAge = maxAgeSeconds > 0 ? `; max-age=${maxAgeSeconds}` : "";
  document.cookie = `token=${token}; path=/${maxAge}; samesite=lax`;
}

function clearTokenCookie() {
  if (typeof document === "undefined") return;
  document.cookie = "token=; path=/; max-age=0";
}

/**
 * Guarda la sesion que devuelve el login del id-service: el token (para que
 * apiClient.ts lo siga adjuntando como Bearer) y el resto de los claims
 * (usuarioId, plataformaId, scope, sucursal activa) que las llamadas a las
 * APIs van a necesitar mandar en headers.
 */
export function saveIdServiceSession(response: IdServiceLoginResponse): IdServiceSession {
  const payload = decodeJwtPayload<Record<string, unknown>>(response.token) || {};

  const session: IdServiceSession = {
    token: response.token,
    usuarioId: Number(response.usuarioId ?? payload.usuarioId) || 0,
    correo: String(response.correo ?? payload.correo ?? ""),
    nombre: String(response.nombre ?? payload.nombre ?? ""),
    plataformaId: Number(payload.plataformaId ?? PLATAFORMA_ID),
    scope: (response.scope ?? (payload.scope as string) ?? "CORPORATE") as IdServiceSession["scope"],
    activeStoreId: (response.activeStoreId ?? (payload.activeStoreId as string) ?? null) as string | null,
    activeStoreName: (response.activeStoreName ?? (payload.activeStoreName as string) ?? null) as string | null,
    exp: Number(payload.exp) || 0,
  };

  localStorage.setItem(AUTH_STORAGE_KEYS.token, session.token);
  localStorage.setItem(AUTH_STORAGE_KEYS.session, JSON.stringify(session));

  const now = Math.floor(Date.now() / 1000);
  setTokenCookie(session.token, session.exp ? session.exp - now : 0);

  return session;
}

export function getIdServiceSession(): IdServiceSession | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEYS.session);
    return raw ? (JSON.parse(raw) as IdServiceSession) : null;
  } catch {
    return null;
  }
}

/** `x-plataforma-id` a mandar en cada request a las APIs (ver apiClient.ts). */
export function getPlataformaId(): number {
  return getIdServiceSession()?.plataformaId || PLATAFORMA_ID;
}

export function clearSession() {
  localStorage.removeItem(AUTH_STORAGE_KEYS.token);
  localStorage.removeItem(AUTH_STORAGE_KEYS.role);
  localStorage.removeItem(AUTH_STORAGE_KEYS.session);
  clearTokenCookie();
}

export function getRememberedEmail(): string {
  return localStorage.getItem(AUTH_STORAGE_KEYS.rememberedEmail) || "";
}

export function setRememberedEmail(email: string) {
  localStorage.setItem(AUTH_STORAGE_KEYS.rememberedEmail, email);
}

export function clearRememberedEmail() {
  localStorage.removeItem(AUTH_STORAGE_KEYS.rememberedEmail);
}
