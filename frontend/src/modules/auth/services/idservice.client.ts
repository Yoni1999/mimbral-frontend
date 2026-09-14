import { ID_SERVICE_BASE_URL, PLATAFORMA_ID } from "@/config";
import type {
  IdServiceApiError,
  IdServiceLoginRequest,
  IdServiceLoginResponse,
} from "../types/auth.types";

/**
 * Cliente del id-service real (el mismo que usa FrontOms — ver
 * FrontOmsMimbral/app/api/auth/[action]/route.ts). Se llama directo desde el
 * navegador via ID_SERVICE_BASE_URL: a diferencia de FrontOms no hay un BFF de
 * Next que guarde el token en una cookie httpOnly, asi que la sesion sigue
 * viviendo en localStorage (ver auth.storage.ts), igual que el resto de
 * Analisis 360.
 */

function resolveUrl(path: string): string {
  const base = ID_SERVICE_BASE_URL.replace(/\/$/, "");
  const clean = path.replace(/^\//, "");
  return `${base}/${clean}`;
}

/** Extrae un mensaje legible del cuerpo de error de id-service / el gateway. */
function extractErrorMessage(payload: unknown, status: number): string {
  if (typeof payload === "string") {
    const txt = payload.trim();
    return txt && !/^HTTP\b/i.test(txt) ? txt : "";
  }

  if (payload && typeof payload === "object") {
    const data = payload as Record<string, unknown>;
    // id-service contesta sus errores como `{ error: { code, message } }`
    // (ver utils/errors.js `sendError` del lado del backend).
    const anidado = data.error;
    if (anidado && typeof anidado === "object") {
      const mensaje = (anidado as Record<string, unknown>).message;
      if (typeof mensaje === "string" && mensaje.trim()) return mensaje.trim();
    }
    if (typeof data.error === "string" && data.error.trim()) return data.error.trim();
    if (typeof data.message === "string" && data.message.trim()) return data.message.trim();
  }

  if (status === 429) return "Demasiados intentos. Espera unos minutos antes de reintentar.";
  return "";
}

async function idServiceFetch<T = unknown>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, headers, ...rest } = options;
  const url = resolveUrl(path);

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        "x-plataforma-id": String(PLATAFORMA_ID),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers || {}),
      },
    });
  } catch {
    const error: IdServiceApiError = Object.assign(
      new Error("No se pudo conectar con el servidor. Revisa tu conexion e intentalo de nuevo."),
      { status: 0, codigo: "NETWORK_ERROR" }
    );
    throw error;
  }

  const text = await response.text();
  const payload = text
    ? (() => {
        try {
          return JSON.parse(text);
        } catch {
          return text;
        }
      })()
    : null;

  if (!response.ok) {
    const message = extractErrorMessage(payload, response.status) || "No fue posible completar la solicitud.";
    const error: IdServiceApiError = Object.assign(new Error(message), {
      status: response.status,
      forceLogin: response.status === 409,
    });
    throw error;
  }

  return payload as T;
}

export async function loginIdService(
  payload: IdServiceLoginRequest
): Promise<IdServiceLoginResponse> {
  return idServiceFetch<IdServiceLoginResponse>("auth/login", {
    method: "POST",
    body: JSON.stringify({
      correo: payload.correo,
      password: payload.password,
      plataformaId: PLATAFORMA_ID,
      forzarSesion: payload.forzarSesion ?? false,
    }),
  });
}

export async function logoutIdService(usuarioId: number, token: string): Promise<void> {
  await idServiceFetch("auth/logout", {
    method: "POST",
    token,
    body: JSON.stringify({ usuarioId, plataformaId: PLATAFORMA_ID }),
  });
}

export async function recuperarPassword(correo: string): Promise<{ message?: string }> {
  return idServiceFetch<{ message?: string }>("auth/recuperar", {
    method: "POST",
    body: JSON.stringify({ correo }),
  });
}

export async function verificarOtpPassword(
  correo: string,
  codigoOtp: string
): Promise<Record<string, unknown>> {
  return idServiceFetch<Record<string, unknown>>("auth/verificar-otp", {
    method: "POST",
    body: JSON.stringify({ correo, codigoOtp }),
  });
}

export async function cambiarContrasenaConOtp(params: {
  correo: string;
  codigoOtp: string;
  nuevaContrasena: string;
  confirmarContrasena: string;
}): Promise<{ message?: string }> {
  return idServiceFetch<{ message?: string }>("auth/cambiar-contrasena", {
    method: "POST",
    body: JSON.stringify({
      correo: params.correo,
      codigoOtp: params.codigoOtp,
      // Claves exactas del contrato del backend (con eñe: ver
      // FrontOmsMimbral/features/auth/pages/recuperar/nueva/NuevaContrasena.tsx).
      "nuevaContraseña": params.nuevaContrasena,
      "confirmarContraseña": params.confirmarContrasena,
    }),
  });
}

// --- Perfil (id-service/src/routes/Perfiles.Routes.js, montado en /perfiles) --

export interface IdServiceUsuarioResumen {
  Nombre: string | null;
  Apellido: string | null;
  Email: string | null;
  Imagen: string | null;
  FechaCreacion?: string | null;
  FechaActualizacion?: string | null;
}

export interface IdServicePerfil {
  ID_FUNCIONARIO: number;
  Email: string;
  EsExterno?: boolean;
  Activo?: boolean;
  Nombres: string | null;
  Apellidos: string | null;
  RUT: string | null;
  ID_Departamento?: number | null;
  Telefono: string | null;
  URLImagenPerfil: string | null;
  CanalDeVenta?: string | null;
  CanalDeVentaId?: string | null;
  PlataformaIDs?: number[];
  RolIDs?: number[];
  UsuarioCreador?: IdServiceUsuarioResumen | null;
  UsuarioActualizador?: IdServiceUsuarioResumen | null;
  [key: string]: unknown;
}

