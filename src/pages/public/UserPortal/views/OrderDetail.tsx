import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Box, Container, Typography, Grid, Card, CardContent, Stack, Divider, IconButton, Skeleton, Alert, Button } from "@mui/material";
import { ArrowBack as ArrowBackIcon, Person as PersonIcon, Receipt as ReceiptIcon } from "@mui/icons-material";
import { ordersApi } from "@/services/orders.service";
import { getCustomerById } from "@/services/customer.service";
import { useSocket } from "@/context/SocketContext";
import type { Order } from "@/interfases/orders.interfase";
import type { ICustomer } from "@/interfases/customer.interfase";
import { OrderLineItems } from "@/components/common/orders/OrderLineItems";
import { OrderStatusChip } from "@/components/common/orders/OrderStatusChip";
import { OrderStatusActions } from "@/components/common/orders/OrderStatusActions";
import { OrderStatusHistory } from "@/components/common/orders/OrderStatusHistory";
import { OrderProgress } from "@/components/common/orders/OrderProgress";

// Lazy load del botón PDF — igual que en el carrito, para no penalizar el bundle inicial
const LazyDownloadPdfButton = React.lazy(() => import("@/components/cart/DownloadPdfButton"));

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const formatDate = (d: Date | string | undefined) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
};

const cardSx = { borderRadius: 2, border: "1px solid", borderColor: "divider", boxShadow: "none" } as const;

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON DE CARGA
// ─────────────────────────────────────────────────────────────────────────────
function OrderDetailSkeleton() {
  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Skeleton width={200} height={32} sx={{ mb: 1 }} />
      <Skeleton width="60%" height={44} sx={{ mb: 2 }} />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Skeleton variant="rounded" height={100} sx={{ mb: 2 }} />
          <Skeleton variant="rounded" height={140} sx={{ mb: 2 }} />
          <Skeleton variant="rounded" height={120} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Skeleton variant="rounded" height={280} />
        </Grid>
      </Grid>
    </Container>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TARJETA DE INFORMACIÓN (Cliente / Documento)
// ─────────────────────────────────────────────────────────────────────────────
interface InfoRowProps {
  label: string;
  value?: string | null;
}
function InfoRow({ label, value }: InfoRowProps) {
  if (!value) return null;
  return (
    <Box sx={{ display: "flex", gap: 1, mb: 0.5, minWidth: 0 }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 90, flexShrink: 0 }}>
        {label}:
      </Typography>
      <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ wordBreak: "break-word" }}>
        {value}
      </Typography>
    </Box>
  );
}

