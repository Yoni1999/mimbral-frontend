import { BACKEND_URL } from "../config";

export async function fetchSafe(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");
  const isPublic = endpoint.includes("/auth/login") || endpoint.includes("/auth/register") || endpoint.includes("/auth/verificar-otp");

const headers: Record<string, string> = {
  "Content-Type": "application/json",
  ...(isPublic ? {} : { Authorization: `Bearer ${token}` }),
};

// Sobrescribir manualmente si se pasaron headers personalizados
if (options.headers && typeof options.headers === "object" && !(options.headers instanceof Headers)) {
  Object.assign(headers, options.headers);
}


  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    console.error("❌ Error en fetchSafe:", {
      status: response.status,
      statusText: response.statusText,
      body: data,
    });

    throw new Error(
      isJson
        ? (data?.error || data?.message || "Error desconocido")
        : "Respuesta inesperada del servidor"
    );
  }

  return data;
}
