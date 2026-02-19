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

export interface AnalyticsSummaryResponse {
  summary: DashboardSummary;
  charts: {
    materials: MaterialData[];
    addons: AddonData[];
    shapes: any[]; // Reserved for future use
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
