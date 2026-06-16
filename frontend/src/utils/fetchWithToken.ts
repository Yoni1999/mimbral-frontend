import { apiRequest } from "@/utils/apiClient";

export const fetchWithToken = async (url: string, options: RequestInit = {}) => {
  return apiRequest(url, {
    ...options,
    auth: "required",
  });
};
  
