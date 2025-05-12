// utils/decodeToken.ts
export const decodeToken = (token: string) => {
    try {
      const payload = token.split(".")[1];
      return JSON.parse(atob(payload));
    } catch (err) {
      console.error("❌ Error al decodificar token:", err);
      return null;
    }
  };
  