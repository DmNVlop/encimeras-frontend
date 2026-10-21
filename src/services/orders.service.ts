import { update, get, post } from "@/services/api.service";
import type { Order, OrderSearchParams, OrderSearchResult, OrderStatus } from "@/interfases/orders.interfase";

export const ordersApi = {
  /**
   * Retorna el listado ligero de órdenes (solo header). Lo usa el portal.
   * Documentación: GET /orders → solo devuelve la cabecera para optimizar listados.
   */
  findAll: async (status?: string): Promise<Order[]> => {
    const params = status ? { status } : {};
    return get<Order[]>("/orders", { params });
  },

  /**
   * Bandeja del backoffice: paginada en servidor, con contadores por estado, nombres resueltos y acciones por fila.
   * Documentación: GET /orders/search
   */
  search: async ({ status, q, page = 0, limit = 25 }: OrderSearchParams): Promise<OrderSearchResult> => {
    const params: Record<string, string | number> = { page, limit };
    if (status?.length) params.status = status.join(",");
    if (q?.trim()) params.q = q.trim();
    return get<OrderSearchResult>("/orders/search", { params });
  },

  /**
   * Retorna la orden completa con items, core, uiState y hydratedContext, más `statusActions` y `display`.
   * Documentación: GET /orders/:id
   */
  findById: async (orderId: string): Promise<Order> => {
    return get<Order>(`/orders/${orderId}`);
  },

  /** Cambia el estado según el flujo del BE (400 transición/nota, 403 permiso, 409 la orden cambió). Devuelve la orden. */
  changeStatus: async (orderId: string, status: OrderStatus, note?: string): Promise<Order> => {
    return update<any>("/orders", `${orderId}/status`, note ? { status, note } : { status });
  },

  /** Deshace el último cambio de estado vigente (OWNER o superior, nota obligatoria). */
  undoStatus: async (orderId: string, note: string): Promise<Order> => {
    return post<Order>(`/orders/${orderId}/status/undo`, { note });
  },
};
