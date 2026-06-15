import { BACKEND_URL } from "@/config";
import { fetchSafe } from "@/utils/fetchSafe";
import type {
  LoginRequest,
  LoginResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  RegisterRequest,
  RegisterResponse,
} from "../types/auth.types";

export async function loginUser(payload: LoginRequest): Promise<LoginResponse> {
  return fetchSafe("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function verifyOtp(payload: VerifyOtpRequest): Promise<VerifyOtpResponse> {
  const response = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Codigo invalido");
  }

  return data;
}

export async function resendOtp(email: string): Promise<{ message?: string }> {
  const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "" }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "No se pudo reenviar el codigo");
  }

  return data;
}

async function getPublicIp(): Promise<string> {
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    return data?.ip || "";
  } catch {
    return "";
  }
}

async function getGeoData(): Promise<{
  ciudad: string;
  region: string;
  pais: string;
  latitud: number | null;
  longitud: number | null;
}> {
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();
    return {
      ciudad: data?.city || "",
      region: data?.region || "",
      pais: data?.country_name || "",
      latitud: data?.latitude || null,
      longitud: data?.longitude || null,
    };
  } catch {
    return {
      ciudad: "",
      region: "",
      pais: "",
      latitud: null,
      longitud: null,
    };
  }
}

export async function registerUser(payload: RegisterRequest): Promise<RegisterResponse> {
  const [ip, geo] = await Promise.all([getPublicIp(), getGeoData()]);

  const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      ip_registro: ip,
      ciudad: geo.ciudad,
      region: geo.region,
      pais: geo.pais,
      latitud: geo.latitud,
      longitud: geo.longitud,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Error al registrar");
  }

  return data;
}
