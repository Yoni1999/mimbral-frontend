export function segundosRestantesDelToken(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;
    const ahora = Math.floor(Date.now() / 1000);
    return exp - ahora;
  } catch (error) {
    console.error("Token inválido:", error);
    return 0;
  }
}
