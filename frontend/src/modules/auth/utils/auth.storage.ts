import { AUTH_STORAGE_KEYS } from "../constants/auth.constants";

export function saveSession(token: string, role?: string) {
  localStorage.setItem(AUTH_STORAGE_KEYS.token, token);
  localStorage.setItem(AUTH_STORAGE_KEYS.role, role || "");
}

export function clearSession() {
  localStorage.removeItem(AUTH_STORAGE_KEYS.token);
  localStorage.removeItem(AUTH_STORAGE_KEYS.role);
}

export function getRememberedEmail(): string {
  return localStorage.getItem(AUTH_STORAGE_KEYS.rememberedEmail) || "";
}

export function setRememberedEmail(email: string) {
  localStorage.setItem(AUTH_STORAGE_KEYS.rememberedEmail, email);
}

export function clearRememberedEmail() {
  localStorage.removeItem(AUTH_STORAGE_KEYS.rememberedEmail);
}
