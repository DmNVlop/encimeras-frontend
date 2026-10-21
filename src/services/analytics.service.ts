import { get } from "./api.service";

export interface DashboardSummary {
  totalQuotes: number;
  totalPoints: number;
  avgPointsPerProject: number;
  totalSqm: number;
  totalMl: number;
  avgPiecesPerProject: number;
}

export interface MaterialData {
  id: string;
  name: string;
  count: number;
  percentage: number;
}

export interface AddonData {
  code: string;
  label: string;
  count: number;
}

export interface TrendData {
  date: string;
  count: number;
  points: number;
}

export interface ShapeData {
  id: string;
  label: string;
  value: number;
}

export interface AnalyticsSummaryResponse {
  summary: DashboardSummary;
  charts: {
    materials: MaterialData[];
    addons: AddonData[];
    shapes: ShapeData[];
  };
  trends: {
    dailyQuotes: TrendData[];
  };
}

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  status?: "order" | "draft" | "all";
  factoryId?: string;
}

export const getAnalyticsSummary = (filters?: AnalyticsFilters): Promise<AnalyticsSummaryResponse> => {
  return get<AnalyticsSummaryResponse>("/admin/analytics/summary", { params: filters });
};

// --- Actividad de presupuestos (quote_events) ---

/** Cuántos presupuestos distintos llegaron a cada paso. */
export interface QuoteFunnel {
  quotes: number;
  calculated: number;
  pdfDownloaded: number;
  draftSaved: number;
  cartAdded: number;
  ordered: number;
  quotedPoints: number;
  orderedPoints: number;
}

export interface ActivityRow extends QuoteFunnel {
  /** userId o customerId; null = presupuestos sin sesión. */
  id: string | null;
  name: string;
  email?: string;
}

export interface ActivityResponse {
  funnel: QuoteFunnel;
  byUser: ActivityRow[];
  byCustomer: ActivityRow[];
  /** Desde cuándo se miden cálculos y descargas de PDF (lo anterior es histórico reconstruido). */
  trackedSince: string | null;
}

export type ActivityFilters = Pick<AnalyticsFilters, "startDate" | "endDate" | "factoryId">;

export const getActivity = (filters?: ActivityFilters): Promise<ActivityResponse> => {
  return get<ActivityResponse>("/admin/analytics/activity", { params: filters });
};

// --- Resumen del portal de usuario ---

export interface PortalOrder {
  id: string;
  orderNumber: string;
  orderName: string;
  status: string;
  totalPoints: number;
  totalDiscount: number;
  orderDate: string;
  customerName?: string;
}

export interface PortalDraft {
  id: string;
  name: string;
  currentPricePoints: number;
  discountAmount: number;
  updatedAt: string;
  expirationDate: string;
}

/** Alcance con el que se calculó el resumen: own = lo propio; team = el suyo y el de su equipo/clientes. */
export type PortalScope = "all" | "factory" | "team" | "own";

export interface PortalSummaryResponse {
  scope: PortalScope;
  orders: {
    total: number;
    totalPoints: number;
    totalOriginalPoints: number;
    totalDiscount: number;
    byStatus: { status: string; count: number; points: number }[];
    recent: PortalOrder[];
  };
  drafts: {
    active: number;
    expiringSoon: number;
    activePoints: number;
    recent: PortalDraft[];
  };
  activity: ActivityResponse;
}

export const getPortalSummary = (): Promise<PortalSummaryResponse> => {
  return get<PortalSummaryResponse>("/analytics/me");
};
