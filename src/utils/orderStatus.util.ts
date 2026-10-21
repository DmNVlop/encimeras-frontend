// src/utils/orderStatus.util.ts

export type OrderStatusColor = "warning" | "info" | "primary" | "success" | "error";

/** Etiqueta y color de cada estado de orden (única fuente para portal y admin; mismos estados que `UpdateOrderStatusDto` del BE). */
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
