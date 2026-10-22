import { BACKEND_URL } from "@/config";
import { getPlataformaId } from "@/modules/auth/utils/auth.storage";
import { limpiarEstadosVista } from "@/utils/estadoVista";
import { olvidarDatosCargados } from "@/utils/memoriaDatos";
// export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://
type ApiAuthMode = "none" | "optional" | "required";

type ApiResponseLike = {
  ok?: boolean;
  status?: number;
  json?: () => Promise<unknown>;
  text?: () => Promise<string>;
};

export interface ApiRequestOptions extends RequestInit {
  auth?: ApiAuthMode;
  baseUrl?: string;
}

const JSON_CONTENT_TYPE = "application/json";
const API_VERSION_SEGMENT = "/v1";

const PUBLIC_ENDPOINTS = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/verificar-otp",
  "/api/auth/verify-otp",
  "/api/public",
];

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getStoredToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem("token");
}

export function clearStoredToken() {
  if (!isBrowser()) return;
  localStorage.removeItem("token");
  // Al cerrar sesión (o vencer) se olvida lo buscado y lo cargado: el
  // próximo usuario en este navegador parte de cero.
  limpiarEstadosVista();
  olvidarDatosCargados();
}

function shouldTreatAsPublic(endpoint: string): boolean {
  return PUBLIC_ENDPOINTS.some((publicEndpoint) => endpoint.includes(publicEndpoint));
}

function resolveUrl(endpoint: string, baseUrl = BACKEND_URL): string {
  const addVersionSegment = (pathname: string) => {
    if (pathname.startsWith("/v1")) {
      return pathname;
    }

    if (pathname.startsWith("/api")) {
      return `${API_VERSION_SEGMENT}${pathname}`;
    }

    return pathname;
  };

  if (/^https?:\/\//i.test(endpoint)) {
    const url = new URL(endpoint);
    url.pathname = addVersionSegment(url.pathname);
    return url.toString();
  }

  const normalizedEndpoint = addVersionSegment(endpoint);
  return `${baseUrl}${normalizedEndpoint}`;
}

function normalizeHeaders(headers?: HeadersInit): Headers {
  const normalized = new Headers();

  if (!headers) {
    return normalized;
  }

  if (headers instanceof Headers) {
    headers.forEach((value, key) => normalized.set(key, value));
    return normalized;
  }

  if (Array.isArray(headers)) {
    headers.forEach(([key, value]) => normalized.set(key, value));
    return normalized;
  }

  Object.entries(headers).forEach(([key, value]) => {
    if (typeof value !== "undefined") {
      normalized.set(key, value);
    }
  });

  return normalized;
}

function buildHeaders(endpoint: string, options: RequestInit = {}, auth: ApiAuthMode): Headers {
  const headers = normalizeHeaders(options.headers);
  const hasContentType = headers.has("Content-Type");
  const token = getStoredToken();
  const isPublic = auth === "none" || shouldTreatAsPublic(endpoint);

  if (!hasContentType && options.body) {
    headers.set("Content-Type", JSON_CONTENT_TYPE);
  }

  if (!isPublic && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // El api-gateway exige que este header coincida con el `plataformaId` que
  // trae el JWT (ver api-gateway/src/middlewares/auth.js) para cualquier ruta
  // autenticada. Se manda siempre, no solo cuando hay token, porque tambien
  // hay endpoints publicos del gateway que lo validan igual.
  if (!headers.has("x-plataforma-id")) {
    headers.set("x-plataforma-id", String(getPlataformaId()));
  }

  return headers;
}

const LOGOUT_REASON_KEY = "authLogoutReason";

/** Deja registrada, antes del `window.location.href`, qué endpoint provocó
 *  el cierre de sesión — `redirectToLogin()` navega de inmediato, así que la
 *  pestaña Network/Console de devtools se vacía antes de que alguien alcance
 *  a leerla. La pantalla de login la muestra y la limpia (ver AuthLogin.tsx). */
function registrarMotivoLogout(detalle: string) {
  if (!isBrowser()) return;
  try {
    sessionStorage.setItem(LOGOUT_REASON_KEY, JSON.stringify({ detalle, at: new Date().toISOString() }));
  } catch {
    // sessionStorage puede no estar disponible (modo privado, cuota); no es
    // razón para bloquear el logout.
  }
}

function redirectToLogin(motivo?: string) {
  if (isBrowser()) {
    if (motivo) registrarMotivoLogout(motivo);
    window.location.href = "/authentication/login";
  }
}

async function parseResponseBody(response: Response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes(JSON_CONTENT_TYPE)) {
    return response.json();
  }

  return response.text();
}

export async function apiRequest(endpoint: string, options: ApiRequestOptions = {}): Promise<Response | null> {
  const auth = options.auth ?? "optional";
  const url = resolveUrl(endpoint, options.baseUrl);
  const token = getStoredToken();
  const isPublic = auth === "none" || shouldTreatAsPublic(endpoint);

  if (auth === "required" && !token) {
    redirectToLogin(`Sin token guardado al pedir ${endpoint}`);
    return null;
  }

  const headers = buildHeaders(endpoint, options, auth);
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!isPublic && response.status === 401) {
    let mensajeServidor = "";
    try {
      const cuerpo = await response.clone().json();
      // `detail` es lo específico (ver analysis-service manejarError/
      // identity.service.js): `message` sólo dice "sesión inválida" para
      // cualquier motivo, `detail` trae la razón real cuando el backend la
      // expone.
      mensajeServidor = cuerpo?.detail || cuerpo?.message || cuerpo?.error || "";
    } catch {
      // Respuesta 401 sin cuerpo JSON legible; se deja sin mensaje del servidor.
    }
    clearStoredToken();
    redirectToLogin(`401 en ${endpoint}${mensajeServidor ? ` — "${mensajeServidor}"` : ""}`);
    return null;
  }

  return response;
}

export async function apiJson<T = unknown>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<any> {
  const response = await apiRequest(endpoint, options);

  if (!response) {
    throw new Error("No se pudo completar la solicitud");
  }

  const data = await parseResponseBody(response);

  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null
        ? ((data as { error?: string; message?: string }).error ||
            (data as { error?: string; message?: string }).message ||
            "Error desconocido")
        : "Respuesta inesperada del servidor";

    throw new Error(message);
  }

  if (data && typeof data === "object") {
    const enriched = data as Record<string, unknown> & ApiResponseLike;

    if (typeof enriched.ok === "undefined") {
      Object.defineProperty(enriched, "ok", {
        value: true,
        enumerable: false,
        configurable: true,
      });
    }

    if (typeof enriched.status === "undefined") {
      Object.defineProperty(enriched, "status", {
        value: response.status,
        enumerable: false,
        configurable: true,
      });
    }

    if (typeof enriched.json !== "function") {
      Object.defineProperty(enriched, "json", {
        value: async () => data,
        enumerable: false,
        configurable: true,
      });
    }

    if (typeof enriched.text !== "function") {
      Object.defineProperty(enriched, "text", {
        value: async () => (typeof data === "string" ? data : JSON.stringify(data)),
        enumerable: false,
        configurable: true,
      });
    }

    return enriched;
  }

  return data;
}
