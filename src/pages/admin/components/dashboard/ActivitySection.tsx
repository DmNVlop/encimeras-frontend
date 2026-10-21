import React, { useCallback, useEffect, useState } from "react";
import { Alert, Button, Grid, Typography } from "@mui/material";
import { getActivity, type ActivityFilters, type ActivityResponse } from "@/services/analytics.service";
import { QuoteFunnelCard } from "@/components/common/analytics/QuoteFunnelCard";
import { ActivityTable } from "@/components/common/analytics/ActivityTable";

interface ActivitySectionProps {
  filters: ActivityFilters;
}

/** Actividad de presupuestos (quién presupuesta, cuánto convierte cada usuario y cliente), con los filtros de fecha del panel. */
export const ActivitySection: React.FC<ActivitySectionProps> = ({ filters }) => {
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { startDate, endDate, factoryId } = filters;

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getActivity({ startDate: startDate || undefined, endDate: endDate || undefined, factoryId: factoryId || undefined }));
    } catch {
      setError("No se pudo cargar la actividad de presupuestos.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, factoryId]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  return (
    <>
      <Grid size={{ xs: 12 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mt: 1 }}>
          Actividad de presupuestos
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Quién hace los presupuestos y cuántos llegan a pedido. Usa las fechas del filtro; el filtro de estado no aplica aquí.
        </Typography>
      </Grid>

      {error ? (
        <Grid size={{ xs: 12 }}>
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={fetchActivity}>
                Reintentar
              </Button>
            }
          >
            {error}
          </Alert>
        </Grid>
      ) : (
        <>
          <Grid size={{ xs: 12, lg: 4 }}>
            <QuoteFunnelCard funnel={data?.funnel} trackedSince={data?.trackedSince} loading={loading} />
          </Grid>
          <Grid size={{ xs: 12, lg: 8 }}>
            <ActivityTable
              title="Por usuario"
              entityLabel="Usuario"
              rows={data?.byUser ?? []}
              loading={loading}
              emptyText="Sin actividad de usuarios en el periodo"
              testId="activity-by-user"
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <ActivityTable
              title="Por cliente"
              entityLabel="Cliente"
              rows={data?.byCustomer ?? []}
              loading={loading}
              emptyText="Sin presupuestos asociados a clientes en el periodo"
              testId="activity-by-customer"
            />
          </Grid>
        </>
      )}
    </>
  );
};
