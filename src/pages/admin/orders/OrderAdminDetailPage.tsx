import React, { Suspense, useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Button, Divider, Grid, IconButton, Paper, Skeleton, Stack, Tooltip, Typography } from "@mui/material";
import { ArrowBack as ArrowBackIcon, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from "@mui/icons-material";
import { useSocket } from "@/context/SocketContext";
import { ordersApi } from "@/services/orders.service";
import { getCustomerById } from "@/services/customer.service";
import type { Order } from "@/interfases/orders.interfase";
import type { ICustomer } from "@/interfases/customer.interfase";
import { OrderStatusChip } from "@/components/common/orders/OrderStatusChip";
import { OrderStatusActions } from "@/components/common/orders/OrderStatusActions";
import { OrderStatusHistory } from "@/components/common/orders/OrderStatusHistory";
import { OrderProgress } from "@/components/common/orders/OrderProgress";
import { OrderLineItems } from "@/components/common/orders/OrderLineItems";
import { formatPoints } from "@/components/common/analytics/analyticsFormat";
import { formatOrderAge } from "@/utils/orderStatus.util";
import type { OrdersQueueState } from "./OrdersInboxPage";

const LazyDownloadPdfButton = React.lazy(() => import("@/components/cart/DownloadPdfButton"));

const sectionSx = { p: 1.5, borderRadius: 2, boxSizing: "border-box" as const };
const sectionTitleSx = { fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: 0.5, color: "text.secondary", mb: 1 };

const formatDate = (d?: string | Date) => (d ? new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }) : "—");

function InfoLine({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <Box sx={{ display: "flex", gap: 1, mb: 0.5, minWidth: 0 }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 82, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} sx={{ minWidth: 0, wordBreak: "break-word" }}>
        {value}
      </Typography>
    </Box>
  );
}

/** El usuario escribe en un campo o hay un diálogo abierto: J/K no deben saltar de pedido. */
const isTypingContext = (e: KeyboardEvent) => {
  const el = e.target as HTMLElement | null;
  return !!el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) || !!el.closest("[role='dialog']"));
};

/**
 * Ficha de pedido del backoffice a pantalla completa: barra fija con estado y acciones (las que el BE permite
 * a quien mira), anterior/siguiente en la cola de la bandeja (también con J/K), seguimiento, estancias y un lateral
 * con cliente, vendedor, económico, PDF e historial de estados.
 */
