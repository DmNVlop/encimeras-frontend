import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Chip, Grid, List, ListItemButton, ListItemText, Paper, Skeleton, Stack, Typography } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { getPortalSummary, type PortalScope, type PortalSummaryResponse } from "@/services/analytics.service";
import { QuoteFunnelCard } from "@/components/common/analytics/QuoteFunnelCard";
import { ActivityTable } from "@/components/common/analytics/ActivityTable";
import { formatDate, formatPoints } from "@/components/common/analytics/analyticsFormat";
import { getOrderStatusMeta } from "@/utils/orderStatus.util";

const SCOPE_TEXT: Record<PortalScope, string> = {
  own: "Tus presupuestos y pedidos.",
  team: "Tus presupuestos y pedidos, los de tu equipo y los de tus clientes asignados.",
  factory: "Todos los presupuestos y pedidos de tu fábrica.",
  all: "Todos los presupuestos y pedidos de la plataforma.",
};

const KpiTile = ({ label, value, hint, loading }: { label: string; value: string; hint?: string; loading: boolean }) => (
  <Paper sx={{ p: 2, borderRadius: 3, height: "100%", boxSizing: "border-box" }}>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="h5" fontWeight="bold">
      {loading ? <Skeleton width={90} /> : value}
    </Typography>
    {hint && !loading && (
      <Typography variant="caption" color="text.secondary">
        {hint}
      </Typography>
    )}
  </Paper>
);

/** Resumen del portal (/dashboard): datos reales dentro del alcance del usuario (GET /analytics/me). */
export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<PortalSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getPortalSummary());
    } catch {
      setError("No se pudo cargar tu resumen.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const orders = data?.orders;
  const drafts = data?.drafts;
  const showBreakdown = !!data && data.scope !== "own";

  return (
    <Box data-testid="portal-dashboard">
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            Resumen
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {data ? SCOPE_TEXT[data.scope] : " "}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/quote")}>
          Nuevo Presupuesto
        </Button>
      </Stack>

      {error ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={fetchSummary}>
              Reintentar
            </Button>
          }
        >
          {error}
        </Alert>
      ) : (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <KpiTile label="Pedidos" value={(orders?.total ?? 0).toLocaleString("es-ES")} loading={loading} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <KpiTile
              label="Valor pedido"
              value={`${formatPoints(orders?.totalPoints ?? 0)} pts`}
              hint={orders?.totalDiscount ? `Descuentos aplicados: ${formatPoints(orders.totalDiscount)} pts` : undefined}
              loading={loading}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <KpiTile
              label="Borradores activos"
              value={(drafts?.active ?? 0).toLocaleString("es-ES")}
              hint={drafts?.expiringSoon ? `${drafts.expiringSoon} caducan en los próximos 7 días` : undefined}
              loading={loading}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <KpiTile label="Valor en borradores" value={`${formatPoints(drafts?.activePoints ?? 0)} pts`} loading={loading} />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2, borderRadius: 3, height: "100%", boxSizing: "border-box" }} data-testid="portal-recent-orders">
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" fontWeight="bold">
                  Últimos pedidos
                </Typography>
                <Button size="small" onClick={() => navigate("/my-quotes")}>
                  Ver todos
                </Button>
              </Stack>
              {!!orders?.byStatus.length && (
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ my: 1 }}>
                  {orders.byStatus.map((s) => (
                    <Chip key={s.status} size="small" color={getOrderStatusMeta(s.status).color} label={`${getOrderStatusMeta(s.status).label}: ${s.count}`} />
                  ))}
                </Stack>
              )}
              {loading ? (
                <Skeleton height={120} />
              ) : orders?.recent.length ? (
                <List dense>
                  {orders.recent.map((o) => (
                    <ListItemButton key={o.id} onClick={() => navigate(`/my-quotes/${o.id}`)}>
                      <ListItemText
                        primary={`${o.orderNumber} · ${o.orderName}`}
                        secondary={`${formatDate(o.orderDate)}${o.customerName ? ` · ${o.customerName}` : ""} · ${formatPoints(o.totalPoints)} pts`}
                      />
                      <Chip size="small" color={getOrderStatusMeta(o.status).color} label={getOrderStatusMeta(o.status).label} />
                    </ListItemButton>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  Todavía no hay pedidos.
                </Typography>
              )}
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2, borderRadius: 3, height: "100%", boxSizing: "border-box" }} data-testid="portal-recent-drafts">
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" fontWeight="bold">
                  Últimos borradores
                </Typography>
                <Button size="small" onClick={() => navigate("/drafts")}>
                  Ver todos
                </Button>
              </Stack>
              {loading ? (
                <Skeleton height={120} />
              ) : drafts?.recent.length ? (
                <List dense>
                  {drafts.recent.map((d) => (
                    <ListItemButton key={d.id} onClick={() => navigate("/drafts")}>
                      <ListItemText
                        primary={d.name}
                        secondary={`Actualizado ${formatDate(d.updatedAt)} · caduca ${formatDate(d.expirationDate)} · ${formatPoints(d.currentPricePoints)} pts`}
                      />
                    </ListItemButton>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary" sx={{ mt: 1 }}>
                  No hay borradores activos.
                </Typography>
              )}
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: showBreakdown ? 4 : 12 }}>
            <QuoteFunnelCard funnel={data?.activity.funnel} trackedSince={data?.activity.trackedSince} loading={loading} title={showBreakdown ? "Embudo de presupuestos" : "Tus presupuestos"} />
          </Grid>
          {showBreakdown && (
            <Grid size={{ xs: 12, md: 8 }}>
              <ActivityTable
                title="Por usuario"
                entityLabel="Usuario"
                rows={data.activity.byUser}
                loading={loading}
                emptyText="Sin actividad de usuarios"
                testId="portal-activity-by-user"
              />
            </Grid>
          )}
          {showBreakdown && (
            <Grid size={{ xs: 12 }}>
              <ActivityTable
                title="Por cliente"
                entityLabel="Cliente"
                rows={data.activity.byCustomer}
                loading={loading}
                emptyText="Sin presupuestos asociados a clientes"
                testId="portal-activity-by-customer"
              />
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
}
