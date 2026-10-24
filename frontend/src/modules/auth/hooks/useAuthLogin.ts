import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loginIdService } from "../services/idservice.client";
import {
  clearRememberedEmail,
  getRememberedEmail,
  saveIdServiceSession,
  setRememberedEmail,
} from "../utils/auth.storage";
import {
  formatRutForInput,
  isValidLoginIdentifier,
  looksLikeRutInput,
  normalizeIdentifierForApi,
} from "../utils/rut";
import type { IdServiceApiError } from "../types/auth.types";

/** Traduce el error del id-service/gateway a un mensaje que el usuario entiende. */
function friendlyMessage(error: IdServiceApiError): string {
  const raw = (error.message || "").trim();
  const status = error.status;

  if (status === 409 || error.forceLogin) {
    return raw || "Ya existe una sesión activa. ¿Deseas cerrarla e iniciar una nueva?";
  }
  if (raw) return raw;
  if (status === 401) return "Credenciales inválidas. Revisa tu usuario y contraseña.";
  if (status === 403) return "Tu usuario no tiene permisos para acceder a esta plataforma.";
  if (status === 429) return "Demasiados intentos. Espera unos minutos antes de reintentar.";
  if (status === 0 || error.codigo === "NETWORK_ERROR") {
    return "No se pudo conectar con el servidor. Revisa tu conexion e intentalo de nuevo.";
  }
  if (typeof status === "number" && status >= 500) {
    return "El servicio de autenticacion no esta disponible. Intentalo en unos minutos.";
  }
  return "Se produjo un error inesperado.";
}

export function useAuthLogin() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [showForceLogin, setShowForceLogin] = useState(false);

  useEffect(() => {
    const savedEmail = getRememberedEmail();
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const togglePassword = () => setShowPassword((prev) => !prev);

  // Mientras se escribe un RUT se le van agregando puntos y el guion del DV;
  // si no parece RUT (trae una @, por ejemplo) se deja tal cual porque es un
  // correo. La contrasena no se habilita hasta que uno de los dos formatos
  // quede valido (ver identifierIsValid).
  const handleEmailChange = (value: string) => {
    setEmail(looksLikeRutInput(value) ? formatRutForInput(value) : value);
  };

  const identifierIsValid = isValidLoginIdentifier(email);
  const passwordEnabled = identifierIsValid;

  const doLogin = async (forzarSesion: boolean) => {
    setLoading(true);
    setError("");
    setShowForceLogin(false);

    try {
      const correo = normalizeIdentifierForApi(email);
      const data = await loginIdService({ correo, password, forzarSesion });

      if (rememberMe) setRememberedEmail(email.trim());
      else clearRememberedEmail();

      saveIdServiceSession(data);
      router.push("/inicio");
    } catch (err) {
      const apiError = err as IdServiceApiError;
      setError(friendlyMessage(apiError));
      setShowForceLogin(Boolean(apiError.forceLogin));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => doLogin(false);
  const handleForceLogin = () => doLogin(true);

  return {
    showPassword,
    email,
    password,
    rememberMe,
    loading,
    error,
    showForceLogin,
    identifierIsValid,
    passwordEnabled,
    setEmail: handleEmailChange,
    setPassword,
    setRememberMe,
    togglePassword,
    handleLogin,
    handleForceLogin,
  };
}
