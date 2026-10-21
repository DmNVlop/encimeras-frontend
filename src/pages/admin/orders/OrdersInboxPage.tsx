import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { DataGrid, type GridColDef, type GridColumnVisibilityModel, type GridPaginationModel } from "@mui/x-data-grid";
import { Box, Button, IconButton, InputAdornment, Paper, Stack, Tab, Tabs, TextField, Tooltip, Typography, useMediaQuery, useTheme } from "@mui/material";
import { Refresh as RefreshIcon, Search as SearchIcon, WarningAmber as WarningAmberIcon } from "@mui/icons-material";
import AdminPageTitle from "../components/AdminPageTitle";
import { ApiErrorFeedback } from "../../public/common/ApiErrorFeedback";
import { useSocket } from "@/context/SocketContext";
import { ordersApi } from "@/services/orders.service";
import type { OrderSearchItem, OrderSearchResult, OrderStatus } from "@/interfases/orders.interfase";
import { OrderStatusChip, getOrderStatusIcon } from "@/components/common/orders/OrderStatusChip";
import { useOrderStatusChange } from "@/components/common/orders/useOrderStatusChange";
import { formatPoints } from "@/components/common/analytics/analyticsFormat";
import { countOrdersInTab, formatOrderAge, getOrderStatusActionLabel, getPrimaryStatusTarget, isOrderStale, ORDER_INBOX_TABS, ORDER_STALE_HOURS } from "@/utils/orderStatus.util";

const PAGE_SIZE_OPTIONS = [25, 50, 100]; // El BE limita a 100 por página
const SEARCH_DEBOUNCE_MS = 350;
const SOCKET_RELOAD_DEBOUNCE_MS = 600;

/** Estado que la ficha recibe para navegar por la cola (anterior/siguiente) y volver a la misma vista de la bandeja. */
export interface OrdersQueueState {
  queue: string[];
  from: string;
}

/**
 * Bandeja de pedidos del backoffice (ADMIN, OWNER, MANAGER, SALES y WORKER): pestañas por estado con contadores,
 * búsqueda y paginación en servidor (`GET /orders/search`), acción rápida del siguiente paso y tiempo real por socket.
 * Vista, búsqueda y página viven en la URL para poder volver desde la ficha al mismo punto.
 */
