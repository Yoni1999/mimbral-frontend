export const AUTH_STORAGE_KEYS = {
  token: "token",
  role: "rol",
  rememberedEmail: "rememberedEmail",
  // Sesion completa del id-service (usuarioId, plataformaId, scope, etc.),
  // ver IdServiceSession en auth.types.ts.
  session: "idServiceSession",
} as const;
