import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Card, CardActionArea, CircularProgress, Container, InputAdornment, Stack, Tab, Tabs, TablePagination, TextField, Typography } from "@mui/material";
import { Add as AddIcon, Search as SearchIcon, ChevronRight, ReceiptLong } from "@mui/icons-material";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ordersApi } from "@/services/orders.service";
import { useSocket } from "@/context/SocketContext";
import type { OrderSearchItem, OrderSearchResult, OrderStatus } from "@/interfases/orders.interfase";
import { OrderStatusChip } from "@/components/common/orders/OrderStatusChip";
import { OrderProgress } from "@/components/common/orders/OrderProgress";
import { formatPoints } from "@/components/common/analytics/analyticsFormat";
import { countOrdersInTab, isOrderStatusClosedKo, PORTAL_ORDER_TABS } from "@/utils/orderStatus.util";

const PAGE_SIZE_OPTIONS = [10, 25, 50];
const SEARCH_DEBOUNCE_MS = 350;
const SOCKET_RELOAD_DEBOUNCE_MS = 600;

const formatDate = (dateString?: Date | string) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
};

/**
 * «Mis presupuestos» del portal: pedidos a su alcance con seguimiento de fábrica.
 * Pestañas con contadores, búsqueda y paginación en servidor (`GET /orders/search`, mismo contrato que la bandeja del
 * backoffice) y tiempo real por socket. Pestaña, búsqueda y página viven en la URL para volver desde el detalle al mismo punto.
 */
export default function MyQuotes() {
  const navigate = useNavigate();
  const location = useLocation();
  const { socket } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabKey = PORTAL_ORDER_TABS.some((t) => t.key === searchParams.get("tab")) ? searchParams.get("tab")! : PORTAL_ORDER_TABS[0].key;
  const q = searchParams.get("q") ?? "";
  const page = Math.max(0, Number(searchParams.get("page")) || 0);
  const pageSize = PAGE_SIZE_OPTIONS.includes(Number(searchParams.get("size"))) ? Number(searchParams.get("size")) : PAGE_SIZE_OPTIONS[0];
  const statuses = PORTAL_ORDER_TABS.find((t) => t.key === tabKey)!.statuses as OrderStatus[];

  const [searchText, setSearchText] = useState(q);
  const [result, setResult] = useState<OrderSearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Cambia parámetros de la URL; cambiar pestaña o búsqueda vuelve a la primera página. */
  const patchParams = useCallback(
    (patch: Record<string, string | number | null>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(patch).forEach(([k, v]) => (v === null || v === "" ? next.delete(k) : next.set(k, String(v))));
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const requestSeq = useRef(0);
  const load = useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    setError(null);
    try {
      const data = await ordersApi.search({ status: statuses, q, page, limit: pageSize });
      if (seq === requestSeq.current) setResult(data); // Descarta respuestas de búsquedas ya superadas
    } catch (err: any) {
      if (seq === requestSeq.current) setError(err?.message || "No se pudieron cargar tus presupuestos.");
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
    // statuses deriva de tabKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabKey, q, page, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  // Búsqueda con espera corta al teclear
  useEffect(() => {
    if (searchText.trim() === q) return;
    const timer = setTimeout(() => patchParams({ q: searchText.trim(), page: null }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchText, q, patchParams]);

  // Tiempo real: pedido nuevo o cambio de estado en fábrica ⇒ recarga la página actual y los contadores (una vez por ráfaga)
  useEffect(() => {
    if (!socket) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(load, SOCKET_RELOAD_DEBOUNCE_MS);
    };
    socket.on("orders:new", schedule);
    socket.on("orders:update", schedule);
    return () => {
      clearTimeout(timer);
      socket.off("orders:new", schedule);
      socket.off("orders:update", schedule);
    };
  }, [socket, load]);

  const items = result?.items ?? [];
  const counts = result?.counts ?? {};
  const openOrder = (id: string) => navigate(`/my-quotes/${id}`, { state: { from: location.search } });

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      {/* HEADER */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} mb={2} useFlexGap flexWrap="wrap">
        <Typography variant="h5" fontWeight="bold" sx={{ color: "text.primary" }}>
          Mis Presupuestos
        </Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => navigate("/quote")} sx={{ fontWeight: 600 }}>
          Nuevo Presupuesto
        </Button>
      </Stack>

      {/* FILTERS & SEARCH */}
      <Card sx={{ mb: 2, borderRadius: 2, border: "1px solid", borderColor: "divider", boxShadow: "none" }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }}>
          <Tabs
            value={tabKey}
            onChange={(_e, key: string) => patchParams({ tab: key === PORTAL_ORDER_TABS[0].key ? null : key, page: null })}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{ px: 1, minHeight: 44, minWidth: 0, flex: 1, "& .MuiTab-root": { textTransform: "none", fontWeight: 600, minHeight: 44, px: 1.5 } }}
          >
            {PORTAL_ORDER_TABS.map((t) => (
              <Tab key={t.key} value={t.key} label={result ? `${t.label} (${countOrdersInTab(counts, t.statuses)})` : t.label} data-testid={`portal-tab-${t.key}`} />
            ))}
          </Tabs>

          <Box sx={{ p: 1, width: { xs: "100%", md: 300 }, boxSizing: "border-box" }}>
            <TextField
              fullWidth
              placeholder="Buscar por nombre o número..."
              size="small"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" fontSize="small" />
                    </InputAdornment>
                  ),
                },
                htmlInput: { "data-testid": "portal-orders-search" },
              }}
            />
          </Box>
        </Stack>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button size="small" color="inherit" onClick={load}>Reintentar</Button>}>
          {error}
        </Alert>
      )}

      {/* ORDERS LIST */}
      {loading && !result ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : items.length === 0 && !error ? (
        <Box sx={{ textAlign: "center", py: 6, color: "text.secondary" }}>
          <ReceiptLong sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            No se encontraron presupuestos
          </Typography>
          <Typography variant="body2">{q ? "Prueba con otra búsqueda o cambia de pestaña." : "Cuando confirmes un presupuesto desde el carrito aparecerá aquí."}</Typography>
        </Box>
      ) : (
        <>
          <Stack spacing={1.5} sx={{ opacity: loading ? 0.6 : 1, transition: "opacity 0.2s" }} data-testid="portal-orders-list">
            {items.map((order) => (
              <OrderCard key={order._id} order={order} onOpen={() => openOrder(order._id)} />
            ))}
          </Stack>
          <TablePagination
            component="div"
            count={result?.total ?? 0}
            page={page}
            onPageChange={(_e, p) => patchParams({ page: p || null })}
            rowsPerPage={pageSize}
            rowsPerPageOptions={PAGE_SIZE_OPTIONS}
            onRowsPerPageChange={(e) => patchParams({ size: Number(e.target.value), page: null })}
            labelRowsPerPage="Por página"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
          />
        </>
      )}
    </Container>
  );
}

