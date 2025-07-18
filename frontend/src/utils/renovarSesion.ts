// utils/auth/renovarSesion.ts
import { fetchWithToken } from "@/utils/fetchWithToken";
import { BACKEND_URL } from "@/config";

export async function renovarSesion(password: string): Promise<boolean> {
  try {
    const response = await fetchWithToken(`${BACKEND_URL}/api/renovar-sesion`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });

    if (!response || !response.ok) {
      console.error("Falló la renovación:", response ? await response.text() : "No response received");
      return false;
    }

    const { token } = await response.json();

    localStorage.setItem("token", token);
    console.log("Sesión renovada con éxito");
    return true;
  } catch (error) {
    console.error("Error al renovar sesión:", error);
    return false;
  }
}