export const OrderAdminDetailPage: React.FC = () => {
  const { orderId = "" } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { socket } = useSocket();
  const queueState = (location.state as OrdersQueueState | null) ?? null;

  const [order, setOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<ICustomer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await ordersApi.findById(orderId);
      setOrder(data);
      return data;
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  // Al cambiar de pedido: cargar ficha y datos de cliente (el cliente no bloquea la vista si falla)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setOrder(null);
    setCustomer(null);
    load().then((data) => {
      const cid = data?.header?.customerId;
      if (!cid || cancelled) return;
      getCustomerById(cid)
        .then((c) => !cancelled && setCustomer(c))
        .catch(() => undefined);
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  // Tiempo real: si otro usuario cambia este pedido, se recarga (estado, acciones e historial)
  useEffect(() => {
    if (!socket) return;
    const onUpdate = (payload: { _id?: string }) => {
      if (payload?._id === orderId) load();
    };
    socket.on("orders:update", onUpdate);
    return () => {
      socket.off("orders:update", onUpdate);
    };
  }, [socket, orderId, load]);

  const queue = queueState?.queue ?? [];
  const position = queue.indexOf(orderId);
  const prevId = position > 0 ? queue[position - 1] : null;
  const nextId = position >= 0 && position < queue.length - 1 ? queue[position + 1] : null;

  const goTo = useCallback((id: string | null) => id && navigate(`/admin/orders/${id}`, { state: queueState, replace: true }), [navigate, queueState]);
  const goBack = useCallback(() => navigate(`/admin/orders${queueState?.from ?? ""}`), [navigate, queueState]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isTypingContext(e)) return;
      const key = e.key.toLowerCase();
      if (key === "j") goTo(nextId);
      else if (key === "k") goTo(prevId);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, nextId, prevId]);

  if (loading && !order) {
    return (
      <Box>
        <Skeleton variant="rounded" height={64} sx={{ mb: 1.5 }} />
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Skeleton variant="rounded" height={90} sx={{ mb: 1.5 }} />
            <Skeleton variant="rounded" height={260} />
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }}>
            <Skeleton variant="rounded" height={380} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (!order) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {error?.statusCode === 404 ? "El pedido no existe o no está a tu alcance." : error?.message || "No se pudo cargar el pedido."}
        </Alert>
        <Button size="small" startIcon={<ArrowBackIcon />} onClick={goBack}>
          Volver a la bandeja
        </Button>
      </Box>
    );
  }

  const { header, display } = order;
  const lastChange = header.statusHistory?.length ? header.statusHistory[header.statusHistory.length - 1].at : header.orderDate;
  const appliedRules = order.appliedGlobalRules ?? [];

  return (
    <Box sx={{ minWidth: 0 }}>
      {/* ── BARRA FIJA: identidad, estado, acciones y cola ── */}
      <Paper
        variant="outlined"
        sx={{ position: "sticky", top: { xs: 56, sm: 64 }, zIndex: (t) => t.zIndex.appBar - 1, px: 1.5, py: 1, mb: 1.5, borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
      >
        <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ xs: "stretch", md: "center" }} justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
            <Tooltip title="Volver a la bandeja">
              <IconButton onClick={goBack} aria-label="Volver a la bandeja">
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography variant="subtitle1" fontWeight={800} noWrap data-testid="order-detail-number">
                  {header.orderNumber}
                </Typography>
                <OrderStatusChip status={header.status} />
              </Stack>
              <Typography variant="caption" color="text.secondary" noWrap display="block">
                {header.orderName} · {formatOrderAge(lastChange)} en este estado
              </Typography>
            </Box>
            {queue.length > 0 && position >= 0 && (
              <Stack direction="row" alignItems="center" sx={{ flexShrink: 0 }}>
                <Tooltip title="Pedido anterior de la bandeja (K)">
                  <span>
                    <IconButton onClick={() => goTo(prevId)} disabled={!prevId} aria-label="Pedido anterior">
                      <ChevronLeftIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 36, textAlign: "center" }}>
                  {position + 1}/{queue.length}
                </Typography>
                <Tooltip title="Pedido siguiente de la bandeja (J)">
                  <span>
                    <IconButton onClick={() => goTo(nextId)} disabled={!nextId} aria-label="Pedido siguiente">
                      <ChevronRightIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
            )}
          </Stack>
          <OrderStatusActions orderId={order._id} actions={order.statusActions} onDone={load} />
        </Stack>
      </Paper>

      <Grid container spacing={1.5}>
        {/* ── PRINCIPAL: seguimiento y estancias ── */}
        <Grid size={{ xs: 12, lg: 8, xl: 9 }} sx={{ minWidth: 0 }}>
          <Paper variant="outlined" sx={{ ...sectionSx, mb: 1.5 }}>
            <Typography sx={sectionTitleSx}>Seguimiento</Typography>
            <OrderProgress status={header.status} history={header.statusHistory} />
          </Paper>
          <Paper variant="outlined" sx={sectionSx}>
            <Typography sx={sectionTitleSx}>
              Estancias ({order.items?.length ?? 0})
            </Typography>
            <OrderLineItems items={order.items} />
          </Paper>
        </Grid>

        {/* ── LATERAL: personas, económico, PDF e historial ── */}
        <Grid size={{ xs: 12, lg: 4, xl: 3 }} sx={{ minWidth: 0 }}>
          <Stack spacing={1.5}>
            <Paper variant="outlined" sx={sectionSx}>
              <Typography sx={sectionTitleSx}>Cliente y vendedor</Typography>
              <InfoLine label="Cliente" value={display?.customerName ?? (header.customerId ? "—" : "Sin cliente")} />
              <InfoLine label="NIF / CIF" value={customer?.nif} />
              <InfoLine label="Email" value={customer?.contact?.email ?? display?.customerEmail} />
              <InfoLine label="Teléfono" value={customer?.contact?.phone} />
              <InfoLine label="Dirección" value={customer?.address?.addressLine1 ? `${customer.address.addressLine1}${customer.address.city ? `, ${customer.address.city}` : ""}` : undefined} />
              <Divider sx={{ my: 1 }} />
              <InfoLine label="Vendedor" value={display?.userName ?? "—"} />
              <InfoLine label="Email" value={display?.userEmail} />
              <InfoLine label="Fecha" value={formatDate(header.orderDate)} />
              <InfoLine label="Entrega" value={header.deliveryDate ? formatDate(header.deliveryDate) : undefined} />
            </Paper>

            <Paper variant="outlined" sx={sectionSx}>
              <Typography sx={sectionTitleSx}>Económico (puntos)</Typography>
              <InfoLine label="Bruto" value={formatPoints(header.totalOriginalPoints)} />
              {appliedRules.map((rule) => (
                <InfoLine key={rule.ruleId} label="Descuento" value={<Box component="span" sx={{ color: "success.main" }}>{`${rule.ruleName}: -${formatPoints(rule.discountAmount)}`}</Box>} />
              ))}
              {header.totalDiscount > 0 && <InfoLine label="Ahorro" value={<Box component="span" sx={{ color: "success.main" }}>-{formatPoints(header.totalDiscount)}</Box>} />}
              <Divider sx={{ my: 1 }} />
              <Stack direction="row" justifyContent="space-between" alignItems="baseline" mb={1}>
                <Typography variant="body2" fontWeight={700}>
                  Total
                </Typography>
                <Typography variant="h6" fontWeight={800} color="primary.main">
                  {formatPoints(header.totalPoints)}
                </Typography>
              </Stack>
              <Suspense
                fallback={
                  <Button size="small" variant="outlined" fullWidth disabled>
                    Preparando PDF...
                  </Button>
                }
              >
                {/* «Preparado por» del PDF = quien hizo el pedido, no quien lo mira */}
                <LazyDownloadPdfButton cart={order as any} user={{ name: display?.userName }} customer={customer} pdfSource={{ source: "order", orderId: order._id }} />
              </Suspense>
            </Paper>

            <Paper variant="outlined" sx={sectionSx}>
              <Typography sx={sectionTitleSx}>Historial de estados</Typography>
              <OrderStatusHistory history={header.statusHistory} orderDate={header.orderDate} />
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OrderAdminDetailPage;
