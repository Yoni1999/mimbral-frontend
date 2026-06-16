import { apiJson } from "@/utils/apiClient";
import type {
  LoginRequest,
  LoginResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  RegisterRequest,
  RegisterResponse,
} from "../types/auth.types";

export async function loginUser(payload: LoginRequest): Promise<LoginResponse> {
  return apiJson<LoginResponse>("/api/auth/login", {
    method: "POST",
    auth: "none",
    body: JSON.stringify(payload),
  });
}

export async function verifyOtp(payload: VerifyOtpRequest): Promise<VerifyOtpResponse> {
  return apiJson<VerifyOtpResponse>("/api/auth/verify-otp", {
    method: "POST",
    auth: "none",
    body: JSON.stringify(payload),
  });
}

export async function resendOtp(email: string): Promise<{ message?: string }> {
  return apiJson<{ message?: string }>("/api/auth/login", {
    method: "POST",
    auth: "none",
    body: JSON.stringify({ email, password: "" }),
  });
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

  return apiJson<RegisterResponse>("/api/auth/register", {
    method: "POST",
    auth: "none",
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
}
