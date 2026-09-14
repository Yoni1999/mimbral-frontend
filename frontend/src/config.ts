// Antes apuntaba directo al tunel propio de analysis-service
// (backmimbral2025.loclx.io); ahora pasa por el api-gateway compartido, igual
// que ID_SERVICE_BASE_URL de abajo. OJO: NO se agrega el sufijo /v1 aca —
// resolveUrl() en apiClient.ts ya se lo antepone solo a cualquier endpoint que
// empiece con /api (para no terminar pegandole a /v1/v1/api/...).
export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://catalogomimbral.loclx.io";

// Base del id-service (login, recuperar contrasena, etc.). Se llama directo
// desde el navegador (sin BFF con cookie httpOnly, a diferencia de FrontOms):
// por eso vive en una var NEXT_PUBLIC_*, igual que BACKEND_URL de arriba.
export const ID_SERVICE_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL_ID_SERVICE ||
  "https://catalogomimbral.loclx.io/api/idservice";

// Plataforma con la que Analisis 360 se identifica ante id-service (2 =
// Analisis 360). El gateway exige que el header `x-plataforma-id` de cada
// request coincida con el `plataformaId` que trae el JWT (ver
// api-gateway/src/middlewares/auth.js), asi que queda configurable por env en
// vez de fijo en el codigo.
export const PLATAFORMA_ID = Number(process.env.NEXT_PUBLIC_PLATAFORMA_ID) || 2;
