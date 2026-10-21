/** Formatos compartidos por las vistas de analítica (admin y portal). */
export const formatPoints = (value: number) => (value ?? 0).toLocaleString("es-ES", { maximumFractionDigits: 2 });

export const formatPercent = (part: number, total: number) => (total > 0 ? `${((part / total) * 100).toFixed(1)}%` : "—");

export const formatDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("es-ES") : "—");
