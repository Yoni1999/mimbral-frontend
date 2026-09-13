// Cliente del módulo Administrador de Metas (analysis-service, bajo
// /api/goals — ver src/routes/metas/*.routes.js de ese servicio).
//
// A diferencia del resto del proyecto (que llama `apiJson` directo desde cada
// página), esto sigue el único precedente bueno que ya existe
// (idservice.client.ts / perfil): un cliente de servicio tipado, para no
// repetir el armado de query strings ni el shape del envoltorio de respuesta
// (`{ok, data, pagination, meta}`) en cada página del wizard.

import { apiJson } from "@/utils/apiClient";
import type {
  Goal,
  GoalAuditEntry,
  GoalDraft,
  GoalPeriod,
  GoalsSummary,
  Pagination,
  PeriodWarning,
  ProductOption,
  ResponsibleOption,
} from "../types";

interface Envelope<T> {
  ok: boolean;
  data: T;
  pagination: Pagination | null;
  meta?: Record<string, unknown>;
}

function buildQuery(params: object): string {
  const query = new URLSearchParams();
  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, String(value));
  });
  const texto = query.toString();
  return texto ? `?${texto}` : "";
}

// --- Periodos ---------------------------------------------------------

export interface ListarPeriodosParams {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export async function listarPeriodos(params: ListarPeriodosParams = {}) {
  const res = (await apiJson(`/api/goals/periods${buildQuery(params)}`, { auth: "required" })) as Envelope<GoalPeriod[]>;
  return { items: res.data, pagination: res.pagination };
}

export async function obtenerPeriodo(id: string) {
  const res = (await apiJson(`/api/goals/periods/${id}`, { auth: "required" })) as Envelope<GoalPeriod>;
  return res.data;
}

export interface PeriodoPayload {
  name: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  status?: "DRAFT" | "ACTIVE";
}

export async function crearPeriodo(payload: PeriodoPayload) {
  const res = (await apiJson("/api/goals/periods", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: "required",
  })) as Envelope<GoalPeriod> & { meta?: { warning?: PeriodWarning | null } };
  return { period: res.data, warning: res.meta?.warning ?? null };
}

export async function editarPeriodo(id: string, payload: PeriodoPayload) {
  const res = (await apiJson(`/api/goals/periods/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
    auth: "required",
  })) as Envelope<GoalPeriod> & { meta?: { warning?: PeriodWarning | null } };
  return { period: res.data, warning: res.meta?.warning ?? null };
}

export async function cerrarPeriodo(id: string) {
  const res = (await apiJson(`/api/goals/periods/${id}/close`, { method: "PATCH", auth: "required" })) as Envelope<GoalPeriod>;
  return res.data;
}

export async function cancelarPeriodo(id: string) {
  const res = (await apiJson(`/api/goals/periods/${id}/cancel`, { method: "PATCH", auth: "required" })) as Envelope<GoalPeriod>;
  return res.data;
}

export async function eliminarPeriodo(id: string) {
  await apiJson(`/api/goals/periods/${id}`, { method: "DELETE", auth: "required" });
}

// --- Metas --------------------------------------------------------------

export interface ListarMetasParams {
  search?: string;
  periodId?: string;
  targetType?: string;
  targetReferenceId?: string;
  goalType?: string;
  assignmentMode?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export async function listarMetas(params: ListarMetasParams = {}) {
  const res = (await apiJson(`/api/goals${buildQuery(params)}`, { auth: "required" })) as Envelope<Goal[]>;
  return { items: res.data, pagination: res.pagination };
}

export async function obtenerResumenMetas(params: { periodId?: string } = {}) {
  const res = (await apiJson(`/api/goals/summary${buildQuery(params)}`, { auth: "required" })) as Envelope<GoalsSummary>;
  return res.data;
}

export async function obtenerMeta(id: string) {
  const res = (await apiJson(`/api/goals/${id}`, { auth: "required" })) as Envelope<Goal>;
  return res.data;
}

export async function obtenerHistorialMeta(id: string, params: { page?: number; pageSize?: number } = {}) {
  const res = (await apiJson(`/api/goals/${id}/audit${buildQuery(params)}`, { auth: "required" })) as Envelope<GoalAuditEntry[]>;
  return { items: res.data, pagination: res.pagination };
}

export async function crearMeta(payload: GoalDraft) {
  const res = (await apiJson("/api/goals", { method: "POST", body: JSON.stringify(payload), auth: "required" })) as Envelope<Goal>;
  return res.data;
}

/** Cubre tanto "sólo cambié nombre/descripción" (sin `assignmentMode`) como
 *  "rehice responsables/objetivo" (con `assignmentMode`) — ver
 *  goals.controller.js `update` en el backend para el porqué de un solo PATCH. */
export async function editarMeta(id: string, payload: Partial<GoalDraft> & { name: string; description?: string | null }) {
  const res = (await apiJson(`/api/goals/${id}`, { method: "PATCH", body: JSON.stringify(payload), auth: "required" })) as Envelope<Goal>;
  return res.data;
}

export async function cancelarMeta(id: string) {
  const res = (await apiJson(`/api/goals/${id}/cancel`, { method: "PATCH", auth: "required" })) as Envelope<Goal>;
  return res.data;
}

export async function eliminarMeta(id: string) {
  await apiJson(`/api/goals/${id}`, { method: "DELETE", auth: "required" });
}

// --- Búsquedas auxiliares (sellers / sales channels / SKU) --------------

export async function buscarVendedores(q: string, page = 1, pageSize = 20) {
  const res = (await apiJson(`/api/goals/lookups/sellers${buildQuery({ q, page, pageSize })}`, {
    auth: "required",
  })) as Envelope<ResponsibleOption[]>;
  return { items: res.data, pagination: res.pagination };
}

export async function buscarCanalesDeVenta(q: string, page = 1, pageSize = 20) {
  const res = (await apiJson(`/api/goals/lookups/sales-channels${buildQuery({ q, page, pageSize })}`, {
    auth: "required",
  })) as Envelope<ResponsibleOption[]>;
  return { items: res.data, pagination: res.pagination };
}

export async function buscarProductos(q: string, page = 1, pageSize = 20) {
  const res = (await apiJson(`/api/goals/lookups/products${buildQuery({ q, page, pageSize })}`, {
    auth: "required",
  })) as Envelope<ProductOption[]>;
  return { items: res.data, pagination: res.pagination };
}
