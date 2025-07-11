// utils/fetchUsuario.ts
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";

export const fetchUsuario = async () => {
  try {
    const response = await fetchWithToken(`${BACKEND_URL}/api/auth/usuario`);

    if (!response || !response.ok) {
      return null;
    }

    // utils/fetchUsuario.ts
    // ...
    const data = await response.json();
    if (data?.ROL) {
    data.ROL = data.ROL.toLowerCase();
    }
    console.log("Usuario obtenido:", data); // ✅ Agrega esto para depurar
    return data;
    // ...

    // ✅ normaliza el rol a minúsculas si existe
    if (data?.ROL) {
      data.ROL = data.ROL.toLowerCase();
    }

    return data;
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    return null;
  }
};
