
export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://catalogomimbral.loclx.io";

export const ID_SERVICE_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL_ID_SERVICE ||
  "https://catalogomimbral.loclx.io/api/idservice";

export const PLATAFORMA_ID = Number(process.env.NEXT_PUBLIC_PLATAFORMA_ID) || 2;
