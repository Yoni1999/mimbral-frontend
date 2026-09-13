// --- id-service (login real, detras del api-gateway) -----------------------

export interface IdServiceLoginRequest {
  correo: string;
  password: string;
  forzarSesion?: boolean;
}

/**
 * Respuesta de POST auth/login. El shape calca el de FrontOms
 * (app/context/auth/AuthContext.tsx) porque es el mismo id-service: el token
 * ya trae usuarioId/plataformaId/scope, y el body los repite sin decodificar
 * para no obligar a leer el JWT solo para pintar la pantalla.
 */
export interface IdServiceLoginResponse {
  token: string;
  usuarioId: number;
  correo: string;
  nombre?: string;
  expiraEn?: number;
  scope?: "STORE" | "CORPORATE";
  activeStoreId?: string | null;
  activeStoreName?: string | null;
  homeStoreId?: string | null;
  homeStoreName?: string | null;
  contextResolved?: boolean;
  allowedStores?: { id: string; name: string }[];
  [key: string]: unknown;
}

export interface IdServiceSession {
  token: string;
  usuarioId: number;
  correo: string;
  nombre: string;
  plataformaId: number;
  scope: "STORE" | "CORPORATE";
  activeStoreId: string | null;
  activeStoreName: string | null;
  exp: number;
}

export interface IdServiceApiError extends Error {
  status?: number;
  codigo?: string;
  forceLogin?: boolean;
}