function SectionTitle({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} mb={1}>
      {icon}
      <Typography variant="subtitle2" fontWeight={700} textTransform="uppercase" color="text.secondary" letterSpacing={0.5}>
        {children}
      </Typography>
    </Stack>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PANEL DE TOTALES (sidebar derecha)
// ─────────────────────────────────────────────────────────────────────────────
function TotalsPanel({ order, customer }: { order: Order; customer: ICustomer | null }) {
  const { header, display } = order;

  return (
    <Card sx={cardSx}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          Resumen Económico
        </Typography>
        <Divider sx={{ mb: 1.5 }} />

        <Stack spacing={1}>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="body2" color="text.secondary">
              Subtotal bruto
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {(header.totalOriginalPoints ?? 0).toFixed(2)}
            </Typography>
          </Box>

          {/* Reglas globales si vienen en la orden */}
          {(order as any).appliedGlobalRules?.length > 0 && (
            <Box>
              <Typography variant="caption" color="success.main" fontWeight={700} display="block" mb={0.5}>
                Descuentos aplicados:
              </Typography>
              {(order as any).appliedGlobalRules.map((rule: any, i: number) => (
                <Box key={i} sx={{ display: "flex", justifyContent: "space-between", pl: 1 }}>
                  <Typography variant="caption" color="success.main">
                    • {rule.ruleName}
                  </Typography>
                  <Typography variant="caption" color="success.main" fontWeight={600}>
                    -{rule.discountAmount.toFixed(2)}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}

          {header.totalDiscount > 0 && (
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body2" color="success.main" fontWeight={600}>
                Ahorro total
              </Typography>
              <Typography variant="body2" color="success.main" fontWeight={700}>
                -{(header.totalDiscount ?? 0).toFixed(2)}
              </Typography>
            </Box>
          )}

          <Divider />

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="subtitle1" fontWeight={700}>
              Total Final
            </Typography>
            <Typography variant="h6" fontWeight={800} color="primary.main">
              {(header.totalPoints ?? 0).toFixed(2)}
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ my: 1.5 }} />

        {/* BOTÓN PDF — «preparado por» es el vendedor del pedido (display del BE), no quien lo mira */}
        <Suspense
          fallback={
            <Button variant="outlined" size="small" fullWidth disabled>
              Preparando PDF...
            </Button>
          }
        >
          <LazyDownloadPdfButton cart={order as any} user={{ name: display?.userName }} customer={customer} pdfSource={{ source: "order", orderId: order._id }} />
        </Suspense>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function OrderDetail() {
  const { orderId = "" } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { socket } = useSocket();
  // Volver a la lista con la misma pestaña, búsqueda y página (MyQuotes pasa su `location.search`)
  const backTo = `/my-quotes${(location.state as { from?: string } | null)?.from ?? ""}`;

  const [order, setOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<ICustomer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Recarga la orden (estado, acciones e historial); la usan la carga inicial, el cambio de estado y el socket
  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await ordersApi.findById(orderId);
      setOrder(data);
      return data;
    } catch (err: any) {
      setError(err?.message || "Error al cargar la orden.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  // Al cambiar de pedido: cargar orden y datos de cliente (el cliente no bloquea la vista si falla)
  useEffect(() => {
    if (!orderId) return;
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
  }, [orderId, load]);

  // Tiempo real: cuando la fábrica cambia el estado de este pedido, el cliente lo ve sin recargar
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

  if (loading) return <OrderDetailSkeleton />;

  if (!order) {
    return (
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || "No se encontró la orden solicitada."}
        </Alert>
        <Button size="small" startIcon={<ArrowBackIcon />} onClick={() => navigate(backTo)}>
          Volver a Mis Presupuestos
        </Button>
      </Container>
    );
  }

  const { header, display } = order;

  // Nombre del cliente: ficha completa si se pudo cargar; si no, el nombre resuelto por el BE
  const customerDisplayName =
    customer?.officialName ||
    customer?.commercialName ||
    (customer?.firstName ? `${customer.firstName} ${customer.lastName || ""}`.trim() : display?.customerName || "Sin cliente asignado");

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      {/* ── VOLVER ── */}
      <Stack direction="row" alignItems="center" spacing={1} mb={1.5} sx={{ minWidth: 0 }}>
        <IconButton onClick={() => navigate(backTo)} size="small" sx={{ bgcolor: "action.hover" }} aria-label="Volver a Mis Presupuestos">
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Typography variant="body2" color="text.secondary" noWrap>
          Mis Presupuestos
        </Typography>
        <Typography variant="body2" color="text.disabled">
          /
        </Typography>
        <Typography variant="body2" color="text.primary" fontWeight={600} noWrap>
          {header.orderName}
        </Typography>
      </Stack>

      {/* ── CABECERA: nombre, estado y acciones que el BE permite a quien mira (cliente: cancelar en PENDING) ── */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} mb={2} gap={1.5}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h5" fontWeight={800} sx={{ wordBreak: "break-word" }}>
            {header.orderName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {header.orderNumber} — {customerDisplayName}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
          <Box data-testid="portal-order-status">
            <OrderStatusChip status={header.status} size="medium" />
          </Box>
          <OrderStatusActions orderId={order._id} actions={order.statusActions} onDone={load} />
        </Stack>
      </Stack>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        {/* ── COLUMNA PRINCIPAL ── */}
        <Grid size={{ xs: 12, md: 8 }}>
          {/* Seguimiento del pedido (o motivo si está rechazado/cancelado) */}
          <Card sx={{ ...cardSx, mb: 2 }} data-testid="portal-order-progress">
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
              <SectionTitle>Seguimiento del pedido</SectionTitle>
              <OrderProgress status={header.status} history={header.statusHistory} />
            </CardContent>
          </Card>

          {/* Tarjetas de info: Cliente y Documento */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Card sx={{ ...cardSx, height: "100%" }}>
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <SectionTitle icon={<PersonIcon sx={{ color: "primary.main", fontSize: 20 }} />}>Datos del Cliente</SectionTitle>
                  {customer || display?.customerName ? (
                    <>
                      <InfoRow label="Nombre" value={customerDisplayName} />
                      {customer?.nif && <InfoRow label="NIF / CIF" value={customer.nif} />}
                      <InfoRow label="Email" value={customer?.contact?.email ?? display?.customerEmail} />
                      <InfoRow label="Teléfono" value={customer?.contact?.phone} />
                      {customer?.address?.addressLine1 && (
                        <InfoRow label="Dirección" value={`${customer.address.addressLine1}${customer.address.city ? `, ${customer.address.city}` : ""}`} />
                      )}
                    </>
                  ) : (
                    <Typography variant="body2" color="text.disabled" fontStyle="italic">
                      Datos de cliente no disponibles
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Card sx={{ ...cardSx, height: "100%" }}>
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <SectionTitle icon={<ReceiptIcon sx={{ color: "primary.main", fontSize: 20 }} />}>Detalles del Presupuesto</SectionTitle>
                  <InfoRow label="Nº Presupuesto" value={header.orderNumber} />
                  <InfoRow label="Fecha" value={formatDate(header.orderDate)} />
                  <InfoRow label="Entrega" value={formatDate(header.deliveryDate)} />
                  <InfoRow label="Creado por" value={display?.userName} />
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Estancias / Line Items */}
          <Typography variant="h6" fontWeight={700} mb={1} sx={{ fontSize: "1.1rem" }}>
            Desglose Técnico
          </Typography>
          <OrderLineItems items={order.items} />
        </Grid>

        {/* ── SIDEBAR DERECHA: TOTALES + PDF + HISTORIAL ── */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={2}>
            <TotalsPanel order={order} customer={customer} />
            <Card sx={cardSx} data-testid="portal-order-history">
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <SectionTitle>Historial</SectionTitle>
                {/* Sin autor: el cliente no ve qué persona de la fábrica hizo cada cambio, sí las notas */}
                <OrderStatusHistory history={header.statusHistory} orderDate={header.orderDate} showAuthor={false} />
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
}