export const OrdersInboxPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("lg"));
  const isNarrowTablet = useMediaQuery(theme.breakpoints.down("md"));
  const { socket } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();

  const legacyOrderId = searchParams.get("orderId"); // Enlaces antiguos `?orderId=` (notificaciones, marcadores)
  const tabKey = ORDER_INBOX_TABS.some((t) => t.key === searchParams.get("tab")) ? searchParams.get("tab")! : "active";
  const q = searchParams.get("q") ?? "";
  const page = Math.max(0, Number(searchParams.get("page")) || 0);
  const pageSize = PAGE_SIZE_OPTIONS.includes(Number(searchParams.get("size"))) ? Number(searchParams.get("size")) : PAGE_SIZE_OPTIONS[0];
  const statuses = ORDER_INBOX_TABS.find((t) => t.key === tabKey)!.statuses as OrderStatus[];

  const [searchText, setSearchText] = useState(q);
  const [result, setResult] = useState<OrderSearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  /** Cambia parámetros de la URL; cambiar vista o búsqueda vuelve a la primera página. */
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
    } catch (err) {
      if (seq === requestSeq.current) setError(err);
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

  // Tiempo real: cualquier pedido nuevo o cambio de estado recarga la página actual y los contadores (una sola vez por ráfaga)
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

  const { busy, changeStatus, feedbackElement } = useOrderStatusChange(load);

  const rows = result?.items ?? [];
  const openOrder = useCallback(
    (id: string) => {
      const state: OrdersQueueState = { queue: rows.map((r) => r._id), from: location.search };
      navigate(`/admin/orders/${id}`, { state });
    },
    [rows, location.search, navigate],
  );

  const columns = useMemo<GridColDef<OrderSearchItem>[]>(
    () => [
      {
        field: "orderNumber",
        headerName: "Pedido",
        flex: 1.2,
        minWidth: 130,
        sortable: false,
        renderCell: ({ row }) => (
          <Box sx={{ lineHeight: 1.25, py: 0.5, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={800} noWrap>
              {row.orderNumber}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {row.orderName}
            </Typography>
          </Box>
        ),
      },
      {
        field: "customerName",
        headerName: "Cliente / vendedor",
        flex: 1.4,
        minWidth: 130,
        sortable: false,
        renderCell: ({ row }) => (
          <Box sx={{ lineHeight: 1.25, py: 0.5, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {row.customerName ?? "Sin cliente"}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {row.userName ?? "—"}
            </Typography>
          </Box>
        ),
      },
      {
        field: "status",
        headerName: "Estado",
        width: 150,
        sortable: false,
        renderCell: ({ row }) => <OrderStatusChip status={row.status} short />,
      },
      {
        field: "lastStatusChangeAt",
        headerName: "En este estado",
        width: 120,
        sortable: false,
        renderCell: ({ row }) => {
          const stale = isOrderStale(row.status, row.lastStatusChangeAt);
          return (
            <Tooltip title={`Último cambio: ${new Date(row.lastStatusChangeAt).toLocaleString("es-ES")}${stale ? ` · más de ${ORDER_STALE_HOURS} h sin avanzar` : ""}`}>
              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: stale ? "warning.main" : "text.secondary", fontWeight: stale ? 700 : 400 }}>
                {stale && <WarningAmberIcon sx={{ fontSize: 16 }} />}
                <Typography variant="body2" fontWeight="inherit">
                  {formatOrderAge(row.lastStatusChangeAt)}
                </Typography>
              </Stack>
            </Tooltip>
          );
        },
      },
      {
        field: "orderDate",
        headerName: "Fecha",
        width: 105,
        sortable: false,
        valueFormatter: (value) => (value ? new Date(value).toLocaleDateString("es-ES") : "—"),
      },
      {
        field: "totalPoints",
        headerName: "Total",
        width: 100,
        type: "number",
        sortable: false,
        valueFormatter: (value) => formatPoints(value),
      },
      {
        field: "action",
        headerName: "Siguiente paso",
        width: isNarrowTablet ? 150 : 180, // En tablet vertical, sin icono para que quepa el nº de pedido
        sortable: false,
        renderCell: ({ row }) => {
          const target = getPrimaryStatusTarget(row.statusActions?.targets) as OrderStatus | null;
          if (!target) return null;
          const label = getOrderStatusActionLabel(target);
          return (
            <Tooltip title={`${label} sin abrir el pedido`}>
              <span>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={isNarrowTablet ? undefined : getOrderStatusIcon(target)}
                  disabled={busy}
                  onClick={(e) => {
                    e.stopPropagation(); // La fila abre la ficha; el botón solo cambia el estado
                    changeStatus(row._id, target);
                  }}
                  sx={{ minHeight: 34, whiteSpace: "nowrap" }}
                  data-testid={`inbox-action-${row._id}`}
                >
                  {label}
                </Button>
              </span>
            </Tooltip>
          );
        },
      },
    ],
    [busy, changeStatus, isNarrowTablet],
  );

  // Menos columnas en tablet y móvil: el detalle completo está en la ficha
  const columnVisibilityModel = useMemo<GridColumnVisibilityModel>(
    () => ({ orderDate: !isTablet, totalPoints: !isNarrowTablet, lastStatusChangeAt: !isMobile, customerName: !isMobile }),
    [isTablet, isNarrowTablet, isMobile],
  );

  if (legacyOrderId) return <Navigate to={`/admin/orders/${legacyOrderId}`} replace />;

  const counts = result?.counts ?? {};

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between" mb={1.5}>
        <AdminPageTitle sx={{ fontSize: "1.35rem" }}>Pedidos</AdminPageTitle>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, maxWidth: { sm: 480 } }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Nº de pedido, nombre, cliente o vendedor"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            inputProps={{ "aria-label": "Buscar pedidos" }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <Tooltip title="Recargar la bandeja">
            <IconButton onClick={load} disabled={loading} aria-label="Recargar la bandeja">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <ApiErrorFeedback error={error} title="Error al cargar los pedidos" onRetry={load} />

      <Paper variant="outlined" sx={{ minWidth: 0, borderRadius: 2, overflow: "hidden" }}>
        <Tabs
          value={tabKey}
          onChange={(_, value) => patchParams({ tab: value === "active" ? null : value, page: null })}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ borderBottom: 1, borderColor: "divider", minHeight: 40, "& .MuiTab-root": { minHeight: 40, py: 0.5, px: 1.5, textTransform: "none", fontSize: "0.85rem" } }}
        >
          {ORDER_INBOX_TABS.map((t) => (
            <Tab key={t.key} value={t.key} label={result ? `${t.label} (${countOrdersInTab(counts, t.statuses)})` : t.label} data-testid={`inbox-tab-${t.key}`} />
          ))}
        </Tabs>

        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row._id}
          loading={loading}
          rowHeight={48}
          columnHeaderHeight={40}
          paginationMode="server"
          rowCount={result?.total ?? 0}
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={(m: GridPaginationModel) => patchParams({ page: m.page || null, size: m.pageSize === PAGE_SIZE_OPTIONS[0] ? null : m.pageSize })}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          columnVisibilityModel={columnVisibilityModel}
          disableColumnMenu
          disableRowSelectionOnClick
          onRowClick={({ row }) => openOrder(row._id)}
          localeText={{ noRowsLabel: q ? "Ningún pedido coincide con la búsqueda" : "No hay pedidos en esta vista" }}
          sx={{ border: 0, minHeight: 300, "& .MuiDataGrid-row": { cursor: "pointer" }, "& .MuiDataGrid-cell": { display: "flex", alignItems: "center" } }}
        />
      </Paper>
      {feedbackElement}
    </Box>
  );
};

export default OrdersInboxPage;
