// Tipos del módulo Administrador de Metas — calcan el contrato del backend
// (analysis-service, src/models/metas/*.model.js). Ver ese servicio para el
// significado exacto de cada campo.

export type PeriodStatus = "DRAFT" | "ACTIVE" | "CLOSED" | "CANCELLED";
export type GoalType = "SALES_AMOUNT" | "SKU_QUANTITY";
export type AssignmentMode = "INDIVIDUAL" | "SHARED" | "DISTRIBUTED";
export type TargetType = "SELLER" | "SALES_CHANNEL";
export type GoalStatus = "ACTIVE" | "CANCELLED";

export interface GoalPeriod {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  status: PeriodStatus;
  goalCount?: number;
  createdByUserId: string;
  createdByUserName: string | null;
  createdAt: string;
  updatedByUserId: string | null;
  updatedByUserName: string | null;
  updatedAt: string | null;
}

export interface GoalTarget {
  id?: string;
  targetType: TargetType;
  targetReferenceId: string;
  targetCode?: string | null;
  targetName?: string | null;
  /** Sólo aplica en SALES_AMOUNT + DISTRIBUTED. */
  assignedAmount?: number | null;
}

export interface GoalItem {
  id?: string;
  sku: string;
  productName?: string | null;
  targetQuantity: number;
}

/** Shape que espera el backend al ESCRIBIR (crear/editar) una meta. */
export interface GoalTargetItem {
  targetReferenceId: string;
  sku: string;
  assignedQuantity: number;
}

/** Shape que devuelve el backend al LEER el detalle de una meta
 *  (GET /api/goals/:id): referencia ids internos de GoalTarget/GoalItem, no
 *  targetReferenceId/sku directamente — hay que resolverlos contra
 *  `goal.targets`/`goal.items` (ver [id]/page.tsx). */
export interface GoalTargetItemDetail {
  id: string;
  goalTargetId: string;
  goalItemId: string;
  assignedQuantity: number;
}

export interface Goal {
  id: string;
  periodId: string;
  periodName?: string;
  periodStatus?: PeriodStatus;
  periodStartDate?: string;
  periodEndDate?: string;
  name: string;
  description: string | null;
  goalType: GoalType;
  assignmentMode: AssignmentMode;
  currencyCode: string | null;
  targetAmount: number | null;
  status: GoalStatus;
  // Presentes sólo en el listado (agregados por SQL, no en el detalle).
  targetType?: TargetType;
  targetNames?: string;
  targetCount?: number;
  // Presentes sólo en el detalle (GET /api/goals/:id).
  targets?: GoalTarget[];
  items?: GoalItem[];
  targetItems?: GoalTargetItemDetail[];
  createdByUserId: string;
  createdByUserName: string | null;
  createdAt: string;
  updatedByUserId: string | null;
  updatedByUserName: string | null;
  updatedAt: string | null;
}

export interface GoalAuditEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  userId: string;
  userName: string | null;
  previousValue: unknown;
  newValue: unknown;
  createdAt: string;
}

export interface GoalsSummary {
  totalGoals: number;
  activeGoals: number;
  cancelledGoals: number;
  // Reservado para cuando se defina el cálculo de cumplimiento contra SAP.
  overallCompliancePct: number | null;
  goalsMet: number | null;
  activePeriod: GoalPeriod | null;
}

/** Opción normalizada de vendedor o canal de venta (ver lookups.service.js
 *  del backend, que ya unifica el shape real de oms-service/comerce-service). */
export interface ResponsibleOption {
  referenceId: string;
  code: string;
  name: string;
  status?: string | null;
}

/** Opción normalizada de producto/SKU (catalog-service-v1 vía el backend). */
export interface ProductOption {
  sku: string;
  productName: string;
  status?: string | null;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
}

export interface PeriodWarning {
  code: string;
  message: string;
  periods?: { id: string; name: string; startDate: string; endDate: string; status: PeriodStatus }[];
}

/** Payload de creación/edición de meta — mismo shape que espera
 *  goals.service.js `validarYNormalizarAsignacion`. */
export interface GoalDraft {
  periodId: string;
  name: string;
  description?: string | null;
  goalType: GoalType;
  assignmentMode: AssignmentMode;
  currencyCode?: string | null;
  targetAmount?: number | null;
  targets: GoalTarget[];
  items?: GoalItem[];
  targetItems?: GoalTargetItem[];
}