/** Tarjeta de un pedido: nombre, número, fecha, cliente, total, estado y seguimiento. Toda la tarjeta abre el detalle. */
function OrderCard({ order, onOpen }: { order: OrderSearchItem; onOpen: () => void }) {
  return (
    <Card sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", boxShadow: "none", "&:hover": { borderColor: "primary.main" } }}>
      <CardActionArea onClick={onOpen} sx={{ p: 1.5 }} data-testid={`portal-order-${order._id}`}>
        <Stack spacing={1.25}>
          <Stack direction="row" spacing={1.5} justifyContent="space-between" alignItems="flex-start">
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight="bold" lineHeight={1.3} sx={{ wordBreak: "break-word" }}>
                {order.orderName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {order.orderNumber} • {formatDate(order.orderDate)}
                {order.customerName ? ` • ${order.customerName}` : ""}
              </Typography>
            </Box>
            <Box sx={{ textAlign: "right", flexShrink: 0 }}>
              <Typography variant="subtitle1" fontWeight={800} color="primary.main" lineHeight={1.3}>
                {order.totalPoints ? formatPoints(order.totalPoints) : "—"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Total
              </Typography>
            </Box>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "stretch", sm: "center" }}>
            <Box>
              <OrderStatusChip status={order.status} />
            </Box>
            {/* El listado no trae historial: si está rechazado/cancelado, el motivo se ve en el detalle */}
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              {isOrderStatusClosedKo(order.status) ? (
                <Typography variant="body2" color="text.secondary">
                  Abre el detalle para ver el motivo.
                </Typography>
              ) : (
                <OrderProgress status={order.status} />
              )}
            </Box>
            <Stack direction="row" alignItems="center" sx={{ color: "primary.main", fontWeight: 600, whiteSpace: "nowrap", alignSelf: { xs: "flex-end", sm: "center" } }}>
              <Typography variant="body2" fontWeight={600}>
                Ver detalles
              </Typography>
              <ChevronRight fontSize="small" />
            </Stack>
          </Stack>
        </Stack>
      </CardActionArea>
    </Card>
  );
}
