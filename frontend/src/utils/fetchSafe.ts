import { apiJson } from "@/utils/apiClient";

export async function fetchSafe(endpoint: string, options: RequestInit = {}) {
  return apiJson(endpoint, {
    ...options,
    auth: "optional",
  });
}
