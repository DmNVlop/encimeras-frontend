import React from "react";
import { Box, Paper, Skeleton, Stack, Typography, LinearProgress, Tooltip } from "@mui/material";
import type { QuoteFunnel } from "@/services/analytics.service";
import { formatDate, formatPercent, formatPoints } from "./analyticsFormat";

interface QuoteFunnelCardProps {
  funnel?: QuoteFunnel;
  trackedSince?: string | null;
  loading: boolean;
  title?: string;
}

const STEPS: { key: keyof QuoteFunnel; label: string; info: string }[] = [
  { key: "calculated", label: "Calculados", info: "Presupuestos con al menos un cálculo de precio en el configurador." },
  { key: "pdfDownloaded", label: "PDF descargado", info: "Presupuestos cuyo PDF se descargó (carrito u orden)." },
  { key: "draftSaved", label: "Guardados", info: "Presupuestos guardados como borrador." },
  { key: "cartAdded", label: "En carrito", info: "Presupuestos añadidos al carrito." },
  { key: "ordered", label: "Pedidos", info: "Presupuestos que acabaron en una orden." },
];

/** Embudo de presupuestos: cuántos llegan a cada paso, sobre el total de presupuestos con actividad. */
export const QuoteFunnelCard: React.FC<QuoteFunnelCardProps> = ({ funnel, trackedSince, loading, title = "Embudo de presupuestos" }) => {
  const total = funnel?.quotes ?? 0;

  return (
    <Paper sx={{ p: 2, borderRadius: 3, height: "100%", boxSizing: "border-box" }} data-testid="quote-funnel">
      <Stack direction="row" flexWrap="wrap" useFlexGap justifyContent="space-between" alignItems="baseline" columnGap={1} sx={{ mb: 1.5 }}>
        <Typography variant="h6" fontWeight="bold">
          {title}
        </Typography>
        {loading ? (
          <Skeleton width={180} />
        ) : (
          <Typography variant="body2" color="text.secondary">
            {total.toLocaleString("es-ES")} presupuestos · conversión {formatPercent(funnel?.ordered ?? 0, total)}
          </Typography>
        )}
      </Stack>

      <Stack spacing={1.5}>
        {STEPS.map((step) => {
          const value = funnel?.[step.key] ?? 0;
          return (
            <Box key={step.key}>
              <Stack direction="row" justifyContent="space-between">
                <Tooltip title={step.info} placement="top-start">
                  <Typography variant="body2">{step.label}</Typography>
                </Tooltip>
                {loading ? (
                  <Skeleton width={60} />
                ) : (
                  <Typography variant="body2" fontWeight="bold">
                    {value.toLocaleString("es-ES")}{" "}
                    <Typography component="span" variant="caption" color="text.secondary">
                      ({formatPercent(value, total)})
                    </Typography>
                  </Typography>
                )}
              </Stack>
              <LinearProgress variant={loading ? "indeterminate" : "determinate"} value={total > 0 ? (value / total) * 100 : 0} sx={{ height: 6, borderRadius: 3 }} />
            </Box>
          );
        })}
      </Stack>

      <Stack direction="row" spacing={3} sx={{ mt: 1.5 }}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Valor presupuestado
          </Typography>
          <Typography fontWeight="bold">{loading ? <Skeleton width={80} /> : `${formatPoints(funnel?.quotedPoints ?? 0)} pts`}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Valor pedido
          </Typography>
          <Typography fontWeight="bold">{loading ? <Skeleton width={80} /> : `${formatPoints(funnel?.orderedPoints ?? 0)} pts`}</Typography>
        </Box>
      </Stack>

      {!loading && (
        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1.5 }}>
          {trackedSince
            ? `Cálculos y descargas de PDF se miden desde el ${formatDate(trackedSince)}; lo anterior solo incluye pedidos y borradores.`
            : "Todavía no hay actividad registrada en vivo: solo se muestran pedidos y borradores anteriores."}
          {" Pedidos = presupuestos pedidos (una orden puede incluir varios); en carrito incluye los ya pedidos."}
        </Typography>
      )}
    </Paper>
  );
};
