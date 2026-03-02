import React, { useState, useEffect, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
  Divider,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Skeleton,
  Alert,
  Button,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  Straighten as StraightenIcon,
  Build as BuildIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as HourglassEmptyIcon,
  LocalShipping as LocalShippingIcon,
  Home as HomeIcon,
} from "@mui/icons-material";
import { ordersApi } from "@/services/orders.service";
import { getCustomerById } from "@/services/customer.service";
import { useAuth } from "@/context/AuthProvider";
import type { Order, OrderLineItem } from "@/interfases/orders.interfase";
import type { ICustomer } from "@/interfases/customer.interfase";

// Lazy load del botón PDF — igual que en el carrito, para no penalizar el bundle inicial
const LazyDownloadPdfButton = React.lazy(() => import("@/components/cart/DownloadPdfButton"));

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: "warning" | "info" | "primary" | "success" | "error"; icon: React.ReactElement }> = {
  PENDING: { label: "Pendiente de Confirmación", color: "warning", icon: <HourglassEmptyIcon fontSize="small" /> },
  MANUFACTURING: { label: "En Producción", color: "info", icon: <BuildIcon fontSize="small" /> },
  SHIPPED: { label: "Enviado", color: "primary", icon: <LocalShippingIcon fontSize="small" /> },
  INSTALLED: { label: "Entregado", color: "success", icon: <CheckCircleIcon fontSize="small" /> },
  CANCELLED: { label: "Cancelado", color: "error", icon: <HomeIcon fontSize="small" /> },
};

const formatDate = (d: Date | string | undefined) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
};

const formatCode = (code: string) =>
  code
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON DE CARGA
// ─────────────────────────────────────────────────────────────────────────────
function OrderDetailSkeleton() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Skeleton width={200} height={40} sx={{ mb: 2 }} />
      <Skeleton width="60%" height={56} sx={{ mb: 3 }} />
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Skeleton variant="rounded" height={180} sx={{ mb: 2 }} />
          <Skeleton variant="rounded" height={120} sx={{ mb: 2 }} />
          <Skeleton variant="rounded" height={120} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Skeleton variant="rounded" height={320} />
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
    <Box sx={{ display: "flex", gap: 1, mb: 0.75 }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 90, flexShrink: 0 }}>
        {label}:
      </Typography>
      <Typography variant="body2" fontWeight={600} color="text.primary">
        {value}
      </Typography>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FILA DETALLE DE PIEZA
// ─────────────────────────────────────────────────────────────────────────────
function PieceRow({ piece, index, materialsMap }: { piece: any; index: number; materialsMap: Map<string, string> }) {
  const materialName = materialsMap.get(piece.materialId) || "Material no especificado";
  const length = piece.length_mm ?? piece.measurements?.length_mm ?? 0;
  const width = piece.width_mm ?? piece.measurements?.width_mm ?? 0;
  const addons: any[] = piece.appliedAddons || [];

  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        py: 1.5,
        px: 2,
        borderRadius: 2,
        bgcolor: "grey.50",
        mb: 1,
        border: "1px solid",
        borderColor: "grey.200",
      }}
    >
      {/* Número pieza */}
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          bgcolor: "primary.main",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {index + 1}
      </Box>

      {/* Material */}
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2" fontWeight={700} color="text.primary">
          {materialName}
        </Typography>
        {/* Atributos del material */}
        {piece.selectedAttributes && Object.keys(piece.selectedAttributes).length > 0 && (
          <Stack direction="row" flexWrap="wrap" gap={0.5} mt={0.5}>
            {Object.entries(piece.selectedAttributes).map(([k, v]) => (
              <Chip
                key={k}
                label={`${formatCode(k)}: ${String(v)}`}
                size="small"
                variant="outlined"
                sx={{ fontSize: "0.7rem", height: 20, bgcolor: "white" }}
              />
            ))}
          </Stack>
        )}
      </Box>

      {/* Dimensiones */}
      <Box sx={{ minWidth: 130, display: "flex", alignItems: "flex-start", gap: 0.5 }}>
        <StraightenIcon sx={{ fontSize: 16, color: "text.secondary", mt: 0.25 }} />
        <Typography variant="body2" fontWeight={600} color="primary.main">
          {length} × {width} mm
        </Typography>
      </Box>

      {/* Trabajos */}
      <Box sx={{ minWidth: 180 }}>
        {addons.length === 0 ? (
          <Typography variant="caption" color="text.disabled" fontStyle="italic">
            Corte limpio básico
          </Typography>
        ) : (
          addons.map((addon: any, i: number) => {
            const measStr = addon.measurements
              ? Object.entries(addon.measurements)
                  .filter(([k]) => k !== "quantity")
                  .map(([k, v]) => `${formatCode(k.replace("_mm", "").replace("_ml", ""))}: ${v}`)
                  .join(", ")
              : "";
            const qty = addon.measurements?.quantity ?? addon.quantity;
            return (
              <Typography key={i} variant="caption" display="block" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                • <strong>{formatCode(addon.code)}</strong>
                {qty ? ` × ${qty}` : ""}
                {measStr ? ` (${measStr})` : ""}
              </Typography>
            );
          })
        )}
      </Box>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ACORDEÓN DE ESTANCIA
