import { apiJson } from "@/utils/apiClient";

export const fetchUsuario = async () => {
  try {
    const data = await apiJson<Record<string, any>>("/api/auth/usuario", {
      auth: "required",
    });

    if (data?.ROL) {
      data.ROL = data.ROL.toLowerCase();
    }

    console.log("Usuario obtenido:", data);
    return data;
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    return null;
  }
};
