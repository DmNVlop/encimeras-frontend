// src/utils/orderStatus.util.ts

export type OrderStatusColor = "warning" | "info" | "primary" | "success" | "error";

/** Etiqueta y color de cada estado de orden (única fuente para portal y admin; mismos estados que `order-status-flow.ts` del BE). */
export const ORDER_STATUS_META: Record<string, { label: string; color: OrderStatusColor }> = {
  PENDING: { label: "Pendiente de Confirmación", color: "warning" },
  REVIEWED: { label: "Revisado", color: "info" },
  APPROVED: { label: "Aprobado", color: "success" },
  REJECTED: { label: "Rechazado", color: "error" },
  MANUFACTURING: { label: "En Producción", color: "info" },
  SHIPPED: { label: "Enviado", color: "primary" },
  INSTALLED: { label: "Entregado", color: "success" },
  CANCELLED: { label: "Cancelado", color: "error" },
};

export const getOrderStatusMeta = (status: string) => ORDER_STATUS_META[status] ?? { label: status, color: "info" as OrderStatusColor };

/** Etiqueta corta para espacios densos (bandeja, pestañas); el resto de estados ya es corto. */
const ORDER_STATUS_SHORT_LABEL: Record<string, string> = { PENDING: "Pendiente" };

export const getOrderStatusShortLabel = (status: string) => ORDER_STATUS_SHORT_LABEL[status] ?? getOrderStatusMeta(status).label;

/**
 * Texto del botón que lleva la orden a cada estado. Solo etiquetas: qué acciones se pintan lo decide
 * el BE (`statusActions.targets` de `GET /orders/:id`); el FE no replica permisos ni transiciones.
 */
export const ORDER_STATUS_ACTION_LABEL: Record<string, string> = {
  REVIEWED: "Marcar revisado",
  APPROVED: "Aprobar",
  REJECTED: "Rechazar",
  MANUFACTURING: "Pasar a producción",
  SHIPPED: "Marcar enviado",
  INSTALLED: "Marcar entregado",
  CANCELLED: "Cancelar pedido",
};

export const getOrderStatusActionLabel = (status: string) => ORDER_STATUS_ACTION_LABEL[status] ?? `Pasar a ${getOrderStatusMeta(status).label}`;

/** Estados que cierran el pedido sin completarlo: el seguimiento no avanza y se muestra el motivo. */
export const isOrderStatusClosedKo = (status: string) => status === "REJECTED" || status === "CANCELLED";

/** Pasos del seguimiento que ve el cliente (camino feliz del flujo). */
export const ORDER_PROGRESS_STEPS = ["Recibido", "Revisado", "Aprobado", "Producción", "Enviado", "Entregado"];

const PROGRESS_INDEX: Record<string, number> = { PENDING: 0, REVIEWED: 1, APPROVED: 2, MANUFACTURING: 3, SHIPPED: 4, INSTALLED: 6 };

/** Paso activo del seguimiento (INSTALLED = todos completados). Estados KO o desconocidos ⇒ 0. */
export const getOrderProgressStep = (status: string) => PROGRESS_INDEX[status] ?? 0;

/** Estados finales (`finalStatuses` del BE): sin acciones salvo «deshacer». */
export const ORDER_FINAL_STATUSES = ["REJECTED", "CANCELLED", "INSTALLED"];

/** Estados con trabajo pendiente: la bandeja abre aquí por defecto. */
export const ORDER_ACTIVE_STATUSES = ["PENDING", "REVIEWED", "APPROVED", "MANUFACTURING", "SHIPPED"];

/** Pestañas de la bandeja: grupo «En curso», un estado cada una y «Todos» (`statuses` vacío = sin filtro). */
export const ORDER_INBOX_TABS: { key: string; label: string; statuses: string[] }[] = [
  { key: "active", label: "En curso", statuses: ORDER_ACTIVE_STATUSES },
  ...[...ORDER_ACTIVE_STATUSES, ...ORDER_FINAL_STATUSES].map((s) => ({ key: s, label: getOrderStatusShortLabel(s), statuses: [s] })),
  { key: "all", label: "Todos", statuses: [] },
];

/** Total de una pestaña a partir de los contadores por estado de `GET /orders/search` (`statuses` vacío = todos). */
export const countOrdersInTab = (counts: Partial<Record<string, number>>, statuses: string[]) =>
  (statuses.length ? statuses.map((s) => counts[s] ?? 0) : Object.values(counts).map((n) => n ?? 0)).reduce((sum, n) => sum + n, 0);

/** Pestañas de «Mis presupuestos» del portal: el cliente sigue sus pedidos, no trabaja por estado. Abre en «Todos». */
export const PORTAL_ORDER_TABS: { key: string; label: string; statuses: string[] }[] = [
  { key: "all", label: "Todos", statuses: [] },
  { key: "active", label: "En curso", statuses: ORDER_ACTIVE_STATUSES },
  { key: "INSTALLED", label: "Entregados", statuses: ["INSTALLED"] },
  { key: "closed", label: "Rechazados / cancelados", statuses: ["REJECTED", "CANCELLED"] },
];

/**
 * Siguiente paso del camino feliz entre las acciones que el BE permite (el que se ofrece como acción rápida).
 * Rechazar/cancelar nunca son acción rápida: piden nota y se hacen desde la ficha.
 */
export const getPrimaryStatusTarget = (targets: string[] = []) => targets.find((t) => !isOrderStatusClosedKo(t)) ?? null;

/** Antigüedad legible desde una fecha («5 min», «3 h», «2 d»). */
export const formatOrderAge = (iso?: string | Date | null) => {
  if (!iso) return "—";
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  return `${Math.floor(hours / 24)} d`;
};

/** Horas sin moverse a partir de las cuales un pedido en curso se marca como atascado en la bandeja. */
export const ORDER_STALE_HOURS = 48;

export const isOrderStale = (status: string, lastChangeAt?: string | Date | null) =>
  !!lastChangeAt && ORDER_ACTIVE_STATUSES.includes(status) && Date.now() - new Date(lastChangeAt).getTime() > ORDER_STALE_HOURS * 3600000;