// ─────────────────────────────────────────────────────────────────────────────
function LineItemAccordion({ item, index }: { item: OrderLineItem; index: number }) {
  // Construir mapa de materiales desde el hydratedContext o el technicalSnapshot
  const materialsMap = new Map<string, string>();
  const materials: any[] = (item as any).hydratedContext?.materials || (item as any).technicalSnapshot?.materials || [];
  materials.forEach((m: any) => {
    if (m._id) materialsMap.set(m._id, m.name || m.materialName);
    if (m.id) materialsMap.set(m.id, m.name || m.materialName);
  });

  const mainPieces: any[] = (item as any).core?.mainPieces || (item as any).technicalSnapshot?.pieces || (item as any).technicalSnapshot?.mainPieces || [];

  return (
    <Accordion
      defaultExpanded={index === 0}
      sx={{
        mb: 1.5,
        borderRadius: "12px !important",
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "none",
        "&:before": { display: "none" },
        overflow: "hidden",
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          bgcolor: "grey.50",
          borderLeft: "4px solid",
          borderLeftColor: "primary.main",
          "& .MuiAccordionSummary-content": { alignItems: "center", justifyContent: "space-between", mr: 1 },
        }}
      >
        <Typography variant="subtitle1" fontWeight={700}>
          {item.cartItemName || `Estancia ${index + 1}`}
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="caption" color="text.secondary">
            {mainPieces.length} pieza{mainPieces.length !== 1 ? "s" : ""}
          </Typography>
          <Typography variant="subtitle1" fontWeight={700} color="primary.main">
            {(item.subtotalPoints ?? 0).toFixed(2)} pts
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 2 }}>
        {mainPieces.length === 0 ? (
          <Alert severity="info" variant="outlined">
            Los detalles técnicos de esta estancia no están disponibles.
          </Alert>
        ) : (
          mainPieces.map((piece: any, i: number) => <PieceRow key={piece.id || i} piece={piece} index={i} materialsMap={materialsMap} />)
        )}

        {/* Descuentos de línea si existen */}
        {item.discountAmount > 0 && (
          <Box sx={{ mt: 1.5, textAlign: "right" }}>
            <Typography variant="caption" color="text.secondary">
              Precio original: <s>{(item.originalPoints ?? 0).toFixed(2)} pts</s>
            </Typography>
            <Typography variant="caption" color="success.main" fontWeight={600} sx={{ ml: 1.5 }}>
              Descuento: -{item.discountAmount.toFixed(2)} pts
            </Typography>
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PANEL DE TOTALES (sidebar derecha)
// ─────────────────────────────────────────────────────────────────────────────
function TotalsPanel({ order, customer, user }: { order: Order; customer: ICustomer | null; user: any }) {
  const { header } = order;

  return (
    <Card
      sx={{
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "0px 4px 20px rgba(0,0,0,0.06)",
        position: { md: "sticky" },
        top: { md: 80 },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          Resumen Económico
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Stack spacing={1.5}>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="body2" color="text.secondary">
              Subtotal bruto
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {(header.totalOriginalPoints ?? 0).toFixed(2)} pts
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
                    -{rule.discountAmount.toFixed(2)} pts
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
                -{(header.totalDiscount ?? 0).toFixed(2)} pts
              </Typography>
            </Box>
          )}

          <Divider />

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="subtitle1" fontWeight={700}>
              Total Final
            </Typography>
            <Typography variant="h6" fontWeight={800} color="primary.main">
              {(header.totalPoints ?? 0).toFixed(2)} pts
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ my: 2.5 }} />

        {/* BOTÓN PDF — El único lugar donde vive en la vista de ordenes */}
        <Suspense
          fallback={
            <Button variant="outlined" fullWidth disabled>
              Preparando PDF...
            </Button>
          }
        >
          <LazyDownloadPdfButton cart={order as any} user={user} customer={customer} />
        </Suspense>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<ICustomer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Carga paralela: orden completa + cliente (si existe)
        const fullOrder = await ordersApi.findById(orderId);
        setOrder(fullOrder);

        // Si la orden tiene un customerId, lo resolvemos en paralelo
        const cid = fullOrder.header?.customerId;
        if (cid) {
          try {
            const customerData = await getCustomerById(cid);
            setCustomer(customerData);
          } catch {
            // No bloqueamos la vista si el cliente no se puede cargar
            console.warn("No se pudo cargar los datos del cliente");
          }
        }
      } catch (err: any) {
        setError(err?.message || "Error al cargar la orden.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [orderId]);

  if (loading) return <OrderDetailSkeleton />;

  if (error || !order) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || "No se encontró la orden solicitada."}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate("/my-quotes")}>
          Volver a Mis Pedidos
        </Button>
      </Container>
    );
  }

  const { header } = order;
  const statusCfg = STATUS_CONFIG[header.status] || STATUS_CONFIG.PENDING;

  // Nombre del cliente para mostrar en el header
  const customerDisplayName =
    customer?.officialName ||
    customer?.commercialName ||
    (customer?.firstName ? `${customer.firstName} ${customer.lastName || ""}`.trim() : header.customerId || "Sin cliente asignado");

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* ── VOLVER ── */}
      <Stack direction="row" alignItems="center" spacing={1} mb={3}>
        <IconButton onClick={() => navigate("/my-quotes")} size="small" sx={{ bgcolor: "grey.100" }}>
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Typography variant="body2" color="text.secondary">
          Mis Pedidos
        </Typography>
        <Typography variant="body2" color="text.disabled">
          /
        </Typography>
        <Typography variant="body2" color="text.primary" fontWeight={600}>
          {header.orderNumber}
        </Typography>
      </Stack>

      {/* ── CABECERA ── */}
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "start", sm: "center" }} mb={3} gap={2}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            {header.orderNumber}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {customerDisplayName}
          </Typography>
        </Box>
        <Chip icon={statusCfg.icon} label={statusCfg.label} color={statusCfg.color} sx={{ fontWeight: 700, fontSize: "0.9rem", px: 1, py: 2 }} />
      </Stack>

      <Grid container spacing={3}>
        {/* ── COLUMNA PRINCIPAL ── */}
        <Grid size={{ xs: 12, md: 8 }}>
          {/* Tarjetas de info: Cliente y Documento */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {/* Cliente */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Card sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", boxShadow: "none", height: "100%" }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                    <PersonIcon sx={{ color: "primary.main", fontSize: 20 }} />
                    <Typography variant="subtitle2" fontWeight={700} textTransform="uppercase" color="text.secondary" letterSpacing={0.5}>
                      Datos del Cliente
                    </Typography>
                  </Stack>
                  {customer ? (
                    <>
                      <InfoRow label="Nombre" value={customerDisplayName} />
                      {customer.nif && <InfoRow label="NIF / CIF" value={customer.nif} />}
                      <InfoRow label="Email" value={customer.contact?.email} />
                      <InfoRow label="Teléfono" value={customer.contact?.phone} />
                      {customer.address?.addressLine1 && (
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

            {/* Documento */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Card sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", boxShadow: "none", height: "100%" }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                    <ReceiptIcon sx={{ color: "primary.main", fontSize: 20 }} />
                    <Typography variant="subtitle2" fontWeight={700} textTransform="uppercase" color="text.secondary" letterSpacing={0.5}>
                      Detalles del Pedido
                    </Typography>
                  </Stack>
                  <InfoRow label="Nº Pedido" value={header.orderNumber} />
                  <InfoRow label="Fecha" value={formatDate(header.orderDate)} />
                  <InfoRow label="Entrega" value={formatDate(header.deliveryDate)} />
                  <InfoRow label="Creado por" value={user?.name} />
                  <InfoRow label="Rol" value={user?.roles?.[0]} />
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Estancias / Line Items */}
          <Typography variant="h6" fontWeight={700} mb={1.5}>
            Desglose Técnico
          </Typography>
          {order.items && order.items.length > 0 ? (
            order.items.map((item, i) => <LineItemAccordion key={(item as any).cartItemId || i} item={item} index={i} />)
          ) : (
            <Alert severity="info" variant="outlined">
              Esta orden no tiene líneas de detalle disponibles. El backend devolvería aquí los ítems completos con el endpoint <code>GET /orders/:id</code>.
            </Alert>
          )}
        </Grid>

        {/* ── SIDEBAR DERECHA: TOTALES + PDF ── */}
        <Grid size={{ xs: 12, md: 4 }}>
          <TotalsPanel order={order} customer={customer} user={user} />
        </Grid>
      </Grid>
    </Container>
  );
}