export async function obtenerPerfil(usuarioId: number, token: string): Promise<IdServicePerfil> {
  return idServiceFetch<IdServicePerfil>(`perfiles/${usuarioId}`, {
    method: "GET",
    token,
  });
}

export async function editarPerfil(
  usuarioId: number,
  token: string,
  datos: { nombres?: string; apellidos?: string; rut?: string; telefono?: string; urlImagenPerfil?: string }
): Promise<{ message?: string }> {
  return idServiceFetch<{ message?: string }>(`perfiles/editar/${usuarioId}`, {
    method: "PUT",
    token,
    body: JSON.stringify(datos),
  });
}

/**
 * Cambia el correo (identidad de login) del propio usuario.
 *
 * `/perfiles/editar/:id` NO acepta correo (solo vive en USUARIOS, no en
 * PERFILES): el unico endpoint que lo edita es este, `PUT /usuarios/editar/:id`
 * (Usuario.Routes.js), pensado para que un admin edite cualquier cuenta -exige
 * `activo` y `rolesIds` en el body o los deja en blanco-. Se usa aca solo para
 * que alguien edite SU PROPIO correo (usuarioId de la URL = el de su sesion),
 * repitiendo tal cual su `activo`/`rolesIds`/`plataformaIds` actuales para no
 * pisarlos por accidente.
 */
export async function editarCorreoUsuario(params: {
  usuarioId: number;
  token: string;
  correo: string;
  activo: boolean;
  rolesIds: number[];
  plataformaIds?: number[];
}): Promise<{ message?: string }> {
  return idServiceFetch<{ message?: string }>(`usuarios/editar/${params.usuarioId}`, {
    method: "PUT",
    token: params.token,
    body: JSON.stringify({
      correo: params.correo,
      activo: params.activo,
      rolesIds: params.rolesIds,
      plataformaIds: params.plataformaIds,
      usuarioActualizadorId: params.usuarioId,
    }),
  });
}

export async function obtenerImagenPerfil(
  usuarioId: number,
  token: string
): Promise<{ usuarioId: number; urlImagenPerfil: string } | null> {
  try {
    return await idServiceFetch<{ usuarioId: number; urlImagenPerfil: string }>(
      `perfiles/imagen/${usuarioId}`,
      { method: "GET", token }
    );
  } catch (err) {
    // 404 = todavia no tiene foto de perfil; no es un error a mostrar.
    if ((err as IdServiceApiError)?.status === 404) return null;
    throw err;
  }
}

/** Sube la foto de perfil. Sin Content-Type propio: el browser arma el
 * boundary del multipart solo, y forzarlo rompe el parseo en el servidor. */
export async function subirImagenPerfil(
  usuarioId: number,
  token: string,
  file: File
): Promise<{ mensaje?: string; url: string; perfil?: IdServicePerfil }> {
  const formData = new FormData();
  formData.append("imagen", file);

  const url = resolveUrl(`perfiles/subir-imagen/${usuarioId}`);
  let response: Response;
  try {
    response = await fetch(url, {
      method: "PUT",
      headers: {
        "x-plataforma-id": String(PLATAFORMA_ID),
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
  } catch {
    const error: IdServiceApiError = Object.assign(
      new Error("No se pudo conectar con el servidor. Revisa tu conexion e intentalo de nuevo."),
      { status: 0, codigo: "NETWORK_ERROR" }
    );
    throw error;
  }

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = extractErrorMessage(payload, response.status) || "No fue posible subir la imagen.";
    throw Object.assign(new Error(message), { status: response.status });
  }

  return payload;
}

// --- Plataformas, roles y departamentos (para enriquecer Mi Perfil) -------

export interface IdServicePlataforma {
  ID: number;
  NOMBRE: string;
  CODIGO?: string;
  DESCRIPCION?: string | null;
}

/** Plataformas a las que el usuario tiene acceso (id-service/Plataformas.Routes.js). */
export async function listarPlataformasUsuario(
  usuarioId: number,
  token: string
): Promise<IdServicePlataforma[]> {
  const resp = await idServiceFetch<{ ok: boolean; data: IdServicePlataforma[] }>(
    `plataformas/obtener?usuarioId=${usuarioId}`,
    { method: "GET", token }
  );
  return resp?.data || [];
}

export interface IdServiceRol {
  roleId: number;
  nombre: string;
  descripcion?: string | null;
}

/** Un rol por id (id-service/Role.Routes.js). La consulta del backend hace
 * JOIN con submodulos/acciones y puede repetir el mismo rol varias filas;
 * solo se necesita nombre/descripcion, asi que basta la primera. */
export async function obtenerRolPorId(rolId: number, token: string): Promise<IdServiceRol | null> {
  try {
    const rows = await idServiceFetch<IdServiceRol[]>(`role/${rolId}`, { method: "GET", token });
    return Array.isArray(rows) && rows.length ? rows[0] : null;
  } catch {
    return null;
  }
}

export interface IdServiceDepartamento {
  DepartmentId: number;
  Name: string;
  Description?: string | null;
}

/** Un departamento por id (id-service/Departments.Routes.js). */
export async function obtenerDepartamentoPorId(
  departamentoId: number,
  token: string
): Promise<IdServiceDepartamento | null> {
  const resp = await idServiceFetch<{ ok: boolean; data: IdServiceDepartamento[] }>(
    `departments/get?departmentId=${departamentoId}`,
    { method: "GET", token }
  );
  return resp?.data?.[0] || null;
}
