import { useState, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "@mui/material";
import { getAnalyticsSummary, type AnalyticsSummaryResponse, type AnalyticsFilters } from "@/services/analytics.service";

export const useDashboard = () => {
  const theme = useTheme();
  const [data, setData] = useState<AnalyticsSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Filters State
  const [filters, setFilters] = useState<AnalyticsFilters>({
    status: "all",
    startDate: "",
    endDate: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const activeFilters: AnalyticsFilters = {};
      if (filters.status && filters.status !== "all") activeFilters.status = filters.status;
      if (filters.startDate) activeFilters.startDate = filters.startDate;
      if (filters.endDate) activeFilters.endDate = filters.endDate;
      if (filters.factoryId) activeFilters.factoryId = filters.factoryId;

      const response = await getAnalyticsSummary(activeFilters);
      setData(response);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error("Error loading analytics:", err);
      setError("No se pudieron cargar los datos del panel. Verifica los filtros o intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (field: keyof AnalyticsFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      status: "all",
      startDate: "",
      endDate: "",
    });
  };

  // Data transformations
  const summary = data?.summary;

  const materialsData = useMemo(
    () =>
      data?.charts.materials.map((m, index) => ({
        id: m.id,
        value: m.count,
        label: `${m.name} (${m.percentage.toFixed(1)}%)`,
        color: [
          theme.palette.primary.main,
          theme.palette.secondary.main,
          theme.palette.success.main,
          theme.palette.warning.main,
          theme.palette.info.main,
          theme.palette.error.main,
        ][index % 6],
      })) || [],
    [data, theme],
  );

  const shapesData = useMemo(
    () =>
      data?.charts.shapes.map((s, index) => ({
        id: s.id,
        value: s.value,
        label: s.label
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(" "),
        color: [
          theme.palette.primary.light,
          theme.palette.secondary.light,
          theme.palette.success.light,
          theme.palette.warning.light,
          theme.palette.info.light,
          theme.palette.error.light,
        ][index % 6],
      })) || [],
    [data, theme],
  );

  const addonsData = useMemo(
    () =>
      data?.charts.addons
        ? [...data.charts.addons]
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
            .map((a) => ({
              ...a,
              label: a.label.length > 25 ? a.label.substring(0, 22) + "..." : a.label,
            }))
        : [],
    [data],
  );

  const trendsData = data?.trends.dailyQuotes || [];

  return {
    data,
    loading,
    error,
    lastUpdated,
    filters,
    fetchData,
    handleFilterChange,
    handleResetFilters,
    summary,
    materialsData,
    shapesData,
    addonsData,
    trendsData,
  };
};
